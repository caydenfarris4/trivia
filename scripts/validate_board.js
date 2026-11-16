#!/usr/bin/env node
// Checks a Big Board candidate against the rules every board in public/banks/jeopardy.js follows.
// Used by the weekly board agents (see agents/weekly-board/README.md) and handy by hand.
//
//   node scripts/validate_board.js path/to/candidate.json     check one candidate against the bank
//   node scripts/validate_board.js --bank                      check every board already in the bank
//
// Exit code 0 = no errors (warnings are advice for the QA agent), 1 = errors, 2 = bad usage.
const fs = require('fs'), path = require('path');
const BANK = path.join(__dirname, '..', 'public', 'banks', 'jeopardy.js');

const loadBank = () => { const w = {}; new Function('window', fs.readFileSync(BANK, 'utf8'))(w); return w.BANKS.jeopardy.boards; };

// Family rule: nothing about alcohol, coffee, tea, tobacco or vaping, and no crude language.
const BANNED = ['alcohol', 'alcoholic', 'beer', 'wine', 'liquor', 'whiskey', 'whisky', 'vodka', 'rum', 'bourbon', 'tequila', 'cocktail', 'champagne', 'brewery', 'saloon',
  'coffee', 'espresso', 'latte', 'tea', 'tobacco', 'cigarette', 'cigar', 'vape', 'vaping', 'marijuana', 'cannabis', 'gambling', 'casino', 'porn', 'sex', 'sexy', 'nude', 'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass'];
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => norm(s).split(' ').filter(w => w.length > 2);
const STOP = new Set('the and for with this that from are was were has have had his her its they their them you your who what which when where into over under about one two not but all any can will out'.split(' '));
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i || 1); };

function validate(board, bank, opts = {}) {
  const errors = [], warnings = [];
  const E = m => errors.push(m), W = m => warnings.push(m);
  const others = bank.filter(b => b.name !== opts.ignoreName);
  if (!board || typeof board !== 'object') return { errors: ['not an object'], warnings };
  const s = (x, max) => typeof x === 'string' && x.trim() && x.length <= max;

  if (!s(board.name, 40)) E('name is required (1-40 characters)');
  else if (others.some(b => norm(b.name) === norm(board.name))) E(`a board named "${board.name}" already exists`);
  if (!['family', 'trivia'].includes(board.style) && !(opts.styleOptional && board.style === undefined)) E('style must be "family" or "trivia"');
  if (!Number.isInteger(board.dailyDoubles) || board.dailyDoubles < 1 || board.dailyDoubles > 2) E('dailyDoubles must be 1 or 2');
  if (!Array.isArray(board.categories) || board.categories.length !== 5) { E('a board needs exactly 5 categories'); return { errors, warnings }; }

  const catNames = new Set(), answers = new Map(), allClues = [];
  board.categories.forEach((c, ci) => {
    const where = `category ${ci + 1} "${c && c.name}"`;
    if (!c || !s(c.name, 32)) { E(`${where}: name is required (1-32 characters, it must fit on a board header)`); return; }
    if (catNames.has(norm(c.name))) E(`${where}: duplicate category name within the board`);
    catNames.add(norm(c.name));
    if (others.some(b => b.categories.some(x => norm(x.name) === norm(c.name)))) E(`${where}: a category with this name already exists in the bank (the mixer would show two identical columns)`);
    if (!Array.isArray(c.clues) || c.clues.length !== 5) { E(`${where}: needs exactly 5 clues`); return; }
    c.clues.forEach((k, ri) => {
      const w = `${where} $${(ri + 1) * 200}`;
      if (!k || k.v !== (ri + 1) * 200) E(`${w}: value must be ${(ri + 1) * 200} (200, 400, 600, 800, 1000 in order)`);
      if (!k || !s(k.q, 300)) E(`${w}: clue text is required (max 300 characters)`);
      if (!k || !s(k.a, 70)) E(`${w}: answer is required (max 70 characters, a short phrase the host can read aloud)`);
      if (k && typeof k.q === 'string' && typeof k.a === 'string') allClues.push({ w, q: k.q, a: k.a });
    });
  });
  const f = board.final;
  if (!f || !s(f.category, 32) || !s(f.q, 400) || !s(f.a, 70)) E('final needs category, q and a');
  else allClues.push({ w: 'final', q: f.q, a: f.a });
  if (f && f.category && others.some(b => b.final && norm(b.final.category) === norm(f.category))) W(`final category "${f.category}" is already used by another board`);

  for (const { w, q, a } of allClues) {
    const text = ' ' + norm(q + ' ' + a) + ' ';
    for (const bad of BANNED) if (text.includes(' ' + bad + ' ')) E(`${w}: contains "${bad}" (off-limits for this family)`);
    const aw = words(a).filter(x => !STOP.has(x)), qw = new Set(words(q));
    if (aw.length && aw.every(x => qw.has(x))) W(`${w}: the answer ("${a}") appears in the clue text`);
    if (/\b(currently|as of|this year|latest|recent(ly)?|today|new(est)?|record holder)\b/i.test(q)) W(`${w}: wording can go stale ("current", "as of", "recent", ...)`);
    if (/\?\s*$/.test(q)) W(`${w}: clues are statements, not questions`);
    const key = norm(a); if (answers.has(key)) W(`${w}: same answer as ${answers.get(key)}`); else answers.set(key, w);
  }
  // near-duplicate clues anywhere in the existing bank
  const existing = others.flatMap(b => [...b.categories.flatMap(c => c.clues.map(k => ({ b: b.name, q: k.q, a: k.a }))), b.final ? { b: b.name, q: b.final.q, a: b.final.a } : null].filter(Boolean));
  for (const { w, q, a } of allClues) {
    const qw = words(q).filter(x => !STOP.has(x));
    for (const e of existing) {
      const sim = jaccard(qw, words(e.q).filter(x => !STOP.has(x)));
      if (sim >= 0.7) E(`${w}: near-duplicate of a clue in "${e.b}" (${Math.round(sim * 100)}% same words)`);
      else if (norm(e.a) === norm(a) && sim >= 0.35) W(`${w}: same answer as a similar clue in "${e.b}"`);
    }
  }
  return { errors, warnings };
}

module.exports = { validate, loadBank, BANK };

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg) { console.error('usage: node scripts/validate_board.js <candidate.json> | --bank'); process.exit(2); }
  const bank = loadBank();
  let bad = 0;
  const report = (name, r) => { console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${name}: ${r.errors.length} error(s), ${r.warnings.length} warning(s)`); r.errors.forEach(e => console.log('   ERROR   ' + e)); r.warnings.forEach(e => console.log('   warning ' + e)); if (r.errors.length) bad++; };
  if (arg === '--bank') bank.forEach(b => report(b.name, validate(b, bank, { ignoreName: b.name, styleOptional: true })));
  else { let c; try { c = JSON.parse(fs.readFileSync(arg, 'utf8')); } catch (e) { console.error('cannot read candidate: ' + e.message); process.exit(2); } report(c.name || arg, validate(c, bank)); }
  process.exit(bad ? 1 : 0);
}
