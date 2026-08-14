/** Fix broken import insertion from auth-sync patch. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');
const eol = src.includes('\r\n') ? '\r\n' : '\n';

const broken = [
  '  finelyOsViewTab,',
  "import { syncPartnerAuthStateFromLive } from '../../lib/partnerAuthActivity';",
  "} from '../../features/os/finelyOsLightUi';",
].join(eol);

const fixed = [
  '  finelyOsViewTab,',
  "} from '../../features/os/finelyOsLightUi';",
  "import { syncPartnerAuthStateFromLive } from '../../lib/partnerAuthActivity';",
].join(eol);

if (src.includes(broken)) {
  src = src.replace(broken, fixed);
  fs.writeFileSync(file, src);
  console.log('Fixed PartnerDetailPage import');
} else {
  console.log('Broken import block not found — no change');
}
