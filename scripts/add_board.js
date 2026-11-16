#!/usr/bin/env node
// Adds a validated candidate board to the end of public/banks/jeopardy.js (same formatting as the existing boards).
//
//   node scripts/add_board.js path/to/candidate.json
//
// The candidate may carry a "sources" field (research notes for the QA agent and the PR); it is not written to the bank.
const fs = require('fs');
const { validate, loadBank, BANK } = require('./validate_board.js');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/add_board.js <candidate.json>'); process.exit(2); }
const c = JSON.parse(fs.readFileSync(file, 'utf8'));
const board = { name: c.name, style: c.style, dailyDoubles: c.dailyDoubles, categories: c.categories.map(x => ({ name: x.name, clues: x.clues.map(k => ({ v: k.v, q: k.q, a: k.a })) })), final: { category: c.final.category, q: c.final.q, a: c.final.a } };

const r = validate(board, loadBank());
if (r.errors.length) { console.error('Not added. Fix these first:\n' + r.errors.map(e => '  ' + e).join('\n')); process.exit(1); }

let src = fs.readFileSync(BANK, 'utf8');
const tail = '\n }\n] };';
if (!src.trimEnd().endsWith(tail)) { console.error('Unexpected end of ' + BANK + ' (expected the boards array to close with "] };"). Not added.'); process.exit(1); }
const inner = JSON.stringify([board], null, 1).split('\n').slice(1, -1).join('\n');
src = src.trimEnd().slice(0, -'\n] };'.length) + ',\n' + inner + '\n] };\n';
fs.writeFileSync(BANK, src);

const after = loadBank();
if (after.length !== loadBank().length || after[after.length - 1].name !== board.name) { console.error('Write check failed'); process.exit(1); }
console.log(`Added "${board.name}" (${board.style}). The bank now has ${after.length} boards.`);
if (r.warnings.length) console.log('Warnings the QA agent already saw:\n' + r.warnings.map(w => '  ' + w).join('\n'));
