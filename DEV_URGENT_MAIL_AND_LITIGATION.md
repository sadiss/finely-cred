# LITIGATION EASY PATH (read this first)

**Branch:** `preview/sitewide-ux-pack-merge` · **same branch only** · never create a new branch · never force-push

## Partner — 60-second Litigation click path

1. Open **`/portal/debt?tab=litigation`**
2. **Step 1 — Drop papers** into the unified drag-drop + chat scraper (summons / docket / affidavit / HTML / image)
3. High-confidence scrapes **auto-Apply** empty fields (case #, court, plaintiff, firm, **firm mailing address**, attorney, amount, hearing, account, original creditor). Credit reports enrich Midland/Citi-style tradelines.
4. **Continue → Step 2** — confirm plaintiff + counsel mailing (never leave an accessible address blank)
5. **Continue → Step 3** — one-tap **Build written answer** + **Build affidavit**
6. Optional proof → **Hearing kit** → Letters Vault to mail

Sticky top HUD = hearing countdown + “Next”. Sticky bottom = **Continue** (always visible).  
Plain English “what to do now” shows for **every** case type (Midland/Citi, PRA, Velocity, bank, unknown).

**Debt-buyer intelligence is pattern-based for all similar cases** — not a permanent Roosevelt dashboard button. Court seed / Ensure Roosevelt lives under **`/admin/partners/import`** only.

Educational · not legal advice · results vary.

---

# 🚨 URGENT — Mail letters today + Litigation Command

| | |
|---|---|
| **Priority** | P0 — owner mailing partner letters live via LetterStream (~$92.60 prepaid) |
| **Branch** | `preview/sitewide-ux-pack-merge` (**same branch only — do not create a new branch**) |
| **Repo** | `e:\Finely-Cred\Tishobe\finely-cred-main` |
| **Also read** | `DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md` (entitlements migration) |

---

## A) Admin mailing path (do this today) — Pick → Confirm → Mail → Email notify

1. Confirm feature flag **`letterMailing`** is ON (Admin → Settings).
2. Confirm edge secrets on **`mailer`**: `MAIL_API_ID`, `MAIL_API_KEY` (optional: `MAIL_PROVIDER=letterstream`).
3. **Watch for TEST MODE** — UI banners appear when:
   - `MAIL_TEST_MODE=true` / `LETTERSTREAM_TEST_MODE=true`, or
   - `MAIL_DEBUG` / `LETTERSTREAM_DEBUG` is set, or
   - ping payload mentions test/sandbox.
4. Open **`/admin/mail`** (also: Admin Partners → **Mail letters** button).
5. Flow: **Pick partner → Confirm PDF-ready letters (checkboxes) → Confirm address → Mail → Email notify**.
6. Partner path: **`/portal/letters/vault`** — select checkboxes → **Mail selected** (same wizard).
7. Single letter: vault / partner Letters tab → **Mail letter** modal (Confirm → Mail → Track).

### Deploy note

After pull, redeploy the **`mailer`** edge function so `op: 'status'`, testmode flags, and gated `debug` ship:

```powershell
cd e:\Finely-Cred\Tishobe\finely-cred-main
npm run deploy:functions
```

If LetterStream account is still in vendor **TEST mode**, turn it off in the LetterStream dashboard before treating USPS as live — the app cannot force production if the vendor account is in test.

---

## B) Litigation Command path (detail)

| Who | Where |
|-----|--------|
| Partner | `/portal/debt?tab=litigation` |
| Admin (acting as partner) | Partner → Debt tab, or set admin partner override then `/portal/debt?tab=litigation` |

**Unified scrape intake:** drop PDF / image / HTML → OCR when needed → chat explains every field → **Apply / auto-Apply** fills only empty fields. Directory fallback fills known firm / buyer mailing addresses when the paper block is sparse. Matching credit-report tradelines enrich account / original creditor when plaintiff looks Midland/Citi-style.

Stronger response letter bodies: courtroom written answer, post-suit validation, debt-buyer affidavits (Letter Studio / Debt catalog).

**Intelligent letter suggestions (Litigation Command Step 3 + Validation):** amber/fuchsia **glowy** primary CTA **Build this letter next** (title + WHY + Opens letter preview) — click scroll-highlights the card and opens the same DebtLetterPreview paper preview (heroLayout) as other build flows. Driven by case type, debt-buyer pattern, hearing proximity, missing fields, scenario pack, and existing catalog IDs (no catalog duplication). Address IQ fills empty TO from scrape + known firm/collector/attorney directory + tradelines; partner address never used as TO; Sender→Date→Recipient once each.

**Letter address layout (critical):** Sender (partner) once → Date → Recipient (firm / collector / creditor mailing) once → Re → body. Never repeat partner address as TO. Never invent `@finelycred*` / `@finely.local` partner emails. No email/SSN/DOB and no “not legal advice / results vary” footers inside mailed letter bodies (UI chrome only).

---

## B2) Mail success email notification

On LetterStream / Finely Mail **success**:
- Premium HTML email to the partner (`notifyLetterMailed` → `send-email` edge; needs `commsDelivery` flag).
- Admin copy when admin mails on behalf of a partner.
- Persists letter `status: mailed` + `mailing.providerId` / timestamps / to+from on the letter record; audit `letter.mailed` + `letter.mailed_email_sent`.
- Subject/body plain English; recipient street redacted in email (city/state shown); “What happens next” strip included.

---

## C) Migration still needed (Letters access)

If not already applied on the linked Supabase project:

```
supabase/migrations/202607240001_entitlements_admin_write.sql
```

Without it, Admin “Grant Credit Letters / Bureaus” may stay local-only and partners stay locked out of letters.

```powershell
supabase db push
# or paste the SQL in Supabase SQL editor
```

Access grant stays simple (Grant Credit Letters / Bureaus on partner services card). **No forever Roosevelt top button** on partner dashboards — Roosevelt court seed is import-only.

---

## D) Same-branch push note

- Work stays on **`preview/sitewide-ux-pack-merge`**
- `git push origin HEAD` — **never** create a new branch, **never** force-push
- Do **not** `StrReplace` `PartnerDetailPage.tsx` (patch scripts only)
- PowerShell: use `;` not `&&`

---

## Copy/paste blurb for developer

```
URGENT — Litigation Easy Path + Mail + Letters access (same branch)

Branch: preview/sitewide-ux-pack-merge  (DO NOT create a new branch)

1) Read FIRST:
   - DEV_URGENT_MAIL_AND_LITIGATION.md  ← "LITIGATION EASY PATH" at top
   - DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md
   - docs/DEVELOPER_HANDOFF.md (§ Physical mail + Litigation)

2) APPLY if not done:
   supabase/migrations/202607240001_entitlements_admin_write.sql

3) Redeploy mailer edge (testmode/status ops):
   npm run deploy:functions

4) Mail today (Pick → Confirm → Mail → Email notify):
   /admin/mail → pick partner → check PDF letters → Confirm address & Mail
   Watch UI for TEST MODE banner (MAIL_TEST_MODE / LetterStream test account).
   After success: partner gets Finely Mail confirmation email (commsDelivery on).

5) Litigation Easy Path:
   /portal/debt?tab=litigation
   Drop papers (unified scrape) → auto-Apply empty fields → Confirm parties
   → Build written answer + affidavit → Hearing kit → Vault to mail
   Plain English “what to do now” for Midland/Citi and all case types.
   Firm mailing address fills from scrape + known directory — never leave blank if known.

6) Rules: no StrReplace on PartnerDetailPage (use scripts/_patch-partner-detail-*.mjs); PowerShell uses ; not &&.
   No forever Roosevelt button on partner UI — Ensure Roosevelt only under /admin/partners/import.

Reply when migration applied, mailer redeployed, and /admin/mail status check passes.
```
