// Game Night Live — game server. Zero dependencies: just `node server.js`.
// It serves the host app (index.html) and the phone page (play.html), and runs the live
// Globe Trotters game: players join from their own devices, drop a pin, and are scored by distance.
//
//   score = round(5000 * exp(-max(0, dist_km - radius_km) / 1500))
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const PORT = +process.env.PORT || 3000;
const ROOT = __dirname;

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
const ownAddrs = () => { const s = new Set(['127.0.0.1', '::1']); for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) s.add(n.address); return s; };
const isLocal = req => { let a = req.socket.remoteAddress || ''; a = a.replace(/^::ffff:/, ''); return ownAddrs().has(a); };

/* ---------- game state ---------- */
let room = null;
const clients = new Set(); // { res, role, pid }

function newRoom() {
  if (room && room.timer) clearTimeout(room.timer);
  for (const c of clients) { try { c.res.write('data: ' + JSON.stringify({ phase: 'closed', now: Date.now() }) + '\n\n'); c.res.end(); } catch (e) {} }
  clients.clear();
  room = {
    code: String(1000 + crypto.randomInt(9000)), hostToken: crypto.randomUUID(), phase: 'lobby',
    settings: { rounds: 10, seconds: 45, category: 'All', hideName: false, max: 20 },
    players: new Map(), rounds: [], idx: -1, deadline: 0, timer: null, results: null, places: loadPlaces(), seq: 0,
  };
  return room;
}
const connected = () => [...room.players.values()].filter(p => p.conn > 0);
const cur = () => room.rounds[room.idx];
const categories = () => ['All', ...new Set(room.places.map(p => p.category))];

function ranked() { return [...room.players.values()].sort((a, b) => b.score - a.score); }
function playerList() {
  return [...room.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked, connected: p.conn > 0 }));
}
function promptOf(pl) {
  const hide = room.settings.hideName && pl.img;
  return { category: pl.category, name: hide ? null : pl.name, image: pl.img ? pl.img.url : null };
}
function view(role, pid) {
  const r = room;
  const v = { now: Date.now(), phase: r.phase, code: r.code, settings: r.settings, players: playerList(), idx: r.idx, total: r.rounds.length, deadline: r.deadline };
  if (r.phase === 'guess' || r.phase === 'reveal') v.prompt = promptOf(cur());
  if (r.phase === 'reveal') {
    const pl = cur();
    v.answer = { name: pl.name, country: pl.country, lat: pl.lat, lon: pl.lon, radius: pl.radius, blurb: pl.blurb, credit: pl.img ? pl.img.credit : '' };
    v.results = r.results;
  }
  if (role === 'host') {
    v.urls = lanUrls(); v.categories = categories(); v.count = r.places.length;
  } else {
    const p = r.players.get(pid);
    if (p) {
      const order = ranked(), rank = order.findIndex(x => x.id === p.id) + 1;
      v.me = { id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked, guess: p.guess, last: p.last, rank, of: order.length };
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

  if (u.pathname === '/api/host/new') {
    if (req.method !== 'POST' || !isLocal(req)) return json(res, 403, { error: 'host only' });
    newRoom();
    return json(res, 200, { token: room.hostToken, code: room.code, urls: lanUrls() });
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
    room.players.set(id, { id, token, name: n, color: colorOf(room.players.size), score: 0, guess: null, locked: false, conn: 0, last: null });
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
  if (p === '/') p = isLocal(req) ? '/index.html' : '/play.html';
  if (p === '/play') p = '/play.html';
  if (p === '/index.html' || p === '/play.html') return sendFile(res, path.join(ROOT, p));
  if (/^\/banks\/[\w-]+\.js$/.test(p)) return sendFile(res, path.join(ROOT, p));
  if (p.startsWith('/img/')) return sendFile(res, path.join(ROOT, 'banks', 'images', path.basename(p)));
  res.writeHead(404); res.end('Not found');
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  GAME NIGHT LIVE is running.\n');
  console.log('  Host screen (open on this computer):  http://localhost:' + PORT);
  const urls = lanUrls();
  console.log('  Players join on their phones at:      ' + (urls.length ? urls.join('   or   ') : '(no network found, connect to Wi-Fi)'));
  console.log('\n  Leave this window open while you play. Press Ctrl+C to stop.\n');
});
