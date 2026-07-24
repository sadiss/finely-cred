# 🚨 URGENT / DO THIS FIRST

**Grant access → Credit Letters / Bureaus entitlements**

| | |
|---|---|
| **Priority** | P0 — partners could not get Letters access on live |
| **Branch** | `preview/sitewide-ux-pack-merge` |
| **Repo** | `e:\Finely-Cred\Tishobe\finely-cred-main` |
| **Owner action** | Send the copy/paste blurb below to the developer |
| **Dev action** | Apply migration → commit/push if needed → verify grant path end-to-end |

---

## Why partners couldn’t get Letters access

Admin “Grant Credit Letters / Bureaus” was saving entitlements **locally only** (browser / local store).

- Admin saw a grant on their machine.
- Partner portal sessions (other device / clean login) **did not** see disputes + letters keys.
- Root cause: no Supabase RLS policy allowing admins to **write** `public.entitlements` from the app. Stripe webhook could upsert via service role; client grants could not persist to the cloud.

**Fix:** sync grants to Supabase + add `entitlements_admin_write` policy.

---

## REQUIRED before live works

Apply this migration on the **linked Supabase project** before expecting grants to stick in production:

```
supabase/migrations/202607240001_entitlements_admin_write.sql
```

What it does:

- Creates policy `entitlements_admin_write` on `public.entitlements`
- `FOR ALL` to `authenticated` where `public.is_admin()`
- Partners still only **read** their own rows (existing select policy)

Example (PowerShell — use `;` not `&&`):

```powershell
cd e:\Finely-Cred\Tishobe\finely-cred-main
supabase db push
# or apply that single SQL file in the Supabase SQL editor
```

If the migration is not applied, the UI may show “granted locally / sync failed” and partners stay locked.

---

## Key files changed (recent work)

| Area | Path |
|------|------|
| Entitlement keys / helpers | `src/billing/entitlements.ts` |
| Cloud sync of admin grants | `src/data/billingSupabaseSync.ts` |
| Admin one-click grant UI (green box) | `src/components/admin/PartnerServicesAccessCard.tsx` |
| Letters studio + journey open | `src/components/letters/LettersCommandCenter.tsx` |
| Dispute picker empty states | `src/components/disputes/DisputePickerModal.tsx` |
| Partner detail (via **patch scripts only**) | `src/pages/admin/PartnerDetailPage.tsx` |
| Patch scripts | `scripts/_patch-partner-detail-grant-async.mjs`, `scripts/_patch-partner-detail-credit-letters-label.mjs` |
| **Migration (must apply)** | `supabase/migrations/202607240001_entitlements_admin_write.sql` |
| Related access UI | `src/components/admin/AdminPartnerAccessPanel.tsx`, `PartnerDetailAdminFooter.tsx` |
| Portal Letters / Debt hubs | `src/pages/portal/PartnerLettersPage.tsx`, `PartnerDebtPage.tsx` |

Also touched for Credit vs Debt letter hubs / FC-Repo separation (see brief below): debt letter catalog views, `LetterTrackTabs`, collateral workstation pieces.

---

## Team rules (do not skip)

1. **Do NOT `StrReplace` `PartnerDetailPage.tsx`** — use patch scripts only (`scripts/_patch-partner-detail-*.mjs`).
2. **PowerShell:** chain with `;` — never `&&`.
3. **No commit/push assumed** — these fixes may still be **uncommitted local**. Run `git status` before deploy.

---

## Credit Letters vs Debt Letters (brief)

| Hub | Route | Purpose |
|-----|-------|---------|
| **Credit Letters** | `/portal/letters` | Bureau disputes, credit-report tracks (incl. credit-side FC/Repo/BK reporting accuracy) |
| **Debt Letters** | Debt portal / debt workstations | Validation, affidavits/court, servicer/institution debt tracks |

Do not mix hubs. Grant **Credit Letters / Bureaus** unlocks disputes + letters for the Credit Letters → Bureaus journey.

---

## Exact verify steps (developer)

1. Confirm branch: `git branch --show-current` → `preview/sitewide-ux-pack-merge`
2. Confirm migration file on disk: `supabase/migrations/202607240001_entitlements_admin_write.sql`
3. **Apply migration** on the target Supabase project (`supabase db push` or SQL editor).
4. Confirm code is on the deploy branch: `git status` — if grant/letters files are still `M` / `??`, **commit + push** (owner must ask for commit, or you commit per team process) before preview/prod deploy.
5. **Admin:** open a partner → Access / Services → tap **Grant Credit Letters / Bureaus access**.
6. Expect **green** “access on” (not “saved locally / sync failed”).
7. **Partner:** hard refresh / new session → open **Credit Letters**.
8. Enter **Bureaus** track → **letter journey** opens (next-steps / journey UI).
9. Create or open a **round** → open **disputes** picker.
10. Confirm empty states are clear if no accounts/docs yet; with data, disputes are selectable and letter flow continues.

Fail = migration missing, deploy missing uncommitted files, or wrong entitlement keys. Re-check admin toast/notice text on grant.

---

## Copy/paste to developer

```
URGENT — DO THIS FIRST (Letters access)

Partners couldn’t get Credit Letters access because admin grants were local-only. Cloud write needs a Supabase RLS policy.

1) Branch: preview/sitewide-ux-pack-merge
2) Read repo-root file: DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md
3) APPLY migration BEFORE live works:
   supabase/migrations/202607240001_entitlements_admin_write.sql
4) Check git status — grant/letters fixes may still be uncommitted; push needed for deploy.
5) Verify: Admin grant → green → partner refresh → Credit Letters → Bureaus → journey open → round → disputes.
6) Do NOT StrReplace PartnerDetailPage.tsx (patch scripts only). PowerShell: use ; not &&.

Reply when migration is applied and the verify path passes on preview.
```

---

## Related P0 — Mail letters + Litigation (same branch)

Owner is mailing partner letters **today** via LetterStream / Finely Mail.

| | |
|---|---|
| **Admin mail path** | `/admin/mail` — pick partner → select letters → Confirm address → Mail → Track |
| **Partner mail path** | `/portal/letters/vault` — select → Mail selected (batch wizard) |
| **Litigation Command** | `/portal/debt?tab=litigation` |
| **Court seed (quiet)** | `/admin/partners/import` only — **no** sticky Roosevelt button on Admin Partners |
| **Full mail/litigation handoff** | [`DEV_URGENT_MAIL_AND_LITIGATION.md`](./DEV_URGENT_MAIL_AND_LITIGATION.md) |
| **Test mode** | UI warns when `MAIL_TEST_MODE` / debug / vendor testmode detectable — turn off before treating USPS as live |

Redeploy `mailer` edge after pull so `op: 'status'` + testmode flags ship.

---

## Pointers

- Also flagged at top of `docs/DEVELOPER_HANDOFF.md`
- Primary can’t-miss files at repo root:
  - **This file** — entitlements / Letters grant migration
  - **`DEV_URGENT_MAIL_AND_LITIGATION.md`** — mailing + litigation + same-branch push
