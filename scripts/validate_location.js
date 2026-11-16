#!/usr/bin/env node
// Checks candidate Globe Trotters places (location + photo) before they are added.
// Used by the weekly location agents (agents/weekly-locations/README.md) and handy by hand.
//
//   node scripts/validate_location.js candidate.json            static checks only (fast, offline)
//   node scripts/validate_location.js candidate.json --online   + live checks: the photo downloads and is a good size, its Commons license
//                                                                matches, the Wikipedia article's coordinates and the photo's own GPS
//                                                                tag agree with the claimed coordinates
//   node scripts/validate_location.js --stats                   how the current 100+ places are spread (continent / category / difficulty)
//
// Exit code: 0 = no errors, 1 = errors, 2 = bad usage. Candidate format: see agents/weekly-locations/README.md.
const fs = require('fs'), path = require('path');
const { BANNED } = require('./validate_board.js');
const BANKS = path.join(__dirname, '..', 'public', 'banks');
const UA = 'GlobeTrottersTrivia/1.0 (caydenfarris2@gmail.com)';

/* ---- tiny RFC 4180 CSV reader/writer (the data files use CRLF line endings and quoted fields) ---- */
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}
const readTable = file => { const [head, ...rows] = parseCsv(fs.readFileSync(path.join(BANKS, file), 'utf8')); return { head, rows: rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()]))) }; };
const csvField = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csvLine = (head, obj) => head.map(h => csvField(obj[h])).join(',') + '\r\n';
const loadPlaces = () => readTable('globetrotters_bank.csv');
const loadImages = () => readTable('globetrotters_images.csv');

