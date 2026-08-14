/**
 * Sync live Supabase auth state when admin opens partner detail.
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

const importNeedle = "} from '../../features/os/finelyOsLightUi';";
const importAdd = `} from '../../features/os/finelyOsLightUi';${eol}import { syncPartnerAuthStateFromLive } from '../../lib/partnerAuthActivity';`;

if (!src.includes('syncPartnerAuthStateFromLive')) {
  if (src.includes(importNeedle)) {
    src = src.replace(importNeedle, importAdd);
    console.log('Added syncPartnerAuthStateFromLive import');
  } else {
    console.warn('Import anchor not found');
  }
}

const oldEffect = [
  '  useEffect(() => {',
  '    if (!id) { setPartner(null); return; }',
  '    adminGetPartner(id).then((p) => {',
  '      if (!p || !p.profile || typeof p.profile.fullName !== \'string\') setPartner(null);',
  '      else setPartner(p);',
  '    });',
  '  }, [id, partnerVersion]);',
].join(eol);

const newEffect = [
  '  useEffect(() => {',
  '    if (!id) { setPartner(null); return; }',
  '    let cancelled = false;',
  '    void (async () => {',
  '      const p = await adminGetPartner(id);',
  '      if (cancelled) return;',
  '      if (!p || !p.profile || typeof p.profile.fullName !== \'string\') {',
  '        setPartner(null);',
  '        return;',
  '      }',
  '      try {',
  '        const synced = await syncPartnerAuthStateFromLive({ partner: p, persist: true });',
  '        if (!cancelled) setPartner(synced.partner);',
  '      } catch {',
  '        if (!cancelled) setPartner(p);',
  '      }',
  '    })();',
  '    return () => {',
  '      cancelled = true;',
  '    };',
  '  }, [id, partnerVersion]);',
].join(eol);

if (src.includes(newEffect)) {
  console.log('Partner auth sync effect already present');
} else if (src.includes(oldEffect)) {
  src = src.replace(oldEffect, newEffect);
  console.log('Patched partner load effect with auth sync');
} else {
  console.warn('Partner load effect needle not found');
}

if (src === before) {
  console.log('No change');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('PartnerDetailPage patched');
