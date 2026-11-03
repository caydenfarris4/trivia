// Game Night Live — game server. Zero dependencies: just `node server.js`.
// It serves the host app (index.html) and the phone page (play.html), and runs the live
// Globe Trotters game: players join from their own devices, drop a pin, and are scored by distance.
//
//   score = round(5000 * exp(-max(0, dist_km - radius_km) / 1500))
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const PORT = +process.env.PORT || 3000;
const ROOT = __dirname;

/* ---------- host accounts ---------- */
// Accounts live in DATA_DIR/users.json (put DATA_DIR on a persistent disk when deploying). Passwords are stored as scrypt hashes.
// Sign-up is open ONLY while no account exists: the first account created becomes the host and sign-up then closes.
// Optional SETUP_CODE env var: if set, it must be entered to create that first account (stops a stranger from claiming it).
// Forgot your password? Stop the server and delete DATA_DIR/users.json; sign-up reopens.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETUP_CODE = process.env.SETUP_CODE || '';
let users = {}; // lowercased username -> { name, salt, hash, created }
try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
catch (e) {
  // Missing file = no accounts yet. Any OTHER problem (corrupt file) must stop the server: treating it as "no accounts" would reopen sign-up.
  if (e.code !== 'ENOENT') { console.error('\n  Cannot read ' + USERS_FILE + ': ' + e.message + '\n  Fix or delete that file, then start again.\n'); process.exit(1); }
}
function saveUsers() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users), { mode: 0o600 });
  fs.renameSync(tmp, USERS_FILE);
}
const hasUsers = () => Object.keys(users).length > 0;
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64);
const DUMMY_SALT = crypto.randomBytes(16);
function checkLogin(name, pw) { // constant-ish work whether or not the user exists
  const u = users[String(name || '').trim().toLowerCase()];
  const h = hashPw(pw, u ? Buffer.from(u.salt, 'hex') : DUMMY_SALT);
  return u && crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex')) ? u : null;
}
const safeEq = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
const SESSION_MS = 12 * 3600 * 1000;
const sessions = new Map(); // cookie token -> { exp, user }
const fails = new Map();    // remote address -> { n, until }
const ipOf = req => req.socket.remoteAddress || '?';
const blocked = req => { const f = fails.get(ipOf(req)); return !!f && f.until > Date.now(); };
function noteFail(req) { const ip = ipOf(req), f = fails.get(ip) || { n: 0, until: 0 }; f.n++; if (f.n >= 8) { f.until = Date.now() + 10 * 60 * 1000; f.n = 0; } fails.set(ip, f); }
function cookieOf(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim(); }
  return '';
}
function hostUser(req) { // the logged-in host's username, or null
  const t = cookieOf(req, 'gn_host'), ses = sessions.get(t);
  if (!ses) return null;
  if (ses.exp < Date.now()) { sessions.delete(t); return null; }
  return ses.user;
}
const isHost = req => !!hostUser(req);
const secureReq = req => !!req.socket.encrypted || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
function startSession(req, res, user) {
  const t = crypto.randomBytes(24).toString('base64url'); sessions.set(t, { exp: Date.now() + SESSION_MS, user });
  res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `gn_host=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}${secureReq(req) ? '; Secure' : ''}` });
  res.end(JSON.stringify({ ok: true, user }));
}

