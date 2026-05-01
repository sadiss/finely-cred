export function extractFirstJsonObject(text: string): any {
  const s = String(text ?? '');
  const start = s.indexOf('{');
  if (start < 0) throw new Error('No JSON object found.');

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i]!;
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\') {
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      const slice = s.slice(start, i + 1);
      return JSON.parse(slice);
    }
  }
  throw new Error('JSON object appears incomplete.');
}

