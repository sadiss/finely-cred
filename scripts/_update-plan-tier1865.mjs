import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1845_complete/, 'execution_status: tier1865_complete');

if (!s.includes('tier1846-1865-plan-handoff')) {
  s = s.replace(
    `  - id: tier1826-1845-plan-handoff
    content: "Tier 1826-1845 — Part CI verified + tier1845_complete (light public hubs wave 36 — agents, resources, AU marketplace, portal dashboard)"
    status: completed`,
    `  - id: tier1826-1845-plan-handoff
    content: "Tier 1826-1845 — Part CI verified + tier1845_complete (light public hubs wave 36 — agents, resources, AU marketplace, portal dashboard)"
    status: completed
  - id: tier1846-1865-plan-handoff
    content: "Tier 1846-1865 — Part CJ verified + tier1865_complete (light marketing pages wave 37 — pricing, affiliate, enlightenment, personal credit, events, testimonials, portal select)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1845 complete** — Light public hubs (agents, resources, AU marketplace guide, portal dashboard quick-actions); sitewide_light_hubs_wave36 |',
  '| **Execution status** | **Tier 1865 complete** — Light marketing pages (pricing, affiliate, enlightenment session, personal credit, events, testimonials, portal select); sitewide_light_marketing_wave37 |',
);

if (!s.includes('## Tier 1865 —')) {
  s = s.replace(
    '## Tier 1845 — Light public hubs wave Part CI (complete)',
    `## Tier 1865 — Light marketing pages wave Part CJ (complete)

| Item | Status |
|------|--------|
| **Pricing** — agency band + intake CTA → catalog / lead magnet panels | Done |
| **Affiliate** — offerings, quote band, pillars, apply form → catalog cards | Done |
| **Enlightenment session** — prep + booking panels → catalog / lead magnet | Done |
| **Personal credit** — platform feature grid → rotating accent catalog cards | Done |
| **Events + testimonials + portal select** — paginated catalog cards | Done |
| **theme:audit** + launch gate wave 37 | Done |

## Tier 1845 — Light public hubs wave Part CI (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1865_complete');
