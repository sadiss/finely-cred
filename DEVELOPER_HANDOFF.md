# Developer Handoff — Finely Cred

**For:** the developer with GitHub + Supabase access.
**From:** the owner (building/testing locally; not a developer).

This documents (1) code changes already made in the local copy, and (2) the
backend steps that must happen on **live** Supabase. The owner cannot run live
SQL / deploys — that's your part. Everything is idempotent and safe to re-run.

---

## TL;DR checklist (do these on LIVE)

1. **Run the DB setup:** paste `supabase/LIVE_SETUP_run_all.sql` into the live
   Supabase **SQL Editor** and run it (or `supabase db push`). Regenerate after
   new migrations with `npm run live-setup:rebuild` — currently **18** migrations
   (core through `work_tasks` + `server_automation_queue`).
2. **Add admin emails:** make sure every staff member who creates partners /
   generates letters is in `public.admin_emails` (3 are seeded; add the rest).
3. **Confirm the storage bucket name:** the app uploads to the bucket from
   `VITE_SUPABASE_PRIVATE_BUCKET` (default `pii`). If that env var is set to
   something else on live, change the bucket id in the storage migration to match.
4. **Launch smoke (repo):** from `Tishobe/finely-cred-main`, run
   `npm run launch:complete` (Parts A–E code + 23-path Playwright QA). After
   Supabase keys are in `.env.local`, run `npm run launch:go-live` (preflight +
   deploy checklist). Full gate: `npm run predeploy:check`.
5. **Deploy edge functions:** `npm run deploy:functions` (requires
   `supabase link`). Set secrets per `.env.example` comments and
   `docs/NORA_CAPITAL_API.md` (`SUPABASE_SERVICE_ROLE_KEY`, `META_APP_SECRET`,
   `NORA_*`, Stripe, SendGrid/Twilio for invite delivery). For premium guide
   audio, set `CARTESIA_API_KEY` (recommended) or `ELEVENLABS_API_KEY` / `OPENAI_API_KEY`,
   `APP_BASE_URL`, and schedule `platform-cron` — see `docs/PLATFORM_CRON.md`
   and `docs/PRODUCTION_DEPLOY.md`.
6. **Merge these code changes** into the GitHub repo (list below) and **redeploy**
   the frontend with `VITE_*` env vars at build time.
7. **Legacy partners:** Admin → Import Partners → load bundled export or SQL audit
   → import with Phase 2 artifacts → backfill if needed → send claim links
   (auto-send when **Invite Delivery** is on).
8. (Recommended) If letter/evidence writes still fail after claim, verify
   `claimed_user_id` on the partner row matches `auth.uid()` and that storage
   bucket + RLS migrations from `LIVE_SETUP_run_all.sql` are applied.

---

## The problems and root causes

### A) Partners could be created on live but not locally
- Partner creation on live goes through the **service-role edge function**
  (`admin-list-partners`), which bypasses RLS — so it worked.
- The local copy has no Supabase keys, and `partnersRepo.ts` was **Supabase-only**
  (every function returned early when not configured, with no local persistence).
- **Fix applied:** added a localStorage fallback for local dev (see below). The
  live/Supabase path is unchanged.

### B) Letters (and screenshots / letter PDFs) save locally but not on live
Three layers behave differently per environment:

| Layer | Local | Live |
|---|---|---|
| Binary files (screenshots, letter PDFs) | IndexedDB | Supabase **Storage bucket** |
| Record (letters / evidence rows) | localStorage | Postgres table behind **RLS** |
| Display | read from IndexedDB | **signed URL** from the bucket |

Root causes on live:
1. **No storage bucket/policies existed in code at all** → uploads and signed-URL
   reads fail → screenshots + letter PDFs don't appear. (New migration fixes this.)
2. **RLS** on `letters` / `evidence` uses `public.is_partner_owner(partner_id)`
   = `claimed_user_id = auth.uid()` **OR** `is_admin()`. The sync helper
   `syncClaimedPartnerRecord` in `src/data/partnersSupabaseSync.ts` (calls
   `upsertPartnerToSupabase`) now runs after self-signup, email-match claim, and
   `/claim` token flows so `claimed_user_id` is set for letter/evidence RLS.
   Admin-created partners still use the `claim-profile` edge function when the
   row was unowned.
