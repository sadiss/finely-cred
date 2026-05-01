## Full Mode Launch Runbook (Finely Cred) — Developer Edition

This is the **developer-grade** runbook for launching “Full Mode”:
- **Supabase Auth** (real accounts)
- **Supabase Postgres** is the source of truth (portable across devices)
- **Supabase Storage** for blobs (screenshots + PDFs) in a **private** bucket
- **Stripe Checkout + webhooks** activate agreements + grant entitlements **server-side**

If you follow this doc end-to-end, you should be able to:
- sign up on device A, upload evidence, generate letters
- sign in on device B and see the same reports/evidence/letters/cases
- purchase via Stripe and have entitlements unlock without relying on localStorage

---

## 0) Repo map (what Full Mode touches)

- **App Supabase client**: `src/lib/supabaseClient.ts`
- **Partner session bootstrap + cache hydration**: `src/portal/getOrCreatePartnerForSession.ts`
  - creates deterministic partner id when Supabase is configured: `partner_<authUserId>`
  - hydrates billing + workflow cache from Supabase on login
- **Billing (local cache)**: `src/data/billingRepo.ts`
  - server snapshot hydration: `replaceBillingSnapshotForPartner()`
- **Billing (Supabase pull)**: `src/data/billingSupabaseSync.ts`
- **Workflow pull (reports/evidence/letters/cases)**: `src/data/workflowSupabaseSync.ts`
- **Workflow dual-write (best effort)**:
  - reports: `src/data/reportsRepo.ts`
  - evidence: `src/data/evidenceRepo.ts`
  - letters: `src/data/lettersRepo.ts`
  - cases: `src/data/casesRepo.ts`
- **Stripe Edge Functions**:
  - checkout: `supabase/functions/stripe-checkout/index.ts`
  - verify: `supabase/functions/stripe-verify/index.ts`
  - webhook: `supabase/functions/stripe-webhook/index.ts` (activates agreements + entitlements in DB)

---

## 0.1) Prereqs (developer workstation)

- **Node**: use the project’s expected Node version (if unsure, use latest LTS)
- **Supabase project**: you need the **project ref**, **anon key**, and **service role key**
- **Supabase CLI** (recommended for function deploy):
  - install via npm:

```bash
npm i -g supabase
supabase --version
```

- **Stripe CLI** (recommended for webhook testing in non-prod):
  - install per Stripe docs and confirm:

```bash
stripe --version
```

---

## 1) Environments & required secrets

### 1.1 App environment variables (hosting)

Set these in your production hosting (Vercel/Netlify/etc):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PRIVATE_BUCKET=pii` (or your chosen private bucket name)

### 1.1.1 Supabase Auth URL configuration (critical)

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: set to your production app origin (example: `https://app.finelycred.com`)
- **Redirect URLs**: add your auth callback / app origins as required (at minimum, include your app origin)

If this is misconfigured, login redirects and magic-link flows can fail even when keys are correct.

### 1.2 Supabase Edge Function secrets (server-side)

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- **Required for webhook activation**
  - `SUPABASE_SERVICE_ROLE_KEY` (used by webhook to write DB)

- **Stripe**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `APP_BASE_URL` (example: `https://app.finelycred.com`)
  - `STRIPE_PRICE_MAP_JSON` (packageId → Stripe priceId)

- **Entitlements mapping (required)**
  - `PACKAGE_ENTITLEMENTS_JSON`

Example `STRIPE_PRICE_MAP_JSON`:

```json
{
  "personal_core": "price_123",
  "personal_restore_plus": "price_456"
}
```

Example **minimal** `PACKAGE_ENTITLEMENTS_JSON` (packageId → entitlement keys):

```json
{
  "personal_core": [
    "portal.reports",
    "portal.documents",
    "portal.messages",
    "portal.tasks",
    "portal.courses",
    "portal.disputes",
    "portal.letters",
    "portal.templates"
  ]
}
```

Notes:
- This mapping is required because Stripe webhooks run server-side and cannot import the app’s `pricingCatalog.ts`.
- If `PACKAGE_ENTITLEMENTS_JSON` is missing or doesn’t include the package, the webhook logs `stripe.no_entitlements_configured`.

---

## 2) Database setup (schema + RLS)

### 2.1 Apply migrations (recommended)

In Supabase Dashboard → SQL Editor, run these migrations **in order**:

1. `supabase/migrations/20260211000100_full_mode_core.sql`
2. `supabase/migrations/20260211000200_full_mode_workflow.sql`

What these migrations do:
- Creates core tables:
  - `tenants`, `memberships`, `partners`
  - `billing_accounts`, `agreements`, `agreement_events`, `entitlements`
  - `audit_events`
