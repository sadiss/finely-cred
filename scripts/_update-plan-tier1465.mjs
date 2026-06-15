import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1445_complete/, 'execution_status: tier1465_complete');

if (!s.includes('tier1446-1465-plan-handoff')) {
  s = s.replace(
    `  - id: tier1426-1445-plan-handoff
    content: "Tier 1426-1445 — Part BO verified + tier1445_complete (site-wide light/dark theme + simplified wayfinding)"
    status: completed`,
    `  - id: tier1426-1445-plan-handoff
    content: "Tier 1426-1445 — Part BO verified + tier1445_complete (site-wide light/dark theme + simplified wayfinding)"
    status: completed
  - id: tier1446-1465-plan-handoff
    content: "Tier 1446-1465 — Part BP verified + tier1465_complete (portal simple nav + app-surface light theme pass)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1445 complete** — Site-wide light/dark theme toggle; simplified nav + wayfinder; sitewide_theme_nav_wave16 |',
  '| **Execution status** | **Tier 1465 complete** — Portal simple nav + app-surface light theme; sitewide_theme_portal_wave17 |',
);

if (!s.includes('## Tier 1465 —')) {
  s = s.replace(
    '## Tier 1445 — Site theme + simplified wayfinding Part BO (complete)',
    `## Tier 1465 — Portal simple nav + app-surface light theme Part BP (complete)

| Item | Status |
|------|--------|
| **PORTAL_NAV_LANES** — 4-lane portal wayfinder (Work / Letters / Connect / Grow) | Done |
| **FinelyPortalSimpleNav** — paginated destination stacks (no long horizontal strip) | Done |
| **finelyPortalNavMode** — Simple vs full nav preference (default simple) | Done |
| **data-fc-app-surface** — portal/admin/business/public theme scoping on PageShell | Done |
| **Light theme pass** — landing bands, tiptap, app surfaces in index.css | Done |
| **audit-site-theme.mjs** wave 17 + launch/CI gates | Done |

## Tier 1445 — Site theme + simplified wayfinding Part BO (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1465_complete');
