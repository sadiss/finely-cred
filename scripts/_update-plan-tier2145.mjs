import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, '.cursor/plans/FINELY-OS-400-MASTER.plan.md');
let s = fs.readFileSync(planPath, 'utf8');

s = s.replace(/execution_status: tier2125_complete/, 'execution_status: tier2145_complete');

if (!s.includes('tier2126-2145-plan-handoff')) {
  s = s.replace(
    `  - id: tier2106-2125-plan-handoff
    content: "Tier 2106-2125 — Part CY verified + tier2125_complete (light residue sweep wave 52 — landing CK harmony, bg-white/07 panels, fc-panel → catalog cards)"
    status: completed`,
    `  - id: tier2106-2125-plan-handoff
    content: "Tier 2106-2125 — Part CY verified + tier2125_complete (light residue sweep wave 52 — landing CK harmony, bg-white/07 panels, fc-panel → catalog cards)"
    status: completed
  - id: tier2126-2145-plan-handoff
    content: "Tier 2126-2145 — Part DA verified + tier2145_complete (Social OS 2.0 wave 53 — SOP expansion, weekly workflow strip, paginated hub, staff portrait validation)"
    status: completed`,
  );
}

s = s.replace(
  '| **Execution status** | **Tier 2125 complete** — Light theme residue sweep (landing, public shell, fc-panel); wave 52 |',
  '| **Execution status** | **Tier 2145 complete** — Social OS 2.0 SOP + autopilot workflow; light theme waves 28–52 closed |',
);

if (!s.includes('## Tier 2145 —')) {
  s = s.replace(
    '## Tier 2125 — Light residue sweep Part CY (complete)',
    `## Tier 2145 — Social OS 2.0 Part DA (complete)

| Item | Status |
|------|--------|
| **SOP library** — 12 templates (business, tradeline, debt, enlightenment, Work OS, CRM nurture) | Done |
| **Weekly workflow strip** — SocialWorkflowWeekStrip on autopilot tab | Done |
| **Paginated SOP UI** — FinelyOsPaginatedStack (no scroll traps) | Done |
| **Staff portraits** — validate-staff-portraits.mjs in ci:check | Done |
| **Launch gate** wave 53 + e2e smoke | Done |

## Tier 2125 — Light residue sweep Part CY (complete)`,
  );
}

fs.writeFileSync(planPath, s);
console.log('Updated plan to tier2145_complete');
