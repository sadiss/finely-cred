import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1725_complete/, 'execution_status: tier1745_complete');

if (!s.includes('tier1706-1725-plan-handoff')) {
  s = s.replace(
    `  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed`,
    `  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed
  - id: tier1706-1725-plan-handoff
    content: "Tier 1706-1725 — Part CC verified + tier1725_complete (luxury ivory mesh + transparent glass wave 30)"
    status: completed`,
  );
}

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

s = s.replace(
  '| **Execution status** | **Tier 1725 complete** — Luxury ivory mesh + transparent glass (elegant multi-color depth, aurora hero, accent washes); sitewide_light_luxury_wave30 |',
  '| **Execution status** | **Tier 1745 complete** — Sitewide pop surfaces (accent glow boxes, floating mesh sections, contrast band rise); sitewide_light_pop_surfaces_wave31 |',
);

if (!s.includes('## Tier 1745 —')) {
  s = s.replace(
    '## Tier 1725 — Luxury light mesh wave Part CC (complete)',
    `## Tier 1745 — Sitewide pop surfaces wave Part CD (complete)

| Item | Status |
|------|--------|
| **fc-pop-surface** — accent glow shadows, default lift, hover XL on all boxes | Done |
| **Contrast bands** — stronger rise off ivory mesh, rainbow top edge | Done |
| **Mesh sections** — fc-light-mesh-section floating panels on luxury background | Done |
| **Hub + glass tokens** — panels, KPIs, catalog cards wired to pop surface | Done |
| **theme:audit** + launch gate wave 31 | Done |

## Tier 1725 — Luxury light mesh wave Part CC (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1745_complete');
