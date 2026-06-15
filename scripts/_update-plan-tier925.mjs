import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier905_complete/, 'execution_status: tier925_complete');

if (!s.includes('tier906-925-plan-handoff')) {
  s = s.replace(
    `  - id: tier886-905-plan-handoff
    content: "Tier 886–905 — Part AN verified + tier905_complete (IG publish + server cron social + CRM bundle panel)"
    status: completed`,
    `  - id: tier886-905-plan-handoff
    content: "Tier 886–905 — Part AN verified + tier905_complete (IG publish + server cron social + CRM bundle panel)"
    status: completed
  - id: tier906-925-plan-handoff
    content: "Tier 906–925 — Part AO verified + tier925_complete (Supabase social queue + DB server cron sweep)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 905 complete** — Instagram publish + server cron social sweep + CRM bundle preview |',
  '| **Execution status** | **Tier 925 complete** — Supabase social post persistence + DB-driven server cron publish |',
);

if (!s.includes('## Tier 925 —')) {
  s = s.replace(
    '## Tier 905 — Production social + CRM bundles Part AN (complete)',
    `## Tier 925 — Supabase social persistence Part AO (complete)

| Item | Status |
|------|--------|
| **social_scheduled_posts migration** — RLS + due index for server cron | Done |
| **socialHubSupabaseSync** — boot hydrate, upsert on queue/update, autopilot config sync | Done |
| **platform-cron v3** — loadDuePostsFromDb + mark published/failed in DB | Done |
| Deploy panel — push local queue then DB-driven server publish + refresh | Done |
| Launch + smoke gates for social_supabase_persistence | Done |

## Tier 905 — Production social + CRM bundles Part AN (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier925_complete');
