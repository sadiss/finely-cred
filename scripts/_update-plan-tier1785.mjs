import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1765_complete/, 'execution_status: tier1785_complete');

if (!s.includes('tier1766-1785-plan-handoff')) {
  s = s.replace(
    `  - id: tier1746-1765-plan-handoff
    content: "Tier 1746-1765 — Part CE verified + tier1765_complete (light readable copy wave 32 — dark text on colorful boxes + mesh sections)"
    status: completed`,
    `  - id: tier1746-1765-plan-handoff
    content: "Tier 1746-1765 — Part CE verified + tier1765_complete (light readable copy wave 32 — dark text on colorful boxes + mesh sections)"
    status: completed
  - id: tier1766-1785-plan-handoff
    content: "Tier 1766-1785 — Part CF verified + tier1785_complete (public shell light rollout wave 33 — landing mesh/contrast, App sections, affiliate band)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1765 complete** — Light readable copy (dark/accent text on colorful boxes, mesh sections, hub panels); sitewide_light_readable_wave32 |',
  '| **Execution status** | **Tier 1785 complete** — Public shell light rollout (landing mesh/contrast bands, App pricing/ebooks/testimonials, tradeline catalog cards); sitewide_light_rollout_wave33 |',
);

if (!s.includes('## Tier 1785 —')) {
  s = s.replace(
    '## Tier 1765 — Light readable copy wave Part CE (complete)',
    `## Tier 1785 — Public shell light rollout wave Part CF (complete)

| Item | Status |
|------|--------|
| **App.tsx sections** — pricing, free guide, ebooks, testimonials → mesh/contrast helpers | Done |
| **Landing tradeline** — catalog cards for inner grid + AU preview panel | Done |
| **Affiliate band** — fc-affiliate-band hides dark overlays on light | Done |
| **Public shell root** — inherited white text fixed on light | Done |
| **theme:audit** + launch gate wave 33 | Done |

## Tier 1765 — Light readable copy wave Part CE (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1785_complete');