- Creates workflow tables:
  - `credit_reports` (stores full report record in `data jsonb`)
  - `evidence` (blob index)
  - `letters`
  - `cases`
- Enables **RLS** and adds owner-based policies using:
  - `partners.claimed_user_id = auth.uid()`
  - helper: `public.is_partner_owner(pid)`
- Adds a guardrail unique index:
  - one claimed partner per user: unique `claimed_user_id` (prevents cross-device duplicates)

### 2.2 Quick DB verification queries

Run these in SQL editor:

```sql
select id, slug, status from public.tenants order by created_at desc limit 5;
select id, tenant_id, claimed_user_id, created_at from public.partners order by created_at desc limit 10;
select id, partner_id, package_id, status, updated_at from public.agreements order by updated_at desc limit 10;
select partner_id, key, status from public.entitlements order by starts_at desc limit 20;
```

---

## 3) Storage setup (private bucket)

Supabase Dashboard → Storage:
- Create bucket named **`pii`** (or match `VITE_SUPABASE_PRIVATE_BUCKET`)
- Ensure it’s **private**

App behavior:
- writes blobs via `src/storage/SupabaseBlobStore.ts`
- views blobs via **signed URLs**

### 3.1 Storage RLS policies (required for private bucket access)

This repo stores objects at:
- `partners/<partnerId>/<kind>/<blobId>.<ext>`

If your bucket is private, you **must** add `storage.objects` policies that allow an authenticated user to access only their own partner folder.

In Supabase Dashboard → SQL Editor, run (replace bucket name if not `pii`):

```sql
-- Optional (so you can re-run safely during setup):
drop policy if exists "pii_read_own_partner_objects" on storage.objects;
drop policy if exists "pii_insert_own_partner_objects" on storage.objects;
drop policy if exists "pii_delete_own_partner_objects" on storage.objects;

-- Allow partner owner to read/list their own objects
create policy "pii_read_own_partner_objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pii'
  and split_part(name, '/', 1) = 'partners'
  and public.is_partner_owner(split_part(name, '/', 2))
);

-- Allow partner owner to upload into their own partner folder
create policy "pii_insert_own_partner_objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pii'
  and split_part(name, '/', 1) = 'partners'
  and public.is_partner_owner(split_part(name, '/', 2))
);

-- Allow partner owner to delete their own objects
create policy "pii_delete_own_partner_objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pii'
  and split_part(name, '/', 1) = 'partners'
  and public.is_partner_owner(split_part(name, '/', 2))
);
```

Notes:
- If you choose a different bucket name, change every `bucket_id = 'pii'` to your bucket id.
- These policies rely on `public.is_partner_owner(partner_id)` created by the Full Mode migrations.

---

## 4) Deploy Edge Functions (Supabase)

You can deploy from the Supabase Dashboard, but the **CLI is faster/repeatable**.

### 4.1 Link your local repo to the Supabase project

From the repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 4.2 Deploy functions

Deploy the authenticated functions (these should keep JWT verification on):

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-verify
```

Deploy the webhook function (this must accept unsigned requests from Stripe):

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4.3 Set Edge Function secrets (CLI option)

You can set secrets in the Dashboard, or via CLI:

PowerShell example:

```bash
supabase secrets set `
  SUPABASE_SERVICE_ROLE_KEY="..." `
  STRIPE_SECRET_KEY="..." `
  STRIPE_WEBHOOK_SECRET="..." `
  APP_BASE_URL="https://app.finelycred.com" `
  STRIPE_PRICE_MAP_JSON='{"personal_core":"price_123"}' `
  PACKAGE_ENTITLEMENTS_JSON='{"personal_core":["portal.reports","portal.letters"]}'
```

macOS/Linux example:

```bash
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  STRIPE_SECRET_KEY="..." \
  STRIPE_WEBHOOK_SECRET="..." \
  APP_BASE_URL="https://app.finelycred.com" \
  STRIPE_PRICE_MAP_JSON='{"personal_core":"price_123"}' \
  PACKAGE_ENTITLEMENTS_JSON='{"personal_core":["portal.reports","portal.letters"]}'
