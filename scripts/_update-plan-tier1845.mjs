import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1825_complete/, 'execution_status: tier1845_complete');

if (!s.includes('tier1826-1845-plan-handoff')) {
  s = s.replace(
    `  - id: tier1806-1825-plan-handoff
    content: "Tier 1806-1825 — Part CH verified + tier1825_complete (light public routes wave 35 — fundability, bookstore, checkout, free-guide funnel)"
    status: completed`,
    `  - id: tier1806-1825-plan-handoff
    content: "Tier 1806-1825 — Part CH verified + tier1825_complete (light public routes wave 35 — fundability, bookstore, checkout, free-guide funnel)"
    status: completed
  - id: tier1826-1845-plan-handoff
    content: "Tier 1826-1845 — Part CI verified + tier1845_complete (light public hubs wave 36 — agents, resources, AU marketplace, portal dashboard)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1825 complete** — Light public routes (fundability hub, bookstore, checkout, free-guide funnel on ivory mesh); sitewide_light_routes_wave35 |',
  '| **Execution status** | **Tier 1845 complete** — Light public hubs (agents, resources, AU marketplace guide, portal dashboard quick-actions); sitewide_light_hubs_wave36 |',
);

if (!s.includes('## Tier 1845 —')) {
  s = s.replace(
    '## Tier 1825 — Light public routes wave Part CH (complete)',
    `## Tier 1845 — Light public hubs wave Part CI (complete)

| Item | Status |
|------|--------|
| **Agents page** — program hero + pillars + tiers → per-accent catalog cards | Done |
| **Resources hub** — lead magnet panel + guides/tools/videos → catalog cards | Done |
| **AU marketplace** — buyer guide tab → fuchsia catalog card | Done |
| **Portal dashboard** — mission control, top actions, modules, admin picker → catalog cards | Done |
| **theme:audit** + launch gate wave 36 | Done |

## Tier 1825 — Light public routes wave Part CH (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1845_complete');