/* ---------- bank loading ---------- */
function parseCSV(txt) {
  txt = txt.replace(/^﻿/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(x => x.trim())) rows.push(row); row = []; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function readObjects(file) {
  const rows = parseCSV(fs.readFileSync(file, 'utf8'));
  const head = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
function loadPlaces() {
  const imgs = {};
  try { readObjects(path.join(ROOT, 'banks', 'globetrotters_images.csv')).forEach(o => { if (o.image_url) imgs[o.id] = o; }); } catch (e) {}
  return readObjects(path.join(ROOT, 'banks', 'globetrotters_bank.csv'))
    .filter(o => o.id && o.name && isFinite(+o.lat) && isFinite(+o.lon))
    .map(o => {
      let img = null;
      if (o.image_file) img = { url: '/img/' + encodeURIComponent(o.image_file), credit: '' };
      else if (imgs[o.id]) { const m = imgs[o.id]; img = { url: m.image_url, credit: [m.author, m.license].filter(Boolean).join(' · ') }; }
      return { id: o.id, name: o.name, country: o.country, continent: o.continent, category: o.category, lat: +o.lat, lon: +o.lon, radius: +o.radius_km || 0, difficulty: o.difficulty, blurb: o.reveal_blurb, img };
    });
}

/* ---------- helpers ---------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const colorOf = i => `hsl(${Math.round((i * 137.508) % 360)} 78% 58%)`;
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, r = Math.PI / 180, dl = (lat2 - lat1) * r, dg = (lon2 - lon1) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
const score = (dist, radius) => Math.round(5000 * Math.exp(-Math.max(0, dist - radius) / 1500));
function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) out.push(`http://${n.address}:${PORT}`);
  return out;
}
// Where players should go: the address the host used (e.g. https://trivia.example.com), or the LAN addresses when hosting locally.
function joinUrls(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const name = host.replace(/:\d+$/, '');
  if (!host || name === 'localhost' || name === '127.0.0.1' || name === '[::1]') { const l = lanUrls(); return l.length ? l : ['http://' + (host || 'localhost:' + PORT)]; }
  return [(secureReq(req) ? 'https://' : 'http://') + host];
}

/* ---------- game state ---------- */
const TEAM_DEFS = [
  { name: 'Red', color: '#ff4d5e' }, { name: 'Blue', color: '#4f7bff' }, { name: 'Green', color: '#2fd573' },
  { name: 'Gold', color: '#ffcf3a' }, { name: 'Purple', color: '#b46bff' }, { name: 'Orange', color: '#ff9d1c' },
];
let room = null;
const clients = new Set(); // { res, role, pid }

function newRoom(urls) {
  if (room && room.timer) clearTimeout(room.timer);
  for (const c of clients) { try { c.res.write('data: ' + JSON.stringify({ phase: 'closed', now: Date.now() }) + '\n\n'); c.res.end(); } catch (e) {} }
  clients.clear();
  room = {
    code: String(1000 + crypto.randomInt(9000)), hostToken: crypto.randomUUID(), phase: 'lobby',
    settings: { rounds: 10, seconds: 45, category: 'All', hideName: false, max: 20, teams: 0 },
    players: new Map(), rounds: [], idx: -1, deadline: 0, timer: null, results: null, places: loadPlaces(), seq: 0, urls: urls || [],
  };
  return room;
}
const connected = () => [...room.players.values()].filter(p => p.conn > 0);
const cur = () => room.rounds[room.idx];
const categories = () => ['All', ...new Set(room.places.map(p => p.category))];

function ranked() { return [...room.players.values()].sort((a, b) => b.score - a.score); }
function playerList() {
  return [...room.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked, connected: p.conn > 0, team: p.team }));
}
// Teams: team score = sum of its members' scores. Assignment is random (round-robin over a shuffle); the host can move people in the lobby.
function assignTeams() {
  const n = room.settings.teams, list = shuffle([...room.players.values()]);
  list.forEach((p, i) => { p.team = n ? i % n : null; });
}
function smallestTeam() {
  const n = room.settings.teams, size = Array(n).fill(0);
  for (const p of room.players.values()) if (p.team != null) size[p.team]++;
  const min = Math.min(...size), pick = size.map((c, i) => c === min ? i : -1).filter(i => i >= 0);
  return pick[crypto.randomInt(pick.length)];
}
function teamList() {
  const n = room.settings.teams;
  if (!n) return null;
  return TEAM_DEFS.slice(0, n).map((t, i) => {
    const m = [...room.players.values()].filter(p => p.team === i);
    return { id: i, name: t.name, color: t.color, members: m.map(p => p.id), score: m.reduce((a, p) => a + p.score, 0), last: room.phase === 'reveal' ? m.reduce((a, p) => a + (p.last ? p.last.pts : 0), 0) : 0 };
  });
}
function promptOf(pl) {
  const hide = room.settings.hideName && pl.img;
  return { category: pl.category, name: hide ? null : pl.name, image: pl.img ? pl.img.url : null };
}
function view(role, pid) {
  const r = room;
  const v = { now: Date.now(), phase: r.phase, code: r.code, settings: r.settings, players: playerList(), teams: teamList(), idx: r.idx, total: r.rounds.length, deadline: r.deadline };
  if (r.phase === 'guess' || r.phase === 'reveal') v.prompt = promptOf(cur());
  if (r.phase === 'reveal') {
    const pl = cur();
    v.answer = { name: pl.name, country: pl.country, lat: pl.lat, lon: pl.lon, radius: pl.radius, blurb: pl.blurb, credit: pl.img ? pl.img.credit : '' };
    v.results = r.results;
  }
  if (role === 'host') {
    v.urls = r.urls; v.categories = categories(); v.count = r.places.length;
  } else {
    const p = r.players.get(pid);
    if (p) {
      const order = ranked(), rank = order.findIndex(x => x.id === p.id) + 1;
      v.me = { id: p.id, name: p.name, color: p.color, team: p.team, score: p.score, locked: p.locked, guess: p.guess, last: p.last, rank, of: order.length };
    }
  }
  return v;
}
function broadcast() { for (const c of clients) { try { c.res.write('data: ' + JSON.stringify(view(c.role, c.pid)) + '\n\n'); } catch (e) {} } }

