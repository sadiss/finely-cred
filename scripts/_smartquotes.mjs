import { readFileSync, writeFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) throw new Error('usage: node _smartquotes.mjs <file>');

let open = true;
const src = readFileSync(target, 'utf8');
const out = src.replace(/"/g, () => {
  const ch = open ? '\u201C' : '\u201D';
  open = !open;
  return ch;
});
writeFileSync(target, out);
console.log(`converted ${(src.match(/"/g) ?? []).length} quotes in ${target}`);
