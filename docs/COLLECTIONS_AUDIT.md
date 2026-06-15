# Collections Area – Audit (Extraction → Display → Workflow)

## 1. EXTRACTION (Parser)

### What works
- **Keyword detection**: Collections section is found via `addGenericSectionByKeywords` with keywords: `collections`, `collection accounts`, `collection account`, `collection`.
- **Fallback classification**: Tables can be classified as collections by column/context (e.g. "original creditor", "date assigned", "placed for collection").
- **Score-table guard**: Tables whose first column or first cell looks like "FICO"/"Vantage"/"score" are not classified as collections.
- **Structured items**: When a section has a table, `buildSectionItems()` builds `s.items` with normalized field keys (e.g. `original_creditor`).
- **Creditor contacts**: `buildCreditorContacts()` pulls names from the collections section table for the Creditors tab.

### Issues / Gaps
1. **First match wins**: `addGenericSectionByKeywords` uses the **first** element that matches any keyword, then finds the **first** following table. If the report has multiple "collection" headings (e.g. per bureau), we merge up to 8 tables via `mergeGenericTables`. Order of DOM elements can make the "wrong" table the one we attach to "Collections".
2. **Merged tables**: When multiple tables are merged, column union can reorder or duplicate semantics (e.g. "Creditor" from one table and "Original Creditor" from another both end up; row length can double if same account appears in two tables).
3. **Single-column "Details" fallback**: When no table is found after a collection heading, we capture the next text block and split into rows with a single column "Details". Those rows then show as cards with label "Item N" or the raw line text; no creditor name extraction.
4. **No provider-specific path**: IdentityIQ vs MyScoreIQ use the same generic logic; provider-specific selectors (e.g. known IDs/classes for their Collections block) could improve reliability.
5. **Column normalization**: `normalizeColForItem` strips to `[a-z0-9_]`, so "Original Creditor (Name)" becomes `original_creditor_name`; getItemLabel tries several variants but not every possible export column name (e.g. "Collector", "CA Name").
6. **Empty rows**: Rows where every cell is empty after trim are dropped in `parseGenericTable`; merged tables can still have rows with empty cells in some columns.

---

## 2. DISPUTE CANDIDATES (Derivation)

### What works
- **Tradeline-based**: Derogatory tradelines (collection type, charge-off status, or payment history codes) produce one candidate per bureau with `account = t.creditorName`.
- **Section-based (table)**: When section has `s.table.rows`, we create one candidate per row per bureau; `account` = creditor column or first column, or "Collection N".
- **Invalid labels filtered**: Score-like or generic labels ("FICO 8", "collection account") are filtered out; section tables that don’t look like collections (no creditor-like column, or score-like) are skipped.
- **Deduplication**: Section-based collection candidates are dropped when a tradeline-based candidate exists for the same account+bureau (normalized).

### Issues / Gaps
7. **s.rows (bureau-style)**: When section has `s.rows` (bureau field table) instead of `s.table`, we push one candidate per bureau with `account: s.title` ("Collections"). So all bureaus show the same label "Collections" with no per-account name.
8. **Creditor column choice**: We use first column matching `creditor|agency|furnisher|original|collector|account`. "Account" can match "Account Number" and use a masked number as the display name; name-like columns (e.g. "Creditor Name", "Original Creditor") should be preferred over "Account #".
9. **Dedupe by name only**: Dedupe is by normalized `account|bureau`. Slight name differences (e.g. "ABC Corp" vs "ABC Corporation") keep both; that can be correct or create duplicates depending on the report.
10. **No bureau-specific section data**: Section-based collection candidates are created for all three bureaus per row even when the table has no bureau columns; we don’t know which bureau each row belongs to.

---

## 3. COLLECTIONS TAB – SECTION-BASED DISPLAY

### What works
- When section has `s.items` or `s.table.rows`, we render one card per item/row with per-card Screenshot button.
- Refs are `collections_0`, `collections_1`, … so screenshots map to the correct card.
- Evidence is saved with `sectionKey: 'collections'`, `creditorName: getItemLabel(i)` so Letters can match by creditor name.
- Column labels and values are shown on each card; "Showing first 50" when > 50 items.

### Issues / Gaps
11. **Fallback when no per-card mode**: When `partnerId` is missing or section has no items/table rows, we render the section as a single block with one section-level Screenshot button; no per-item screenshots.
12. **getItemLabel – "account" column**: For structured items we try `prefer('account')`; if the only name-like key is "account" and it’s actually "Account Number", the card title can be a masked number. Prefer name-like keys over "account" when possible.
13. **Table-row label**: For table rows we use `creditorIdx` which can be "Account" (number). Prefer columns that contain "name", "creditor", "agency", "furnisher", "original", "collector" over a column that is only "account" / "account number".
14. **No link to Accounts**: Section-based collection cards don’t have a "View in Accounts" link; if the same account exists as a tradeline, user must switch tabs manually.
15. **Truncation**: Card title (getItemLabel) is in a truncate class but no tooltip with full name when truncated.

---

## 4. COLLECTIONS TAB – “COLLECTION ACCOUNTS FROM ACCOUNT HISTORY”

### What works
- `collectionTradelines` filters tradelines by `accountType` (contains "collection"), `accountStatus` (contains "charge"), or payment history derog codes.
- Same list as derogatory accounts in Accounts tab; each card shows creditor name, type/status, balance, and Screenshot button.
- Evidence saved with `sectionKey: 'collections_tradeline'`, `creditorName: t.creditorName`; Letters flow matches via `collections_tradeline` accepted for collection candidates.
- Refs `collections_tradeline_0`, … avoid collision with section refs.

