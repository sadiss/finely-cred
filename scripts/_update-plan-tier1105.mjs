import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1085_complete/, 'execution_status: tier1105_complete');

if (!s.includes('tier1086-1105-plan-handoff')) {
  s = s.replace(
    `  - id: tier1066-1085-plan-handoff
    content: "Tier 1066-1085 — Part AW verified + tier1085_complete (portal wave 4 hubs + full human seed + hero fundability CTA)"
    status: completed`,
    `  - id: tier1066-1085-plan-handoff
    content: "Tier 1066-1085 — Part AW verified + tier1085_complete (portal wave 4 hubs + full human seed + hero fundability CTA)"
    status: completed
  - id: tier1086-1105-plan-handoff
    content: "Tier 1086-1105 — Part AX verified + tier1105_complete (portal wave 5 hubs: documents/build/debt/letters vault)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1085 complete** — Portal wave 4 unified hubs, full human catalog auto-seed, hero fundability CTA |',
  '| **Execution status** | **Tier 1105 complete** — Portal wave 5: documents, build, debt, letters vault unified hubs |',
);

if (!s.includes('## Tier 1105 —')) {
  s = s.replace(
    '## Tier 1085 — Portal wave 4 Part AW (complete)',
    `## Tier 1105 — Portal wave 5 Part AX (complete)

| Item | Status |
|------|--------|
| **PartnerDocumentsPage** — upload / vault / doc intel hub tabs | Done |
| **PartnerBuildPage** — bundles / timeline / history hub tabs | Done |
| **PartnerDebtPage** — overview / cases / letter guides hub tabs | Done |
| **PartnerLettersVaultPage** — letters + analysis reports hub tabs | Done |
| Launch + smoke gates for Part AX | Done |

## Tier 1085 — Portal wave 4 Part AW (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1105_complete');
