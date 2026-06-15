import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1965_complete/, 'execution_status: tier1985_complete');

if (!s.includes('tier1966-1985-plan-handoff')) {
  s = s.replace(
    `  - id: tier1946-1965-plan-handoff
    content: "Tier 1946-1965 — Part CO verified + tier1965_complete (light admin workspaces wave 42 — resources, billing, team, support, voice, calendar, automations, vault, import, nora, crm, access panels)"
    status: completed`,
    `  - id: tier1946-1965-plan-handoff
    content: "Tier 1946-1965 — Part CO verified + tier1965_complete (light admin workspaces wave 42 — resources, billing, team, support, voice, calendar, automations, vault, import, nora, crm, access panels)"
    status: completed
  - id: tier1966-1985-plan-handoff
    content: "Tier 1966-1985 — Part CP+CQ verified + tier1985_complete (light admin studios wave 43 + portal hubs wave 44 — comms/media/templates/settings + partner dashboard/reports/billing)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1965 complete** — Light admin workspace panels (resources, billing, team, vault, import); sitewide_light_admin_workspaces_wave42 |',
  '| **Execution status** | **Tier 1985 complete** — Light admin studios + portal hubs (comms, settings, partner dashboard/reports/billing); waves 43–44 |',
);

if (!s.includes('## Tier 1985 —')) {
  s = s.replace(
    '## Tier 1965 — Light admin workspaces wave Part CO (complete)',
    `## Tier 1985 — Light admin studios + portal hubs Part CP/CQ (complete)

| Item | Status |
|------|--------|
| **Admin studios** — comms, media, templates, settings tab bodies → catalog cards | Done |
| **Admin ops** — cases, AU sellers, finance, parsing, social hub, ops agent | Done |
| **Portal hubs** — dashboard, reports, billing, education, escalations, barter, checklist | Done |
| **theme:audit** + launch gates wave 43 + 44 | Done |

## Tier 1965 — Light admin workspaces wave Part CO (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1985_complete');
