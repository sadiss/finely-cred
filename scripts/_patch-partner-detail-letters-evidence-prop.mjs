/**
 * Wire the `evidence` prop into the Letters tab's <SavedLetterCard /> on PartnerDetailPage.
 * Without it, editing a dispute letter (Edit -> LetterBodyEditorModal -> regenerateSavedLetterPdf)
 * regenerates the PDF with zero evidence exhibits, silently dropping screenshots that were
 * already attached to the letter.
 * Patch scripts only — do not StrReplace PartnerDetailPage from the agent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

const eol = src.includes('\r\n') ? '\r\n' : '\n';
const needle = [
  '                      <SavedLetterCard',
  '                        id={`letter-${l.id}`}',
  '                        letter={l}',
  '                        highlighted={highlightLetterId === l.id}',
  "                        canMail={isFeatureEnabled('letterMailing')}",
].join(eol);
const replacement = [
  '                      <SavedLetterCard',
  '                        id={`letter-${l.id}`}',
  '                        letter={l}',
  '                        highlighted={highlightLetterId === l.id}',
  '                        evidence={evidence}',
  "                        canMail={isFeatureEnabled('letterMailing')}",
].join(eol);

if (src.includes(`evidence={evidence}${eol}                        canMail={isFeatureEnabled('letterMailing')}`)) {
  console.log('evidence prop already wired on Letters tab SavedLetterCard');
} else if (!src.includes(needle)) {
  console.warn('Needle not found for Letters tab SavedLetterCard evidence prop');
} else {
  src = src.replace(needle, replacement);
  console.log('Wired evidence prop onto Letters tab SavedLetterCard');
}

if (src === before) {
  console.log('No change');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage letters evidence prop');