3. The sync-down (`pullWorkflowSnapshotFromSupabase`) used a **destructive replace**
   that erased locally-saved letters/evidence when the server returned empty
   (which it did, because of #2). Now hardened to a non-destructive merge.

### C) Dispute reasons were generic instead of specific
The owner reported the dispute-reason suggestions were generic, not data-specific
(e.g. "balance exceeds limit", "DOFD before date opened"). Root causes:
1. `suggestDisputeReasons` (`src/creditReports/disputeReasons.ts`) only generated
   **cross-bureau** mismatches — it had **no single-account (Metro 2) contradiction
   checks**, so single-bureau reports (or any clean cross-bureau data) produced only
   the generic baseline.
2. **Field-label mismatch:** the cross-bureau loop searched for labels
   (`Date Reported`, `High Credit`, `Date of First Delinquency`) that the parser
   never emits — it produces `Last Reported`, `Credit Limit`, `High Balance`, etc.
   (see `canonicalTradelineLabel` in `parseTextReport.ts`). So those checks silently
   never matched.
3. It ignored the **typed fields** the HTML parser already extracts
   (`balance`, `creditLimit`, `highBalance`, `pastDue`, `dofd`, `dateOpened`,
   `dateClosed`, `accountStatus`) — the reliable source for contradiction logic.
- **Fix applied:** added a per-account contradiction detector + fixed the labels
  (see code changes below). Remaining parser work is noted near the bottom.

### D) "TUC" leaking into the UI
`TUC` is the **internal bureau code** for TransUnion (the `Bureau` type and all
`byBureau.TUC` keys) and must NOT be renamed — the parser and stored data depend on
it. The correct way to show it is the helper in `src/utils/bureaus.ts`
(`bureauShortCode` → "Trans", `bureauFullName` → "TransUnion"). Many screens were
rendering the raw bureau **variable** (`{c.bureau}`, letter titles/filenames,
notifications, PDFs), which printed "TUC". All of those now route through the helper
(fixed below).

---

## Code changes already made (in this local copy)

> These are in the owner's local folder. Merge them into the GitHub repo.

- **`src/data/partnersRepo.ts`** — Added a localStorage fallback store
  (`finely.partners.v1`) used **only** when `!isSupabaseConfigured`. Updated:
  `listPartners`, `listPartnersByTenant`, `listPartnersByAgent`, `getPartner`,
  `getPartnerInTenant`, `upsertPartner`, `adminUpsertPartner`, `findPartnerByEmail`,
  `findPartnerByClaimedUserId`, `findPartnerByImportExternalId`, `deletePartner`.
  The Supabase branches are untouched (zero live behavior change).

- **`src/data/lettersRepo.ts`** — `upsertLetter` now `await`s the Supabase upsert
  and logs the error (was a silent `void`). Added `mergeLettersSnapshotForPartner`
  (non-destructive sync).

- **`src/data/evidenceRepo.ts`** — Same treatment: `upsertEvidence` surfaces upsert
  errors; added `mergeEvidenceSnapshotForPartner`.

- **`src/data/workflowSupabaseSync.ts`** — Now calls the `merge*` snapshot helpers
  for letters + evidence instead of the destructive `replace*` ones, so a blocked/
  failed server write can't erase data the user just created.

- **`src/creditReports/disputeReasons.ts`** — Added `deriveTradelineContradictions()`,
  a per-account (Metro 2) contradiction detector wired into `suggestDisputeReasons`.
  It uses the typed parsed fields (with row-label fallback) to flag: balance > limit /
  high credit; closed/paid account still showing a balance; past-due on a current/paid
  account; DOFD before Date Opened or after close; Last Reported before Date Opened;
  Last Activity after Last Reported; revolving account missing limit. Also fixed the
  cross-bureau `keyFields` to match the parser's actual labels (`Last Reported`,
  `High Balance`, etc.) so those checks fire. (Purely front-end; ships on redeploy.)

- **Dispute reasons + AI draft enhancements** —
  `creditReports/disputeReasons.ts`: greatly expanded the advanced, type-specific
  reason library (collections, charge-offs, lates, repo, foreclosure, public
  record/bankruptcy, inquiries, personal info) so every account gets 5+ specific,
  numbered options; data-specific contradictions are now ordered first.
  `components/letters/LettersCommandCenter.tsx`: reasons are numbered in the picker,
  the cap was raised (8 → 16), "Fill top 3" → "Fill top 5", the Reasons box + the
  per-item "Reasons" badge **flash red** once a screenshot is attached but no reason
  is selected, and the AI dispute-draft prompt now feeds the model each account's
  parsed FACTS + auto-detected contradictions + whether an exhibit is attached, with
  a much stronger system prompt (account-tailored, specific, 3-7 sentence narratives).
  (AI uses the existing `ai-gateway` edge function + its provider key on live.)

