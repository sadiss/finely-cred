import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier1405_complete/, 'execution_status: tier1425_complete');

if (!s.includes('tier1406-1425-plan-handoff')) {
  s = s.replace(
    `  - id: tier1386-1405-plan-handoff
    content: "Tier 1386-1405 — Part BM verified + tier1405_complete (public hub wave 14 + role hubs + public catalog extension)"
    status: completed`,
    `  - id: tier1386-1405-plan-handoff
    content: "Tier 1386-1405 — Part BM verified + tier1405_complete (public hub wave 14 + role hubs + public catalog extension)"
    status: completed
  - id: tier1406-1425-plan-handoff
    content: "Tier 1406-1425 — Part BN verified + tier1425_complete (public hub wave 15 + business detail hubs + portal catalog)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 1405 complete** — Public hub wave 14 + role hubs; catalog UX extension; role:hub:audit |',
  '| **Execution status** | **Tier 1425 complete** — Public hub wave 15 + business detail hubs; portal catalog lanes; sitewide_hub_wave15 |',
);

if (!s.includes('## Tier 1425 —')) {
  s = s.replace(
    '## Tier 1405 — Public hub wave 14 + role hubs Part BM (complete)',
    `## Tier 1425 — Public hub wave 15 + portal catalog Part BN (complete)

| Item | Status |
|------|--------|
| **FaqPage** + **CheckoutPage** + **BookstoreProductPage** — unified hub + paginated stacks | Done |
| **AgencySignupPage** + legal pages — FinelyUnifiedHubLayout | Done |
| **LeadMagnetFunnelShell** — hub shell + paginated feature/value stacks | Done |
| **BusinessProfilePage** + **BusinessBillionPathPage** + **BusinessDisputeDetailPage** — required business hubs | Done |
| **PartnerBillingPage** + **PartnerLibraryPage** + **PartnerMyTasksPage** + **PartnerChecklistPage** — portal catalog | Done |
| **audit-public-marketing-hub.mjs** wave 15 + **audit-business-hub.mjs** detail promotion | Done |
| **audit-no-long-list-ui.mjs** portal catalog extension + launch/CI gates | Done |

## Tier 1405 — Public hub wave 14 + role hubs Part BM (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier1425_complete');
