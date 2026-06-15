import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1625_complete/, 'execution_status: tier1645_complete');

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

s = s.replace(
  '| **Execution status** | **Tier 1625 complete** — Light solid accents (icons/boxes are the color, no glow) + full lane menus; sitewide_light_solid_wave25 |',
  '| **Execution status** | **Tier 1645 complete** — Obsidian black metallic secondary CTAs (same shine as former silver); sitewide_obsidian_metal_wave26 |',
);

if (!s.includes('## Tier 1645 —')) {
  s = s.replace(
    '## Tier 1625 — Light solid accent wave Part BX (complete)',
    `## Tier 1645 — Obsidian metallic wave Part BY (complete)

| Item | Status |
|------|--------|
| **fc-button-platinum** — black obsidian fill + white label + specular sweep | Done |
| **fc-button-platinum-surface** — shared black metal for sized CTAs | Done |
| **fc-metal-black-icon-box** — onboarding/auth icon tiles | Done |
| **Inline silver CTAs** — App + landing affiliate → obsidian classes | Done |
| **theme:audit** + launch gate wave 26 | Done |

## Tier 1625 — Light solid accent wave Part BX (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1645_complete');