- **Credit report upload + analysis report are now FREE** (`data/billingRepo.ts`) —
  `hasEntitlement` now treats `portal.reports` and `portal.documents` as always-free
  promo modules (a `FREE_ENTITLEMENT_KEYS` set), so the partner Reports page
  (`/portal/reports`) and the Credit Analysis Report generator are accessible to
  everyone with no plan/trial. "Premium deliverable" labels were changed to
  "Free deliverable" in `pages/portal/PartnerReportsPage.tsx` and
  `pages/admin/PartnerDetailPage.tsx`. (To re-gate later, remove keys from that set.)
  A dedicated **Analysis Report tab** was added to the admin partner profile
  (`PartnerDetailPage`) — report selector + one-click "Generate Free Analysis Report"
  + saved-PDF list — so it's no longer buried in the Reports tab. The generate logic
  is shared via `runGenerateAnalysis()`.

- **Onboarding/signup redesign** (`components/portal/index.tsx`) — replaced the long
  fixed 12-step wizard with a **role-first, lean, dynamic pipeline**:
  - New **Role** step (Client / AU Seller / Agent / Affiliate) defines the primary role.
  - New **Focus** step (Clients only, multi-select with a "primary" that drives
    `goal`/`lane`/`primaryRoute`): Personal Restore, Personal Building, Business Credit,
    Debt & Legal, Tradelines, Funding/Wealth. AU Sellers/Agents/Affiliates skip Focus
    and go straight to details → their portal.
  - **Removed** the "connect credit monitoring" step and the "estimate your score"
    slider (score now comes from the parsed credit report), plus filler steps
    (FinancialVelocity, StrategicUrgency, StatutoryScan) — those components still exist
    but are no longer in the pipeline (safe to delete later).
  - Pipeline is computed dynamically from role/focus (`stepKeys`), so steps skip
    correctly per role. `role` + `focuses` are saved in signup metadata.
  - **Entitlements:** the chosen primary focus sets `lane`, which drives
    `ensurePartnerTrialEntitlements` in `getOrCreatePartnerForSession` (existing) — so
    signup auto-unlocks the trial tools for that focus; additional focuses are added/paid
    later in the dashboard; admins can grant/bypass entitlements in the admin panel.
    (Tune which focuses are free vs paid in `src/billing/entitlements.ts`.)

