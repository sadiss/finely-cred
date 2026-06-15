import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1165_complete/, 'execution_status: tier1185_complete');

if (!s.includes('tier1166-1185-plan-handoff')) {
  s = s.replace(
    `  - id: tier1146-1165-plan-handoff
    content: "Tier 1146-1165 — Part BA verified + tier1165_complete (portal wave 8: billing/tradeline/wealth/analysis/barter)"
    status: completed`,
    `  - id: tier1146-1165-plan-handoff
    content: "Tier 1146-1165 — Part BA verified + tier1165_complete (portal wave 8: billing/tradeline/wealth/analysis/barter)"
    status: completed
  - id: tier1166-1185-plan-handoff
    content: "Tier 1166-1185 — Part BB verified + tier1185_complete (portal wave 9: checkout/purchase/workspace/course/dispute-detail)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1165 complete** — Portal wave 8: billing, tradeline, wealth paths, analysis vault, barter hubs |',
  '| **Execution status** | **Tier 1185 complete** — Portal wave 9: checkout, purchase flows, project workspace, course player, dispute detail hubs |',
);

if (!s.includes('## Tier 1185 —')) {
  s = s.replace(
    '## Tier 1165 — Portal wave 8 Part BA (complete)',
    `## Tier 1185 — Portal wave 9 Part BB (complete)

| Item | Status |
|------|--------|
| **PartnerCheckoutPage** — catalog / package / payment hub tabs | Done |
| **PartnerBookPurchasePage** — overview / unlock hub tabs | Done |
| **PartnerBundlePurchasePage** — overview / unlock hub tabs | Done |
| **PartnerProjectWorkspacePage** — overview / board / list / calendar hub tabs | Done |
| **PartnerCoursePage** — syllabus / lesson hub tabs | Done |
| **PartnerDisputeDetailPage** — overview / workflow / items hub tabs | Done |
| **ProjectWorkspaceBody** — unifiedShell hides inner view tabs | Done |
| Launch + smoke gates for Part BB | Done |

## Tier 1165 — Portal wave 8 Part BA (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1185_complete');
