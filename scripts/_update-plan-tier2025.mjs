import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2005_complete/, 'execution_status: tier2025_complete');

if (!s.includes('tier2006-2025-plan-handoff')) {
  s = s.replace(
    `  - id: tier1986-2005-plan-handoff
    content: "Tier 1986-2005 — Part CR+CS verified + tier2005_complete (light portal lanes wave 45 + public/account wave 46 — debt/disputes/letters + pricing/agents/account/seller)"
    status: completed`,
    `  - id: tier1986-2005-plan-handoff
    content: "Tier 1986-2005 — Part CR+CS verified + tier2005_complete (light portal lanes wave 45 + public/account wave 46 — debt/disputes/letters + pricing/agents/account/seller)"
    status: completed
  - id: tier2006-2025-plan-handoff
    content: "Tier 2006-2025 — Part CT verified + tier2025_complete (light component layer wave 47 — token unification + FinelyOsGlassPanel + 49 component panels + padding cleanup)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2005 complete** — Light portal lanes + public/account sitewide (debt, letters, pricing, seller); waves 45–46 |',
  '| **Execution status** | **Tier 2025 complete** — Light component layer sitewide (token unification, glass panels, hub layouts); wave 47 |',
);

if (!s.includes('## Tier 2025 —')) {
  s = s.replace(
    '## Tier 2005 — Light portal lanes + public account Part CR/CS (complete)',
    `## Tier 2025 — Light component layer Part CT (complete)

| Item | Status |
|------|--------|
| **Token layer** — FINELY_OS_GLASS_* / ENTITY_PANEL → fc-accent-card core | Done |
| **FinelyOsGlassPanel** — finelyOsCatalogCard + data-fc-accent | Done |
| **FinelyUnifiedHubLayout** — hero + content catalog cards | Done |
| **49 components/features** — bulk catalog conversion + 42-file padding cleanup | Done |
| **theme:audit** + launch gate wave 47 | Done |

## Tier 2005 — Light portal lanes + public account Part CR/CS (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2025_complete');
