const SPREAD_BASE_PATH = '/credit-analysis/premium-spreads/v1';

/** Load spread PNG bytes — works in browser (fetch) and Node (fs). */
export async function loadPremiumSpreadPng(fileName: string): Promise<Uint8Array> {
  if (typeof window === 'undefined') {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const candidates = [
      path.join(process.cwd(), 'public', 'credit-analysis', 'premium-spreads', 'v1', fileName),
      path.join(process.cwd(), 'Tishobe', 'finely-cred-main', 'public', 'credit-analysis', 'premium-spreads', 'v1', fileName),
      path.join('f:', 'Content', 'Finely Cred', 'Onboard', 'premium-spreads', 'v1', fileName),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    }
  }
  const res = await fetch(`${SPREAD_BASE_PATH}/${fileName}`);
  if (!res.ok) throw new Error(`Missing premium spread asset: ${fileName} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export { SPREAD_BASE_PATH };
