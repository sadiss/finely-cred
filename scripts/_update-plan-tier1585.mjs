import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1565_complete/, 'execution_status: tier1585_complete');

if (!s.includes('tier1566-1585-plan-handoff')) {
  s = s.replace(
    `  - id: tier1546-1565-plan-handoff
    content: "Tier 1546-1565 — Part BU verified + tier1565_complete (portal catalog pagination wave 22 — dashboard, select, kanban, lead intel, events)"
    status: completed`,
    `  - id: tier1546-1565-plan-handoff
    content: "Tier 1546-1565 — Part BU verified + tier1565_complete (portal catalog pagination wave 22 — dashboard, select, kanban, lead intel, events)"
    status: completed
  - id: tier1566-1585-plan-handoff
    content: "Tier 1566-1585 — Part BV verified + tier1585_complete (drastic light frosted glass wave 23 — aurora shell + glass tokens + surface remaps)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1565 complete** — Portal catalog pagination (dashboard, partner select, kanban, lead intel, events feed); sitewide_portal_catalog_wave22 |',
  '| **Execution status** | **Tier 1585 complete** — Drastic light frosted glass (aurora shell, glass tokens, tinted chips); sitewide_light_glass_wave23 |',
);

if (!s.includes('## Tier 1585 —')) {
  s = s.replace(
    '## Tier 1565 — Portal catalog pagination wave Part BU (complete)',
    `## Tier 1585 — Light frosted glass wave Part BV (complete)

| Item | Status |
|------|--------|
| **Aurora mesh shell** — rich color orbs for glass blur depth | Done |
| **--fc-glass-* tokens** — frosted panels, borders, specular highlights | Done |
| **Site-wide remaps** — bg-white/* + accent tints → frosted glass (not flat transparent) | Done |
| **Landing bands + nav chrome** — glass wayfinder, bands, sticky tabs | Done |
| **theme:audit** + launch gate wave 23 | Done |

## Tier 1565 — Portal catalog pagination wave Part BU (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1585_complete');