const CONTINENTS = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Antarctica'];
const CATEGORIES = ['Landmark', 'City & Culture', 'Beach & Coast', 'Natural Wonder', 'Mountain & Range'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
// Only licenses that allow commercial use with credit. (No NonCommercial, NoDerivatives or GFDL: they are hard to comply with in a game.)
const LICENSE_OK = /^(CC0( 1\.0)?|Public domain|PD[- ].*|CC BY(-SA)? \d\.\d( [a-z]{2,3})?)$/i;
const BAD_FILE = /flag|map|locator|location|coat[_ ]of[_ ]arms|logo|diagram|chart|panorama[_ ]map|\.svg|\.png|\.gif|\.tif|\.pdf|\.webp/i;
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const haversine = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, dl = (c - a) * r, dg = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const fileOfUrl = u => { try { return decodeURIComponent(String(u).split('?')[0].split('/').pop()).replace(/^\d+px-/, '').replace(/_/g, ' '); } catch (e) { return ''; } };
const fileOfPage = u => { try { return decodeURIComponent(String(u).split('/wiki/File:')[1] || '').replace(/_/g, ' '); } catch (e) { return ''; } };

function validateStatic(list, places, images) {
  const out = list.map(() => ({ errors: [], warnings: [] }));
  const names = new Set(places.rows.map(p => norm(p.name))), baseNames = new Set(places.rows.map(p => norm(p.name.replace(/\(.*?\)/g, ''))));
  list.forEach((c, i) => {
    const E = m => out[i].errors.push(m), W = m => out[i].warnings.push(m);
    if (!c || typeof c !== 'object') return E('not an object');
    const s = (x, min, max) => typeof x === 'string' && x.trim().length >= min && x.trim().length <= max;
    if (!s(c.name, 3, 40)) E('name is required (3-40 characters)');
    else {
      if (names.has(norm(c.name)) || baseNames.has(norm(c.name.replace(/\(.*?\)/g, '')))) E(`"${c.name}" is already in the game`);
      if (list.some((o, j) => j < i && o && norm(o.name || '') === norm(c.name))) E('duplicate name inside this batch');
    }
    if (!s(c.country, 2, 40)) E('country is required');
    if (!CONTINENTS.includes(c.continent)) E('continent must be one of: ' + CONTINENTS.join(', '));
    if (!CATEGORIES.includes(c.category)) E('category must be one of: ' + CATEGORIES.join(', '));
    if (!DIFFICULTIES.includes(c.difficulty)) E('difficulty must be easy, medium or hard');
    const lat = c.lat, lon = c.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number' || Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) E('lat/lon must be numbers (decimal degrees, south and west negative)');
    else {
      if (String(lat).split('.')[1] && String(lat).split('.')[1].length > 5 || String(lon).split('.')[1] && String(lon).split('.')[1].length > 5) W('coordinates need at most 5 decimals');
      for (const p of places.rows) { const d = haversine(lat, lon, +p.lat, +p.lon); if (d < 2) E(`within ${d.toFixed(1)} km of existing place "${p.name}" (same place?)`); }
      list.forEach((o, j) => { if (j < i && o && typeof o.lat === 'number' && haversine(lat, lon, o.lat, o.lon) < 2) E(`within 2 km of "${o.name}" in this batch`); });
    }
    if (!(typeof c.radius_km === 'number' && c.radius_km >= 1 && c.radius_km <= 1500)) E('radius_km must be a number from 1 to 1500 (the "close enough" zone: ~1-5 for a single building, 15-60 for a park/coast, more for a big region)');
    if (!s(c.reveal_blurb, 20, 160)) E('reveal_blurb must be 20-160 characters (one short fun fact shown after the guess)');
    else {
      const t = ' ' + norm(c.reveal_blurb + ' ' + c.name) + ' ';
      for (const bad of BANNED) if (t.includes(' ' + bad + ' ')) E(`contains "${bad}" (off-limits for this family; also no casinos, wine regions, breweries or the like)`);
    }
    const im = c.image;
    if (!im || typeof im !== 'object') return E('image {wiki_title, image_url, license, author, commons_page} is required');
    if (!s(im.wiki_title, 2, 80)) E('image.wiki_title is required (the Wikipedia article of the place)');
    const m = /^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+\/(\d+)px-[^/?]+$/.exec(String(im.image_url || '').split('?')[0]);
    if (!m) E('image.image_url must be a thumb.wikimedia.org .../thumb/.../1920px-<file> link');
    else if (+m[1] < 1280) E('image.image_url must be at least 1280px wide (use 1920px)');
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^\s]+$/.test(String(im.commons_page || ''))) E('image.commons_page must be the https://commons.wikimedia.org/wiki/File:... page');
    else if (m && norm(fileOfUrl(im.image_url)) !== norm(fileOfPage(im.commons_page))) E(`image_url (${fileOfUrl(im.image_url)}) and commons_page (${fileOfPage(im.commons_page)}) are different files`);
    if (BAD_FILE.test(fileOfPage(im.commons_page)) || !/\.jpe?g$/i.test(fileOfPage(im.commons_page))) E('the photo must be a real JPEG photo (not a flag, map, logo, diagram, SVG or PNG)');
    if (!LICENSE_OK.test(String(im.license || '').trim())) E(`license "${im.license}" is not allowed (use CC0, Public domain, CC BY x.x or CC BY-SA x.x)`);
    const au = String(im.author || '');
    if (!s(au, 2, 90) || /[\n<>@]|https?:/.test(au)) E('image.author must be a clean name of at most 90 characters (no line breaks, e-mails, tags or links)');
    if (images.rows.some(r => r.commons_page === im.commons_page || r.image_url.split('?')[0] === String(im.image_url).split('?')[0])) E('this exact photo is already used by another place');
    if (list.some((o, j) => j < i && o && o.image && o.image.commons_page === im.commons_page)) E('same photo used twice in this batch');
    if (!c.sources || !Array.isArray(c.sources.coordinates) || c.sources.coordinates.length < 2) W('sources.coordinates should list 2 independent sources');
    if (!c.sources || !Array.isArray(c.sources.photo) || !c.sources.photo.length) W('sources.photo should list where the photo was found/checked');
  });
  return out;
}

