---
name: Post-master stabilization
overview: "Continue from the now-completed integrated master plan by focusing on the remaining user-reported issues: the crash/reopen loop, the letter-preview background bleed-through, and the missing auto-population for court letters from credit report public-record/court data. Also ensure the site is viewable (local/LAN and optionally deployable)."
todos:
  - id: view-site-local-lan
    content: Make site viewable locally/LAN with simple run instructions
    status: pending
  - id: fix-crash-loop
    content: Reproduce crash/reopen loop and fix root cause (error boundary + offending component)
    status: pending
  - id: fix-letter-preview-bleed
    content: Remove playbook/background text bleed-through in all paper preview variants
    status: pending
  - id: court-autofill-from-report
    content: Extract court/public-record info from parsed report and use it to prefill court letters
    status: pending
  - id: templates-cross-type-polish
    content: Finalize template picker UX so saved templates are usable across all letter types
    status: pending
isProject: false
---

## Current state (what’s already done)

- The integrated master plan at `.cursor/plans/integrated_pending_master_plan_2026-02-10.plan.md` shows all items marked `completed`.
- Recent request items that are already implemented in code:
- Debt Validation letters now auto-populate partner identity + creditor/collector (and best-effort creditor address).
- Saved templates are no longer restricted by category inside `LettersCommandCenter`.
- Admin Partner Detail now supports editing partner identity fields and a guarded delete flow.

## What’s still not fully done (based on your latest messages)

- **Crash + reopen loop**: we need to reproduce and capture the error cause (likely an unhandled runtime exception) and harden the error boundary / offending component.
- **Letter preview “Playbook / background text” bleed-through**: you’re still seeing content behind the paper preview; we need to audit every preview modal/wrapper and ensure the preview surface is fully opaque and isolated.
- **Court letter auto-population from credit report**: court recipient/case fields are not being sourced from parsed report “public record” data; currently court metadata comes from manually-entered debt/summons cases.

## Implementation plan

- **Make the site viewable immediately (local/LAN)**
- Document a reliable local run command (Vite + `--host`) and where to open it.
- Add a short “If it crashes” section: where to look (browser console) and what to send back.
- **Fix the crash/reopen loop**
- Identify the route/screen where the crash occurs.
- Instrument/confirm `AppErrorBoundary` behavior and ensure errors don’t trigger repeated reload loops.
- Patch the offending component/state logic once the stack trace points to it.
- **Eliminate letter-preview bleed-through everywhere**
- Audit all preview surfaces used by:
  - Dispute paper preview
  - Template preview
  - Validation/DV draft preview
  - Court draft preview
- Make every preview wrapper fully opaque and ensure no underlying panel can show through (remove transparency + remove backdrop blur on containers that sit above live UI).
- Add a small visual regression checklist to confirm this is gone.
- **Auto-populate Court letters from credit report “court/public record” info**
- Extend the parsed report model to include court/public-record contact info (court name/address and docket/case number when present).
  - Likely add a new optional array on `ParsedCreditReport` in `src/domain/creditReports.ts`.
- Update parsers (HTML/Text/PDF best-effort) to extract court fields when they appear as a table/rows under `public_records`.
  - Primary target: `src/creditReports/parseHtmlReport.ts` (most structured source).
- Update letter drafting UI:
  - In `src/components/letters/LettersCommandCenter.tsx` Court tab: add a selector for “Court from report” and map into recipient block + case number for court letters.
  - In `src/pages/portal/PartnerDebtDetailPage.tsx` for summons cases: show detected court info and allow “Use detected court info”.
- **Template visibility across letter types (finish polish)**
- Ensure the same template picker experience exists for Dispute, Validation/DV, and Court flows (no category-lock surprises).
- Optionally add “Recent templates” quick-pick (top 5) to reduce clicks.

## Files most likely involved

- `src/components/letters/LettersCommandCenter.tsx`
- `src/pages/portal/PartnerDebtDetailPage.tsx`
- `src/domain/creditReports.ts`
- `src/creditReports/parseHtmlReport.ts` (and possibly `parseTextReport.ts`, `parsePdfReport.ts`)
- `src/components/ui/AppErrorBoundary.tsx` (or whichever boundary is used)

## How you’ll verify

- Open the letter paper preview on a dispute and confirm **no** playbook/snippet text is visible behind it.
- Draft a DV letter and confirm partner address + creditor/collector are populated.
- Draft a court letter and confirm detected court/case fields can be inserted when present.
- Run through the prior crash path and confirm it no longer crashes or loops.