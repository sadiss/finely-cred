import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1425_complete/, 'execution_status: tier1445_complete');

if (!s.includes('tier1426-1445-plan-handoff')) {
  s = s.replace(
    `  - id: tier1406-1425-plan-handoff
    content: "Tier 1406-1425 — Part BN verified + tier1425_complete (public hub wave 15 + business detail hubs + portal catalog)"
    status: completed`,
    `  - id: tier1406-1425-plan-handoff
    content: "Tier 1406-1425 — Part BN verified + tier1425_complete (public hub wave 15 + business detail hubs + portal catalog)"
    status: completed
  - id: tier1426-1445-plan-handoff
    content: "Tier 1426-1445 — Part BO verified + tier1445_complete (site-wide light/dark theme + simplified wayfinding)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1425 complete** — Public hub wave 15 + business detail hubs; portal catalog lanes; sitewide_hub_wave15 |',
  '| **Execution status** | **Tier 1445 complete** — Site-wide light/dark theme toggle; simplified nav + wayfinder; sitewide_theme_nav_wave16 |',
);

if (!s.includes('## Tier 1445 —')) {
  s = s.replace(
    '## Tier 1425 — Public hub wave 15 + portal catalog Part BN (complete)',
    `## Tier 1445 — Site theme + simplified wayfinding Part BO (complete)

| Item | Status |
|------|--------|
| **FinelySiteThemeProvider** — Light / Dark / Auto with CSS variable shell | Done |
| **FinelyThemeToggle** — PageShell + public nav + mobile menu | Done |
| **FinelySiteWayfinder** — 4-lane sticky wayfinder on public inner pages | Done |
| **PUBLIC_PRIMARY_NAV** — simplified top nav (no mega dropdowns) | Done |
| **FinelyOsPublicCommandStrip** — collapsible paginated lead magnets | Done |
| **audit-site-theme.mjs** + launch/CI gates | Done |

## Tier 1425 — Public hub wave 15 + portal catalog Part BN (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1445_complete');
