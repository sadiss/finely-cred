import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const before = src;

const re =
  /(<AdminPartnerViewAsButton partnerId=\{partner\.id\}[\s\S]*?<div className=\{`\$\{FINELY_OS_ENTITY_SUBLABEL\} font-mono normal-case tracking-normal`\}>partner_id: \{partner\.id\})\s*\n(\s*<\/div>\s*\n\s*\})/;

if (re.test(src)) {
  src = src.replace(re, '$1</div>\n        </div>\n      }');
  fs.writeFileSync(file, src);
  console.log('Fixed headerRight JSX');
} else if (src.includes('partner_id: {partner.id}</div>')) {
  console.log('Already fixed');
} else {
  console.warn('Pattern not found');
  process.exit(1);
}