### Issues / Gaps
16. **Possible duplicate display**: If the report has both (a) a Collections section with rows and (b) tradelines that are collection-type, the same account can appear twice (once in section block, once in "Collection accounts from Account History"). No dedupe or "also in Accounts" note on section cards.
17. **Limited fields on card**: Only creditor name, type/status, balance. Missing: date opened, date of first delinquency, account number (masked), original creditor—useful for disputes and for matching to the Accounts tab.
18. **No payment history on card**: Accounts tab shows 2-year payment history per tradeline; Collections tab tradeline cards don’t show it, so user may need to open Accounts for full context.
19. **No "View in Accounts"**: No direct link from a collection tradeline card to the same account in the Accounts tab (e.g. scroll to or open that account).
20. **partnerId required for Screenshot**: When viewing in a context without `partnerId` (e.g. read-only report view), Screenshot buttons are hidden; behavior is correct but could be clearer (e.g. "Sign in to save evidence").

---

## 5. EVIDENCE & LETTER MATCHING

### What works
- Section item screenshots: `sectionKey` + `creditorName`; per-card screenshots from section use getItemLabel.
- Tradeline-from-Collections screenshots: `sectionKey: 'collections_tradeline'`, `creditorName: t.creditorName`.
- PartnerDetailPage (Letters): For collection candidates, evidence is matched by `sectionKey === 'collections'` or `'collections_tradeline'`, then by `creditorName === c.account`; best match is preferred and used for PDF.

### Issues / Gaps
21. **Caption vs creditorName**: Legacy evidence may have only caption (e.g. "Section screenshot: Collections"); matching falls back to caption. New evidence has both; old evidence might not match a specific item when multiple collections exist.
22. **One evidence per item**: Dispute case items have a single `evidenceId`; the spec mentioned "linkedEvidence per auditItem (array)". Multiple screenshots per dispute item are not yet supported in the letter flow.

---

## 6. EMPTY STATES & MESSAGING

### What works
- When no section and no collectionTradelines: message explains to upload a full report and that collection accounts from Account History will appear when detected.
- Disputes tab empty state explains that negatives come from Account History and to use Accounts/Collections for screenshots.

### Issues / Gaps
23. **No guidance when section exists but empty rows**: If the Collections section exists but has 0 rows (e.g. "No collection accounts"), we might still show the section block with no cards; message could say "No collection accounts in this report" instead of an empty grid.
24. **Success notice**: After screenshot we show "Saved screenshot for evidence vault. Attach it to the matching dispute item." We don’t link to Disputes or Letters; user has to know where to attach.

---

## 7. WORKFLOW & UX

### What works
- Flow: Reports → open report → Collections tab → see section and/or Account History collection cards → Screenshot per card → Letters/Disputes → select items, evidence auto-matched → generate PDF.
- Strategy tab links to Collections; Disputes tab shows candidates with account names (after fixes for score-like labels).

### Issues / Gaps
25. **Order of blocks**: Section-based block is first, then "Collection accounts from Account History". If both exist, users might be confused which list is "authoritative"; a short heading like "From report’s Collections section" vs "From Account History (same as Accounts tab)" helps.
26. **Consistent card design**: Section-based cards show all fields; tradeline cards show only type/status/balance. Aligning card layout (e.g. always show type, status, balance, dates when available) would make scanning easier.
27. **Accessibility**: Screenshot buttons have title/tooltip; card titles truncate without full-name exposure for screen readers or hover.
28. **Mobile**: Grid is 2 columns on md; on small screens a single column might be better for long creditor names and the Screenshot button.

---

## 8. RECOMMENDED FIXES (Priority)

### High impact
- **#8/#12/#13**: Prefer name-like columns over "account" / "account number" when deriving getItemLabel and dispute candidate `account` (parser + disputeCandidates + getItemLabel).
- **#17**: On collection tradeline cards, show optional fields: date opened, dofd, account number masked, original creditor when available.
- **#16**: When both section and collectionTradelines exist, optionally dedupe by normalized creditor name or show a note "Also listed in Account History below" on section cards that match a tradeline.

### Medium impact
- **#25**: Add subheadings to distinguish "From report’s Collections section" vs "From Account History (same as Accounts tab)".
- **#23**: Handle empty section (0 rows) with explicit "No collection accounts" message.
- **#18**: Add a "Payment history" summary or link on collection tradeline cards (e.g. "View in Accounts" that switches to Accounts tab and could scroll to that tradeline if we add an id).

### Lower impact
- **#14/#19**: Add "View in Accounts" on cards when the account exists in tradelines (match by creditorName).
- **#24**: After screenshot success, add a short link or button "Go to Disputes" / "Go to Letters".
- **#4**: Provider-specific extraction for IdentityIQ/MyScoreIQ Collections block when we have sample HTML.

---

## 9. CHECKLIST FOR YOU TO VERIFY

- [ ] Upload a report that has a dedicated "Collections" section: do section-based cards appear with correct creditor names?
- [ ] Upload a report that has only collection-type tradelines (no Collections section): do "Collection accounts from Account History" cards appear and match Accounts tab?
- [ ] Take a screenshot from a section-based collection card: in Letters, is that evidence auto-selected for the matching dispute item?
- [ ] Take a screenshot from a "Collection accounts from Account History" card: same check.
- [ ] Disputes tab: do you see only real account names (no "FICO score 8" or "Collection account")?
- [ ] When a collection appears in both section and as tradeline: do you see it once or twice in Collections tab? Is that acceptable?
- [ ] Payment history: for a collection tradeline, does the Accounts tab show payment history for that account? Does the Collections tab need it on the card?
