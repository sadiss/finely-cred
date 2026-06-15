import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1305_complete/, 'execution_status: tier1325_complete');

if (!s.includes('tier1306-1325-plan-handoff')) {
  s = s.replace(
    `  - id: tier1286-1305-plan-handoff
    content: "Tier 1286-1305 — Part BH verified + tier1305_complete (CI pre-deploy gate + GitHub Actions ci:check)"
    status: completed`,
    `  - id: tier1286-1305-plan-handoff
    content: "Tier 1286-1305 — Part BH verified + tier1305_complete (CI pre-deploy gate + GitHub Actions ci:check)"
    status: completed
  - id: tier1306-1325-plan-handoff
    content: "Tier 1306-1325 — Part BI verified + tier1325_complete (plan closure + hub audit + deploy workflow)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1305 complete** — CI pre-deploy gate (ci:check); GitHub Actions unified; secrets CI-safe; build job with placeholder Vite env |',
  '| **Execution status** | **Tier 1325 complete** — Finely OS 400% plan closure; portal hub audit; manual deploy workflow; FINELY-OS-400-COMPLETE.md |',
);

if (!s.includes('## Tier 1325 —')) {
  s = s.replace(
    '## Tier 1305 — CI pre-deploy Part BH (complete)',
    `## Tier 1325 — Plan closure Part BI (complete)

| Item | Status |
|------|--------|
| **FINELY-OS-400-COMPLETE.md** — execution summary + deploy runbook | Done |
| **audit-portal-unified-hub.mjs** — npm run hub:audit (31 portal pages) | Done |
| **deploy-manual.yml** — workflow_dispatch predeploy + dist artifact | Done |
| Launch + smoke gates for plan closure | Done |

## Tier 1305 — CI pre-deploy Part BH (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1325_complete');