function startRound() {
  room.idx++;
  if (room.idx >= room.rounds.length) { room.phase = 'end'; room.deadline = 0; return broadcast(); }
  room.phase = 'guess';
  room.deadline = Date.now() + room.settings.seconds * 1000;
  for (const p of room.players.values()) { p.guess = null; p.locked = false; p.last = null; }
  room.results = null;
  clearTimeout(room.timer);
  const seq = ++room.seq;
  room.timer = setTimeout(() => { if (seq === room.seq) endRound(); }, room.settings.seconds * 1000 + 300);
  broadcast();
}
function endRound() {
  if (room.phase !== 'guess') return;
  clearTimeout(room.timer); room.seq++;
  const pl = cur();
  for (const p of room.players.values()) {
    if (p.guess) { const d = haversine(p.guess.lat, p.guess.lon, pl.lat, pl.lon); const pts = score(d, pl.radius); p.score += pts; p.last = { dist: d, pts }; }
    else p.last = { dist: null, pts: 0 };
  }
  room.results = ranked().map(p => ({ id: p.id, name: p.name, color: p.color, lat: p.guess ? p.guess.lat : null, lon: p.guess ? p.guess.lon : null, dist: p.last.dist, pts: p.last.pts, total: p.score }));
  room.phase = 'reveal'; room.deadline = 0;
  broadcast();
}
function maybeEarlyEnd() {
  const c = connected();
  if (room.phase === 'guess' && c.length && c.every(p => p.locked)) endRound();
}

