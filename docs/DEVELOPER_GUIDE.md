# Finely Cred — Developer Guide

Audience: a developer who needs to run the **full stack** locally — app, Supabase Postgres/Auth, edge functions, AI gateway, credit report parsing, partner admin, letters/validation/court letter tracks, and entitlements.

This guide is concrete about file paths so you can jump straight to the code. It does not replace the more specific docs it links to (`docs/DEVELOPER_HANDOFF.md`, `docs/LOCAL_DEV.md`, `docs/PRODUCTION_DEPLOY.md`) — it ties them together into one runbook.

> **Do not commit or push while following this guide.** It is a reference doc only.

---

## Table of contents

1. [Repo overview / architecture](#1-repo-overview--architecture)
2. [Prerequisites](#2-prerequisites)
3. [Local setup](#3-local-setup)
4. [Environment variables](#4-environment-variables)
5. [Supabase: linking, migrations, edge functions](#5-supabase-linking-migrations-edge-functions)
6. [AI features (AI gateway)](#6-ai-features-ai-gateway)
7. [Auth / admin allowlist / sensitive action codes](#7-auth--admin-allowlist--sensitive-action-codes)
8. [Credit reports: HTML parsing, Creditor Contacts, Credit Intelligence](#8-credit-reports-html-parsing-creditor-contacts-credit-intelligence)
9. [Debt / Validation / Court letter tracks](#9-debt--validation--court-letter-tracks)
10. [Entitlements / Grant partner access](#10-entitlements--grant-partner-access)
11. [Troubleshooting matrix](#11-troubleshooting-matrix)
12. [Useful npm scripts](#12-useful-npm-scripts)
13. [Branching note](#13-branching-note)
14. [Recent product surfaces (2026)](#14-recent-product-surfaces-2026) — careers/CS join, tradelines vs AU sellers, agency buy-ins, Platinum Workspace, home/nav wayfinding, affiliate + Denefit share, letters evidence capture, plan docs index

---

## 1. Repo overview / architecture

**Stack:** Vite 7 + React 19 + TypeScript (strict-ish) SPA, `react-router-dom` v7, Tailwind. Backend is **Supabase** (Postgres + Auth + Storage + Edge Functions on Deno).

```
finely-cred-main/
├── src/                      # React app (public site, partner portal, admin OS)
│   ├── auth/admin.ts         # Hardcoded admin email allowlist (bootstrap admins)
│   ├── billing/entitlements.ts   # Entitlement keys, service bundles, grant helpers
│   ├── creditReports/        # HTML/text credit report parsers + creditor contact extract
│   ├── legal/                # Debt letter catalog + letter body generators
│   ├── domain/                # Shared types (partners, debtLegal, creditReports, cases…)
│   ├── data/                  # "Repos" — local-storage/JSON + Supabase-synced data layers
│   ├── lib/                   # Clients (aiClient, mailerClient, reportParsePipeline…)
│   ├── components/            # UI: admin/, portal/, creditIntel/, debt/, letters/
│   └── pages/                 # Route-level pages (admin/, portal/, public)
├── supabase/
│   ├── functions/             # ~79 Deno edge functions (one folder per function)
│   │   └── _shared/           # cors.ts, edgeGuard.ts (auth/allowlist/rate-limit helpers)
│   ├── migrations/            # Ordered SQL migrations (timestamped filenames)
│   ├── config.toml            # Per-function `verify_jwt` overrides for local `supabase serve`
│   └── LIVE_SETUP_run_all.sql # One-shot bootstrap SQL for a fresh Supabase project
├── scripts/                   # Node/tsx automation: deploy, audits, launch gates, env checks
├── docs/                      # Feature-specific docs (this guide lives here)
├── e2e/                       # Playwright specs
└── data/                      # Static JSON fallbacks used in "marketing-only" mode
```

**Two runtime modes** (see `docs/LOCAL_DEV.md`):
- **Marketing-only** — no Supabase keys. Public marketing pages work from local JSON in `data/`. Auth, portal, admin, and anything edge-backed do **not** work.
- **Full** — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set in `.env.local`. Auth, partner portal, admin OS, cloud sync, and all edge-function-backed features work.

The frontend never talks to a server you run yourself for backend logic — it calls Supabase directly (Postgres via `@supabase/supabase-js`, or `supabase.functions.invoke('<name>', …)` for edge functions). There is no separate Node/Express backend in this repo.

---

## 2. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | **20.x** (CI pins `node-version: '20'` in `.github/workflows/ci.yml`) | No `.nvmrc` in repo — match CI's Node 20 |
| npm | Bundled with Node 20 | `package-lock.json` is committed — use `npm ci` for reproducible installs, `npm install` for day-to-day |
| Supabase CLI | Not globally required | Repo scripts invoke it via `npx supabase …` — no global install needed |
| Git | Any recent version | Repo is on Windows (`E:\Finely-Cred\Tishobe\finely-cred-main`) — PowerShell is the default shell |
| Supabase account/project | Free tier is enough for dev | Create a **separate dev project** — do not point local dev at production (see §5) |

PowerShell note: chain commands with `;`, not `&&` (both work in PowerShell 7+, but the team convention in this repo's docs is `;`).

---

## 3. Local setup

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main
npm install
cp .env.example .env.local     # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Dev server: **http://127.0.0.1:5173/** (Vite is pinned to this host/port with `--strictPort` in the `dev` script — it will fail rather than silently pick a different port).

- `npm run dev` — binds `127.0.0.1:5173` only
- `npm run dev:host` — binds `0.0.0.0:5173` (LAN-accessible, e.g. testing from a phone)

Verify your setup:

```powershell
npm run env:check     # marketing-only vs full mode, based on .env / .env.local
npm run dev:check     # typecheck + env:check
npm run launch:ops    # code vs env vs manual-QA blockers in one view
```

Bootstrap `.env.local` interactively (writes a template if missing):

```powershell
npm run env:setup
npm run env:dev-supabase   # step-by-step checklist for creating an isolated dev Supabase project
```

**Recommended:** create a dedicated `finely-cred-dev` Supabase project (Dashboard → New project), paste its URL/anon key into `.env.local`, then run `supabase/LIVE_SETUP_run_all.sql` in that project's SQL Editor. Never paste production keys into local `.env.local`.

Restart `npm run dev` after any `.env.local` edit (Vite only reads env at startup).

---

## 4. Environment variables

Two env surfaces exist and must not be confused:

- **Client (Vite) vars** — prefixed `VITE_*`, embedded in the browser bundle at build time. Live in `.env.local` (dev) or the hosting provider's env config (prod). Never put secrets here — they are public.
- **Edge function secrets** — server-side only, set via **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or `supabase secrets set`). Never referenced from `src/`.

`.env.example` is the canonical template (comments show which secrets are edge-only). There is also `.env.edge.local` in the repo root — used for local reference of edge secret values you plan to push to Supabase; it is **not** read by Vite or by `supabase functions serve` automatically (see §5.3 for local edge secret loading).

### 4.1 Client vars (`.env.local`)

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | Yes (for Full mode) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for Full mode) | Public anon key |
| `VITE_SUPABASE_PRIVATE_BUCKET` | Recommended (default `pii`) | Private storage bucket for reports/letters/evidence — must match the bucket created by `LIVE_SETUP_run_all.sql` |
| `VITE_SITE_URL` | Optional | Canonical URL for sitemap generation (default `https://finelycred.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Portal/public Stripe checkout |
| `VITE_SMARTCREDIT_PID` | Optional | SmartCredit affiliate PID (default placeholder `54821`) |
| `VITE_PROVIDER_GATEWAY_URL` | Optional | Bridge/provider gateway base URL |
| `VITE_FINELY_CRED_API_URL` | Optional | Public partner API base (`.../functions/v1/finely-partner-api`) |
| `VITE_VOICE_ALLOW_BROWSER_PREVIEW` | Optional (default dev-only) | Allow browser TTS preview in production builds |
| `VITE_DAILY_DOMAIN` | Optional | Video meeting integration domain (litigation/case-help scheduling) |
| `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | Optional | Playwright portal QA with a real Supabase auth user |

### 4.2 Edge function secrets (Supabase Dashboard, never in Vite)

| Secret | Used by | Purpose |
|--------|---------|---------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | most functions | Passed automatically by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | `claim-profile`, `platform-cron`, `automation-runner`, admin functions | RLS-bypass server writes — **never** expose to browser |
| `EDGE_ADMIN_EMAILS` | `send-email`, `send-sms`, `send-invite-email`, `admin-events`, `lead-intel`, `image-generate`, `video-motion-render`, `_shared/edgeGuard.ts::requireAllowlistedEmail` | Comma-separated allowlist for guarded functions |
| `APP_BASE_URL` (or `PUBLIC_SITE_URL`) | Stripe checkout, comms links, OAuth redirects | e.g. `https://app.finelycred.com` |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_CHAT_MODEL`, `OPENAI_INTEL_MODEL`, `OPENAI_TTS_MODEL` | `ai-gateway`, `doc-intel`, `lead-intel`, `image-generate`, voice fallback | Default chat/general provider |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_INTEL_MODEL` | `ai-gateway`, `doc-intel` | Doc extraction / lead intel / classify tasks |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_COOWNER_MODEL`, `ANTHROPIC_INTEL_MODEL` | `ai-gateway` | Co-owner/ops, legal/compliance tasks |
| `SERPER_API_KEY` | `lead-intel` | Web search augmentation |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SMTP_SECURE` | `send-email`, `send-partner-welcome`, `send-invite-email`, `send-password-reset`, nurture cron | Preferred email transport |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | same as above | Legacy fallback email transport |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE` | `send-sms`, `send-invite-sms`, `twilio-webhook` | SMS (US default) |
| `SMS_API_ID`, `SMS_API_KEY`, `SMS_SENDER_ID`, `SMS_PROVIDER`, `SMS_REST_SEND_URL` | `send-sms` | REST SMS gateway fallback |
| `MAIL_PROVIDER`, `MAIL_API_ID`, `MAIL_API_KEY`, `MAIL_TEST_MODE`, `MAIL_DEBUG`/`LETTERSTREAM_DEBUG` | `mailer` | Physical letter mailing (LetterStream / Finely Mail white-label) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `stripe-checkout`, `stripe-webhook`, `stripe-verify`, `public-session-checkout` | Payments |
| `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` | `meta-oauth`, `meta-webhook`, `meta-publish-post` | Meta lead ads + inbox |
| `NORA_CAPITAL_BASE_URL`, `NORA_CAPITAL_API_KEY`, `NORA_CAPITAL_WEBHOOK_SECRET`, `NORA_CAPITAL_ALLOWED_PATHS_JSON` | `nora-capital`, `nora-capital-webhook` | Nora Capital bidirectional API |
| `FINELY_PARTNER_API_KEYS_JSON` | `finely-partner-api` | Partner API bearer keys (Nora and other integrators) |
| `FINELY_BRIDGE_WEBHOOK_SECRET` | `finely-bridge-webhook` | Optional HMAC verification |
| `CARTESIA_API_KEY`, `CARTESIA_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL`, `VOICE_CLONE_FINELY_PRIMARY_ID`, `VOICE_CLONE_NORA_PRIMARY_ID`, `ELEVENLABS_VOICE_*`, `VOICE_PIPELINE_VERSION` | `voice-studio`, `guide-audio` (legacy shim) | Multi-engine narration (Cartesia presets + ElevenLabs clone + OpenAI TTS fallback) |
| `DENEFITS_*` (webhook secret, if configured) | `denefits-webhook` | Financing webhook verification |

Run `npm run secrets:check` for a non-secret-leaking presence check, and `npm run secrets:summary` for a broader overview. `scripts/production-secrets-check.mjs` is the source of truth for the checked list.

### 4.3 Feature flags (not env vars — client-side settings)

Feature flags are **not** environment variables. They live in `localStorage` under `finely.settings.v1` (see `src/data/settingsRepo.ts`) until `tenant_settings` is wired server-side — so **enabling a flag in one browser/admin session does not sync to others**. Toggle them in **Admin → Settings**.

| Flag | Gates | Prerequisite secrets |
|------|-------|----------------------|
| `aiGateway` | `callAiGateway()` / `callPublicAiGateway()` in `src/lib/aiClient.ts` | At least one provider key (`OPENAI_API_KEY`, `GEMINI_API_KEY`, or `ANTHROPIC_API_KEY`) |
| `docIntel` | AI-assisted document extraction | `GEMINI_API_KEY` or `ai-gateway` provider keys |
| `commsDelivery` | Live nurture/dunning/digest email + branded welcome/invite email | SMTP or SendGrid secrets + `send-partner-welcome` deployed |
| `inviteDelivery` | Admin invite email delivery | SMTP + `send-invite-email` deployed |
| `letterMailing` | Physical mail via `mailer` | `MAIL_API_ID` + `MAIL_API_KEY` |
| `stripeEnabled` | Paid strategy calls / portal checkout | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` |
| `automationAutopilot` | Hands-free letter draft + staff task routing | `platform-cron` scheduled with `dryRun: false` |
| `lightThemePublic` | Public light theme (otherwise admin-preview only via `src/lib/finelyThemeAccess.ts`) | none |

`localhost` auto-enables several flags by default (see `settingsRepo.ts`), so local dev usually "just works" once Supabase + provider keys are present.

---

## 5. Supabase: linking, migrations, edge functions

### 5.1 Link the CLI to a project (no global install — all via `npx`)

```powershell
npm run supabase:login     # npx supabase login
npm run supabase:link      # npx supabase link  (prompts for project ref)
```

### 5.2 Migrations

Migrations live in `supabase/migrations/*.sql`, ordered by timestamp prefix. Two ways to apply them:

```powershell
npm run supabase:db:push        # npx supabase db push — applies pending migrations to the linked project
# OR, for a brand-new project:
# run supabase/LIVE_SETUP_run_all.sql in the Supabase SQL Editor (one-shot bootstrap)
```

`npm run migrations:check` verifies migration files are present on disk (does not touch the DB). `npm run rls:check` runs RLS smoke checks against the **linked** Supabase project.

Key migrations to know about:
- `supabase/migrations/202607240001_entitlements_admin_write.sql` — **required** before admin-granted entitlements (Letters/Bureaus access) persist to the cloud (see §10)
- `20260629000002_auto_create_partner_on_signup.sql` — auto-creates a partner row on `auth.users` insert
- `20260530000001_fix_admin_partner_select_policy.sql` — lets admins read all partner rows
- `20260629000001_fix_is_admin_security_definer.sql` — makes `is_admin()` work correctly under RLS
- `20260612000000_voice_studio.sql` — Voice Studio tables

### 5.3 Running edge functions locally (`supabase functions serve`)

```powershell
npx supabase functions serve --env-file .env.edge.local
# or serve a single function while iterating:
npx supabase functions serve ai-gateway --env-file .env.edge.local
```

- `.env.edge.local` (repo root) holds local values for edge secrets (`SUPABASE_SERVICE_ROLE_KEY`, provider API keys, etc.) — pass it explicitly with `--env-file`; it is not auto-loaded by Vite or by `supabase functions serve` without the flag.
- Point the frontend at your local functions during `serve` by temporarily setting `VITE_SUPABASE_URL` to the local Supabase URL Studio prints (`http://127.0.0.1:54321` by default when running `supabase start`), or leave it pointed at the cloud project and only serve the function you're actively iterating on.
- `supabase/config.toml` sets `verify_jwt = false` for most functions — this is required because the app's Supabase JWTs are **ES256**, which breaks Supabase's default JWT verification. Do not remove these overrides.

### 5.4 Deploying edge functions

```powershell
npm run deploy:functions             # launch-critical subset (see scripts/deploy-supabase-functions.mjs)
npm run deploy:functions -- --all    # every function under supabase/functions (skips folders starting with "_")
```

Under the hood this runs `supabase functions deploy <name> --no-verify-jwt` for each function in `LAUNCH_FUNCTIONS` (or all folders when `--all` is passed). **Always deploy with `--no-verify-jwt`** — same ES256 reasoning as above. The script is `scripts/deploy-supabase-functions.mjs`; edit `LAUNCH_FUNCTIONS` there to add/remove a function from the default subset.

There are ~79 function folders under `supabase/functions/` (plus `_shared/` helpers, not deployable). Notable groups:
- **Partner lifecycle:** `claim-profile`, `admin-list-partners`, `admin-import-legacy`, `send-partner-welcome`, `send-invite-email`, `send-invite-sms`, `send-password-reset`
- **AI:** `ai-gateway`, `doc-intel`, `lead-intel`, `image-generate`, `legal-research`
- **Comms/mail:** `send-email`, `send-sms`, `mailer`, `comms-ping`, `comms-oauth-callback`, `email-webhook`, `twilio-webhook`
- **Payments:** `stripe-checkout`, `stripe-webhook`, `stripe-verify`, `public-session-checkout`, `denefits-webhook`
- **Automation/cron:** `platform-cron`, `automation-runner`, `automation-blueprint-apply`, `overnight-tick`
- **Voice:** `voice-studio` (current), `guide-audio` (legacy compatibility shim)
- **Integrations:** `nora-capital`, `nora-capital-webhook`, `nora-llc-api`, `finely-partner-api`, `finely-bridge-webhook`, `meta-oauth`, `meta-webhook`, `meta-publish-post`
- **CMO/lead engine/sovereign agents:** `cmo-*`, `lead-intel*`, `lead-swarm-*`, `sovereign-*`, `staff-*`, `synthetic-staff-tick`

### 5.5 Common edge function failures and how to debug

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `401 Unauthorized` calling any function | JWT verification rejected the ES256 token | Deploy with `--no-verify-jwt` (already default via `npm run deploy:functions`); confirm `supabase/config.toml` has `verify_jwt = false` for that function name |
| `500` with `Missing env: XYZ` | Secret not set in Supabase project | Set the secret in Dashboard → Project Settings → Edge Functions → Secrets, then redeploy (secrets apply on next invocation, redeploy not always required, but do it to be safe) |
| CORS error in browser console | Function response missing headers | All functions should `import { corsHeaders } from '../_shared/cors.ts'` and spread it into every `Response`/`json()` call — check the function's `index.ts` if a new one is missing it |
| `Forbidden` from an admin-only function | Caller's email not in `EDGE_ADMIN_EMAILS` | Add the email (comma-separated, case-insensitive) to the `EDGE_ADMIN_EMAILS` secret; see `_shared/edgeGuard.ts::requireAllowlistedEmail` |
| `EDGE_ADMIN_EMAILS not configured` | Secret unset entirely | Set at least one admin email in the secret — an empty allowlist always throws, it never "allows all" |
| Function invoked but nothing happens / silent no-op | `platform-cron`/`automation-runner` called without `dryRun: false` | Cron defaults to dry-run; pass `{ "action": "tick", "dryRun": false }` explicitly (see `docs/PLATFORM_CRON.md`) |
| Works in Studio "Invoke" test but not from the app | Local `.env.local` still points at a different Supabase project than the one you deployed to | Confirm `VITE_SUPABASE_URL` matches the linked project (`npx supabase projects list` / Dashboard) |
| `Unauthorized` even though logged in | Session expired | Refresh session — this is the standard 401 fix noted in `docs/DEVELOPER_HANDOFF.md` §4 |

Check logs: **Supabase Dashboard → Edge Functions → [function name] → Logs**.

---

## 6. AI features (AI gateway)

- **Edge function:** `supabase/functions/ai-gateway/index.ts` — routes to OpenAI / Gemini / Anthropic based on `taskType`, keeps provider keys server-side.
- **Client:** `src/lib/aiClient.ts` — exports `callAiGateway()` (signed-in users) and `callPublicAiGateway()` (anonymous visitors, restricted to `public_chat`, `public_concierge`, `lead_intel_public` task types).
- **Gate:** both client functions throw `AI Gateway is disabled (Feature Flags)` unless `isFeatureEnabled('aiGateway')` is true (Admin → Settings).
- **Routing (`pickProvider` in the edge function):**
  - `coowner` / `ops.coowner` / `ops.agent` / `legal` / `policy` / `compliance` / `admin_ops` → Anthropic
  - `lead_intel` / `doc` / `extract` / `classify` → Gemini
  - everything else → OpenAI (default)
- **Models** are resolved per task via `resolveOpenAiModel` / `resolveGeminiModel` / `resolveAnthropicModel` in the same file — override with `OPENAI_MODEL`, `OPENAI_CHAT_MODEL`, `OPENAI_INTEL_MODEL`, `GEMINI_MODEL`, `GEMINI_INTEL_MODEL`, `ANTHROPIC_MODEL`, `ANTHROPIC_COOWNER_MODEL`, `ANTHROPIC_INTEL_MODEL`.
- **Requirements to test:** `aiGateway` flag ON, signed-in session (or a public task type), and the relevant provider key set as an edge secret.
- **Where it's used in the UI:** Admin AI test panels, dispute-letter AI draft in Letter Studio, doc-intel extraction, lead-intel enrichment.
- Related: `doc-intel` (document extraction), `lead-intel` (web-search-augmented lead enrichment, needs `SERPER_API_KEY` for search), `image-generate`, `legal-research`.

---

## 7. Auth / admin allowlist / sensitive action codes

### 7.1 Auth

Supabase Auth handles sign-up/sign-in. Two email systems exist and are easy to confuse (see `docs/DEVELOPER_HANDOFF.md` §0):
- **Supabase Auth emails** (confirm signup, magic link, default password reset) — templates live in Supabase Dashboard → Authentication → Email Templates.
- **Finely Comms emails** (welcome, invite, nurture, branded reset) — built in `src/comms/` and sent via edge functions (`send-partner-welcome`, `send-invite-email`, `send-password-reset`) over SMTP/SendGrid.

### 7.2 Admin allowlist

Client-side bootstrap admins are hardcoded in `src/auth/admin.ts`:

```12:src/auth/admin.ts
export const ADMIN_EMAIL_ALLOWLIST = new Set(
  [
    'partnersupport@finelycred.com',
    'sanzstlouis@finelycred.com',
    'shellystlouis@finelycred.com',
  ].map((e) => e.trim().toLowerCase()),
);
```

- `isAdminEmail(email)` checks this set **plus** any extra emails an existing admin added at runtime via `finely.settings.v1` → `security.adminEmails` (localStorage — per-browser, not synced).
- Plus-addressing (`owner+dev@finelycred.com`) is normalized and still matches.
- **Server-side** (edge functions), the equivalent allowlist is `EDGE_ADMIN_EMAILS` (comma-separated secret), enforced by `requireAllowlistedEmail()` in `supabase/functions/_shared/edgeGuard.ts`. Keep the two allowlists in sync — client `isAdminEmail` and edge `EDGE_ADMIN_EMAILS` are **not** the same mechanism and can drift (noted as a known gap in `docs/DEVELOPER_HANDOFF.md` §6.4).
- Database-level admin check: `public.is_admin()` (Postgres function used by RLS policies) — keyed off `public.admin_emails` table. Add staff emails there for RLS-level admin reads (e.g. `admin-list-partners`, partner select policies).

### 7.3 Sensitive action codes (Access Center)

**Admin UI:** `/admin/access` → **Sensitive action codes** panel (`src/pages/admin/AdminAccessCenterPage.tsx`).

Codes are stored in `finely.settings.v1` → `security.sensitiveActionCodes` (per-browser) and gate destructive/high-trust actions via `src/lib/sensitiveActionGuard.ts` + the `SensitiveActionCodeGate` component:

| `SensitiveActionKey` | Settings field | Used for |
|-----------------------|-----------------|----------|
| `partner_delete` | `partnerDelete` | Permanent partner file deletion when reports/letters/journey exist |
| `hos_access_grant` | `hosAccessGrant` | Master Head-of-Society access grants |
| `partner_access_grant` | `partnerAccessGrant` | Grant partner portal module access |
| `bulk_report_purge` | `bulkReportPurge` | Destructive bulk report purge/re-import |

`hasSensitiveActionCode(key)` checks whether a code is set; `verifySensitiveActionCode(key, attempt)` checks the entered code. If a code was never set, the guard always fails closed (`hasSensitiveActionCode` returns false → gate blocks the action).

HOS invite keys (separate, per-invite) live in `src/components/heta/HosAccessCodesAdminPanel.tsx`, backed by the `hos-access-codes` edge function.

---

## 8. Credit reports: HTML parsing, Creditor Contacts, Credit Intelligence

Full troubleshooting doc: **`docs/CREDIT_REPORT_PARSING_DIAGNOSTICS.md`**.

### 8.1 What's parsed

The app parses **HTML exports** from monitoring providers (IdentityIQ, SmartCredit, MyScoreIQ) into structured tradelines, payment history, scores, and report sections.

| Format | Support |
|--------|---------|
| HTML export from provider portal | **Best** — full tradeline/score/contact parsing |
| Searchable-text PDF | Okay — displayable/referenceable, does **not** parse into tradelines |
| Scanned/image-only PDF | Not parseable — no selectable text |

Parsers: `src/creditReports/parseHtmlReport.ts` (primary), `src/creditReports/parseTextReport.ts` (fallback/text). Pipeline glue: `src/lib/reportParsePipeline.ts`.

### 8.2 Creditor Contacts extraction

`src/creditReports/creditorContactExtract.ts` pulls creditor/collector/furnisher mailing contacts, in priority order:
1. Dedicated "Creditor Contacts" / "Contact Information" sections in the export (IdentityIQ-style)
2. Fallback: tradeline address/phone fields and collections tables
3. Last resort: a directory lookup elsewhere in the app

Key exports: `accountRefKey()` / `sameAccountRef()` (stable masked-account matching so two accounts from the same collector don't collapse into one letter target), `cleanAddressBlock()` (preserves multi-line mailing addresses instead of flattening them). This data feeds the **TO block** of validation/dispute letters — a report that "parses" but is missing this section will produce letters with an empty or wrong recipient address.

### 8.3 Re-parsing a stored report

If a report was parsed before a contact-extractor fix shipped, or the Creditor Contacts table wasn't picked up:
- **Partner Portal:** `Partner Portal → My Credit Reports → select report → Re-parse` (button appears when `needsReparse` recovery flag is set; auto-recovery is attempted first — see `reparseStoredCreditReport()` in `src/lib/reportParsePipeline.ts` and its usage in `src/pages/portal/PartnerReportsPage.tsx`).
- **Admin:** `Admin → Partners → select partner → Reports tab → Parsing diagnostics (admin)` shows section coverage and can trigger the same re-parse.
- Re-parse always busts the cache and re-runs the current extractor against the **already-stored raw HTML blob** — no re-upload needed unless the original upload was a PDF (in which case re-upload the HTML export instead).

### 8.4 Parsing diagnostics panel

Shows coverage counters (tradelines, scores, 24-month history presence), quality flags (`Provider not recognized`, `Fallback detection used`), and — admin-only — section-by-section coverage. **Copy** produces a JSON payload safe to paste into a bug report (excludes full PII/tradeline contents by design).

### 8.5 Credit Intelligence → Creditors tab

`src/components/creditIntel/CreditIntelTabs.tsx` renders the **Creditors** tab (alongside Collections, Late payments, etc.) inside the unified Credit Intel navigator. Per the workspace "no duplicate UI layers" rule, new creditor-related fields (mailing address, match source, counts) belong **on the existing Creditors tab / cards**, not as a second list elsewhere on the page.

Related: `src/lib/debtCreditorIntel.ts`, `src/components/debt/DebtCreditorIntelPanel.tsx` (debt-side creditor intel, distinct from the bureau-side Creditors tab), `src/lib/collectionContactBoard.ts`.

---

## 9. Debt / Validation / Court letter tracks

### 9.1 Two hubs — do not mix them

| Hub | Route | Purpose |
|-----|-------|---------|
| **Credit Letters** | `/portal/letters` | Bureau disputes, credit-report accuracy tracks (incl. FC/Repo/BK reporting-accuracy on the credit side) |
| **Debt Letters** | `/portal/debt` (Debt Letters hub / `LettersCommandCenter`) | Validation, affidavits/court, servicer/institution debt tracks |

### 9.2 Letter catalog

`src/legal/debtLetterCatalog.ts` defines an 80+ entry catalog. Each entry:

```ts
type DebtLetterCatalogEntry = {
  id: string;
  category: LetterCatalogCategory;   // 'validation' | 'court' | 'securitization' | 'repossession' | 'foreclosure' | 'negotiation' | 'reporting' | 'bureau'
  title: string;
  shortDescription: string;
  whenToUse: string[];
  laws: string[];
  keyPrinciple: string;
  scenarios: string[];
  tier: 'full' | 'outline';          // 'full' → maps to a DebtLetterType body; 'outline' → generateCatalogLetterBody()
  letterType?: DebtLetterType;
  hub?: LetterCatalogHub;             // 'credit' | 'debt' | 'both' — defaults to 'debt'
};
```

- **`validation`** category (`VALIDATION` array): FDCPA §809 initial/round2/round3 validation, licensing demand, itemized accounting, chain-of-title, medical/student-loan/auto/credit-card/payday-specific validation, identity theft block, SCRA addendum, post-suit "mini-Miranda" validation.
- **`court`** category (`COURT` array): general answer, pretrial proof/preservation notice, written answer, court-day prep kit (UI-only, never mailed), response affidavit, discovery set, motion to compel, FDCPA counterclaim, affirmative defenses (SOL, standing, account-stated, hearsay), motions to dismiss/compel arbitration, jury/bench trial elections.
- Court-track letters that reference a lawsuit rely on **court/plaintiff fields** on the debt record (case number, court name, plaintiff/law firm) captured via the Litigation Command scrape-and-fill flow (`/portal/debt?tab=litigation`) — these fields are what distinguish a "court" letter from a plain "validation" letter for the same underlying debt.
- Letter body generation: `src/legal/generateCatalogLetter.ts` (outline tier) and the full `DebtLetterType` body generators referenced by `letterType` (full tier).
- Title resolution: `src/lib/resolveDebtDraftTitle.ts`. Suggestions: `src/lib/intelligentLetterSuggestions.ts`.

### 9.3 Mailing letters

- **Function:** `mailer` (op: `ping` | `status` | `verify` | send). **Flag:** `letterMailing`. **Client:** `src/lib/mailerClient.ts`.
- **Admin mail-for-partner:** `/admin/mail`. **Partner vault (batch + single):** `/portal/letters/vault`. **Admin partner letters tab:** `/admin/partners/:id?tab=letters`.
- A letter PDF must exist in blob storage (`pdfBlobRef`) before it can be mailed.
- UI shows a **TEST MODE** banner when `MAIL_TEST_MODE` / debug flags are set or vendor test-mode is detectable — confirm this banner is **off** before treating a send as live USPS mail.
- Redeploy `mailer` after any secret/testmode change: `npx supabase functions deploy mailer --no-verify-jwt`.

### 9.4 Litigation Command

`/portal/debt?tab=litigation` — drag-drop scrape + chat that auto-fills empty debt/court fields (`AffidavitCourtCenterView.tsx`). Debt-buyer intel is pattern-based (e.g. Midland/Citi-style patterns applied to similarly-shaped suits). Court partner seed data (`src/data/rooseveltCourtPartnerSeed.ts`) is imported quietly via **`/admin/partners/import` only** — do not add a prominent import button elsewhere.

---

## 10. Entitlements / Grant partner access

### 10.1 Entitlement model

`src/billing/entitlements.ts`:
- `ENTITLEMENT_KEYS` — canonical keys (`portal.reports`, `portal.disputes`, `portal.letters`, `portal.debt`, `portal.escalations`, `portal.business.build`, `letters.pack.*` specialty packs, `portal.au_seller`, etc.)
- `SERVICE_ACCESS_BUNDLES` — grouped bundles per lane (`credit_restore`, `debt`, `business`, `au_tradelines`) used by the admin one-click grant UI
- `entitlementsForProduct(productId)` — maps a purchased product to its entitlement set (Stripe webhook path)
- `trialEntitlementsForLane(lane)` / `ensurePartnerTrialEntitlements()` — 30-day trial grants by partner lane
- `ensurePartnerEntitlements()` / `ensurePartnerEntitlementsAsync()` — idempotent grant (skips already-active keys) that also pushes to Supabase via `src/data/billingSupabaseSync.ts`

### 10.2 Why cloud sync matters (and the required migration)

Admin-granted entitlements used to save **locally only** — an admin's browser showed "granted", but other sessions (partner's own device, a different admin) never saw it, because no RLS policy allowed the app to **write** `public.entitlements` from the client.

**Fix (required on every target Supabase project):**

```
supabase/migrations/202607240001_entitlements_admin_write.sql
```

This creates policy `entitlements_admin_write` — `FOR ALL` on `public.entitlements` to `authenticated` where `public.is_admin()` is true. Partners keep read-only access to their own rows via the existing select policy. Apply with `supabase db push` or by running the SQL file directly in the SQL Editor. If unapplied, the Grant UI shows "granted locally / sync failed" and partners stay locked out even though the admin saw success.

### 10.3 Grant flow (UI)

1. **Admin:** open partner → **Access / Services** panel (`src/components/admin/PartnerServicesAccessCard.tsx`) → tap **Grant Credit Letters / Bureaus access** (or the relevant bundle button).
2. Behind a `partner_access_grant` sensitive action code if one is configured (§7.3) — `SensitiveActionCodeGate` intercepts the click.
3. Expect a **green** "access on" confirmation — not "saved locally / sync failed".
4. **Partner:** hard refresh / new session → open the corresponding hub (e.g. Credit Letters → Bureaus) → journey/letter flow should now be unlocked.

Related files: `src/components/admin/AdminPartnerAccessPanel.tsx`, `src/components/admin/PartnerDetailAdminFooter.tsx`, `src/pages/admin/PartnerDetailPage.tsx` (**patch scripts only** — do not `StrReplace` this file directly; use `scripts/_patch-partner-detail-*.mjs`).

### 10.4 Verifying end-to-end

1. `git status` — confirm entitlement/grant files aren't sitting uncommitted if you're about to deploy.
2. Confirm the migration is applied on the target project.
3. Admin grants → green confirmation (not "sync failed").
4. Partner session (new login/incognito) → entitled hub unlocked → round/journey opens → disputes picker populated (not stuck on a contradictory empty state).

Full incident writeup: `DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md` (repo root).

---

## 11. Troubleshooting matrix

| Symptom | Check | Fix |
|---------|-------|-----|
| App shows marketing pages only, portal/admin routes blank or redirect | `npm run env:check` → "Marketing-only mode" | Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`, restart `npm run dev` |
| `AI Gateway is disabled (Feature Flags)` | `aiGateway` flag off | Admin → Settings → enable AI Gateway; confirm a provider key is set as an edge secret |
| AI call returns 500 `OPENAI_API_KEY missing` (or Gemini/Anthropic) | Missing edge secret | Set the key in Supabase Dashboard → Edge Functions → Secrets, retry (redeploy not required for secret changes, only for code changes) |
| Edge function 401 | ES256 JWT verification | Redeploy with `--no-verify-jwt` / confirm `supabase/config.toml` entry |
| Edge function `Forbidden` | Caller email not allowlisted | Add to `EDGE_ADMIN_EMAILS` secret |
| No welcome/invite email sent | `commsDelivery`/`inviteDelivery` flag off, SMTP secrets unset, or function not deployed | Check flag, run `comms-ping` from admin, confirm `send-partner-welcome`/`send-invite-email` deployed |
| Partner clicks welcome link and lands on portal instead of password-setup | CTA pointed to `/portal/dashboard` for an unclaimed partner | Verify email HTML uses `/signup?invite=1&partnerId=…` (see `docs/DEVELOPER_HANDOFF.md` §2–3) |
| Report parses but letters have no recipient address | Creditor Contacts section not detected | Open Parsing diagnostics panel; if `needsReparse`, click Re-parse; if still missing, re-upload the **HTML** export (not PDF) |
| Admin grants access but partner still locked out on another device | `entitlements_admin_write` RLS policy migration not applied | Apply `supabase/migrations/202607240001_entitlements_admin_write.sql` |
| Sensitive action always fails even with a code entered | Code was never set, or wrong key | Set the code in `/admin/access` → Sensitive action codes; confirm you're using the matching `SensitiveActionKey` |
| Physical letter shows as "sent" but you're not sure if it's live USPS | `MAIL_TEST_MODE` / vendor test flag active | Check the TEST MODE banner in the mail UI before trusting a send as live |
| `platform-cron` / `automation-runner` runs but nothing happens | Dry-run default | Pass `{ "action": "tick", "dryRun": false }` explicitly |
| Build fails in CI but works locally | Local `.env.local` values leaking into a check that expects placeholders | CI sets `VITE_SUPABASE_URL=https://ci-placeholder.supabase.co` explicitly for the build job — don't assume local secrets are used in CI |
| `npm run build` fails | Any of: sitemap generation, staff portraits fetch, `tsc`, `vite build`, deploy-handoff, or dist verification | Run `npm run typecheck` alone first to isolate TS errors from the other build sub-steps |

---

## 12. Useful npm scripts

Full list is in `package.json`; the ones you'll actually use day-to-day:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on `127.0.0.1:5173` (strict port) |
| `npm run dev:host` | Same, bound to `0.0.0.0` for LAN access |
| `npm run typecheck` | `tsc --noEmit` only — fastest way to check for TS errors |
| `npm run env:check` / `npm run env:setup` / `npm run env:dev-supabase` | Local env diagnostics / bootstrap / dev-Supabase walkthrough |
| `npm run dev:check` | `typecheck` + `env:check` |
| `npm run build` | Sitemap + syndication feeds + staff portraits + `tsc` + `vite build` + deploy handoff + dist verification |
| `npm run preview` | Serve `dist/` locally via Vite preview |
| `npm run start` | Serve `dist/` on port 8080 via `serve` |
| `npm run supabase:login` / `:link` / `:db:push` | Supabase CLI via `npx` — no global install |
| `npm run deploy:functions` / `-- --all` | Deploy launch-critical (or all) edge functions with `--no-verify-jwt` |
| `npm run secrets:check` / `secrets:summary` | Presence checks for required client/edge secrets (no values printed) |
| `npm run rls:check` | RLS smoke checks against the linked Supabase project |
| `npm run migrations:check` | Verify migration files exist on disk |
| `npm run ci:check` | CI-safe pre-deploy gate (what GitHub Actions runs) |
| `npm run e2e:smoke` | Module smoke test + typecheck, no browser |
| `npm run e2e:playwright` / `e2e:playwright:install` | Full Playwright E2E (install Chromium first) |
| `npm run launch:status` / `launch:summary` / `launch:ops` | Fast readiness snapshots (file-based, no live checks / one-screen QA-vs-env-vs-code view) |
| `npm run launch:go-live` | Preflight + deploy checklist once Supabase keys are live |
| `npm run predeploy:check` | Full production gate incl. local secrets + RLS |
| `npm run post-deploy:verify -- https://your-domain.com` | Smoke-check a deployed URL |
| `npm run voice:prerender` / `voice:catalog:check` | Pre-render/verify Voice Studio narration assets |
| `npm run audit:legacy` / `extract:legacy-reasons` | Legacy SQL/dispute-reason audits (migration support) |
| `npm run verify:creditor-contacts` | Smoke-verify creditor contact extraction against sample reports |
| `npm run dispute:track:audit` | Validation vs court track purity audit (no cross-contamination between hubs) |

---

## 13. Branching note

- This repo's docs (`docs/DEVELOPER_HANDOFF.md`, `DEV_URGENT_*.md` at repo root) currently direct engineers to work on **existing feature/preview branches** (e.g. `preview/sitewide-ux-pack-merge` per the urgent handoff notes) rather than cutting new branches for urgent fixes. At the time of writing this guide, the checked-out branch is `fix/chat-vault-screenshots-and-address-extract` with local uncommitted changes.
- **Do not invent a new branching process.** Check `git branch --show-current` and the most recent `DEV_URGENT_*.md` file at the repo root before starting work — they name the exact branch to use for in-flight priorities.
- **Do not commit or push** as part of following this guide — that decision belongs to the owner/team lead per the workspace rules.
- `PartnerDetailPage.tsx` must only be modified via patch scripts (`scripts/_patch-partner-detail-*.mjs`), never `StrReplace`/direct edits — this applies regardless of which branch you're on.

---

## 14. Recent product surfaces (2026)

Product/IA work that landed around careers sell pages, tradelines vs AU sellers, agency buy-ins, Platinum Workspace admin UI, home/nav wayfinding, affiliate payout paths, and the letters evidence/screenshot flow. The runbook above (§1–§13) is unchanged; this section is a map of the new/changed surfaces so you can jump to the right files.

| § | Area | Status |
|---|------|--------|
| [14.1](#141-careers-sellable-pages--cs-join-wizard) | Careers sellable pages + CS join wizard | Shipped |
| [14.2](#142-tradelines-buy-vs-au-sellers-supply) | Tradelines (buy) vs AU sellers (supply) | Shipped |
| [14.3](#143-agency-buy-in-ladder) | Agency 6-tier buy-in ladder | Shipped |
| [14.4](#144-platinum-workspace-partner-overview--profile) | Platinum Workspace (Overview/Profile color-pop) | Shipped |
| [14.5](#145-home-hero-cta--nav-wayfinding) | Home hero CTA + nav wayfinding (Dispute guide) | Shipped |
| [14.6](#146-affiliate-paths--denefit-profit-share) | Affiliate paths + Denefit profit share | Shipped — base % + Denefit stacks |
| [14.7](#147-letters-in-popup-account-choose--screenshot-capture) | Letters: in-popup account choose + screenshot capture | Shipped |
| [14.8](#148-plan-docs-index-docsplans) | Plan docs index (`docs/plans/`) | Reference |
| [14.9](#149-key-configs-quick-index) | Key configs (quick index) | Reference |

### 14.1 Careers sellable pages + CS join wizard

Public career / join surfaces (full public chrome via `PageShell`):

| Route | Role |
|-------|------|
| `/credit-specialist` | Credit Specialist sell page |
| `/credit-specialist/join` | CS join wizard (multi-step) — `src/pages/CreditSpecialistJoinPage.tsx` |
| `/agency-partners` | Agency partner sell + buy-in ladder |
| `/affiliate` | Affiliate program sell page — `src/pages/AffiliatePage.tsx` |
| `/au-sellers` | AU seller (tradeline supply) career page — see §14.2 |

**Redirects** (keep marketing links working — all in `src/App.tsx`):

| Old / alias path | Redirects to |
|-------------------|----------------|
| `/credit-specialists` | `/credit-specialist` |
| `/agents` | `/credit-specialist` |
| `/credit-specialist/onboarding` | `/credit-specialist/join` |
| `/credit-specialist-apply` | `/credit-specialist/join` |
| `/au-seller` | `/au-sellers` |
| `/services/tradelines`, `/pricing/tradelines` | `/tradelines` |

**Shared UI** under `src/components/careers/`:

| Component | Purpose |
|-----------|---------|
| `CareerTierChooser` | Tier selection (used on CS, agency, affiliate sell pages) |
| `CareerPackagePanel` | Package / offer detail panel |
| `CareerGuideTwoSheetMedia` | Guide / two-sheet marketing media block |
| `CareerSignupProgress` | Join-wizard step progress indicator |
| `CareerTierStickySummary` | Sticky tier summary rail on sell pages |
| `CareerChoiceApply` | Apply/lead-capture form embedded in tier choice |
| `CareerQualificationsPanel` | "Who this is for" qualifications panel |
| `CareersQuickNav` | Cross-links between career tracks (CS / agency / affiliate / AU seller) |
| `CareerOtherTracksLink` | Single "looking for a different track?" link |
| `careerUi.ts` | Shared style tokens/helpers for the careers surfaces |

**CS join wizard flow** (`CreditSpecialistJoinPage.tsx`):
- Multi-step: tier choice → lead-entry commitment (CSV bulk import or manual add, `parseLeadsCsv`) → account signup.
- Intent persistence: `src/lib/creditSpecialistJoinIntent.ts` — `loadCreditSpecialistJoinIntent()` / `saveCreditSpecialistJoinIntent()` / `addDraftLeadToJoinIntent()` / `minLeadsRequiredWithBonus()`. Survives page reloads so a partial wizard isn't lost.
- Offer copy/pricing SSOT: `src/config/creditSpecialistOffer.ts` (`CS_OFFER`, `getCreditSpecialistOfferTier`, `creditSpecialistAccountSignupUrl`).
- Digital invite card attribution (`?invite=…&src=digital-card`) is captured via `src/lib/digitalInviteCardAttribution.ts` and tagged onto the resulting lead — same mechanism reused by AU seller and affiliate join flows.

### 14.2 Tradelines (buy) vs AU sellers (supply)

Two products must stay visually and verbally split:

| Intent | Route | Nav home | Notes |
|--------|-------|----------|-------|
| **Buy** AU / primary tradelines | `/tradelines` | Solutions | Inventory + checkout / get matched. Do **not** hero "become a seller." |
| **Become** an AU / tradeline supplier | `/au-sellers` | Public / Careers | "You supply cards · Finely brings buyers." Do **not** browse buyer inventory as the hero. |

**Path carve-out:** app chrome for seller workspace is `/au/…` (marketplace, requests, orders) — see `AU_SELLER.marketplacePath` etc. in `src/config/auSellerProgram.ts`. `/au-sellers` (and `/au-seller` → `/au-sellers`) stays a **public** career page — do not treat `startsWith('/au')` as app-only without excluding `/au-sellers` (see the guard comment near `src/App.tsx:1054`).

**Payouts (`src/config/auSellerProgram.ts`):**

| Tier id | Name | Payout % | Requirement |
|---------|------|----------|-------------|
| `starter` | Starter | 35% (floor) | 1–2 verified cards, basic issuer requirements met |
| `growth` | Growth | 45% | 3+ cards, clean utilization, on-time season rotations (badge: "Most sellers land here") |
| `pro` | Pro | 55% | Higher limits, multi-bureau reporting, dependable fulfillment |
| `elite` | Elite | 65% | Top inventory strength/reliability tier |

`AU_SELLER.defaultCommissionPct` = `35` is the published floor; `AU_SELLER_PAYOUT_TIERS` is the full ladder — advancement is automatic based on inventory strength, not a manual admin toggle.

**Invites:** `?invite=tradelines` (and related query params, e.g. `&src=digital-card`) stay on `/tradelines` for attribution only (see `src/App.tsx:600`) — no separate invite route.

**Solutions nav wiring:** `src/config/siteWayfinderLanes.ts` — `PUBLIC_SOLUTIONS_SECTIONS`/dropdown entries include `id: 'tradelines'` → `/tradelines`. `matchSolutionsPath()` explicitly matches `/tradelines*`; `matchResourcesPath()` explicitly excludes `/tradelines*` so the two nav dropdowns never double-highlight the same route.

Plan: [`docs/plans/tradelines-au-split-and-agency-buyin.md`](plans/tradelines-au-split-and-agency-buyin.md).

### 14.3 Agency buy-in ladder

Six **one-time** buy-ins, mapped 1:1 to agency capacity tiers (floor ≥ $1,000):

| Buy-in id | Capacity tier | Price (one-time) | Seats / files | Keep-% story |
|-----------|---------------|------------------|----------------|--------------|
| `agency_buyin_starter` | Agency Starter | $1,000 | 1 seat • 20 files | 30% training → 45% certified |
| `agency_buyin_growth` | Agency Growth | $9,900 | 2 seats • 50 files | 42% training → 52% certified |
| `agency_buyin_operator` | Agency Operator | $24,997 | 4 seats • 100 files | 46% training → 58% certified |
| `agency_buyin_pro` | White-Label Pro | $99,000 | 6 seats • 175 files | 50% at launch → 62% independent |
| `agency_buyin_scale` | Agency Scale | $249,000 | 10 seats • 300 files | 50% ramp-up → 58% certified |
| `agency_buyin_enterprise` | Enterprise | $499,000 | Unlimited seats/files | Custom, negotiated up to 68% |

Sources of truth:

- `src/config/pricingCatalog.ts` — SKU / price ids (`getPackageById`), capacity tier definitions (`agencyTiers`)
- `src/config/agencyPartnersProgram.ts` — public buy-in copy (`AGENCY_BUY_IN_COPY`), 1:1 tier↔buy-in maps (`AGENCY_BUY_IN_CAPACITY_TIER_ID`, `recommendedAgencyBuyInIdForTier`, `agencyCapacityTierIdForBuyIn`), `getPublicAgencyBuyInTiers()`
- Public page: `/agency-partners` (`src/pages/agency/AgencyPartnersPage.tsx`) — renders **all six** buy-ins with keep-%/seats/white-label depth so it reads as investing in a real white-label business, not a discount ladder

Plans: [`docs/plans/tradelines-au-split-and-agency-buyin.md`](plans/tradelines-au-split-and-agency-buyin.md), [`docs/plans/admin-color-pop-agency-buyins-push.md`](plans/admin-color-pop-agency-buyins-push.md).

### 14.4 Platinum Workspace (Partner Overview / Profile)

Admin partner detail (Overview + Profile) uses a dedicated **always-light** workspace surface, scoped by the `.fc-admin-workspace` CSS class — cool white/graphite ground with **solid accent pop cards** (deep emerald / gold / navy / sky / rose fills or thick accent borders), not washed-out gray-on-white or marketing ivory. It is **not** gated by the public dark/light theme toggle — always light, independent of `lightThemePublic`.

| Piece | Location |
|-------|----------|
| Surface helpers / tokens | `src/features/os/finelyOsAdminSurface.ts` |
| CSS vars (`--fc-admin-bg`, `--fc-admin-surface`, `--fc-admin-surface-sunken`, `--fc-admin-border[-strong]`, `--fc-admin-ink[-muted/-faint]`, `--fc-admin-accent`, `--fc-admin-status-*`, `--fc-admin-tone-*`) | `src/index.css` (`:root`, near `--fc-admin-bg: #f4f5f7`) |
| Consumers | `PartnerOverviewTab`, `PartnerProfileTab`, `EntityDetailShell` (`surface="admin"`), related partner admin chrome |

**Tone system (`FcAdminTone`):** `neutral | emerald | gold | sky | navy | rose` — one tone per *type of thing*, not a decorative per-index rotation:

| Tone | Semantic use |
|------|--------------|
| `emerald` | Primary / overall / success |
| `gold` | Evidence, financial/contract detail, secondary emphasis |
| `sky` | Scores, informational / improvement actions |
| `navy` | Identity, contact, access/administrative detail |
| `rose` | Risk, danger, blockers |

Key helpers: `fcAdminCard(padding, tone)` (2px colored border + ~8% tint for non-neutral), `fcAdminInnerTile()`, `fcAdminKpi()`, `fcAdminStatusChip('ok' | 'warn' | 'blocked')` (solid fills, not 10% ghosts), `fcAdminScoreCell()`, plus button classes `FC_ADMIN_PRIMARY_BTN` (solid emerald), `FC_ADMIN_SECONDARY_BTN` (gold outline → solid gold on hover), `FC_ADMIN_DANGER_BTN`/`FC_ADMIN_DANGER_PANEL` (rose).

**Note:** site-wide light-theme polish for the rest of the app is a **later** plan — do not conflate Platinum Workspace tokens with public marketing light glass (`fc-light-*` / ivory sell bands) or with `finelyOsLightUi.ts` (which is dark-by-default despite its name — see root-cause audit in the plan doc below).

Plans: [`docs/plans/partner-overview-profile-professional-ui.md`](plans/partner-overview-profile-professional-ui.md), [`docs/plans/admin-color-pop-agency-buyins-push.md`](plans/admin-color-pop-agency-buyins-push.md).

### 14.5 Home hero CTA + nav wayfinding

- **Home hero primary CTA** (`HeroSection` inside `LandingRoute`, `src/App.tsx`) → `onGetStarted={() => navigate('/pricing/business-credit')}` — the hero routes straight into **business credit pricing**, not a generic signup. `onViewTradelines` routes to `/tradelines` (see §14.2).
- **Header nav:** `PUBLIC_CORE_NAV` in `src/config/siteWayfinderLanes.ts` exposes exactly two top-level tabs — **Home** and **Dispute guide** (`id: 'free-guide'`, label `"Dispute guide"`, path `/free-guide`). This is intentional: hero CTAs and Solutions/Resources cover the other funnels, so the header must **not** duplicate a second "Free guide" button.
- The homepage still has its own **"Start free guide"** in-page CTA further down the page (the free-guide teaser band, `src/App.tsx` inside `LandingRoute`) — that is a **different, in-page** button, not a header nav item, so it does not violate the "no duplicate Free guide buttons" rule. `matchResourcesPath()` explicitly returns `false` for `/free-guide*` so the Resources dropdown never double-highlights it either.

### 14.6 Affiliate paths + Denefit profit share

> **Status: shipped.** Payout is **additive**: base commission % on the referral’s package/service sale **plus** Denefit / in-house-financing profit share when that referral chooses a Denefit contract — never “percentage OR profit share.” Canonical copy: `AFFILIATE_STACKING_NOTE` in `src/config/affiliateProgram.ts`.

Source of truth: `src/config/affiliateProgram.ts` (`AF`, `AFFILIATE_PATHS`, `AFFILIATE_STACKING_NOTE`, `AFFILIATE_OFFERINGS`) + `src/config/denefitsProgram.ts`.

| Path id | Ladder | Payout stack (published `AF` %) | Incentive depth |
|---------|--------|----------------------------------|-----------------|
| `referrer` | Tier 1 · Entry | ~20% upfront on sale; **+** ~8% Denefit share if they take Denefit | Toolkit basics; no priority block |
| `recurring_partner` | Tier 2 · Growth | Upfront + ~15% residual on active plans; **+** Denefit share when applicable | Deeper toolkit + priority |
| `denefit_stream` | Tier 3 · Specialist (“Denefit-focused partner”) | Still earns package % on non-Denefit sales; **+** Denefit share on Denefit contracts | Strongest Denefit tools / residual story |

Sell page: `src/pages/AffiliatePage.tsx` (stacking band, tier badges, multi-block “what you get”). Calculator footer: `AffiliateCommissionCalculator.tsx` (“stacks on top — never instead of”).


**The base % + Denefit profit-share model:** an affiliate is not limited to one path — the intended design (per `AFFILIATE_OFFERINGS` "Denefit referral stream" entry and `DENEFITS_AFFILIATE_COPY`) is that referring an in-house Denefit financing contract earns the Denefit share **in addition to** whatever base upfront/recurring commission the affiliate already earns on the underlying service sale. This is the "base % PLUS Denefit profit share when in-house financing is used" story — implemented today as a separate selectable path (`denefit_stream`) with copy that says it stacks, rather than as an automatic combined line-item; if the product decision is to always auto-stack for every affiliate regardless of selected path, that still needs to be wired into the commission calculator (`src/components/calculators/AffiliateCommissionCalculator.tsx`) and payout orchestrator (`src/billing/orchestrator.ts`, `src/domain/partnerEconomics.ts`).

**Denefit brand/config notes (`src/config/denefitsProgram.ts`):**
- User-facing brand is **Denefit** (singular) — never "Denefits" or the underlying vendor name in visible copy.
- `DENEFITS.defaultSpecialistSharePct` (12%) and `DENEFITS.defaultAffiliateSharePct` (8%) are the two role-specific shares — Credit Specialists earn the specialist share (`DENEFITS_SPECIALIST_COPY`), affiliates earn the affiliate share (`DENEFITS_AFFILIATE_COPY`).
- Public homepage/marketing CTAs use `FINANCING_PREAPPROVAL_PUBLIC` (Finely Cred voice) and must not name the third-party vendor; the actual application URL is `FINANCING_PREAPPROVAL_URL` (single source of truth — do not hardcode elsewhere).
- Admin-side contract mapping/config lives in `settingsRepo.ts` (`getDenefitsSettings`, `getDenefitsContracts`, `isDenefitsConfigured`) — `denefits.status` flips from `not_configured` once a `merchantId` is set.

Related UI: `src/pages/AffiliatePage.tsx` (sell page + path chooser via `CareerTierChooser`), `src/pages/affiliate/AffiliateHubPage.tsx` (signed-in hub), `src/components/affiliate/AffiliateReferralToolkit.tsx`, `src/components/affiliate/AffiliateRoleAutomationPanel.tsx`, `src/components/denefits/DenefitsEnrollmentPanel.tsx`.

### 14.7 Letters: in-popup account choose + screenshot capture

> **Status: shipped.** Partners/admins can choose the negative account, capture a tradeline screenshot inside the attach popup, and see selected negatives highlighted in Letters — without leaving for Credit Intel (that path remains a fallback).

**Goal:** when attaching evidence to a dispute letter, the partner (or admin, on their behalf) should be able to (a) pick **which negative account** the screenshot is for, (b) **capture the screenshot right there in the popup** (no tab-switching to Credit Intel), and (c) always see **which negatives are currently selected** for the letter while doing so.

**Component:** `src/components/evidence/EvidencePickerModal.tsx` — reusable modal, exported type `EvidencePickerAccount`:

```12:20:src/components/evidence/EvidencePickerModal.tsx
export type EvidencePickerAccount = {
  id: string;
  label: string;
  creditorName: string;
  type?: string;
  bureau?: Bureau;
  last4?: string | null;
  /** Resolved parsed tradeline, when available — required to enable in-popup capture. */
  tradeline?: ParsedTradeline | null;
  reportId?: string;
};
```

When the caller passes `accounts` (+ `selectedAccountId` / `onSelectAccount`), the modal renders an **"Capture screenshot here"** panel: an account `<select>` plus a **Take screenshot** button that calls `captureTradelineEvidenceScreenshot()` (`src/lib/captureTradelineEvidenceScreenshot.ts`) using the selected account's resolved `tradeline`. If no parsed tradeline is found for the account, the button disables and the modal falls back to `onGoCapture` ("Go capture in Credit Intel instead") or manual upload via `EvidenceUploader`.

**Wiring in `src/components/letters/LettersCommandCenter.tsx`:**

| Piece | What it does |
|-------|----------------|
| `evidencePicker` state (`{ candidateId?: string }`) | Which negative the picker popup currently targets |
| `evidencePickerCandidate` (`useMemo`) | Resolves `evidencePicker.candidateId` back to the full selected-dispute record |
| `evidencePickerAccounts` (`useMemo`, ~line 2546) | Builds the `EvidencePickerAccount[]` list from **all currently selected disputes** (`selectedDisputes.map(...)`), resolving each account's parsed tradeline via `findMatchingTradeline()` so in-popup capture works per-account |
| `evidencePickerItems` (`useMemo`) | Ranks existing screenshot evidence by match quality for the targeted candidate (`rankEvidenceMatches`) so the best-matching screenshots surface first |
| "Selected negatives (N)" strip (~line 4918) | Always-visible chip row of every selected dispute account; clicking a chip jumps the workspace to that bureau/account; chips show an amber "targeted" state, an emerald "screenshot attached" state, or a plain "no screenshot yet" state — this is the **selected-negative visibility** requirement |

**Account-match guardrail:** `src/utils/evidenceMatch.ts` (`scoreEvidenceForAccount`, `evidenceMatchesAccount`, `describeEvidenceMismatch`, `EVIDENCE_MATCH_ATTACH_MIN`) — when `strictAccountMatch` is on (the default whenever a specific candidate is targeted), a screenshot that doesn't clearly match the targeted account is blocked from attaching, with an explanatory message instead of a silent failure. This exists so a partner can't accidentally attach the wrong creditor's screenshot to a dispute.

**Not yet closed / worth checking when you touch this flow:**
- Confirm the "Capture screenshot here" panel's account dropdown always defaults to the letter's *current* focused account (not just `accounts[0]`) when opened from a specific chip.
- There is no dedicated `docs/plans/*.md` for this flow yet — this subsection is the design record until one exists; update it here first if the design changes materially.

### 14.8 Plan docs index (`docs/plans/`)

| Plan doc | Covers |
|----------|--------|
| [`tradelines-au-split-and-agency-buyin.md`](plans/tradelines-au-split-and-agency-buyin.md) | Tradelines buyer page vs AU seller careers split, `/tradelines` single-inventory-row rule, invite URL handling, original agency $1k buy-in ask |
| [`partner-overview-profile-professional-ui.md`](plans/partner-overview-profile-professional-ui.md) | Platinum Workspace root-cause audit (why `finelyOsLightUi.ts` is dark-by-default), palette/token plan, scope (`PartnerOverviewTab`/`PartnerProfileTab`/`EntityDetailShell`/`PartnerDetailSidebarNav`/`PageShell` admin lane) |
| [`admin-color-pop-agency-buyins-push.md`](plans/admin-color-pop-agency-buyins-push.md) | Solid color-pop pass on Overview/Profile, the 6-tier agency buy-in ladder (this doc's origin), the ask to update this developer guide, and a push-to-GitHub step |

These plans are historical build records, not living specs — once a plan's work ships, this §14 (or the relevant numbered section) is the up-to-date reference; the plan doc stays as context for *why*.

### 14.9 Key configs (quick index)

| File | What it owns |
|------|----------------|
| `src/config/creditSpecialistOffer.ts` | CS offer / package story for sell + join |
| `src/lib/creditSpecialistJoinIntent.ts` | Join-wizard intent persistence |
| `src/config/affiliateProgram.ts` | Affiliate program; **`AFFILIATE_PATHS`** (+ path helpers) — see §14.6 |
| `src/config/denefitsProgram.ts` | Denefit in-house financing brand/copy + specialist/affiliate share %s — see §14.6 |
| `src/config/publicCareers.ts` | Public careers lane / card registry |
| `src/config/auSellerProgram.ts` | AU seller program + **`AU_SELLER_PAYOUT_TIERS`** (35% floor) — see §14.2 |
| `src/config/agencyPartnersProgram.ts` | Agency sell copy + buy-in ↔ tier mapping — see §14.3 |
| `src/config/pricingCatalog.ts` | Agency buy-in SKUs / prices (and related catalog rows) |
| `src/config/siteWayfinderLanes.ts` | Public wayfinder; Solutions **Tradelines → `/tradelines`**; `PUBLIC_CORE_NAV` (Home / Dispute guide) — see §14.5 |
| `src/features/os/finelyOsAdminSurface.ts` | Platinum Workspace tokens/tones — see §14.4 |
| `src/components/evidence/EvidencePickerModal.tsx` | Evidence picker + in-popup account choose/capture — see §14.7 |

---

## See also

- `docs/LOCAL_DEV.md` — quick start + modes + key routes
- `docs/DEVELOPER_HANDOFF.md` — production ops runbook (golden rules, onboarding flows, AI gateway, edge auth matrix, RLS, automation/nurture, mail, deploy checklist)
- `docs/PRODUCTION_DEPLOY.md` — environments, pre-deploy checklist, feature flags, rollback, CI workflows
- `docs/CREDIT_REPORT_PARSING_DIAGNOSTICS.md` — report parsing diagnostics panel
- `docs/SECURITY_ARCHITECTURE_SUPABASE.md` — target-state RLS/tenant model
- `docs/PLATFORM_CRON.md` — server cron ticks (digest, nurture, billing)
- `docs/VOICE_STUDIO_API.md` — Voice Studio render API
- `docs/plans/tradelines-au-split-and-agency-buyin.md` — tradelines vs AU sellers + agency buy-in rules (§14.2, §14.3, §14.8)
- `docs/plans/partner-overview-profile-professional-ui.md` — Platinum Workspace (admin Overview/Profile) plan (§14.4, §14.8)
- `docs/plans/admin-color-pop-agency-buyins-push.md` — admin color-pop + 6-tier agency buy-ins + guide update (§14.3, §14.4, §14.8)
- `DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md`, `DEV_URGENT_MAIL_AND_LITIGATION.md`, `DEV_URGENT_LITIGATION_ROLES_MEETINGS.md`, `DEV_URGENT_BC_PRICING_ONESHEETS.md` (repo root) — current in-flight priority handoffs
