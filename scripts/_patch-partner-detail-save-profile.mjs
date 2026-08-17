/**
 * PartnerDetailPage: onSaveProfile returns true on success, false when name missing.
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

src = src.replace(
  "if (!name) return;",
  "if (!name) return false;",
);

src = src.replace(
  `              setPartnerVersion((v) => v + 1);
              setNotesVersion((v) => v + 1);
            }}
            onResetProfileDraft`,
  `              setPartnerVersion((v) => v + 1);
              setNotesVersion((v) => v + 1);
              return true;
            }}
            onResetProfileDraft`,
);

if (src === before) {
  console.warn('PartnerDetailPage save-profile patch: no changes applied (already patched or needle missing)');
} else {
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched PartnerDetailPage onSaveProfile return value');
}
