import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1685_complete/, 'execution_status: tier1705_complete');

if (!s.includes('tier1666-1685-plan-handoff')) {
  s = s.replace(
    `  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, hero panels)"
    status: completed`,
    `  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, hero panels)"
    status: completed
  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed`,
  );
}

if (!s.includes('tier1686-1705-plan-handoff')) {
  s = s.replace(
    `  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed`,
    `  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed
  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1685 complete** — Clean neutral page shells (no rainbow aurora); contrast bands + accent cards kept; sitewide_clean_shell_wave28 |',
  '| **Execution status** | **Tier 1705 complete** — Light pop 100% (opaque glass, bold hero, hub KPIs, vivid accent cards); sitewide_light_pop_wave29 |',
);

if (!s.includes('## Tier 1705 —')) {
  s = s.replace(
    '## Tier 1685 — Clean neutral shell wave Part CA (complete)',
    `## Tier 1705 — Light pop 100% wave Part CB (complete)

| Item | Status |
|------|--------|
| **Opaque glass tokens** — 92–98% white panels, stronger shadows | Done |
| **PageShell hero** — bold title, gold badge, fc-pageshell-hero | Done |
| **Unified hub** — KPI accent rails, platinum secondary, pop content shell | Done |
| **Vivid accent cards** — 2px borders, 28–30% fills, hover lift | Done |
| **View tabs** — fc-view-tabs bar with gradient active pop | Done |
| **theme:audit** + launch gate wave 29 | Done |

## Tier 1685 — Clean neutral shell wave Part CA (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1705_complete');
