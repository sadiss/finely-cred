import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1285_complete/, 'execution_status: tier1305_complete');

if (!s.includes('tier1286-1305-plan-handoff')) {
  s = s.replace(
    `  - id: tier1266-1285-plan-handoff
    content: "Tier 1266-1285 — Part BG verified + tier1285_complete (local dev bootstrap + env:check + handoff sync)"
    status: completed`,
    `  - id: tier1266-1285-plan-handoff
    content: "Tier 1266-1285 — Part BG verified + tier1285_complete (local dev bootstrap + env:check + handoff sync)"
    status: completed
  - id: tier1286-1305-plan-handoff
    content: "Tier 1286-1305 — Part BH verified + tier1305_complete (CI pre-deploy gate + GitHub Actions ci:check)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1285 complete** — Local dev bootstrap (LOCAL_DEV.md, env:check, dev:check); secrets read .env + .env.local; handoff updated |',
  '| **Execution status** | **Tier 1305 complete** — CI pre-deploy gate (ci:check); GitHub Actions unified; secrets CI-safe; build job with placeholder Vite env |',
);

if (!s.includes('## Tier 1305 —')) {
  s = s.replace(
    '## Tier 1285 — Local dev bootstrap Part BG (complete)',
    `## Tier 1305 — CI pre-deploy Part BH (complete)

| Item | Status |
|------|--------|
| **ci-predeploy-check.mjs** — npm run ci:check (smoke + migrations + RLS, CI-safe secrets) | Done |
| **GitHub Actions ci.yml** — ci-check → build + playwright jobs | Done |
| **secrets:check** — CI mode defers VITE_* to deploy host | Done |
| Launch + smoke gates for CI pre-deploy | Done |

## Tier 1285 — Local dev bootstrap Part BG (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1305_complete');
