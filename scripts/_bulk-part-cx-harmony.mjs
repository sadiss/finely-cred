import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLTIP = 'fc-light-tooltip-shell fc-light-chrome-panel';
const GLASS = 'fc-light-glass-panel fc-light-chrome-panel';

const TARGETS = [
  'src/components/portal/index.tsx',
  'src/components/PortalSteps.jsx',
  'src/components/creditIntel/CreditIntelTabs.tsx',
  'src/components/chat/HubTeamChatPanel.tsx',
];

function patchFile(rel) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) return false;
  let s = fs.readFileSync(fp, 'utf8');
  const before = s;

  s = s.replace(/hover:-translate-y-2/g, 'hover:brightness-[1.03] hover:shadow-lg');
  s = s.replace(/hover:-translate-y-1/g, 'hover:brightness-[1.02] hover:shadow-md');
  s = s.replace(/bg-\[#1a1a1a\]/g, TOOLTIP.split(' ')[0]);
  s = s.replace(/fc-light-tooltip-shell border/g, `${TOOLTIP} border`);

  // Credit intel — dark soft-surface stacks → chrome buttons/panels
  s = s.replace(/fc-soft-surface bg-white\/\[0\.06\] hover:bg-white\/\[0\.04\]/g, 'fc-light-chrome-btn');
  s = s.replace(/fc-soft-surface bg-white\/\[0\.06\] hover:bg-white\/\[0\.06\]/g, 'fc-light-chrome-btn');
  s = s.replace(/fc-soft-surface hover:bg-white\/\[0\.06\]/g, 'fc-light-chrome-btn');
  s = s.replace(/fc-soft-surface hover:bg-white\/\[0\.05\]/g, 'fc-light-chrome-btn');
  s = s.replace(/fc-soft-surface bg-white\/\[0\.06\] p-4/g, `${GLASS} p-4`);
  s = s.replace(/fc-soft-surface-lg hover:bg-white\/\[0\.04\]/g, `${GLASS}`);

  // PortalSteps legacy glass → light glass panel
  s = s.replace(
    /rounded-2xl border-t border-l border-white\/\[0\.08\] border-b border-r border-black\/50 bg-gradient-to-br from-white\/\[0\.03\] to-transparent backdrop-blur-md/g,
    `${GLASS} ring-1 ring-inset ring-white/5`,
  );
  s = s.replace(
    /rounded-2xl border-t border-l border-white\/\[0\.08\] border-b border-r border-black\/50/g,
    `${GLASS} ring-1 ring-inset ring-white/5`,
  );
  s = s.replace(
    /rounded-xl border-t border-l border-white\/\[0\.08\] border-b border-r border-black\/50/g,
    `${GLASS} rounded-xl ring-1 ring-inset ring-white/5`,
  );
  s = s.replace(/bg-white\/\[0\.02\] hover:bg-white\/\[0\.05\]/g, 'hover:brightness-[1.02]');
  s = s.replace(/bg-white\/\[0\.02\] backdrop-blur-md/g, GLASS);

  if (s !== before) {
    fs.writeFileSync(fp, s);
    return true;
  }
  return false;
}

let n = 0;
for (const rel of TARGETS) {
  if (patchFile(rel)) {
    n += 1;
    console.log(`  patched ${rel}`);
  }
}
console.log(`Part CX harmony bulk: ${n} files updated`);
