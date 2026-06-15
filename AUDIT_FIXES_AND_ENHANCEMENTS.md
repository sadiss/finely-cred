# Finely Cred – Audit: Fixes, Unification & Enhancements

This document lists issues fixed in this pass and remaining items for UI, extraction, and intelligence.

---

## Fixed in this pass

### 1. **“Screen with codes” (error-like experience)**
- **Cause:** When a PDF report was selected (no HTML parsing), the app showed a full-screen `<pre>` of raw extracted text (up to 6000 chars), which looked like a wall of code/errors.
- **Fix:** Introduced `PdfReportFallbackView` component used on both Partner Reports and Admin Partner Detail. It shows a clear “PDF report” message, explains that only HTML is parsed into tradelines, and puts “View extracted text” behind a collapsible button so raw text is opt-in.
- **Files:** `src/components/reports/PdfReportFallbackView.tsx` (new), `PartnerReportsPage.tsx`, `PartnerDetailPage.tsx`.

### 2. **Duplicate `sectionsByKey` in CreditIntelTabs**
- **Cause:** `sectionsByKey` was declared twice (once before `collectionsDisplayTradelines`, once after `scoreRows`), which was redundant and could cause confusion.
- **Fix:** Removed the second declaration so only the one used by `collectionsDisplayTradelines` remains.

### 3. **CreditIntelTabs robustness (malformed `parsed`)**
- **Cause:** If `parsed` was missing or had non-array `tradelines`/`sections`/`scores` (e.g. legacy or corrupted data), the component could throw and show React’s error overlay (“screen with codes”).
- **Fix:** Added a `safeParsed` memo that normalizes `parsed` to always have array `tradelines` (and optional arrays for `sections`/`scores`). All usages in the component now read from `safeParsed` instead of `parsed`.

### 4. **View in Accounts**
- Already fixed earlier: `scrollToCreditorName` is passed to `ParsedReportViewer` on the Accounts tab, and fallback substring matching was added so the correct account expands when coming from Disputes.

---

## UI / UX – Recommended next steps

| Area | Issue | Recommendation |
|------|--------|----------------|
| **Error handling** | No React Error Boundary | Add an Error Boundary around the main app or report viewer so a single component throw shows a friendly “Something went wrong” + retry instead of the dev error overlay. |
| **Diagnostics** | Overview tab has “Troubleshooting: report diagnostics” (collapsible) | Already collapsed by default; keep as-is for support. Ensure no other screens render raw JSON/code as the main content. |
| **Empty states** | Some tabs show minimal copy when there’s no data | Add short, consistent empty-state copy and optional CTAs (e.g. “Upload a report”, “Open Reports tab”) where relevant. |
| **Overflow / layout** | Some tables/cards use `break-words` / `truncate` | Already in place in key components; keep an eye on very long creditor names or account IDs in letter PDF and evidence lists. |
| **Navigation** | Partner Reports has both “Partner Dashboard” and “MasteryOS” back buttons | Confirm with product whether both are needed; consider unifying to a single primary back action. |
| **Consistency** | Tab styling and button patterns vary across Credit Intel, Partner, Admin | Consider a small design token set (e.g. tab button class, card border) for Credit Intel and reuse on Partner/Admin report views. |

---

## Extraction / Credit intelligence – Enhancements

| Area | Current state | Enhancement idea |
|------|----------------|------------------|
| **Payment history** | `looksLikePaymentHistoryTable` + fallback `findFollowingPaymentHistoryTable`; 2-year grid by bureau | Add more provider-specific class/id hints if new exports use different markup; consider storing raw payment grid for re-processing. |
| **Collections section** | Section tables turned into synthetic tradelines; name detection from columns/cells | If providers use different column names, extend the “name-like” column detection (e.g. “creditor”, “agency”, “furnisher”) in both `disputeCandidates.ts` and `collectionsDisplayTradelines`. |
| **Dispute labels** | Name-like column preferred over “account #”; fallback to “Collection N” | Continue to tune `isInvalidAccountLabel` and `tableLooksLikeCollections` as new report formats appear; consider fuzzy match for “View in Accounts” when creditor names differ slightly. |
| **Scores** | Best-effort extraction; dedup by bureau+model; duplicates show “we keep highest” note | If a provider uses a different score table layout, add a provider-specific branch in score extraction. |
| **PDF reports** | Text extraction only; no tradeline parsing | Future: OCR or PDF-structure parsing for image-only or structured PDFs so PDF uploads can get the same intelligence as HTML. |

---

## Duplicates / Unification

| Item | Where | Suggestion |
|------|--------|------------|
| **PDF fallback UI** | Was inline in PartnerReportsPage and PartnerDetailPage | **Done:** Replaced by shared `PdfReportFallbackView` used in both. |
| **Report list + Credit Intel** | PartnerReportsPage (partner) vs PartnerDetailPage (admin) both show report list + parsed view | Logic is similar; consider a shared “Report list + viewer” layout component if more variants appear. |
| **Tab button style** | `tabBtn(active)` in CreditIntelTabs; similar patterns elsewhere | Already consistent within Credit Intel; could be a shared `TabButton` from a UI kit. |
| **Creditor contact derivation** | CreditIntelTabs derives contacts from tradelines when `parsed.creditorContacts` is missing | Kept as fallback; no duplication with parser output. |

---

## Letter / Evidence workflow

| Area | Current state | Enhancement |
|------|----------------|-------------|
| **Letter PDF** | Item title, bureau/code/status, evidence image, reasons | Letter does not yet include full account details or 2-year payment history table in the PDF; add optional “Account details” and “Payment history” blocks per item if tradeline data is passed in. |
| **Evidence attachment** | Screenshots per tradeline or section item; stored in IndexedDB; linked by `creditorName` / caption | Ensure dispute case item stores a stable identifier (e.g. reportId + creditor or section row id) so “attach evidence” always matches the right item. |
| **Round tracking** | Dispute detail shows rounds and due dates | Already in place; consider exposing “next due” on Partner Dashboard for open disputes. |

---

## Bugs to watch (no code change in this pass)

- **Filters in ParsedReportViewer:** When “View in Accounts” opens with a scroll target, if the user has Bureau/Type/Status filters set, the target account might be filtered out; consider clearing filters when scrolling to an account or showing a “No matching account” hint.
- **Compare tab:** Depends on `availableReports` with `parsed`; if a report’s `parsed` is missing after load, the compare dropdown may be empty; `safeParsed` does not apply to `availableReports` items.
- **Strategy tab “What we extracted”:** Shows `parsed.debug` counts; now backed by `safeParsed.debug` so it won’t throw, but if `parsed` was malformed, debug may be missing.

---

## Summary

- **“Screen with codes”** is addressed by: (1) PDF fallback view that hides raw text behind a button, and (2) defensive `safeParsed` in CreditIntelTabs so bad data doesn’t throw.
- **Duplicate `sectionsByKey`** is removed; **View in Accounts** and **Collections** behavior is unchanged and more robust.
- **Audit list** above covers UI consistency, extraction enhancements, letter PDF enhancements, and duplicates/unification for future work.
