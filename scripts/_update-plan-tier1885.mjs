import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1865_complete/, 'execution_status: tier1885_complete');

if (!s.includes('tier1866-1885-plan-handoff')) {
  s = s.replace(
    `  - id: tier1846-1865-plan-handoff
    content: "Tier 1846-1865 — Part CJ verified + tier1865_complete (light marketing pages wave 37 — pricing, affiliate, enlightenment, personal credit, events, testimonials, portal select)"
    status: completed`,
    `  - id: tier1846-1865-plan-handoff
    content: "Tier 1846-1865 — Part CJ verified + tier1865_complete (light marketing pages wave 37 — pricing, affiliate, enlightenment, personal credit, events, testimonials, portal select)"
    status: completed
  - id: tier1866-1885-plan-handoff
    content: "Tier 1866-1885 — Part CK verified + tier1885_complete (light surface harmony wave 38 — grounded depth, role hubs, AU orders paginated)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1865 complete** — Light marketing pages (pricing, affiliate, enlightenment session, personal credit, events, testimonials, portal select); sitewide_light_marketing_wave37 |',
  '| **Execution status** | **Tier 1885 complete** — Light surface harmony (grounded accent depth, role hubs, AU orders); sitewide_light_harmony_wave38 |',
);

if (!s.includes('## Tier 1885 —')) {
  s = s.replace(
    '## Tier 1865 — Light marketing pages wave Part CJ (complete)',
    `## Tier 1885 — Light surface harmony wave Part CK (complete)

| Item | Status |
|------|--------|
| **Surface harmony CSS** — remove literal Y-lift; softer shadows; nested hub cards | Done |
| **fc-surface-harmony** — catalog cards sit flush with parent sections | Done |
| **Role hubs** — agent, affiliate, AU seller → catalog cards | Done |
| **AU orders** — paginated catalog cards (no 24-item scroll trap) | Done |
| **Bookstore product** — amber catalog detail panel | Done |
| **theme:audit** + launch gate wave 38 | Done |

## Tier 1865 — Light marketing pages wave Part CJ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1885_complete');
