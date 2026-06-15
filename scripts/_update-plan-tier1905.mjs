import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1885_complete/, 'execution_status: tier1905_complete');

if (!s.includes('tier1886-1905-plan-handoff')) {
  s = s.replace(
    `  - id: tier1866-1885-plan-handoff
    content: "Tier 1866-1885 — Part CK verified + tier1885_complete (light surface harmony wave 38 — grounded depth, role hubs, AU orders paginated)"
    status: completed`,
    `  - id: tier1866-1885-plan-handoff
    content: "Tier 1866-1885 — Part CK verified + tier1885_complete (light surface harmony wave 38 — grounded depth, role hubs, AU orders paginated)"
    status: completed
  - id: tier1886-1905-plan-handoff
    content: "Tier 1886-1905 — Part CL verified + tier1905_complete (light business + portal wave 39 — funding, bureaus, profile, billion-path, library, personal credit)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1885 complete** — Light surface harmony (grounded accent depth, role hubs, AU orders); sitewide_light_harmony_wave38 |',
  '| **Execution status** | **Tier 1905 complete** — Light business lane + portal library (funding, bureaus, profile, billion-path, library, personal credit); sitewide_light_business_wave39 |',
);

if (!s.includes('## Tier 1905 —')) {
  s = s.replace(
    '## Tier 1885 — Light surface harmony wave Part CK (complete)',
    `## Tier 1905 — Light business + portal wave Part CL (complete)

| Item | Status |
|------|--------|
| **Business funding** — guide + inputs → amber/violet catalog cards | Done |
| **Business bureaus** — guide pillars + score tracker → catalog cards | Done |
| **Business profile + billion path** — form + capital pillars → catalog cards | Done |
| **Portal library + tradelines** — owned/store tiles → accent catalog cards | Done |
| **Personal credit** — readable accents + catalog section panels | Done |
| **theme:audit** + launch gate wave 39 | Done |

## Tier 1885 — Light surface harmony wave Part CK (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1905_complete');
