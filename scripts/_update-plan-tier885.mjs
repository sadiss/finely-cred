import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier845_complete/, 'execution_status: tier885_complete');

if (!s.includes('tier846-865-plan-handoff')) {
  s = s.replace(
    `  - id: tier841-845-plan-handoff
    content: "Tier 841–845 — Part AK verified + tier845_complete (social autopilot + launch depth gates)"
    status: completed`,
    `  - id: tier841-845-plan-handoff
    content: "Tier 841–845 — Part AK verified + tier845_complete (social autopilot + launch depth gates)"
    status: completed
  - id: tier846-865-plan-handoff
    content: "Tier 846–865 — Part AL verified + tier865_complete (ops briefing + social publish workflow)"
    status: completed
  - id: tier866-885-plan-handoff
    content: "Tier 866–885 — Part AM verified + tier885_complete (inbox briefing + bundle preview + Meta live publish)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 845 complete** — Portal Work command palette + Work/CRM functional depth verification |',
  '| **Execution status** | **Tier 885 complete** — Ops briefing depth + social publish + Meta live publish + service bundle preview |',
);

if (!s.includes('## Tier 865 —')) {
  s = s.replace(
    '## Tier 845 — Work + CRM depth Part AK (complete)',
    `## Tier 885 — Unified inbox + bundles Part AM (complete)

| Item | Status |
|------|--------|
| **Ops briefing expansion** — support threads + Meta inbox in daily ranking | Done |
| **Service bundle preview** — \`describeServiceBundle\` on template gallery | Done |
| **Meta live publish** — \`meta-publish-post\` edge + \`metaSocialPublish\` client | Done |
| Launch + smoke gates for briefing, bundles, Meta publish | Done |

## Tier 865 — Ops briefing + social publish Part AL (complete)

| Item | Status |
|------|--------|
| **Briefing kinds** — \`automation\` + \`social\` ranked in \`buildDailyBriefing\` | Done |
| **Social publish workflow** — \`updateSocialPostStatus\`, publish due, compliance queue | Done |
| **Platform cron** — \`publishDueSocialPosts\` after autopilot tick | Done |
| **OpsBriefingPanel** — \`finelyOsInlineListItem\` + kind chips | Done |
| Launch checklist — \`ops_briefing_depth\` + \`social_publish_depth\` | Done |

## Tier 845 — Work + CRM depth Part AK (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier885_complete');