```

Notes:
- `STRIPE_PRICE_MAP_JSON` and `PACKAGE_ENTITLEMENTS_JSON` must be valid JSON.
- Prefer single quotes around the JSON on shells that otherwise escape quotes unexpectedly.

---

## 5) Stripe setup (Checkout + webhooks)

### 5.1 Create webhook endpoint

In Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://<your-project-ref>.functions.supabase.co/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - optional: `checkout.session.async_payment_succeeded`

### 5.2 Activation logic (what happens on webhook)

When Stripe sends `checkout.session.completed` and `payment_status` is paid:
- webhook upserts `agreements` row to `active`
- inserts a deterministic `agreement_events` row (`stripe_evt_<eventId>`) (idempotent)
- upserts `entitlements` for partner based on `PACKAGE_ENTITLEMENTS_JSON`

Common failure modes:
- missing `SUPABASE_SERVICE_ROLE_KEY`
- missing or incomplete `PACKAGE_ENTITLEMENTS_JSON`
- metadata missing on Stripe object (should be set by `stripe-checkout`)

### 5.3 Webhook testing (recommended in staging/test mode)

- Use **Stripe test keys** and **test prices** in a staging Supabase project.
- Use Stripe CLI to forward events while developing:

```bash
stripe listen --forward-to "https://<your-project-ref>.functions.supabase.co/stripe-webhook"
```

Then run a real checkout in the app (recommended) so the session metadata matches what the webhook expects.

---

## 6) App runtime expectations

### 6.1 Partner identity (no duplicates)

When Supabase is configured, partner id is deterministic:
- `partner_<authUserId>`

This prevents “device A created partner_1, device B created partner_2” issues.

### 6.2 Cache hydration

On login, the app attempts to:
- upsert partner row to Supabase
- pull **billing snapshot** (agreements + entitlements) into local cache
- pull **workflow snapshot** (reports/evidence/letters/cases) into local cache

This is best-effort and should never hard-crash the portal if Supabase is temporarily unavailable.

---

## 7) Smoke tests (developer checklist)

### 7.1 Auth + partner persistence
- Sign up
- Sign out
- Sign in
- Confirm partner id is stable and partner row exists in `public.partners`

### 7.2 Workflow portability
- Upload a report
- Confirm the report appears after refresh
- Capture evidence screenshots for:
  - Public Records (bankruptcy) — court name should be visible on screenshot card label
  - Personal Information
- Generate a letter and confirm the PDF is saved to the vault
- Sign in from another device/browser and confirm:
  - reports/evidence/letters/cases are present

### 7.3 Stripe activation (webhook-driven)
- Purchase a paid package
- After redirect back to `/portal/billing`, confirm:
  - entitlements exist in `public.entitlements`
  - portal gating unlocks

---

## 8) Troubleshooting

### 8.1 “Payment verified but still locked”
- Check Supabase Edge Function logs for:
  - `stripe.activation_failed`
  - `stripe.no_entitlements_configured`
- Verify secrets exist:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PACKAGE_ENTITLEMENTS_JSON`

### 8.2 “Nothing persists across devices”
- Confirm the migrations were applied
- Confirm the user has a partner row with `claimed_user_id`
- Confirm RLS works (logged-in user can select own rows)

### 8.3 Storage issues (blobs not viewable)
- Confirm bucket is private and signed URLs work
- Confirm app env `VITE_SUPABASE_PRIVATE_BUCKET` matches bucket name

---

## 9) Production cutover checklist

Before pointing real traffic at production:

- **Supabase**
  - migrations applied (core + workflow)
  - RLS enabled (should be via migrations)
  - private bucket exists (`pii`) and app env matches bucket name
  - Edge Functions deployed (`stripe-checkout`, `stripe-verify`, `stripe-webhook`)
  - secrets set (especially `SUPABASE_SERVICE_ROLE_KEY`, `PACKAGE_ENTITLEMENTS_JSON`)

- **Stripe**
  - live mode price IDs are correct in `STRIPE_PRICE_MAP_JSON`
  - webhook endpoint added and signing secret matches `STRIPE_WEBHOOK_SECRET`
  - at least one end-to-end purchase verified in live (or a staged environment)

- **App hosting**
  - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set to production project
  - `APP_BASE_URL` matches your deployed domain (used by Edge Functions)

---

## 10) Rollback / incident response basics

- **If Stripe activation fails**:
  - check function logs (`stripe.activation_failed`, `stripe.no_entitlements_configured`)
  - verify secrets were not overwritten (service role key, entitlements JSON)
  - verify Stripe webhook signing secret matches the endpoint

- **If users can’t see their data**:
  - verify partner row exists and `claimed_user_id` is set
  - verify RLS policies are present/enabled (migrations applied)

- **Safe rollback approach**:
  - do **not** drop tables in production to “undo”
  - revert app deploy to last known good build
  - keep DB schema; fix forward with a new migration if needed

---

## 11) Operational notes / guardrails

- Stripe webhooks **must** use service role to write DB (expected)
- RLS is owner-based; admin cross-tenant tooling is not part of this runbook
- Keep `EDGE_ADMIN_EMAILS` configured for any admin-only edge functions you rely on

