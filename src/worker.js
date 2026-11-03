// Game Night Live: Cloudflare Worker.
//
//   Worker (this default export)  routes pages + API, checks the host's login cookie
//   Auth  (Durable Object, one)   the host account (scrypt-hashed password), login sessions, rate limiting, the active game code
//   Game  (Durable Object, per game code)  one live game: players, rounds, scores, teams, live updates (Server-Sent Events)
//
// Globe Trotters scoring (do not change without asking):
//   score = round(5000 * exp(-max(0, dist_km - radius_km) / 1500))
import { DurableObject } from 'cloudflare:workers';
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import bankCsv from '../public/banks/globetrotters_bank.csv';
import imagesCsv from '../public/banks/globetrotters_images.csv';

/* ======================================================================== */
/* shared helpers                                                           */
/* ======================================================================== */
const SESSION_S = 12 * 3600;
const json = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...headers } });
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rint = n => { const lim = 0x100000000 - (0x100000000 % n); let x; do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= lim); return x % n; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rint(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const colorOf = i => `hsl(${Math.round((i * 137.508) % 360)} 78% 58%)`;
const sha = x => createHash('sha256').update(String(x)).digest();
const safeEq = (a, b) => timingSafeEqual(sha(a), sha(b));
const b64url = bytes => Buffer.from(bytes).toString('base64url');
function cookieOf(request, name) {
  for (const part of String(request.headers.get('cookie') || '').split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim(); }
  return '';
}
const sessionCookie = (token, secure, maxAge = SESSION_S) => `gn_host=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

/* ---------- Globe Trotters bank (answers stay on the server until the reveal) ---------- */
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
function readObjects(txt) {
  const rows = parseCSV(txt);
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
function loadPlaces() {
  const imgs = {};
  try { readObjects(imagesCsv).forEach(o => { if (o.id && o.image_url) imgs[o.id] = o; }); } catch (e) {}
  return readObjects(bankCsv)
    .filter(o => o.id && o.name && isFinite(+o.lat) && isFinite(+o.lon) && o.lat !== '' && o.lon !== '')
    .map(o => {
      let img = null;
      if (o.image_file) img = { url: '/img/' + encodeURIComponent(o.image_file), credit: '' };
      else if (imgs[o.id]) { const m = imgs[o.id]; img = { url: m.image_url, credit: [m.author, m.license].filter(Boolean).join(' · ') }; }
      return { id: o.id, name: o.name, country: o.country, continent: o.continent, category: o.category, lat: +o.lat, lon: +o.lon, radius: +o.radius_km || 0, difficulty: o.difficulty, blurb: o.reveal_blurb, img };
    });
}
const PLACES = loadPlaces();

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, r = Math.PI / 180, dl = (lat2 - lat1) * r, dg = (lon2 - lon1) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
const score = (dist, radius) => Math.round(5000 * Math.exp(-Math.max(0, dist - radius) / 1500));
const GAMES = ['jeopardy', 'globetrotters', 'spotthefake', 'crowdcontrol']; // the game a code is for is chosen by the host before opening the lobby
const TEAM_DEFS = [
  { name: 'Red', color: '#ff4d5e' }, { name: 'Blue', color: '#4f7bff' }, { name: 'Green', color: '#2fd573' },
  { name: 'Gold', color: '#ffcf3a' }, { name: 'Purple', color: '#b46bff' }, { name: 'Orange', color: '#ff9d1c' },
];

/* ======================================================================== */
/* Auth Durable Object: the host account                                    */
/* ======================================================================== */
// Sign-up is open ONLY while no account exists: the first account created becomes the host and sign-up then closes.
// Optional SETUP_CODE secret: if set, the first sign-up must also enter it.
// Forgot your password? Set the RESET_HOST secret to a new value (see AGENTS.md) and sign up again.
export class Auth extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.setup = env.SETUP_CODE || '';
    this.s = { users: {}, sessions: {}, fails: {}, room: null };
    ctx.blockConcurrencyWhile(async () => {
      const s = await ctx.storage.get('s'); if (s) this.s = s;
      // Forgot the password? Set the RESET_HOST secret to any new value: the host account and all logins are wiped once
      // for that value, and sign-up reopens (see AGENTS.md).
      const reset = env.RESET_HOST || '';
      if (reset && this.s.lastReset !== reset) { this.s = { users: {}, sessions: {}, fails: {}, room: this.s.room || null, lastReset: reset }; await ctx.storage.put('s', this.s); }
    });
  }
  save() { return this.ctx.storage.put('s', this.s); }
  hasUsers() { return Object.keys(this.s.users).length > 0; }
  userOf(token) {
    const x = token && this.s.sessions[token];
    if (!x) return null;
    if (x.exp < Date.now()) { delete this.s.sessions[token]; return null; }
    return x.user;
  }
  blocked(ip) { const f = this.s.fails[ip]; return !!f && f.until > Date.now(); }
  async noteFail(ip) {
    const f = this.s.fails[ip] || { n: 0, until: 0 };
    f.n++; if (f.n >= 8) { f.until = Date.now() + 10 * 60 * 1000; f.n = 0; }
    this.s.fails[ip] = f;
    for (const k of Object.keys(this.s.fails)) if (this.s.fails[k].until < Date.now() && this.s.fails[k].n === 0) delete this.s.fails[k];
    await this.save();
  }
  async startSession(user) {
    const token = b64url(randomBytes(24)), now = Date.now();
    for (const k of Object.keys(this.s.sessions)) if (this.s.sessions[k].exp < now) delete this.s.sessions[k];
    this.s.sessions[token] = { exp: now + SESSION_S * 1000, user };
    await this.save();
    return token;
  }
  hash(pw, salt) { return scryptSync(String(pw), salt, 64); }

  async user(token) { return this.userOf(token); }
  async whoami(token) {
    const user = this.userOf(token), none = !this.hasUsers();
    return { host: !!user, user, canSignup: none, needsSetupCode: none && !!this.setup };
  }
  async signup(b, ip) {
    if (this.hasUsers()) return { status: 403, body: { error: 'Sign-up is closed: a host account already exists.' } };
    if (this.blocked(ip)) return { status: 429, body: { error: 'Too many wrong tries. Wait a few minutes and try again.' } };
    if (this.setup && !safeEq(b.setupCode || '', this.setup)) { await this.noteFail(ip); return { status: 401, body: { error: 'Wrong setup code.' } }; }
    const name = String(b.username || '').trim(), pw = String(b.password || '');
    if (!/^[A-Za-z0-9_.-]{3,20}$/.test(name)) return { status: 400, body: { error: 'Username must be 3-20 letters, numbers, dots, dashes or underscores.' } };
    if (pw.length < 8 || pw.length > 200) return { status: 400, body: { error: 'Password must be at least 8 characters.' } };
    const salt = randomBytes(16);
    // no await between the hasUsers() check above and this assignment, so two simultaneous sign-ups cannot both win
    this.s.users[name.toLowerCase()] = { name, salt: salt.toString('hex'), hash: this.hash(pw, salt).toString('hex'), created: new Date().toISOString() };
    const token = await this.startSession(name);
    return { status: 200, body: { ok: true, user: name }, token };
  }
  async login(b, ip) {
    if (this.blocked(ip)) return { status: 429, body: { error: 'Too many wrong tries. Wait a few minutes and try again.' } };
    const pw = String(b.password || '');
    const bad = async () => { await this.noteFail(ip); return { status: 401, body: { error: 'Wrong username or password.' } }; };
    if (pw.length > 200) return bad();
    const u = this.s.users[String(b.username || '').trim().toLowerCase()];
    const h = this.hash(pw, u ? Buffer.from(u.salt, 'hex') : Buffer.alloc(16)); // same work whether or not the user exists
    if (!u || !timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) return bad();
    delete this.s.fails[ip];
    const token = await this.startSession(u.name);
    return { status: 200, body: { ok: true, user: u.name }, token };
  }
  async logout(token) { if (token && this.s.sessions[token]) { delete this.s.sessions[token]; await this.save(); } }
  // The host starts a new game: remember its code, return the previous code (so the Worker can close that game).
  async reserveRoom(token) {
    if (!this.userOf(token)) return { error: true };
    const old = this.s.room ? this.s.room.code : null;
    let code; do { code = String(1000 + rint(9000)); } while (code === old);
    this.s.room = { code, hostToken: crypto.randomUUID() };
    await this.save();
    return { code, hostToken: this.s.room.hostToken, old };
  }
}

/* ======================================================================== */
/* Game Durable Object: one live Globe Trotters game                        */
/* ======================================================================== */
export class Game extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Set();   // live Server-Sent-Event connections { writer, role, pid }
    this.enc = new TextEncoder();
    this.pingTimer = null;
    this.r = null;              // the game; persisted to storage after every change
    ctx.blockConcurrencyWhile(async () => { this.r = (await ctx.storage.get('room')) || null; });
  }
  save() { return this.r ? this.ctx.storage.put('room', this.r) : Promise.resolve(); }

  /* ---- lifecycle (called by the Worker over RPC) ---- */
  async init(hostToken, code) {
    await this.close();
    this.r = {
      code, hostToken, phase: 'lobby',
      settings: { rounds: 10, seconds: 45, category: 'All', hideName: false, max: 20, teams: 0, game: 'globetrotters' },
      players: {}, rounds: [], idx: -1, deadline: 0, results: null,
    };
    await this.save();
  }
  async close() {
    for (const c of [...this.clients]) { this.send(c, { phase: 'closed', now: Date.now() }); this.drop(c, true); }
    this.r = null;
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  /* ---- state helpers ---- */
  players() { return Object.values(this.r.players); }
  connCount(pid) { let n = 0; for (const c of this.clients) if (c.role === 'player' && c.pid === pid) n++; return n; }
  connected() { return this.players().filter(p => this.connCount(p.id) > 0); }
  cur() { return this.r.rounds[this.r.idx]; }
  categories() { return ['All', ...new Set(PLACES.map(p => p.category))]; }
  ranked() { return this.players().sort((a, b) => b.score - a.score); }
  playerList() {
    return this.players().map(p => ({ id: p.id, name: p.name, color: p.color, score: p.score, locked: p.locked, connected: this.connCount(p.id) > 0, team: p.team }));
  }
  promptOf(pl) {
    const hide = this.r.settings.hideName && pl.img;
    return { category: pl.category, name: hide ? null : pl.name, image: pl.img ? pl.img.url : null };
  }
  // Teams: team score = sum of its members' scores. Assignment is random (round-robin over a shuffle); the host can move people in the lobby.
  assignTeams() {
    const n = this.r.settings.teams;
    shuffle(this.players()).forEach((p, i) => { p.team = n ? i % n : null; });
  }
  smallestTeam() {
    const n = this.r.settings.teams, size = Array(n).fill(0);
    for (const p of this.players()) if (p.team != null) size[p.team]++;
    const min = Math.min(...size), pick = size.map((c, i) => c === min ? i : -1).filter(i => i >= 0);
    return pick[rint(pick.length)];
  }
  teamList() {
    const n = this.r.settings.teams;
    if (!n) return null;
    return TEAM_DEFS.slice(0, n).map((t, i) => {
      const m = this.players().filter(p => p.team === i);
      return { id: i, name: t.name, color: t.color, members: m.map(p => p.id), score: m.reduce((a, p) => a + p.score, 0), last: this.r.phase === 'reveal' ? m.reduce((a, p) => a + (p.last ? p.last.pts : 0), 0) : 0 };
    });
  }
  view(role, pid) {
    const r = this.r;
    const v = { now: Date.now(), phase: r.phase, code: r.code, settings: r.settings, players: this.playerList(), teams: this.teamList(), idx: r.idx, total: r.rounds.length, deadline: r.deadline };
    if (r.phase === 'guess' || r.phase === 'reveal') v.prompt = this.promptOf(this.cur());
    if (r.phase === 'reveal') {
      const pl = this.cur();
      v.answer = { name: pl.name, country: pl.country, lat: pl.lat, lon: pl.lon, radius: pl.radius, blurb: pl.blurb, credit: pl.img ? pl.img.credit : '' };
      v.results = r.results;
    }
    if (role === 'host') {
      v.categories = this.categories(); v.count = PLACES.length;
    } else {
      const p = r.players[pid];
      if (p) {
        const order = this.ranked(), rank = order.findIndex(x => x.id === p.id) + 1;
        v.me = { id: p.id, name: p.name, color: p.color, team: p.team, score: p.score, locked: p.locked, guess: p.guess, last: p.last, rank, of: order.length };
      }
    }
    return v;
  }

  /* ---- live updates (Server-Sent Events) ---- */
  send(c, v) {
    try { c.writer.write(this.enc.encode('data: ' + JSON.stringify(v) + '\n\n')).catch(() => this.drop(c)); } catch (e) { this.drop(c); }
  }
  broadcast() { for (const c of [...this.clients]) if (this.r) this.send(c, this.view(c.role, c.pid)); }
  drop(c, quiet) {
    if (!this.clients.delete(c)) return;
    try { c.writer.close().catch(() => {}); } catch (e) {}
    if (!this.clients.size && this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    if (!quiet && c.role === 'player' && this.r) { this.broadcast(); this.maybeEarlyEnd(); this.ctx.waitUntil(this.save()); }
  }
  openStream(role, pid) {
    const { readable, writable } = new TransformStream();
    const c = { writer: writable.getWriter(), role, pid };
    this.clients.add(c);
    c.writer.closed.catch(() => {}).finally(() => this.drop(c));
    if (!this.pingTimer) this.pingTimer = setInterval(() => { for (const x of [...this.clients]) { try { x.writer.write(this.enc.encode(': ping\n\n')).catch(() => this.drop(x)); } catch (e) { this.drop(x); } } }, 4000); // a closed connection is only noticed when we next write to it, so keep-alives are frequent (and tiny)
    this.send(c, this.view(role, pid));
    if (role === 'player') this.broadcast();
    return new Response(readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' } });
  }
  closedStream() {
    return new Response('data: ' + JSON.stringify({ phase: 'closed', now: Date.now() }) + '\n\n', { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
  }

  /* ---- game flow ---- */
  async startRound() {
    const r = this.r;
    r.idx++;
    if (r.idx >= r.rounds.length) { r.phase = 'end'; r.deadline = 0; return this.broadcast(); }
    r.phase = 'guess';
    r.deadline = Date.now() + r.settings.seconds * 1000;
    for (const p of this.players()) { p.guess = null; p.locked = false; p.last = null; }
    r.results = null;
    await this.ctx.storage.setAlarm(r.deadline + 300); // round timer: the alarm ends the round if nobody does
    this.broadcast();
  }
  endRound() {
    const r = this.r;
    if (!r || r.phase !== 'guess') return;
    const pl = this.cur();
    for (const p of this.players()) {
      if (p.guess) { const d = haversine(p.guess.lat, p.guess.lon, pl.lat, pl.lon); const pts = score(d, pl.radius); p.score += pts; p.last = { dist: d, pts }; }
      else p.last = { dist: null, pts: 0 };
    }
    r.results = this.ranked().map(p => ({ id: p.id, name: p.name, color: p.color, lat: p.guess ? p.guess.lat : null, lon: p.guess ? p.guess.lon : null, dist: p.last.dist, pts: p.last.pts, total: p.score }));
    r.phase = 'reveal'; r.deadline = 0;
    this.broadcast();
  }
  maybeEarlyEnd() {
    const c = this.connected();
    if (this.r.phase === 'guess' && c.length && c.every(p => p.locked)) this.endRound();
  }
  async alarm() {
    const r = this.r;
    if (r && r.phase === 'guess' && Date.now() >= r.deadline) { this.endRound(); await this.save(); }
  }

  /* ---- HTTP (the Worker forwards /api/... here, already checked for a valid game code) ---- */
  async fetch(request) {
    const u = new URL(request.url), act = u.pathname;
    if (act === '/api/events') {
      if (!this.r) return this.closedStream();
      const role = u.searchParams.get('role'), pid = u.searchParams.get('pid');
      if (role === 'host') { if (u.searchParams.get('token') !== this.r.hostToken) return json({ error: 'bad token' }, 403); return this.openStream('host', null); }
      const p = this.r.players[pid];
      if (!p || p.token !== u.searchParams.get('token')) return this.closedStream();
      return this.openStream('player', pid);
    }
    if (!this.r) return json({ error: act === '/api/join' ? 'That game code is not right.' : 'no game' }, act === '/api/join' ? 400 : 410);
    let b = {};
    try { b = JSON.parse((await request.text()) || '{}'); } catch (e) {}
    const res = await this.handle(act, b, request.headers.get('x-token'));
    await this.save();
    return res;
  }
  async handle(act, b, hostToken) {
    const r = this.r;
    if (act === '/api/join') {
      if (r.phase === 'end') return json({ error: 'That game has finished.' }, 400);
      const name0 = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 14);
      if (!name0) return json({ error: 'Enter a name.' }, 400);
      if (this.players().length >= r.settings.max) return json({ error: 'The game is full.' }, 400);
      const taken = new Set(this.players().map(p => p.name.toLowerCase()));
      let n = name0, k = 2; while (taken.has(n.toLowerCase())) n = name0.slice(0, 12) + ' ' + k++;
      const id = String(this.players().length), token = crypto.randomUUID();
      r.players[id] = { id, token, name: n, color: colorOf(this.players().length), score: 0, guess: null, locked: false, last: null, team: null };
      if (r.settings.teams) r.players[id].team = this.smallestTeam();
      this.broadcast();
      return json({ pid: id, token, name: n, code: r.code });
    }
    if (act === '/api/guess') {
      const p = r.players[String(b.pid)];
      if (!p || p.token !== b.token) return json({ error: 'bad player' }, 403);
      if (r.phase !== 'guess' || p.locked) return json({ ok: false });
      const lat = +b.lat, lon = +b.lon;
      if (!isFinite(lat) || !isFinite(lon)) return json({ error: 'bad pin' }, 400);
      p.guess = { lat: clamp(lat, -90, 90), lon: ((lon + 540) % 360) - 180 };
      if (b.lock) { p.locked = true; this.broadcast(); this.maybeEarlyEnd(); }
      return json({ ok: true });
    }
    if (act.startsWith('/api/host/')) {
      if (hostToken !== r.hostToken) return json({ error: 'bad token' }, 403);
      const a = act.slice(10), s = r.settings;
      if (a === 'settings' && r.phase === 'lobby') {
        if ('rounds' in b) s.rounds = clamp(Math.round(+b.rounds) || 10, 3, 30);
        if ('seconds' in b) s.seconds = clamp(Math.round(+b.seconds) || 45, 15, 180);
        if ('category' in b && this.categories().includes(b.category)) s.category = b.category;
        if ('hideName' in b) s.hideName = !!b.hideName;
        if ('max' in b) s.max = clamp(Math.round(+b.max) || 20, 4, 20);
        if ('game' in b && GAMES.includes(b.game)) s.game = b.game;
        if ('teams' in b) { const t = Math.round(+b.teams) || 0; s.teams = t < 2 ? 0 : clamp(t, 2, 6); this.assignTeams(); }
        this.broadcast(); return json({ ok: true });
      }
      if (a === 'teams' && r.phase === 'lobby' && s.teams) {
        if (b.shuffle) this.assignTeams();
        if (b.move) { const p = r.players[String(b.move.pid)], t = Math.round(+b.move.team); if (p && t >= 0 && t < s.teams) p.team = t; }
        this.broadcast(); return json({ ok: true });
      }
      if (a === 'start' && r.phase === 'lobby') {
        if (s.game !== 'globetrotters') return json({ error: 'This game is run from the host screen.' }, 400);
        if (!this.players().length) return json({ error: 'No players yet.' }, 400);
        const pool = s.category === 'All' ? PLACES : PLACES.filter(p => p.category === s.category);
        r.rounds = shuffle(pool).slice(0, s.rounds); r.idx = -1;
        await this.startRound(); return json({ ok: true });
      }
      if (a === 'reveal') { this.endRound(); return json({ ok: true }); }
      if (a === 'next' && r.phase === 'reveal') { await this.startRound(); return json({ ok: true }); }
      if (a === 'again') { // back to the lobby from any phase (also used when the host leaves a game mid-round)
        r.phase = 'lobby'; r.idx = -1; r.rounds = []; r.results = null; r.deadline = 0;
        for (const p of this.players()) { p.score = 0; p.guess = null; p.locked = false; p.last = null; }
        this.broadcast(); return json({ ok: true });
      }
      return json({ error: 'not now' }, 400);
    }
    return json({ error: 'unknown' }, 404);
  }
}

/* ======================================================================== */
/* Worker: routing                                                          */
/* ======================================================================== */
const GAME_PATHS = /^\/api\/(events|join|guess|host\/(settings|start|reveal|next|again|teams))$/;
const authStub = env => env.AUTH.get(env.AUTH.idFromName('auth'));
const gameStub = (env, code) => env.GAME.get(env.GAME.idFromName(code));

async function pageFromAssets(env, request, path, isHtml) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  if (res.status !== 200) return new Response('Not found', { status: 404 });
  const h = new Headers(res.headers);
  h.set('cache-control', 'no-cache');
  h.set('x-content-type-options', 'nosniff');
  if (isHtml) { h.set('x-frame-options', 'DENY'); h.set('referrer-policy', 'same-origin'); }
  return new Response(res.body, { status: 200, headers: h });
}

async function pages(request, env, url) {
  const p = url.pathname;
  if (p === '/' || p === '/play' || p === '/play.html') return pageFromAssets(env, request, '/play.html', true);   // players: enter the game code
  if (p === '/login' || p === '/login.html') return pageFromAssets(env, request, '/login.html', true);
  const token = cookieOf(request, 'gn_host');
  const needHost = async () => token ? await authStub(env).user(token) : null;
  if (p === '/host' || p === '/index.html') {                                                                         // the host app: login required
    if (!(await needHost())) return new Response(null, { status: 302, headers: { location: '/login' } });
    return pageFromAssets(env, request, '/index.html', true);
  }
  if (/^\/banks\/[\w-]+\.js$/.test(p)) {                                                                              // host-run question banks hold the answers: login required
    if (!(await needHost())) return new Response('Host login required', { status: 401 });
    return pageFromAssets(env, request, p, false);
  }
  if (/^\/img\/[\w. %-]+$/.test(p)) return pageFromAssets(env, request, p, false);
  return new Response('Not found', { status: 404 });
}

async function api(request, env, url) {
  const p = url.pathname, secure = url.protocol === 'https:';
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const token = cookieOf(request, 'gn_host');
  let text = '', b = {};
  if (request.method === 'POST') {
    text = await request.text();
    if (text.length > 20000) return json({ error: 'too large' }, 413);
    try { b = JSON.parse(text || '{}'); } catch (e) {}
  }
  const auth = authStub(env);

  if (p === '/api/whoami') return json(await auth.whoami(token));
  if (p === '/api/login' || p === '/api/signup') {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    const out = p === '/api/login' ? await auth.login(b, ip) : await auth.signup(b, ip);
    return json(out.body, out.status, out.token ? { 'set-cookie': sessionCookie(out.token, secure) } : {});
  }
  if (p === '/api/logout') { await auth.logout(token); return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', secure, 0) }); }
  if (p === '/api/host/new') {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    const room = await auth.reserveRoom(token);
    if (room.error) return json({ error: 'login required' }, 401);
    if (room.old) { try { await gameStub(env, room.old).close(); } catch (e) { console.error(e); } }
    await gameStub(env, room.code).init(room.hostToken, room.code);
    return json({ token: room.hostToken, code: room.code });
  }

  if (GAME_PATHS.test(p)) {
    const code = String(url.searchParams.get('code') || b.code || '').trim();
    if (!/^\d{4}$/.test(code)) {
      if (p === '/api/events') return new Response('data: ' + JSON.stringify({ phase: 'closed', now: Date.now() }) + '\n\n', { headers: { 'content-type': 'text/event-stream' } });
      return json({ error: p === '/api/join' ? 'That game code is not right.' : 'bad code' }, 400);
    }
    const init = request.method === 'POST'
      ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-token': request.headers.get('x-token') || '' }, body: text }
      : { method: 'GET' };
    return gameStub(env, code).fetch(new Request(url.toString(), init));
  }
  return json({ error: 'unknown' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      return url.pathname.startsWith('/api/') ? await api(request, env, url) : await pages(request, env, url);
    } catch (e) {
      console.error(e && e.stack || e);
      return json({ error: 'server error' }, 500);
    }
  },
};
