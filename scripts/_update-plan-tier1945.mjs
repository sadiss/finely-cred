import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1925_complete/, 'execution_status: tier1945_complete');

if (!s.includes('tier1926-1945-plan-handoff')) {
  s = s.replace(
    `  - id: tier1906-1925-plan-handoff
    content: "Tier 1906-1925 — Part CM verified + tier1925_complete (light business completion wave 40 — vendors, disputes, documents, notifications, admin products/bookstore)"
    status: completed`,
    `  - id: tier1906-1925-plan-handoff
    content: "Tier 1906-1925 — Part CM verified + tier1925_complete (light business completion wave 40 — vendors, disputes, documents, notifications, admin products/bookstore)"
    status: completed
  - id: tier1926-1945-plan-handoff
    content: "Tier 1926-1945 — Part CN verified + tier1945_complete (light admin catalog wave 41 — funnel, monitoring, tenants, analytics, vendors, testimonials, integration, cms, access, settings)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1925 complete** — Light business completion (dashboard, vendors, disputes, documents, notifications, admin); sitewide_light_completion_wave40 |',
  '| **Execution status** | **Tier 1945 complete** — Light admin catalog completion (funnel, monitoring, tenants, integration hub); sitewide_light_admin_wave41 |',
);

if (!s.includes('## Tier 1945 —')) {
  s = s.replace(
    '## Tier 1925 — Light business completion wave Part CM (complete)',
    `## Tier 1945 — Light admin catalog wave Part CN (complete)

| Item | Status |
|------|--------|
| **Funnel A/B + monitoring** — experiment panels + paginated event stream | Done |
| **Tenants + analytics** — white-label forms → accent catalog cards | Done |
| **Vendors + testimonials** — list/detail shells → catalog cards + pagination | Done |
| **Integration hub** — inbound map, API keys, deliveries → nested catalog cards | Done |
| **CMS + access + settings home** — module tiles → rotating accent catalog cards | Done |
| **theme:audit** + launch gate wave 41 | Done |

## Tier 1925 — Light business completion wave Part CM (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1945_complete');
