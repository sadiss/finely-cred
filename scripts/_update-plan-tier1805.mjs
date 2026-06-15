import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1785_complete/, 'execution_status: tier1805_complete');

if (!s.includes('tier1786-1805-plan-handoff')) {
  s = s.replace(
    `  - id: tier1766-1785-plan-handoff
    content: "Tier 1766-1785 — Part CF verified + tier1785_complete (public shell light rollout wave 33 — landing mesh/contrast, App sections, affiliate band)"
    status: completed`,
    `  - id: tier1766-1785-plan-handoff
    content: "Tier 1766-1785 — Part CF verified + tier1785_complete (public shell light rollout wave 33 — landing mesh/contrast, App sections, affiliate band)"
    status: completed
  - id: tier1786-1805-plan-handoff
    content: "Tier 1786-1805 — Part CG verified + tier1805_complete (light marketing closures wave 34 — hero ivory wash, lead magnet, testimonials, final CTA)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1785 complete** — Public shell light rollout (landing mesh/contrast bands, App pricing/ebooks/testimonials, tradeline catalog cards); sitewide_light_rollout_wave33 |',
  '| **Execution status** | **Tier 1805 complete** — Light marketing closures (wealth hero, lead magnet panel, testimonial accents, final CTA platinum band); sitewide_light_marketing_wave34 |',
);

if (!s.includes('## Tier 1805 —')) {
  s = s.replace(
    '## Tier 1785 — Public shell light rollout wave Part CF (complete)',
    `## Tier 1805 — Light marketing closures wave Part CG (complete)

| Item | Status |
|------|--------|
| **Wealth hero** — ivory wash, softened skyline, gold/violet marble veil on light | Done |
| **Footer + final CTA** — platinum/contrast bands via finelyOsLandingPlatinumSection | Done |
| **Lead magnet panel** — emerald catalog card on contrast band (finelyOsLeadMagnetPanel) | Done |
| **Testimonial dossiers** — per-accent catalog cards (emerald/amber/violet) + pop lift | Done |
| **theme:audit** + launch gate wave 34 | Done |

## Tier 1785 — Public shell light rollout wave Part CF (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1805_complete');
