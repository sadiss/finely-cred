import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1745_complete/, 'execution_status: tier1765_complete');

if (!s.includes('tier1726-1745-plan-handoff')) {
  s = s.replace(
    `  - id: tier1706-1725-plan-handoff
    content: "Tier 1706-1725 — Part CC verified + tier1725_complete (luxury ivory mesh + transparent glass wave 30)"
    status: completed`,
    `  - id: tier1706-1725-plan-handoff
    content: "Tier 1706-1725 — Part CC verified + tier1725_complete (luxury ivory mesh + transparent glass wave 30)"
    status: completed
  - id: tier1726-1745-plan-handoff
    content: "Tier 1726-1745 — Part CD verified + tier1745_complete (sitewide pop surfaces wave 31 — boxes + sections float on mesh)"
    status: completed`,
  );
}

if (!s.includes('tier1746-1765-plan-handoff')) {
  s = s.replace(
    `  - id: tier1726-1745-plan-handoff
    content: "Tier 1726-1745 — Part CD verified + tier1745_complete (sitewide pop surfaces wave 31 — boxes + sections float on mesh)"
    status: completed`,
    `  - id: tier1726-1745-plan-handoff
    content: "Tier 1726-1745 — Part CD verified + tier1745_complete (sitewide pop surfaces wave 31 — boxes + sections float on mesh)"
    status: completed
  - id: tier1746-1765-plan-handoff
    content: "Tier 1746-1765 — Part CE verified + tier1765_complete (light readable copy wave 32 — dark text on colorful boxes + mesh sections)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1745 complete** — Sitewide pop surfaces (accent glow boxes, floating mesh sections, contrast band rise); sitewide_light_pop_surfaces_wave31 |',
  '| **Execution status** | **Tier 1765 complete** — Light readable copy (dark/accent text on colorful boxes, mesh sections, hub panels); sitewide_light_readable_wave32 |',
);

if (!s.includes('## Tier 1765 —')) {
  s = s.replace(
    '## Tier 1745 — Sitewide pop surfaces wave Part CD (complete)',
    `## Tier 1765 — Light readable copy wave Part CE (complete)

| Item | Status |
|------|--------|
| **fc-light-readable** — sitewide dark copy on glass/colorful surfaces | Done |
| **Contrast band cards** — override white text inside accent boxes only | Done |
| **Mesh sections** — headings/body use light-theme ink colors | Done |
| **Per-accent titles** — emerald/violet/amber/sky/fuchsia surface copy | Done |
| **theme:audit** + launch gate wave 32 | Done |

## Tier 1745 — Sitewide pop surfaces wave Part CD (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1765_complete');
