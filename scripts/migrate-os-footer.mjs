import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.join(__dirname, '../src/pages/admin');

const skip = new Set(['AdminCourseEditorPage.tsx']);

function migrateFile(filePath) {
  const name = path.basename(filePath);
  if (skip.has(name)) return false;
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('FinelyOsPlatformFeatureStrip') && !src.includes('FinelyOsAutomationCatalog')) return false;

  src = src.replace(/import \{ FinelyOsAutomationCatalog \} from '[^']+';\n?/g, '');
  src = src.replace(/import \{ FinelyOsPlatformFeatureStrip \} from '[^']+';\n?/g, '');

  const importFooter = "import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';";
  if (!src.includes('FinelyOsPageFooter')) {
    const m = src.match(/\nimport [^;]+;\n/g);
    if (m) {
      const last = m[m.length - 1];
      const idx = src.lastIndexOf(last) + last.length;
      src = src.slice(0, idx) + importFooter + '\n' + src.slice(idx);
    }
  }

  const blocks = [
    /\s*<FinelyOsPlatformFeatureStrip compact \/>\s*\n\s*<FinelyOsAutomationCatalog compact \/>\s*/g,
    /\s*<FinelyOsPlatformFeatureStrip compact \/>\s*\n\s*<FinelyOsAutomationCatalog \/>\s*/g,
    /\s*<FinelyOsPlatformFeatureStrip \/>\s*\n\s*<FinelyOsAutomationCatalog \/>\s*/g,
    /\s*<FinelyOsPlatformFeatureStrip compact \/>\s*\n\s*<FinelyOsAutomationCatalog compact\s*\/>\s*/g,
  ];

  let replaced = false;
  for (const pat of blocks) {
    if (pat.test(src)) {
      src = src.replace(pat, '\n        <FinelyOsPageFooter />\n');
      replaced = true;
    }
  }

  if (!replaced) {
    src = src.replace(/\s*<FinelyOsPlatformFeatureStrip compact \/>\s*/g, '\n        <FinelyOsPageFooter />\n');
    src = src.replace(/\s*<FinelyOsAutomationCatalog compact \/>\s*/g, '');
    src = src.replace(/\s*<FinelyOsAutomationCatalog \/>\s*/g, '');
    replaced = src.includes('FinelyOsPageFooter');
  }

  if (!replaced) return false;
  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

let count = 0;
for (const f of fs.readdirSync(adminDir).filter((x) => x.endsWith('.tsx'))) {
  if (migrateFile(path.join(adminDir, f))) {
    console.log('migrated', f);
    count++;
  }
}

const workHub = path.join(__dirname, '../src/features/work/views/WorkProjectsHub.tsx');
if (migrateFile(workHub)) console.log('migrated WorkProjectsHub.tsx');

console.log('done', count, 'files');
