/**
 * Add "View as partner" to PartnerDetailPage headerRight.
 * Do NOT StrReplace PartnerDetailPage from the agent — run this script instead.
 *
 * Usage (PowerShell): node scripts/_patch-partner-detail-view-as-partner.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

const importLine =
  "import { AdminPartnerViewAsButton } from '../../components/admin/AdminPartnerViewAsButton';";

if (!src.includes('AdminPartnerViewAsButton')) {
  const anchor = "import { PartnerDetailAdminFooter } from '../../components/admin/PartnerDetailAdminFooter';";
  if (src.includes(anchor)) {
    src = src.replace(anchor, `${anchor}\n${importLine}`);
    console.log('Added AdminPartnerViewAsButton import');
  } else {
    console.warn('Could not find import anchor for AdminPartnerViewAsButton');
  }
}

const headerNeedle =
  /headerRight=\{\s*<div className="flex flex-wrap items-center gap-2">\s*<div className=\{`\$\{FINELY_OS_ENTITY_SUBLABEL\} font-mono normal-case tracking-normal`\}>partner_id: \{partner\.id\}<\/div>\s*<\/div>\s*\}/;

const headerReplacement =
  'headerRight={\n        <div className="flex flex-wrap items-center gap-2">\n          <AdminPartnerViewAsButton partnerId={partner.id} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`} />\n          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>partner_id: {partner.id}</div>\n        </div>\n      }';

if (src.includes('AdminPartnerViewAsButton partnerId={partner.id}')) {
  console.log('View as partner button already in header');
} else if (headerNeedle.test(src)) {
  src = src.replace(headerNeedle, headerReplacement);
  console.log('Added View as partner button to headerRight');
} else {
  console.warn('Could not patch headerRight — pattern missing');
}

if (src === before) {
  console.log('No change (already patched or patterns missing)');
  process.exit(0);
}
fs.writeFileSync(file, src);
console.log('Patched PartnerDetailPage → View as partner header button');
