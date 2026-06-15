import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier885_complete/, 'execution_status: tier905_complete');

if (!s.includes('tier886-905-plan-handoff')) {
  s = s.replace(
    `  - id: tier866-885-plan-handoff
    content: "Tier 866–885 — Part AM verified + tier885_complete (inbox briefing + bundle preview + Meta live publish)"
    status: completed`,
    `  - id: tier866-885-plan-handoff
    content: "Tier 866–885 — Part AM verified + tier885_complete (inbox briefing + bundle preview + Meta live publish)"
    status: completed
  - id: tier886-905-plan-handoff
    content: "Tier 886–905 — Part AN verified + tier905_complete (IG publish + server cron social + CRM bundle panel)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 885 complete** — Ops briefing depth + social publish + Meta live publish + service bundle preview |',
  '| **Execution status** | **Tier 905 complete** — Instagram publish + server cron social sweep + CRM bundle preview |',
);

if (!s.includes('## Tier 905 —')) {
  s = s.replace(
    '## Tier 885 — Unified inbox + bundles Part AM (complete)',
    `## Tier 905 — Production social + CRM bundles Part AN (complete)

| Item | Status |
|------|--------|
| **Instagram publish** — \`metaGraphPublish\` media container + \`defaultIgImageUrl\` config | Done |
| **Server cron social** — \`platform-cron\` social_autopilot/social_publish + admin server publish sweep | Done |
| **CRM bundle panel** — \`CrmServiceBundlePanel\` on record page before convert | Done |
| Launch + smoke gates for IG publish, server cron social, CRM bundle preview | Done |

## Tier 885 — Unified inbox + bundles Part AM (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier905_complete');
