import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier985_complete/, 'execution_status: tier1005_complete');

if (!s.includes('tier986-1005-plan-handoff')) {
  s = s.replace(
    `  - id: tier966-985-plan-handoff
    content: "Tier 966-985 — Part AR verified + tier985_complete (server nurture email + DB automation rules + pg_cron schedule)"
    status: completed`,
    `  - id: tier966-985-plan-handoff
    content: "Tier 966-985 — Part AR verified + tier985_complete (server nurture email + DB automation rules + pg_cron schedule)"
    status: completed
  - id: tier986-1005-plan-handoff
    content: "Tier 986-1005 — Part AU verified + tier1005_complete (sitewide unified UX + human automations 20× + reasons OS + fundability hub)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 985 complete** — Server nurture email + DB automation rules + pg_cron schedule |',
  '| **Execution status** | **Tier 1005 complete** — Sitewide unified UX, fundability hub, human automations 20×, Reasons OS |',
);

if (!s.includes('## Tier 1005 —')) {
  s = s.replace(
    '## Tier 985 — Server nurture email + DB rules Part AR (complete)',
    `## Tier 1005 — Sitewide unification Part AU (complete)

| Item | Status |
|------|--------|
| **FinelyUnifiedHubLayout** — tab-first progressive disclosure sitewide pattern | Done |
| **FundabilityReadinessPage** — /fundability-readiness unified personal + business hub | Done |
| **LandingUnifiedJourneySection** — signup → fundability → portal journey strip | Done |
| **OnboardingExperienceShell** — step progress + lane context in signup wizard | Done |
| **ReasonsCommandHub** — library + AI rank + fundability lens | Done |
| **HUMAN_AUTOMATION_RECIPES** — 40+ human-like recipes + agentRunner cadence | Done |
| Personal credit + admin role preview unified tab layouts | Done |
| Launch + smoke gates for unified UX / human automations | Done |

## Tier 985 — Server nurture email + DB rules Part AR (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1005_complete');
