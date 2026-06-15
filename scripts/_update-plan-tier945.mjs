import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier925_complete/, 'execution_status: tier945_complete');

if (!s.includes('tier926-945-plan-handoff')) {
  s = s.replace(
    `  - id: tier906-925-plan-handoff
    content: "Tier 906–925 — Part AO verified + tier925_complete (Supabase social queue + DB server cron sweep)"
    status: completed`,
    `  - id: tier906-925-plan-handoff
    content: "Tier 906–925 — Part AO verified + tier925_complete (Supabase social queue + DB server cron sweep)"
    status: completed
  - id: tier926-945-plan-handoff
    content: "Tier 926–945 — Part AP verified + tier945_complete (server automation cron + heartbeat + runbook)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 925 complete** — Supabase social post persistence + DB-driven server cron publish |',
  '| **Execution status** | **Tier 945 complete** — Server automation/nurture cron sweep + platform heartbeat monitoring |',
);

if (!s.includes('## Tier 945 —')) {
  s = s.replace(
    '## Tier 925 — Supabase social persistence Part AO (complete)',
    `## Tier 945 — Server automation cron Part AP (complete)

| Item | Status |
|------|--------|
| **automation-runner cron_sweep** — scans lead_captures + Meta inbox, matches server hooks | Done |
| **platform-cron v4** — invokes automation sweep + saves heartbeat to DB | Done |
| **platform_cron_heartbeats migration** — admin monitoring snapshot | Done |
| **docs/PLATFORM_CRON.md** — pg_cron schedule runbook | Done |
| Launch + smoke gates for server_automation_cron | Done |

## Tier 925 — Supabase social persistence Part AO (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier945_complete');
