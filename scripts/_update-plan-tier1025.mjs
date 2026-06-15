import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1005_complete/, 'execution_status: tier1025_complete');

if (!s.includes('tier1006-1025-plan-handoff')) {
  s = s.replace(
    `  - id: tier986-1005-plan-handoff
    content: "Tier 986-1005 — Part AU verified + tier1005_complete (sitewide unified UX + human automations 20× + reasons OS + fundability hub)"
    status: completed`,
    `  - id: tier986-1005-plan-handoff
    content: "Tier 986-1005 — Part AU verified + tier1005_complete (sitewide unified UX + human automations 20× + reasons OS + fundability hub)"
    status: completed
  - id: tier1006-1025-plan-handoff
    content: "Tier 1006-1025 — Part AS verified + tier1025_complete (server automation queue + Ops cron health + business unified hub)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1005 complete** — Sitewide unified UX, fundability hub, human automations 20×, Reasons OS |',
  '| **Execution status** | **Tier 1025 complete** — Server automation queue, Ops cron health, business dashboard unified hub |',
);

if (!s.includes('## Tier 1025 —')) {
  s = s.replace(
    '## Tier 1005 — Sitewide unification Part AU (complete)',
    `## Tier 1025 — Server automation depth Part AS (complete)

| Item | Status |
|------|--------|
| **server_automation_queue** migration + RLS | Done |
| **processAutomationRulesFromDb** — create_task / run_workflow queued for client drain | Done |
| **drainServerAutomationQueue** — boot + live cron tick drain | Done |
| **OpsPlatformCronHealthPanel** — heartbeat + pg_cron + queue pending in Ops Inbox | Done |
| **BusinessDashboardPage** — FinelyUnifiedHubLayout tabs | Done |
| Expanded human recipe auto-seed (8 core human recipes) | Done |
| Launch + smoke gates for server queue + ops cron health | Done |

## Tier 1005 — Sitewide unification Part AU (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1025_complete');
