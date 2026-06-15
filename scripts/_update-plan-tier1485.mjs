import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1465_complete/, 'execution_status: tier1485_complete');

if (!s.includes('tier1466-1485-plan-handoff')) {
  s = s.replace(
    `  - id: tier1446-1465-plan-handoff
    content: "Tier 1446-1465 — Part BP verified + tier1465_complete (portal simple nav + app-surface light theme pass)"
    status: completed`,
    `  - id: tier1446-1465-plan-handoff
    content: "Tier 1446-1465 — Part BP verified + tier1465_complete (portal simple nav + app-surface light theme pass)"
    status: completed
  - id: tier1466-1485-plan-handoff
    content: "Tier 1466-1485 — Part BQ verified + tier1485_complete (admin simple nav + onboarding light theme + admin hub wave)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1465 complete** — Portal simple nav + app-surface light theme; sitewide_theme_portal_wave17 |',
  '| **Execution status** | **Tier 1485 complete** — Admin simple nav + onboarding light theme + admin hub wave; sitewide_theme_admin_wave18 |',
);

if (!s.includes('## Tier 1485 —')) {
  s = s.replace(
    '## Tier 1465 — Portal simple nav + app-surface light theme Part BP (complete)',
    `## Tier 1485 — Admin simple nav + admin hub wave Part BQ (complete)

| Item | Status |
|------|--------|
| **ADMIN_NAV_LANES** — 4-lane admin wayfinder (Core / Comms / Automation / Platform) | Done |
| **FinelyAdminSimpleNav** — paginated module stacks (default mobile admin nav) | Done |
| **SovereignPortal** — \`data-fc-onboarding-shell\` light theme pass | Done |
| **AdminDashboardPage** + **PartnersListPage** — FinelyUnifiedHubLayout tabs | Done |
| **audit-admin-hub.mjs** + theme audit wave 18 + launch/CI gates | Done |

## Tier 1465 — Portal simple nav + app-surface light theme Part BP (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1485_complete');
