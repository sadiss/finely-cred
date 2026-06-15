import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1945_complete/, 'execution_status: tier1965_complete');

if (!s.includes('tier1946-1965-plan-handoff')) {
  s = s.replace(
    `  - id: tier1926-1945-plan-handoff
    content: "Tier 1926-1945 — Part CN verified + tier1945_complete (light admin catalog wave 41 — funnel, monitoring, tenants, analytics, vendors, testimonials, integration, cms, access, settings)"
    status: completed`,
    `  - id: tier1926-1945-plan-handoff
    content: "Tier 1926-1945 — Part CN verified + tier1945_complete (light admin catalog wave 41 — funnel, monitoring, tenants, analytics, vendors, testimonials, integration, cms, access, settings)"
    status: completed
  - id: tier1946-1965-plan-handoff
    content: "Tier 1946-1965 — Part CO verified + tier1965_complete (light admin workspaces wave 42 — resources, billing, team, support, voice, calendar, automations, vault, import, nora, crm, access panels)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1945 complete** — Light admin catalog completion (funnel, monitoring, tenants, integration hub); sitewide_light_admin_wave41 |',
  '| **Execution status** | **Tier 1965 complete** — Light admin workspace panels (resources, billing, team, vault, import); sitewide_light_admin_workspaces_wave42 |',
);

if (!s.includes('## Tier 1965 —')) {
  s = s.replace(
    '## Tier 1945 — Light admin catalog wave Part CN (complete)',
    `## Tier 1965 — Light admin workspaces wave Part CO (complete)

| Item | Status |
|------|--------|
| **Resources CMS** — guides/videos editor → violet/sky catalog cards | Done |
| **Billing + team + support + voice** — entity panels → catalog cards | Done |
| **Calendar + automations + vault + import** — workspace shells → catalog cards | Done |
| **Nora + CRM record + access center** — nested harmony catalog panels | Done |
| **Partners list** — create + directory → violet catalog cards | Done |
| **theme:audit** + launch gate wave 42 | Done |

## Tier 1945 — Light admin catalog wave Part CN (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1965_complete');
