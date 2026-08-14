/** Gate: letter closing spacing normalizer smoke test. Run: node scripts/verify-letter-closing-spacing.mjs */
const LETTER_CLOSING_PARAGRAPH_RE =
  /^(?:If you cannot|Until you(?: cure| must)?|Please preserve|Please confirm|Please treat|Please answer|Please review|Please refrain|You have thirty|Because you|This letter is made|I reserve all rights|Cease and desist|Failure to comply|I do not consent|For the avoidance|If validation|Continued collection|You must cease|You may not|This is my (?:final|second)|This is not an admission|This request is not a refusal|Sincerely,|Thank you,|Regards,|Respectfully,)/i;

function normalizeLetterBlockSpacing(text) {
  let out = String(text || '').replace(/\r\n/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/^(\d+\.\s[^\n]+)\n(?!\n|\d+\.\s|[•\-*]\s)/gm, '$1\n\n');
  out = out.replace(/^([•\-*]\s[^\n]+)\n(?!\n|[•\-*]\s|\d+\.\s)/gm, '$1\n\n');
  const lines = out.split('\n');
  const padded = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const prevNonEmpty = [...padded].reverse().find((l) => l.trim()) ?? '';
    if (
      trimmed &&
      LETTER_CLOSING_PARAGRAPH_RE.test(trimmed) &&
      prevNonEmpty.trim() &&
      (padded[padded.length - 1] ?? '').trim() !== ''
    ) {
      padded.push('');
    }
    padded.push(line);
  }
  out = padded.join('\n');
  out = out.replace(/\n(Sincerely,|Thank you,|Regards,|Respectfully,)\n(?!\n)/gi, '\n\n$1\n\n');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const sample = `1. First demand item
2. Last demand item
If you cannot provide validation, cease collection.
Please preserve all records.
You have thirty (30) days from receipt of this letter to provide this validation.

Sincerely,

Partner Name`;

const normalized = normalizeLetterBlockSpacing(sample);
const afterLastNumber = normalized.match(/2\. Last demand item\n([\s\S]*?)If you cannot/);
if (!afterLastNumber || afterLastNumber[1].trim() !== '') {
  console.error('FAIL: expected blank line between last numbered item and closing paragraph');
  process.exit(1);
}

if (!normalized.includes('Please preserve all records')) {
  console.error('FAIL: closing paragraphs missing');
  process.exit(1);
}

console.log('OK: letter closing spacing normalizer');
process.exit(0);
