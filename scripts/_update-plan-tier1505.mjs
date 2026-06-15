import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1485_complete/, 'execution_status: tier1505_complete');

if (!s.includes('tier1486-1505-plan-handoff')) {
  s = s.replace(
    `  - id: tier1466-1485-plan-handoff
    content: "Tier 1466-1485 — Part BQ verified + tier1485_complete (admin simple nav + onboarding light theme + admin hub wave)"
    status: completed`,
    `  - id: tier1466-1485-plan-handoff
    content: "Tier 1466-1485 — Part BQ verified + tier1485_complete (admin simple nav + onboarding light theme + admin hub wave)"
    status: completed
  - id: tier1486-1505-plan-handoff
    content: "Tier 1486-1505 — Part BR verified + tier1505_complete (partner detail tab lanes + Leads/CRM hubs + wave19)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1485 complete** — Admin simple nav + onboarding light theme + admin hub wave; sitewide_theme_admin_wave18 |',
  '| **Execution status** | **Tier 1505 complete** — Partner detail tab lanes + Leads/CRM unified hubs + paginated entity stacks; sitewide_partner_detail_wave19 |',
);

if (!s.includes('## Tier 1505 —')) {
  s = s.replace(
    '## Tier 1485 — Admin simple nav + admin hub wave Part BQ (complete)',
    `## Tier 1505 — Partner detail + CRM/leads hub wave Part BR (complete)

| Item | Status |
|------|--------|
| **PARTNER_DETAIL_TAB_LANES** + **FinelyEntityTabLaneNav** — 4-lane paginated partner tabs | Done |
| **PartnerDetailPage** — FinelyOsPaginatedStack for notes/debt (no show-all traps) | Done |
| **AdminLeadsOsPage** + **AdminCrmWorkspacePage** — FinelyUnifiedHubLayout tabs | Done |
| **Entity sticky bar** light theme + landing device bezel polish | Done |
| **audit-admin-hub** + **theme audit** wave 19 + launch/CI gates | Done |

## Tier 1485 — Admin simple nav + admin hub wave Part BQ (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1505_complete');
