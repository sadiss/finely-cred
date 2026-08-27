# Why credit scores are not showing — follow-up plan

**Status:** Diagnose later (do not implement in the chrome/theme pass)  
**Date:** 2026-08-25  
**Asked by:** owner, while reviewing partner view-as (Yoli)

## Question

Dashboard / partner view is not reading the **actual credit score**. Answer and fix in a dedicated pass — not mixed into overlay/theme work.

## Where scores are read today

[`PartnerDashboardProductSurface.tsx`](../../src/features/workspaceLightPreview/surfaces/PartnerDashboardProductSurface.tsx):

- Loads reports for **the current partner id** (session or view-as override).
- Takes `reports[0]?.parsed?.scores`.
- Maps Equifax / Experian / TransUnion from that parse (`EQF` / `EXP` / `TUC`).
- If that array is empty, bureau tiles show empty / placeholder — not a live bureau pull.

## Likely causes (check in this order)

1. **No parsed report on Yoli’s file** — upload exists but `parsed.scores` was never written, or the newest report is not `reports[0]`.
2. **Wrong partner identity** — view-as override vs session partner vs demo fixture. Header can say Yoli while scores still come from another record.
3. **Demo / empty portfolio** — local admin session had 0 partners earlier; preview shell uses sample data, not Yoli’s parsed HTML/PDF.
4. **Score shape mismatch** — bureau codes on the parse (`Equifax` vs `EQF`) do not match `scoreFor()`.
5. **We never call a live bureau API** — scores only come from **uploaded report parse**, not TransUnion/Equifax/Experian network pulls.

## Acceptance when we pick this up

- Open Yoli (or any partner with a parsed 3-bureau report) → Overview shows **those** three numbers.
- Partner A vs Partner B → different scores.
- No report / unparsed → plain empty state (“Upload a report to read scores”), not a fake 700.

## Do not

- Invent scores.
- Mix this into Roles overlay or Light/Dark toggle work.
