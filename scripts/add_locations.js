#!/usr/bin/env node
// Adds validated Globe Trotters places to public/banks/globetrotters_bank.csv and globetrotters_images.csv.
//
//   node scripts/add_locations.js candidate.json [--approved qa_report.json] [--max 5]
//
// With --approved, only places the QA report marks "PASS" are added (report format: agents/weekly-locations/qa.md).
// The candidate may carry "sources" notes; they are not written to the data files.
const fs = require('fs'), path = require('path');
const V = require('./validate_location.js');

const args = process.argv.slice(2), file = args[0];
if (!file) { console.error('usage: node scripts/add_locations.js <candidate.json> [--approved qa_report.json] [--max N]'); process.exit(2); }
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const cand = JSON.parse(fs.readFileSync(file, 'utf8')); let list = Array.isArray(cand) ? cand : cand.locations;
if (opt('--approved')) {
  const qa = JSON.parse(fs.readFileSync(opt('--approved'), 'utf8')), pass = new Set((qa.locations || []).filter(x => x.verdict === 'PASS').map(x => V.norm(x.name)));
  list = list.filter(c => pass.has(V.norm(c.name)));
}
if (opt('--max')) list = list.slice(0, +opt('--max'));
if (!list.length) { console.error('Nothing to add (no approved places).'); process.exit(1); }

const places = V.loadPlaces(), images = V.loadImages();
const res = V.validateStatic(list, places, images);
const errs = res.flatMap((r, i) => r.errors.map(e => `${list[i].name}: ${e}`));
if (errs.length) { console.error('Not added. Fix these first:\n' + errs.map(e => '  ' + e).join('\n')); process.exit(1); }

let nextId = Math.max(...places.rows.map(p => +p.id)) + 1;
let bankAdd = '', imgAdd = '';
const added = [];
for (const c of list) {
  const id = String(nextId++);
  bankAdd += V.csvLine(places.head, { id, name: c.name, country: c.country, continent: c.continent, category: c.category, lat: c.lat, lon: c.lon, radius_km: c.radius_km, difficulty: c.difficulty, reveal_blurb: c.reveal_blurb, image_search_query: `${c.name} ${c.country} photo`, image_file: '', visited: '' });
  imgAdd += V.csvLine(images.head, { id, name: c.name, wiki_title: c.image.wiki_title, image_url: c.image.image_url, license: c.image.license, author: c.image.author, commons_page: c.image.commons_page });
  added.push({ id, name: c.name });
}
const append = (name, text) => { const p = path.join(V.BANKS, name); let s = fs.readFileSync(p, 'utf8'); if (!s.endsWith('\n')) s += '\r\n'; fs.writeFileSync(p, s + text); };
append('globetrotters_bank.csv', bankAdd); append('globetrotters_images.csv', imgAdd);

// verify by reading both files back
const p2 = V.loadPlaces(), i2 = V.loadImages();
const ok = added.every(a => p2.rows.some(p => p.id === a.id && p.name === list.find(c => c.name === a.name).name) && i2.rows.some(r => r.id === a.id && /^https:\/\/thumb\.wikimedia\.org/.test(r.image_url)));
if (!ok || p2.rows.length !== places.rows.length + added.length || i2.rows.length !== images.rows.length + added.length) { console.error('Write check failed: restore the data files with git checkout.'); process.exit(1); }
console.log(`Added ${added.length} places (ids ${added[0].id}-${added[added.length - 1].id}): ${added.map(a => a.name).join(', ')}. The game now has ${p2.rows.length} places.`);
