/**
 * Patch PartnerDetailPage grant callbacks to use ensurePartnerEntitlementsAsync
 * (persists to Supabase). No StrReplace on PartnerDetailPage.tsx from the agent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

if (!src.includes('ensurePartnerEntitlementsAsync')) {
  src = src.replace(
    "import { ENTITLEMENT_KEYS, type EntitlementKey, ensurePartnerEntitlements } from '../../billing/entitlements';",
    "import { ENTITLEMENT_KEYS, type EntitlementKey, ensurePartnerEntitlements, ensurePartnerEntitlementsAsync } from '../../billing/entitlements';",
  );
}

const syncGrantRe =
  /onRequestGrantEntitlements=\{\(keys\) => \{\s*ensurePartnerEntitlements\(\{ partnerId: partner\.id, keys: keys as any \}\);\s*setNotesVersion\(\(v\) => v \+ 1\);\s*\}\}/g;

const asyncGrant = `onRequestGrantEntitlements={(keys) => {
                void ensurePartnerEntitlementsAsync({ partnerId: partner.id, keys: keys as any }).then(() => {
                  setNotesVersion((v) => v + 1);
                });
              }}`;

if (syncGrantRe.test(src)) {
  src = src.replace(syncGrantRe, asyncGrant);
} else if (src.includes('ensurePartnerEntitlementsAsync({ partnerId: partner.id, keys: keys as any })')) {
  console.log('Grant callbacks already async');
} else {
  console.warn('Pattern for onRequestGrantEntitlements not found — check file manually');
}

if (src === before) {
  console.log('No change (already patched or pattern missing)');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage grant callbacks → ensurePartnerEntitlementsAsync');
