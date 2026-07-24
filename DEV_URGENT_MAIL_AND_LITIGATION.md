# 🚨 URGENT — Mail letters today + Litigation Command

| | |
|---|---|
| **Priority** | P0 — owner mailing partner letters live via LetterStream (~$92.60 prepaid) |
| **Branch** | `preview/sitewide-ux-pack-merge` (**same branch only — do not create a new branch**) |
| **Repo** | `e:\Finely-Cred\Tishobe\finely-cred-main` |
| **Also read** | `DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md` (entitlements migration) |

---

## A) Admin mailing path (do this today)

1. Confirm feature flag **`letterMailing`** is ON (Admin → Settings).
2. Confirm edge secrets on **`mailer`**: `MAIL_API_ID`, `MAIL_API_KEY` (optional: `MAIL_PROVIDER=letterstream`).
3. **Watch for TEST MODE** — UI banners appear when:
   - `MAIL_TEST_MODE=true` / `LETTERSTREAM_TEST_MODE=true`, or
   - `MAIL_DEBUG` / `LETTERSTREAM_DEBUG` is set, or
   - ping payload mentions test/sandbox.
4. Open **`/admin/mail`** (also: Admin Partners → **Mail letters** button).
5. Flow: **Pick partner → Select PDF-ready letters → Confirm address → Mail → Track**.
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

## B) Litigation Command path

| Who | Where |
|-----|--------|
| Partner | `/portal/debt?tab=litigation` |
| Admin (acting as partner) | Partner → Debt tab, or set admin partner override then `/portal/debt?tab=litigation` |

First-timer steps inside Litigation Command: Upload papers → Parties → **Written answer** → Affidavit / discovery → Hearing kit.

**Debt-buyer intelligence** (Midland/Citi, PRA, Velocity, etc.) is **pattern-based for all similar cases** — not a permanent Roosevelt dashboard button. Court seed / Ensure Roosevelt lives under **`/admin/partners/import`** only.

Stronger response letter bodies: courtroom written answer, validation, debt-buyer affidavits (Letter Studio / Debt catalog).

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

---

## D) Same-branch push note

- Work stays on **`preview/sitewide-ux-pack-merge`**
- `git push origin HEAD` — **never** create a new branch, **never** force-push
- Do **not** `StrReplace` `PartnerDetailPage.tsx` (patch scripts only)
- PowerShell: use `;` not `&&`

---

## Copy/paste blurb for developer

```
URGENT — Mail + Litigation + Letters access (same branch)

Branch: preview/sitewide-ux-pack-merge  (DO NOT create a new branch)

1) Read:
   - DEV_URGENT_MAIL_AND_LITIGATION.md
   - DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md
   - docs/DEVELOPER_HANDOFF.md (§ Physical mail + Litigation)

2) APPLY if not done:
   supabase/migrations/202607240001_entitlements_admin_write.sql

3) Redeploy mailer edge (testmode/status ops):
   npm run deploy:functions

4) Mail today:
   /admin/mail → pick partner → select PDF letters → Confirm address → Mail → Track
   Watch UI for TEST MODE banner (MAIL_TEST_MODE / LetterStream test account).

5) Litigation:
   /portal/debt?tab=litigation — debt-buyer pattern intel for Midland/Citi-style suits (all similar cases).
   Court seed = /admin/partners/import only (no sticky Roosevelt button on Partners list).

6) Rules: no StrReplace on PartnerDetailPage; PowerShell uses ; not &&.

Reply when migration applied, mailer redeployed, and /admin/mail status check passes.
```
