import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1665_complete/, 'execution_status: tier1685_complete');

if (!s.includes('tier1646-1665-plan-handoff')) {
  s = s.replace(
    `  - id: tier1626-1645-plan-handoff
    content: "Tier 1626-1645 — Part BY verified + tier1645_complete (obsidian metallic wave 26 — theme-split obsidian/silver CTAs)"
    status: completed`,
    `  - id: tier1626-1645-plan-handoff
    content: "Tier 1626-1645 — Part BY verified + tier1645_complete (obsidian metallic wave 26 — theme-split obsidian/silver CTAs)"
    status: completed
  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, vivid aurora)"
    status: completed`,
  );
}

if (!s.includes('tier1666-1685-plan-handoff')) {
  s = s.replace(
    `  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, vivid aurora)"
    status: completed`,
    `  - id: tier1646-1665-plan-handoff
    content: "Tier 1646-1665 — Part BZ verified + tier1665_complete (light appeal wave 27 — contrast bands, pop cards, hero panels)"
    status: completed
  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1665 complete** — Light appeal + black contrast bands; theme-split silver (dark) / obsidian (light) CTAs; sitewide_light_appeal_wave27 |',
  '| **Execution status** | **Tier 1685 complete** — Clean neutral page shells (no rainbow aurora); contrast bands + accent cards kept; sitewide_clean_shell_wave28 |',
);

if (!s.includes('## Tier 1685 —')) {
  s = s.replace(
    '## Tier 1665 — Light appeal wave Part BZ (complete)',
    `## Tier 1685 — Clean neutral shell wave Part CA (complete)

| Item | Status |
|------|--------|
| **--fc-shell-gradient** — neutral light/dark page backgrounds | Done |
| **Remove aurora orbs** — body, public shell, pageshell decorative layers | Done |
| **Clean glass panels** — spotlight/elevated/card/hub-hero without multi radials | Done |
| **Contrast bands** — solid black gradient (no rainbow wash inside) | Done |
| **theme:audit** + launch gate wave 28 | Done |

## Tier 1665 — Light appeal wave Part BZ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1685_complete');
