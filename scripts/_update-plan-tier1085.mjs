import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1065_complete/, 'execution_status: tier1085_complete');

if (!s.includes('tier1066-1085-plan-handoff')) {
  s = s.replace(
    `  - id: tier1046-1065-plan-handoff
    content: "Tier 1046-1065 — Part AV verified + tier1065_complete (partner dashboard hub + pricing service hub + landing hero refresh + human seed expansion)"
    status: completed`,
    `  - id: tier1046-1065-plan-handoff
    content: "Tier 1046-1065 — Part AV verified + tier1065_complete (partner dashboard hub + pricing service hub + landing hero refresh + human seed expansion)"
    status: completed
  - id: tier1066-1085-plan-handoff
    content: "Tier 1066-1085 — Part AW verified + tier1085_complete (portal wave 4 hubs + full human seed + hero fundability CTA)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1065 complete** — Partner dashboard hub, pricing service hub, landing hero OS refresh, human auto-seed expansion |',
  '| **Execution status** | **Tier 1085 complete** — Portal wave 4 unified hubs, full human catalog auto-seed, hero fundability CTA |',
);

if (!s.includes('## Tier 1085 —')) {
  s = s.replace(
    '## Tier 1065 — Portal + landing wave 3 Part AV (complete)',
    `## Tier 1085 — Portal wave 4 Part AW (complete)

| Item | Status |
|------|--------|
| **PartnerDisputesPage** — overview / needs / tracked / cases hub tabs | Done |
| **PartnerChecklistPage** — checklist / score / improvements hub tabs | Done |
| **PartnerReportsPage** — credit intel + evidence vault unified hub | Done |
| **PartnerProjectsPage** — Work OS unified hub wrapper | Done |
| **Human automation full seed** — entire HUMAN_AUTOMATION_RECIPES catalog on boot | Done |
| **Hero fundability CTA** — primary landing button → /fundability-readiness | Done |
| Launch + smoke gates for Part AW | Done |

## Tier 1065 — Portal + landing wave 3 Part AV (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1085_complete');
