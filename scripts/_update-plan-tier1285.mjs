import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1265_complete/, 'execution_status: tier1285_complete');

if (!s.includes('tier1266-1285-plan-handoff')) {
  s = s.replace(
    `  - id: tier1246-1265-plan-handoff
    content: "Tier 1246-1265 — Part BF verified + tier1265_complete (LIVE_SETUP rebuild + deploy gates hardened)"
    status: completed`,
    `  - id: tier1246-1265-plan-handoff
    content: "Tier 1246-1265 — Part BF verified + tier1265_complete (LIVE_SETUP rebuild + deploy gates hardened)"
    status: completed
  - id: tier1266-1285-plan-handoff
    content: "Tier 1266-1285 — Part BG verified + tier1285_complete (local dev bootstrap + env:check + handoff sync)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1265 complete** — LIVE_SETUP synced (18 migrations); predeploy/RLS/migration gates hardened; production deploy ready |',
  '| **Execution status** | **Tier 1285 complete** — Local dev bootstrap (LOCAL_DEV.md, env:check, dev:check); secrets read .env + .env.local; handoff updated |',
);

if (!s.includes('## Tier 1285 —')) {
  s = s.replace(
    '## Tier 1265 — Production deploy readiness Part BF (complete)',
    `## Tier 1285 — Local dev bootstrap Part BG (complete)

| Item | Status |
|------|--------|
| **docs/LOCAL_DEV.md** — quick start, routes, marketing vs full mode | Done |
| **validate-local-env.mjs** — npm run env:check | Done |
| **dev:check** — typecheck + env:check | Done |
| **secrets:check** — merges .env + .env.local like Vite | Done |
| **DEVELOPER_HANDOFF** — 18 migrations + live-setup:rebuild note | Done |
| Launch + smoke gates for local dev bootstrap | Done |

## Tier 1265 — Production deploy readiness Part BF (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1285_complete');