/* ---- live checks ---- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Node's fetch ignores the HTTPS proxy some environments require, so the live checks use curl (which honours it).
const { spawnSync } = require('child_process'), os = require('os');
function curl(url) {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gtv-')), 'body');
  const r = spawnSync('curl', ['-sS', '-L', '-m', '90', '-A', UA, '-o', tmp, '-w', '%{http_code} %{content_type}', url], { encoding: 'utf8' });
  const [code, ...type] = String(r.stdout || '').trim().split(' ');
  let buf = Buffer.alloc(0); try { buf = fs.readFileSync(tmp); fs.unlinkSync(tmp); fs.rmdirSync(path.dirname(tmp)); } catch (e) {}
  if (r.error) throw new Error('curl is not available: ' + r.error.message);
  return { status: +code || 0, type: type.join(' '), buf, err: r.stderr };
}
async function getJson(url) { for (let t = 0; t < 5; t++) { const r = curl(url); try { return JSON.parse(r.buf.toString('utf8')); } catch (e) { await sleep(6000 * (t + 1)); } } throw new Error('API did not answer: ' + url.slice(0, 90)); }
function jpegSize(buf) { // width/height from the JPEG header
  let i = 2;
  while (i < buf.length) { if (buf[i] !== 0xFF) { i++; continue; } const m = buf[i + 1]; if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }; i += 2 + buf.readUInt16BE(i + 2); }
  return null;
}
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const sameLicense = (a, b) => norm(a).replace(/ /g, '') === norm(b).replace(/ /g, '') || (/public domain|pd/i.test(a) && /public domain|pd/i.test(b));

async function checkOnline(c, E, W, note) {
  const im = c.image, file = fileOfPage(im.commons_page), W0 = c.radius_km || 10;
  // 1. the photo itself
  try {
    const r = curl(im.image_url), buf = r.buf;
    if (r.status !== 200 || !/image\/jpeg/.test(r.type)) E(`photo download failed (HTTP ${r.status}, ${r.type || r.err})`);
    else {
      const sz = jpegSize(buf);
      if (!sz) E('photo is not a readable JPEG');
      else {
        note(`photo ${sz.w}x${sz.h}, ${Math.round(buf.length / 1024)} KB`);
        if (sz.w < 1280) E(`photo is only ${sz.w}px wide`);
        if (sz.w / sz.h < 1.2) W(`photo is not landscape (${sz.w}x${sz.h}); it will be small on the host screen`);
        if (sz.w / sz.h > 3.2) W('photo is a very wide panorama');
        if (buf.length < 150 * 1024) W('photo file is small (' + Math.round(buf.length / 1024) + ' KB): it may be low quality');
      }
    }
  } catch (e) { E('photo download error: ' + e.message); }
  // 2. Commons: license, author, GPS tag of the photo, categories
  try {
    const d = await getJson('https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=' + encodeURIComponent('File:' + file) + '&prop=imageinfo|coordinates|categories&iiprop=extmetadata|size&coprimary=all&cllimit=60');
    const pg = Object.values(d.query.pages)[0];
    if (!pg || pg.missing !== undefined || !pg.imageinfo) { E('the Commons file does not exist: ' + file); }
    else {
      const ii = pg.imageinfo[0], md = ii.extmetadata || {};
      const lic = strip(md.LicenseShortName && md.LicenseShortName.value);
      if (!sameLicense(lic, im.license)) E(`license on Commons is "${lic}", not "${im.license}"`);
      if (!LICENSE_OK.test(lic)) E(`license on Commons ("${lic}") is not allowed`);
      note(`Commons license: ${lic}; original ${ii.width}x${ii.height}`);
      const art = strip(md.Artist && md.Artist.value);
      if (art && !norm(art).includes(norm(im.author).split(' ')[0]) && !norm(im.author).includes(norm(art).split(' ')[0])) W(`author "${im.author}" does not obviously match the Commons artist "${art.slice(0, 60)}"`);
      const cats = (pg.categories || []).map(x => x.title.replace('Category:', ''));
      const star = cats.filter(x => /^(Featured pictures|Quality images|Valued images)/i.test(x));
      note(star.length ? 'Commons quality marker: ' + star.join(', ') : 'no Featured/Quality/Valued marker');
      if (pg.coordinates && pg.coordinates.length) {
        const g = pg.coordinates[0], dist = haversine(c.lat, c.lon, g.lat, g.lon);
        note(`photo's own GPS tag is ${dist.toFixed(1)} km from the claimed coordinates`);
        if (dist > 100 + W0) E(`the photo's GPS tag is ${dist.toFixed(0)} km away from the claimed place: it may show somewhere else`);
        else if (dist > 25 + 2 * W0) W(`the photo's GPS tag is ${dist.toFixed(0)} km away from the claimed coordinates`);
      } else note('photo has no GPS tag');
    }
  } catch (e) { E('Commons lookup error: ' + e.message); }
  // 3. Wikipedia: independent coordinates for the place
  try {
    const d = await getJson('https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=coordinates&coprimary=primary&titles=' + encodeURIComponent(im.wiki_title));
    const pg = Object.values(d.query.pages)[0];
    if (!pg || pg.missing !== undefined) E(`Wikipedia article "${im.wiki_title}" does not exist`);
    else if (!pg.coordinates) W(`Wikipedia article "${pg.title}" has no coordinates: verify with other sources`);
    else {
      const w = pg.coordinates[0], dist = haversine(c.lat, c.lon, w.lat, w.lon), tol = Math.max(15, 1.5 * W0);
      note(`Wikipedia "${pg.title}" says ${w.lat.toFixed(4)}, ${w.lon.toFixed(4)}: ${dist.toFixed(1)} km from the claimed coordinates (allowed ${tol.toFixed(0)} km)`);
      if (dist > tol) E(`coordinates are ${dist.toFixed(1)} km from Wikipedia's for "${pg.title}" (allowed ${tol.toFixed(0)} km)`);
      else if (dist > Math.max(3, W0 / 2)) W(`coordinates differ from Wikipedia's by ${dist.toFixed(1)} km`);
    }
  } catch (e) { E('Wikipedia lookup error: ' + e.message); }
}

module.exports = { norm, validateStatic, checkOnline, loadPlaces, loadImages, readTable, csvLine, parseCsv, CONTINENTS, CATEGORIES, haversine, BANKS };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--stats') {
    const p = loadPlaces().rows, by = k => p.reduce((o, x) => (o[x[k]] = (o[x[k]] || 0) + 1, o), {});
    console.log(`${p.length} places`); for (const k of ['continent', 'category', 'difficulty']) console.log(k + ':', JSON.stringify(by(k)));
    console.log('continents with none:', CONTINENTS.filter(c => !p.some(x => x.continent === c)).join(', ') || '-');
    return;
  }
  if (!args[0]) { console.error('usage: node scripts/validate_location.js <candidate.json> [--online] | --stats'); process.exit(2); }
  let cand; try { cand = JSON.parse(fs.readFileSync(args[0], 'utf8')); } catch (e) { console.error('cannot read candidate: ' + e.message); process.exit(2); }
  const list = Array.isArray(cand) ? cand : cand.locations;
  if (!Array.isArray(list) || !list.length) { console.error('candidate needs a "locations" array'); process.exit(2); }
  const places = loadPlaces(), images = loadImages(), res = validateStatic(list, places, images);
  let bad = 0;
  for (let i = 0; i < list.length; i++) {
    const notes = [];
    if (args.includes('--online') && res[i].errors.length === 0) { await checkOnline(list[i], m => res[i].errors.push(m), m => res[i].warnings.push(m), m => notes.push(m)); await sleep(1500); }
    console.log(`${res[i].errors.length ? 'FAIL' : 'ok  '} ${list[i] && list[i].name}: ${res[i].errors.length} error(s), ${res[i].warnings.length} warning(s)`);
    notes.forEach(n => console.log('   evidence ' + n)); res[i].errors.forEach(e => console.log('   ERROR    ' + e)); res[i].warnings.forEach(e => console.log('   warning  ' + e));
    if (res[i].errors.length) bad++;
  }
  process.exit(bad ? 1 : 0);
})();