/* ---------- http ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function sendFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise(resolve => {
    let s = ''; req.on('data', d => { s += d; if (s.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { resolve({}); } });
  });
}
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

async function api(req, res, u) {
  const q = u.searchParams;
  if (u.pathname === '/api/events') {
    const role = q.get('role'), pid = q.get('pid');
    if (!room) return json(res, 410, { error: 'no game' });
    if (role === 'host') { if (q.get('token') !== room.hostToken) return json(res, 403, { error: 'bad token' }); }
    else { const p = room.players.get(pid); if (!p || p.token !== q.get('token')) { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.write('data: ' + JSON.stringify({ phase: 'closed', now: Date.now() }) + '\n\n'); return res.end(); } }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const c = { res, role: role === 'host' ? 'host' : 'player', pid };
    clients.add(c);
    if (c.role === 'player') room.players.get(pid).conn++;
    res.write('data: ' + JSON.stringify(view(c.role, c.pid)) + '\n\n');
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 15000);
    req.on('close', () => {
      clearInterval(ping); clients.delete(c);
      if (c.role === 'player' && room) { const p = room.players.get(pid); if (p) { p.conn = Math.max(0, p.conn - 1); broadcast(); maybeEarlyEnd(); } }
    });
    if (c.role === 'player') broadcast();
    return;
  }
  const b = req.method === 'POST' ? await body(req) : {};

  if (u.pathname === '/api/login') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    if (blocked(req)) return json(res, 429, { error: 'Too many wrong tries. Wait a few minutes and try again.' });
    if (String(b.password || '').length > 200) return json(res, 400, { error: 'Wrong username or password.' });
    const user = checkLogin(b.username, b.password || '');
    if (!user) { noteFail(req); return json(res, 401, { error: 'Wrong username or password.' }); }
    fails.delete(ipOf(req));
    return startSession(req, res, user.name);
  }
  if (u.pathname === '/api/signup') { // only works while there are no accounts
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    if (hasUsers()) return json(res, 403, { error: 'Sign-up is closed: a host account already exists.' });
    if (blocked(req)) return json(res, 429, { error: 'Too many wrong tries. Wait a few minutes and try again.' });
    if (SETUP_CODE && !safeEq(b.setupCode || '', SETUP_CODE)) { noteFail(req); return json(res, 401, { error: 'Wrong setup code.' }); }
    const name = String(b.username || '').trim(), pw = String(b.password || '');
    if (!/^[A-Za-z0-9_.-]{3,20}$/.test(name)) return json(res, 400, { error: 'Username must be 3-20 letters, numbers, dots, dashes or underscores.' });
    if (pw.length < 8 || pw.length > 200) return json(res, 400, { error: 'Password must be at least 8 characters.' });
    const salt = crypto.randomBytes(16);
    users[name.toLowerCase()] = { name, salt: salt.toString('hex'), hash: hashPw(pw, salt).toString('hex'), created: new Date().toISOString() };
    try { saveUsers(); }
    catch (e) { users = {}; console.error('Could not save account:', e.message); return json(res, 500, { error: 'The account could not be saved on the server (is DATA_DIR writable?).' }); }
    return startSession(req, res, name);
  }
  if (u.pathname === '/api/logout') {
    sessions.delete(cookieOf(req, 'gn_host'));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'gn_host=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    return res.end('{"ok":true}');
  }
  if (u.pathname === '/api/whoami') { const user = hostUser(req); return json(res, 200, { host: !!user, user, canSignup: !hasUsers(), needsSetupCode: !hasUsers() && !!SETUP_CODE }); }
  if (u.pathname === '/api/host/new') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    if (!isHost(req)) return json(res, 401, { error: 'login required' });
    newRoom(joinUrls(req));
    return json(res, 200, { token: room.hostToken, code: room.code, urls: room.urls });
  }
  if (u.pathname === '/api/join') {
    if (!room || b.code !== room.code) return json(res, 400, { error: 'That game code is not right.' });
    if (room.phase === 'end') return json(res, 400, { error: 'That game has finished.' });
    let name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 14);
    if (!name) return json(res, 400, { error: 'Enter a name.' });
    if (room.players.size >= room.settings.max) return json(res, 400, { error: 'The game is full.' });
    const taken = new Set([...room.players.values()].map(p => p.name.toLowerCase()));
    let n = name, k = 2; while (taken.has(n.toLowerCase())) n = name.slice(0, 12) + ' ' + k++;
    const id = String(room.players.size), token = crypto.randomUUID();
    room.players.set(id, { id, token, name: n, color: colorOf(room.players.size), score: 0, guess: null, locked: false, conn: 0, last: null, team: null });
    if (room.settings.teams) room.players.get(id).team = smallestTeam();
    json(res, 200, { pid: id, token, name: n });
    return broadcast();
  }
  if (u.pathname === '/api/guess') {
    const p = room && room.players.get(String(b.pid));
    if (!p || p.token !== b.token) return json(res, 403, { error: 'bad player' });
    if (room.phase !== 'guess' || p.locked) return json(res, 200, { ok: false });
    const lat = +b.lat, lon = +b.lon;
    if (!isFinite(lat) || !isFinite(lon)) return json(res, 400, { error: 'bad pin' });
    p.guess = { lat: clamp(lat, -90, 90), lon: ((lon + 540) % 360) - 180 };
    if (b.lock) p.locked = true;
    json(res, 200, { ok: true });
    if (b.lock) { broadcast(); maybeEarlyEnd(); }
    return;
  }

  // host-only actions
  if (u.pathname.startsWith('/api/host/')) {
    if (!room || req.headers['x-token'] !== room.hostToken) return json(res, 403, { error: 'bad token' });
    const act = u.pathname.slice(10);
    if (act === 'settings' && room.phase === 'lobby') {
      const s = room.settings;
      if ('rounds' in b) s.rounds = clamp(Math.round(+b.rounds) || 10, 3, 30);
      if ('seconds' in b) s.seconds = clamp(Math.round(+b.seconds) || 45, 15, 180);
      if ('category' in b && categories().includes(b.category)) s.category = b.category;
      if ('hideName' in b) s.hideName = !!b.hideName;
      if ('max' in b) s.max = clamp(Math.round(+b.max) || 20, 4, 20);
      if ('teams' in b) { const t = Math.round(+b.teams) || 0; s.teams = t < 2 ? 0 : clamp(t, 2, 6); assignTeams(); }
      broadcast(); return json(res, 200, { ok: true });
    }
    if (act === 'teams' && room.phase === 'lobby' && room.settings.teams) {
      if (b.shuffle) assignTeams();
      if (b.move) { const p = room.players.get(String(b.move.pid)), t = Math.round(+b.move.team); if (p && t >= 0 && t < room.settings.teams) p.team = t; }
      broadcast(); return json(res, 200, { ok: true });
    }
    if (act === 'start' && room.phase === 'lobby') {
      if (!room.players.size) return json(res, 400, { error: 'No players yet.' });
      room.places = loadPlaces();
      const pool = room.settings.category === 'All' ? room.places : room.places.filter(p => p.category === room.settings.category);
      room.rounds = shuffle(pool).slice(0, room.settings.rounds); room.idx = -1;
      startRound(); return json(res, 200, { ok: true });
    }
    if (act === 'reveal') { endRound(); return json(res, 200, { ok: true }); }
    if (act === 'next' && room.phase === 'reveal') { startRound(); return json(res, 200, { ok: true }); }
    if (act === 'again' && room.phase !== 'guess') {
      room.phase = 'lobby'; room.idx = -1; room.rounds = []; room.results = null; room.deadline = 0;
      for (const p of room.players.values()) { p.score = 0; p.guess = null; p.locked = false; p.last = null; }
      broadcast(); return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'not now' });
  }
  json(res, 404, { error: 'unknown' });
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) return api(req, res, u).catch(e => { console.error(e); try { json(res, 500, { error: 'server error' }); } catch (_) {} });
  let p = decodeURIComponent(u.pathname);
  if (p === '/' || p === '/play') return sendFile(res, path.join(ROOT, 'play.html'));          // players: join with the game code
  if (p === '/login') return sendFile(res, path.join(ROOT, 'login.html'));
  if (p === '/host' || p === '/index.html') {                                                    // host app: password required
    if (!isHost(req)) { res.writeHead(302, { Location: '/login' }); return res.end(); }
    return sendFile(res, path.join(ROOT, 'index.html'));
  }
  if (p === '/play.html') return sendFile(res, path.join(ROOT, 'play.html'));
  if (/^\/banks\/[\w-]+\.js$/.test(p)) {                                                       // question banks hold the answers: host only
    if (!isHost(req)) { res.writeHead(401); return res.end('Host login required'); }
    return sendFile(res, path.join(ROOT, p));
  }
  if (p.startsWith('/img/')) return sendFile(res, path.join(ROOT, 'banks', 'images', path.basename(p)));
  res.writeHead(404); res.end('Not found');
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  GAME NIGHT LIVE is running.\n');
  console.log('  Host login:                           http://localhost:' + PORT + '/host');
  console.log('  Host account:                         ' + (hasUsers() ? 'ready (log in at /login)' : 'NONE YET: open /login and create it (first account becomes the host)'));
  console.log('  Accounts saved in:                    ' + DATA_DIR);
  const urls = lanUrls();
  console.log('  Players join at:                      ' + (urls.length ? urls.join('   or   ') : '(no network found, connect to Wi-Fi)'));
  console.log('\n  Leave this window open while you play. Press Ctrl+C to stop.\n');
});
