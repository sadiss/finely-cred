import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1505_complete/, 'execution_status: tier1525_complete');

if (!s.includes('tier1506-1525-plan-handoff')) {
  s = s.replace(
    `  - id: tier1486-1505-plan-handoff
    content: "Tier 1486-1505 — Part BR verified + tier1505_complete (partner detail tab lanes + Leads/CRM hubs + wave19)"
    status: completed`,
    `  - id: tier1486-1505-plan-handoff
    content: "Tier 1486-1505 — Part BR verified + tier1505_complete (partner detail tab lanes + Leads/CRM hubs + wave19)"
    status: completed
  - id: tier1506-1525-plan-handoff
    content: "Tier 1506-1525 — Part BS verified + tier1525_complete (admin ops hub wave 20 — playbooks, comms, automations, portfolio)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1505 complete** — Partner detail tab lanes + Leads/CRM unified hubs + paginated entity stacks; sitewide_partner_detail_wave19 |',
  '| **Execution status** | **Tier 1525 complete** — Admin ops hub wave (playbooks, comms, automations, portfolio); sitewide_admin_ops_wave20 |',
);

if (!s.includes('## Tier 1525 —')) {
  s = s.replace(
    '## Tier 1505 — Partner detail + CRM/leads hub wave Part BR (complete)',
    `## Tier 1525 — Admin ops hub wave Part BS (complete)

| Item | Status |
|------|--------|
| **AdminPlaybooksPage** — FinelyUnifiedHubLayout (playbooks vs bundles tabs) | Done |
| **AdminCommsStudioPage** — unified hub + paginated nurture enrollments | Done |
| **AdminAutomationsPage** — unified hub (studio / library / logs / autopilot) | Done |
| **AdminPortfolioDashboardPage** — unified hub + paginated project cards | Done |
| **AdminLeadsOsPage** — paginated Meta leads + social inbox (no scroll traps) | Done |
| **audit-admin-hub** + launch gate wave 20 + CI gates | Done |

## Tier 1505 — Partner detail + CRM/leads hub wave Part BR (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1525_complete');
