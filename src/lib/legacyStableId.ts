/** Deterministic ids so local import + server import + re-import stay aligned. */
export function legacyStableId(prefix: string, ...parts: string[]): string {
  const raw = parts.join('|');
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return `${prefix}_${Math.abs(h).toString(16)}_${raw.length}`;
}
