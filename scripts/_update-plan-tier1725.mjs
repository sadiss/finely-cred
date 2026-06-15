import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1705_complete/, 'execution_status: tier1725_complete');

if (!s.includes('tier1686-1705-plan-handoff')) {
  s = s.replace(
    `  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed`,
    `  - id: tier1666-1685-plan-handoff
    content: "Tier 1666-1685 — Part CA verified + tier1685_complete (clean neutral shell wave 28 — remove multi-color page aurora)"
    status: completed
  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed`,
  );
}

if (!s.includes('tier1706-1725-plan-handoff')) {
  s = s.replace(
    `  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed`,
    `  - id: tier1686-1705-plan-handoff
    content: "Tier 1686-1705 — Part CB verified + tier1705_complete (light pop 100% wave 29 — opaque glass, hero, hub KPIs, vivid cards)"
    status: completed
  - id: tier1706-1725-plan-handoff
    content: "Tier 1706-1725 — Part CC verified + tier1725_complete (luxury ivory mesh + transparent glass wave 30)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1705 complete** — Light pop 100% (opaque glass, bold hero, hub KPIs, vivid accent cards); sitewide_light_pop_wave29 |',
  '| **Execution status** | **Tier 1725 complete** — Luxury ivory mesh + transparent glass (elegant multi-color depth, aurora hero, accent washes); sitewide_light_luxury_wave30 |',
);

if (!s.includes('## Tier 1725 —')) {
  s = s.replace(
    '## Tier 1705 — Light pop 100% wave Part CB (complete)',
    `## Tier 1725 — Luxury light mesh wave Part CC (complete)

| Item | Status |
|------|--------|
| **Ivory luxury mesh** — warm base + restrained gold/violet/emerald/sky/fuchsia radials | Done |
| **Transparent glass** — fc-luxury-glass panels (~72–82%) let mesh show through | Done |
| **PageShell aurora** — re-enabled on light with elegant accent orbs | Done |
| **Accent washes** — hub shell + hero panels per data-fc-accent | Done |
| **Pop balance** — KPIs + accent cards stay strong; glass layers stay airy | Done |
| **theme:audit** + launch gate wave 30 | Done |

## Tier 1705 — Light pop 100% wave Part CB (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1725_complete');
