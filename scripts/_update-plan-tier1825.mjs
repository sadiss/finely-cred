import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1805_complete/, 'execution_status: tier1825_complete');

if (!s.includes('tier1806-1825-plan-handoff')) {
  s = s.replace(
    `  - id: tier1786-1805-plan-handoff
    content: "Tier 1786-1805 — Part CG verified + tier1805_complete (light marketing closures wave 34 — hero ivory wash, lead magnet, testimonials, final CTA)"
    status: completed`,
    `  - id: tier1786-1805-plan-handoff
    content: "Tier 1786-1805 — Part CG verified + tier1805_complete (light marketing closures wave 34 — hero ivory wash, lead magnet, testimonials, final CTA)"
    status: completed
  - id: tier1806-1825-plan-handoff
    content: "Tier 1806-1825 — Part CH verified + tier1825_complete (light public routes wave 35 — fundability, bookstore, checkout, free-guide funnel)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1805 complete** — Light marketing closures (wealth hero, lead magnet panel, testimonial accents, final CTA platinum band); sitewide_light_marketing_wave34 |',
  '| **Execution status** | **Tier 1825 complete** — Light public routes (fundability hub, bookstore, checkout, free-guide funnel on ivory mesh); sitewide_light_routes_wave35 |',
);

if (!s.includes('## Tier 1825 —')) {
  s = s.replace(
    '## Tier 1805 — Light marketing closures wave Part CG (complete)',
    `## Tier 1825 — Light public routes wave Part CH (complete)

| Item | Status |
|------|--------|
| **Fundability hub** — readiness pillars + roadmap → per-accent catalog cards | Done |
| **Bookstore** — featured strip + product tiles → catalog cards | Done |
| **Checkout** — cart line items → rotating accent catalog cards | Done |
| **Free-guide funnel** — lead magnet panel + feature grid + fg-funnel light mesh CSS | Done |
| **theme:audit** + launch gate wave 35 | Done |

## Tier 1805 — Light marketing closures wave Part CG (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1825_complete');
