import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1645_complete/, 'execution_status: tier1665_complete');

if (!s.includes('tier1626-1645-plan-handoff')) {
  s = s.replace(
    `  - id: tier1606-1625-plan-handoff
    content: "Tier 1606-1625 — Part BX verified + tier1625_complete (light solid accent wave 25 — colored icons/boxes, lane nav restore, More menu)"
    status: completed`,
    `  - id: tier1606-1625-plan-handoff
    content: "Tier 1606-1625 — Part BX verified + tier1625_complete (light solid accent wave 25 — colored icons/boxes, lane nav restore, More menu)"
    status: completed
  - id: tier1626-1645-plan-handoff
    content: "Tier 1626-1645 — Part BY verified + tier1645_complete (obsidian metallic wave 26 — black shiny CTAs site-wide)"
    status: completed`,
  );
}

if (!s.includes('tier1646-1665-plan-handoff')) {
  s = s.replace(
    `  - id: tier1626-1645-plan-handoff
    content: "Tier 1626-1645 — Part BY verified + tier1645_complete (obsidian metallic wave 26 — black shiny CTAs site-wide)"
    status: completed`,
    `  - id: tier1626-1645-plan-handoff
    content: "Tier 1626-1645 — Part BY verified + tier1645_complete (obsidian metallic wave 26 — theme-split obsidian/silver CTAs)"
    status: completed
  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, vivid aurora)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1645 complete** — Obsidian black metallic secondary CTAs (same shine as former silver); sitewide_obsidian_metal_wave26 |',
  '| **Execution status** | **Tier 1665 complete** — Light appeal + black contrast bands; theme-split silver (dark) / obsidian (light) CTAs; sitewide_light_appeal_wave27 |',
);

if (!s.includes('## Tier 1665 —')) {
  s = s.replace(
    '## Tier 1645 — Obsidian metallic wave Part BY (complete)',
    `## Tier 1665 — Light appeal wave Part BZ (complete)

| Item | Status |
|------|--------|
| **Theme-split metals** — silver platinum on dark, obsidian on light only | Done |
| **Black contrast bands** — fc-light-contrast-band + data-fc-contrast-band | Done |
| **Pop cards + hero panels** — fc-light-pop-card, fc-light-hero-panel, accent hover lift | Done |
| **Vivid aurora shell** — richer light body gradients | Done |
| **PersonalCreditPage** — process band, funding promo, bottom CTA contrast | Done |
| **theme:audit** + launch gate wave 27 | Done |

## Tier 1645 — Obsidian metallic wave Part BY (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1665_complete');