- **Letters studio UX** (`components/letters/LettersCommandCenter.tsx`) — the inline
  paper preview is now **collapsible** (default hidden, with "Show preview" + "Full
  preview" buttons) so it no longer buries the focused-item editor; the AI draft
  buttons are recolored to a distinct violet gradient and an AI draft button was
  added inside the focused item's Narrative section.

- **Admin partner creation → partner "create profile" flow**
  (`pages/admin/PartnersListPage.tsx` + existing `data/invitesRepo.ts` +
  `pages/ClaimPartnerProfilePage.tsx`) — creating a partner now generates a
  tokenized **claim link** (`/claim?token=…`) and shows it to the admin to copy.
  The partner opens it, signs up (sets a password via the normal onboarding portal),
  and claims the record (sets `claimed_user_id`). This converges with self-signup:
  if the partner signs up with the same email, `findPartnerByEmail` links them too.
  REMAINING (dev/live): auto-send the invite via the `send-invite-email` /
  `send-invite-sms` edge functions (currently the admin copies the link manually);
  and on live, claiming requires the partner RLS insert/update to allow
  `claimed_user_id = auth.uid()` (already in the migrations).

- **Bureau labels (TUC → "Trans" / "TransUnion") across the UI** — replaced raw
  `{...bureau}` rendering with `bureauShortCode` / `bureauFullName` in:
  `components/dashboard/index.tsx`, `components/creditIntel/CreditIntelTabs.tsx`,
  `components/letters/LettersCommandCenter.tsx` (incl. the saved letter **title** and
  **PDF filename**), `letters/generateDisputePdfInline.ts`,
  `components/evidence/EvidenceSheet.tsx`, `pages/portal/PartnerDisputesPage.tsx`,
  `pages/portal/PartnerDisputeDetailPage.tsx`, `pages/admin/PartnerDetailPage.tsx`
  (incl. letter body), `pages/admin/CasesPage.tsx`, `data/lettersRepo.ts`,
  `data/casesRepo.ts`, `automation/runWorkflows.ts`,
  `reports/generateCreditAnalysisReportPdf.ts`. Internal `Bureau` / `byBureau.TUC`
  keys are unchanged. NOTE: letters created **before** this change keep their old
  "TUC" title/filename until regenerated.

- **`src/components/disputes/DisputePickerModal.tsx`** — The "Select disputes"
  window now defaults to the **"From report"** tab (it previously opened on "From
  saved cases" whenever any case existed, which made it look like only one negative
  was available). Falls back to "From saved cases" only when no reports exist.

- **`supabase/migrations/20260606000001_storage_pii_bucket.sql`** *(new)* — Creates
  the private `pii` bucket and a `storage.objects` policy reusing `is_partner_owner`
  (admins + owning partner can upload/read; nobody else).

- **`supabase/LIVE_SETUP_run_all.sql`** *(new, convenience)* — All 5 migrations
  concatenated in order for a single paste into the live SQL editor.

- **`.env.local`** *(local only, git-ignored)* — the owner's local Supabase keys.
  **Do not commit**; not relevant to live.

All changes pass `tsc --noEmit` (the build's type-check).

---

## Backend steps on LIVE (detail)

1. **Database** — run `supabase/LIVE_SETUP_run_all.sql` in the live SQL Editor.
   Contents (in order):
   1. `20260211000100_full_mode_core.sql` (tenants/partners/billing + RLS + `is_partner_owner`)
   2. `20260211000200_full_mode_workflow.sql` (reports/evidence/letters/cases + RLS)
   3. `20260521000001_add_admin_bypass_to_rls.sql` (`admin_emails`, `is_admin()`, admin bypass)
   4. `20260530000001_fix_admin_partner_select_policy.sql` (admin partner CRUD policies)
   5. `20260606000001_storage_pii_bucket.sql` (**new** — private bucket + policy)

2. **Admin emails** — `insert into public.admin_emails (email) values ('...');`
   for each staff member who works in the portal/admin. (Seeded:
   `partnersupport@`, `sanzstlouis@`, `shellystlouis@` `finelycred.com`.)

3. **Env vars** (host / hosting platform): `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` (already set since the live site works). Optional
   `VITE_SUPABASE_PRIVATE_BUCKET` — if set, it **must** match the bucket id in the
   storage migration (default `pii`).

4. **Edge functions** — `admin-list-partners` etc. appear already deployed (admin
   partner creation works on live). If anything still fails after the above,
   verify functions + their secrets.

5. **Redeploy** the app from GitHub so the front-end changes ship.

---

## Partner claim (`claimed_user_id`) wiring — DONE

The root-cause fix so **non-admin client users** can save their own
letters/evidence/screenshots is now implemented in
`src/portal/getOrCreatePartnerForSession.ts`:

- A **newly created** partner is now created with `claimedUserId = user.id`
  (`createPartner({ ..., claimedUserId, claimedAt })`), so on live the insert passes
  `partner_insert_self` RLS and `is_partner_owner` is true → the partner's own
  letters/evidence/reports save without relying on the admin bypass.
- A partner **found by email** (e.g. an admin-created record) is now claimed by the
  signed-in user (`upsertPartner({ ..., claimedUserId })` + best-effort
  `upsertPartnerToSupabase`). Locally this works directly.

Claiming an **existing/admin-created** partner via a direct update is blocked by RLS
(you can't update a row you don't yet own), so that now goes through the
**`claim-profile` edge function** (service_role), which was previously a non-functional
scaffold and is **now fully implemented** (`supabase/functions/claim-profile/index.ts`):
- It authenticates the caller, finds the partner by `partnerId` (or by the user's
  email), verifies the **partner email matches the authenticated user's email**, and
  sets `claimed_user_id = auth user id` via service role.
- Client helper: `claimPartnerViaEdge()` in `data/partnersRepo.ts`. It's called on LIVE
  by both `getOrCreatePartnerForSession` (auto-claim by email) and
  `ClaimPartnerProfilePage` (the claim link). Locally (no Supabase) the direct
  localStorage path is used.

DEPLOY REQUIREMENTS for `claim-profile`: deploy the function and ensure it has
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and **`SUPABASE_SERVICE_ROLE_KEY`** secrets
(`config.toml` already sets `verify_jwt = false`). New self-signup partners are
created already-claimed (no edge function needed). Verify the
`partners_claimed_user_unique` index behavior when testing on live.

---

## Remaining work / notes (not yet done)

- **Calendar booking policy (current local implementation).**
  Booking settings live in `src/data/calendarSettingsRepo.ts` and power public
  slot selection through `PublicSessionSlotPicker` / `BookingTimeSlotPicker`.
  Settings include hours, min notice, day-before cutoff, weekdays, durations, and
  blocked windows. Public enlightenment and consultation forms now require a
  selected slot to prevent conflicting requests. `calendarRepo.ts` enforces one
  free enlightenment session per email; additional enlightenment sessions are
  flagged as `paymentRequired` with `sessionPriceCents = 10000`. A real payment
  link/checkout product still needs to be connected before auto-confirming paid
  repeat sessions.
- **Lead magnet course boundary.**
  `/free-guide` intentionally routes free-guide users to course recommendations
  after download. Prefilled dispute letters and AI-drafted dispute packets should
  stay behind DFY/paid service access. The current UI says this explicitly and
  routes users into `/onboarding?next=/portal/courses?...`.
- **Projects & Tasks interaction.**
  The project sidebar now uses row click for editable project details and a
  separate `Tasks` action to show the board for that project. Task cards open
  `TaskDetailModal` for editable task fields.
- **Role promo links + lead attribution.**
  Role promo links are generated by `RolePromoLinksPanel` for affiliates, credit
  specialists, sellers, and partners. Links include `ref`, `promoter_role`,
  `promo_type`, and `promo_asset` so guides, ebooks, services, sessions, and
  onboarding can attach leads to the promoter. Local lead storage supports these
  fields now. For Supabase, add nullable columns to `lead_captures`:
  `referral_code`, `promoter_role`, `promo_type`, `promo_asset` (text) and expose
  them in admin read policies.
- **Onboarding attribution.**
  The onboarding modal captures the same attribution params, preselects role
  when `promoter_role` is affiliate/agent/seller, shows a tracked-signup banner,
  and stores those fields in auth metadata on signup.
- **Parser: capture "Date Last Active".** The new reason engine includes a check for
  "Date of Last Activity later than Date Last Reported", but the parsers don't
  currently extract a *Date Last Active* field, so that one check can't fire until it
  is added (`canonicalTradelineLabel` in `parseTextReport.ts`, and the `getVal(...)`
  block in `parseHtmlReport.ts`).
- **Text/PDF parser typed fields.** `parseTextReport.ts` only canonicalizes row
  labels; it does **not** populate the typed `ParsedTradeline` fields (`balance`,
  `dofd`, `dateClosed`, …) the way `parseHtmlReport.ts` does. The reason engine has a
  label-based fallback, but populating typed fields would make contradiction detection
  more reliable on PDF/text reports.
- **Seed "Bureau focus" option.** `src/data/seedEnterpriseDefaults.ts` lists
  `['EQF','EXP','TUC']` as a user-visible multiselect option. Left as-is because the
  value is also the stored key; convert to a label/value pair if you want it to read
  "Trans".

---

## How to verify

- **Local (owner):** already works — partners, letters, screenshots persist via
  browser storage; no backend needed.
- **Live (after setup + redeploy):** log in with an `admin_emails` address, create
  a partner, generate a letter, attach a screenshot. It should save and the
  screenshot/PDF should display. If not, the browser **DevTools → Console** now
  prints the exact reason (RLS block vs. storage/bucket error).
- **Dispute reasons:** upload a report for an account that has a real contradiction
  (e.g. balance above the limit, or a closed account with a balance) and open the
  reason suggestions (Credit Intel / Letters). Specific, data-backed reasons should
  appear alongside the generic baseline. Clean accounts correctly show only the
  baseline.

---

## Getting these changes into GitHub

The owner's local copy is a **standalone folder** (not linked to git). To bring
the changes in, either:
- have the owner zip and send the project folder, then merge it, **or**
- re-apply the file changes listed above (they're small and self-contained).
