#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(import.meta.dirname, '../src/pages/admin/PartnerDetailPage.tsx');
let src = fs.readFileSync(file, 'utf8');

if (!src.includes('FINELY_OS_MODAL_HEADER')) {
  src = src.replace(
    '  FINELY_OS_FIXED_OVERLAY,\n  FINELY_OS_MODAL_SHELL,',
    '  FINELY_OS_FIXED_OVERLAY,\n  FINELY_OS_MODAL_HEADER,\n  FINELY_OS_MODAL_SHELL,',
  );
}

src = src.replace(
  /<div className="flex items-start justify-between gap-3 border-b border-white\/10 px-4 py-3">\s*<div className="min-w-0">\s*<div className=\{FINELY_OS_ENTITY_SUBLABEL\}>Parse overview<\/div>\s*<h2 id="parse-overview-title" className=\{\`mt-1 \$\{FINELY_OS_ENTITY_TITLE\} truncate\`\}>\s*\{selectedReport\.filename\}\s*<\/h2>\s*<\/div>\s*<button[\s\S]*?<\/button>\s*<\/div>/,
  `<div className={FINELY_OS_MODAL_HEADER}>
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Parse overview</div>
                      <h2 id="parse-overview-title" className={\`mt-1 \${FINELY_OS_ENTITY_TITLE} truncate\`}>
                        {selectedReport.filename}
                      </h2>
                    </div>
                    <FinelyOsModalCloseButton onClick={() => setParseOverviewOpen(false)} />
                  </div>`,
);

if (!src.includes('FinelyOsModalCloseButton onClick={() => setParseOverviewOpen(false)}')) {
  console.error('PartnerDetailPage patch failed');
  process.exit(1);
}

fs.writeFileSync(file, src);
console.log('patched PartnerDetailPage');
