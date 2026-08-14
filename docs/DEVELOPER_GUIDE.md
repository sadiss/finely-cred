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
14. [Recent product surfaces (2026)](#14-recent-product-surfaces-2026) — careers/CS join, tradelines vs AU sellers, agency buy-ins, Platinum Workspace, home/nav wayfinding, affiliate + Denefit share, letters evidence capture, **debt guide mockup + video wordmark (§14.10)**, plan docs index
15. [Launch sprint runbook (Aug 2026)](#15-launch-sprint-runbook-aug-2026) — **CTA spine, growth agents, video/voice studio, mail live mode, admin view-as, partner hub launchers, client seeds, personal credit UX**
16. [Platform expansion ship (Aug 2026)](#16-platform-expansion-ship-aug-2026) — **letters preview/save, unified chat brain, public chat UX, nationwide geo hunts, Ruth Command, video copilot 5-step wizard, booking invites, Alex appointments, marketing wow layer**
17. [Restore lane + letters ship (Aug 2026)](#17-restore-lane--letters-ship-aug-2026) — **personal credit package tile text, Ask Finely text-only strip, per-class mail pricing, letter mail-To backfill, partner hub modals**
18. [Growth Agents & Marketing Automation (Aug 2026)](#18-growth-agents--marketing-automation-aug-2026) — **agent org hierarchy, agent brain/sub-agents, handoff ledger, attribution/learning loop, lead-intel swarm honesty labeling, CRM sequences + A/B testing, automation orchestration, calendar/booking, comms safety rails**
19. [Ruth (AI Co-Owner), public chat brain, knowledge/RAG, and compliance review gate (Aug 2026)](#19-ruth-ai-co-owner-public-chat-brain-knowledgerag-and-compliance-review-gate-aug-2026) — **Ruth's tool-calling, public chat personas, unified knowledge index, doctrine repos, pgvector status, compliance gate, psychology engine**
20. [Server cron, reliability, Content Studio media & public funnel/referral (Aug 2026)](#20-server-cron-reliability-content-studio-media--public-funnelreferral-aug-2026) — **platform-cron server migration, retry queue, server-side comms safety, dual-write sync, media production engine, proof/pricing/referral system, missed-call text-back, calendar-sync groundwork**
21. [Letter lifecycle hardening (Aug 2026)](#21-letter-lifecycle-hardening-aug-2026) — **unsaved-edit protection, mail/ledger reconciliation, evidence-exhibit regression fix**

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
| `MAIL_PROVIDER`, `MAIL_API_ID`, `MAIL_API_KEY`, `MAIL_LIVE_MODE` / `LETTERSTREAM_LIVE_MODE`, `MAIL_TEST_MODE`, `MAIL_DEBUG`/`LETTERSTREAM_DEBUG` | `mailer` | Physical letter mailing (LetterStream / Finely Mail white-label). Set **`MAIL_LIVE_MODE=true`** and unset test/debug secrets when the account is live — see §15.4 |
| `FAL_KEY` / `FAL_API_KEY` | `video-motion-render` | Optional cinematic motion (Luma via Fal). Presenter Mode (stills + VO + browser WebM) works without this — see §15.3 |
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

#### 9.2.1 Letter closing spacing (disclaimer + CTA after numbered lists)

> **Quick reference — read this first when partners say “the closing is cramped”**

| What | Where |
|------|--------|
| **Single normalizer (all letters)** | `normalizeLetterBlockSpacing()` in `src/lib/letterBodySafety.ts` — runs inside `stripLetterVendorBranding()` before every PDF, preview, and save |
| **Plain → HTML paragraphs** | `plainTextToHtml()` in `src/utils/richText.ts` — calls the normalizer so editor/preview get separate `<p>` blocks |
| **HTML → plain round-trip** | `htmlToPlainText()` — re-applies the normalizer after conversion |
| **Debt validation 30-day block** | `VALIDATION_30_DAY_RECEIPT_BLOCK` in `src/legal/validationLetterClauses.ts` |
| **Full validation letter body** | `getValidationRequestBody()` in `src/legal/debtLetterTemplates.ts` |
| **PDF extra gap after list → closing** | `src/letters/generateTextPdf.ts` (debt/court letters) |
| **Paper preview CSS** | `.fc-paper-prose p + p` in `src/index.css` |

**Rule:** After the **last numbered demand** (e.g. item 15 on debt validation), there must be a **blank line** before disclaimer / CTA / 30-day / “Sincerely,” blocks. Do **not** hand-fix spacing in the editor — extend `normalizeLetterBlockSpacing()` or the template in `debtLetterTemplates.ts`.

**Verify before merge:**

```powershell
node scripts/verify-letter-closing-spacing.mjs
npm run typecheck
```

**Partner-visible check:** Letter Studio → generate **Initial validation (FDCPA § 809)** → paper preview → confirm visible gap after item 15 before “If you cannot provide…” and before the 30-day block.

### 9.3 Mailing letters

- **Function:** `mailer` (op: `ping` | `status` | `verify` | send). **Flag:** `letterMailing`. **Client:** `src/lib/mailerClient.ts`.
- **Admin mail-for-partner:** `/admin/mail`. **Partner vault (batch + single):** `/portal/letters/vault`. **Admin partner letters tab:** `/admin/partners/:id?tab=letters`.
- A letter PDF must exist in blob storage (`pdfBlobRef`) before it can be mailed.
- UI shows a **TEST MODE** banner when `MAIL_TEST_MODE` / debug flags are set or vendor test-mode is detectable — confirm this banner is **off** (or green **LIVE production mail** shows) before treating a send as live USPS mail. Production flip: `MAIL_LIVE_MODE=true` on the `mailer` edge function + remove test/debug secrets + redeploy — see §15.4.
- Redeploy `mailer` after any secret/testmode change: `npx supabase functions deploy mailer --no-verify-jwt`.
- **LetterStream `-904` (page count mismatch):** `estimatePdfPageCount()` in `supabase/functions/_shared/letterStreamClient.ts` reads the PDF `/Type /Pages` `/Count` before send. If LetterStream still returns `-904`, the client **auto-retries once** without the `pages` field so the vendor reads the file directly. UI copy: `src/lib/mailerClient.ts`. If both attempts fail, regenerate the letter PDF from Letter Studio and retry.

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
| Physical letter shows as "sent" but you're not sure if it's live USPS | `MAIL_TEST_MODE` / vendor test flag active | Set `MAIL_LIVE_MODE=true`, unset `MAIL_TEST_MODE`/`MAIL_DEBUG`, redeploy `mailer`; confirm green LIVE banner (§15.4) |
| Mail send fails with `-904` / "page count does not match" | Stale `pages` field vs actual PDF | Edge auto-retries without `pages`; redeploy `mailer` if code is old; regenerate letter PDF and retry (§9.3) |
| Bare `/onboarding` links in public CTAs | Audit drift | Run `npm run cta:bare-onboarding:audit` — must return 0; use `resolveFinelyCtaPath()` (§15.1) |
| Letter closing / disclaimer glued to last numbered item | Missing `\n\n` or editor merged `<p>` | Run `node scripts/verify-letter-closing-spacing.mjs`; fix `normalizeLetterBlockSpacing()` (§9.2.1) — not manual partner spacing |
| `/resources#presenter-demo` shows "Video not generated yet" | WebM missing from deploy | Run `npm run demo:launch:video` locally, commit `public/demos/finely-launch-demo.webm` (§15.3) |
| Admin Partners missing Max Jean-Baptiste after deploy | Migration not applied | Run `supabase db push` (migration `202608110001_max_jean_baptiste_partner_seed.sql`) or open Admin → Partners (auto-seed on load) — §15.7 |
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
| `npm run demo:launch:video` | Generate launch presenter WebM (`public/demos/finely-launch-demo.webm`) — needs ffmpeg; see `docs/DEMO_VIDEOS.md` |
| `npm run cta:bare-onboarding:audit` | Fail if any public CTA still links bare `/onboarding` (must be 0 before merge) |
| `npm run tour:scan:video` / `tour:demos:full` | Playwright site scan + tour MP4 pipeline (dev server on `:5173`) |
| `npm run audit:legacy` / `extract:legacy-reasons` | Legacy SQL/dispute-reason audits (migration support) |
| `npm run verify:creditor-contacts` | Smoke-verify creditor contact extraction against sample reports |
| `npm run dispute:track:audit` | Validation vs court track purity audit (no cross-contamination between hubs) |

---

## 13. Branching note

- This repo's docs (`docs/DEVELOPER_HANDOFF.md`, `DEV_URGENT_*.md` at repo root) currently direct engineers to work on **existing feature/preview branches** rather than cutting new branches for urgent fixes. At the time of writing this guide, the active ship branch is **`fix/debt-guide-mockup-video-wordmark`** (letters, chat, marketing geo, video copilot, booking).
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
| [14.10](#1410-debt-guide-funnel-visuals--video-branding-2026-08) | Debt guide mockup + video wordmark | Shipped |
| [15](#15-launch-sprint-runbook-aug-2026) | **Launch sprint runbook (Aug 2026)** — CTA, agents, video, mail, view-as, seeds | **Primary reference for Aug sprint baseline** |
| [16](#16-platform-expansion-ship-aug-2026) | **Platform expansion ship (Aug 2026)** — letters, chat brain, geo hunts, Ruth, copilot wizard, booking | Shipped |
| [17](#17-restore-lane--letters-ship-aug-2026) | **Restore lane + letters ship (Aug 2026)** — package tile text, Ask Finely strip, mail pricing, mail-To backfill, hub modals | **Latest ship on `fix/debt-guide-mockup-video-wordmark`** |

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
| `src/pages/leadmagnet/debtGuideMockupAssets.ts` | Debt funnel hero book + standup PNG constants — see §14.10 |
| `src/components/leadmagnet/VideoFinelyCredWordmark.tsx` | Typography-only video brand (no raster logo) — see §14.10 |
| `src/lib/finelyCtaIntent.ts` | CTA intent spine — see §15.1 |
| `src/features/studioCommandOs/VideoCreateWizard.tsx` | Easy-mode video wizard — see §15.3 |
| `src/lib/mediaProviderRouter.ts` | Presenter Mode video pipeline — see §15.3 |
| `src/data/maxJeanBaptistePartnerSeed.ts` | Max Jean-Baptiste client seed — see §15.7 |
| `src/lib/adminPartnerViewAs.ts` | Admin partner view-as — see §15.5 |

### 14.10 Debt guide funnel visuals & video branding (2026-08)

**Canonical mockups (`debtGuideMockupAssets.ts`):**

- **Hero (single book):** `DEBT_GUIDE_MOCKUP_HERO_BOOK_SRC` → `public/images/lead-magnets/debt-eradication-mockup.png` — `/free-debt-guide` hero only (`GuideMockup` with `tall`, no `footer`).
- **Standup stack (brochure + tablet + book):** `DEBT_GUIDE_MOCKUP_STANDUP_SRC` → `public/images/lead-magnets/debt-eradication-standup.png` — homepage debt band + `/free-debt-guide` footer CTA (`GuideMockup` with `footer`).
- **Do not** use `debt-and-summons-mockup.png` or legacy booklet cutouts — those were retired.

**`/free-debt-guide` hero layout:**

- **Left:** single-book hero mockup (`GuideMockup` with `tall` on `DebtEradicationLandingPage.tsx`)
- **Right:** headline + `PremiumLeadMagnetCaptureForm`
- CSS: `debtEradicationLanding.css` (`del-hero-grid`, `del-mockup-stack--hero-book`)

**Homepage debt band:**

- `src/components/landing/LandingDebtEradicationBand.tsx` imports the same `DEBT_GUIDE_MOCKUP_STANDUP_SRC`.

**Funnel & homepage video — no raster logo:**

- Use `VideoFinelyCredWordmark` with `plaque` on `LandingCinematicVideoStage` and `LeadMagnetFunnelHeroVideo`.
- Homepage cinematic **thumbnail** stays `public/media/home-credit-solutions-poster.png` (green materials composite). Do not swap it for a navy gradient or duplicate the debt standup mockup — overlay the wordmark plaque on the poster (and during playback) instead of showing a separate logo PNG.
- Regenerating funnel mockups: `node scripts/build-debt-eradication-mockup.mjs` (kit under `public/images/lead-magnets/_kit/`).

---

## 15. Launch sprint runbook (Aug 2026)

**Status: shipped** on branch `fix/debt-guide-mockup-video-wordmark`. This section is the developer runbook for the Aug 2026 launch sprint — CTA routing, growth agents, video/voice studio, live mail, admin view-as, role hub launchers, client seeds, and personal credit public UX.

### 15.1 CTA intent spine

**Problem solved:** Public buttons were linking bare `/onboarding`, losing lane/goal context. All CTAs now route through one resolver.

**Full contract (canonical pattern, exceptions, how to add a new intent):** see
[`docs/CTA_CONTRACT.md`](./CTA_CONTRACT.md).

| Piece | Location |
|-------|----------|
| Intent resolver | `src/lib/finelyCtaIntent.ts` — `resolveFinelyCtaPath(intent, opts)` |
| Portal bootstrap | `src/components/portal/index.tsx` — reads `goal`, `tier`, `focus`, `leadId` query params |
| Role routing | `src/lib/onboardingRoleRouting.ts` — includes `case_help` + six career tracks |
| Audit gate | `scripts/audit-bare-onboarding.mjs` |

**What to run before merge:**

```powershell
npm run cta:bare-onboarding:audit   # must report 0 bare /onboarding links
```

**Intents:** `personal_free_guide`, `personal_free_trial`, `personal_intake`, `personal_package`, `business_intake`, `debt_intake`, `funding_intake`, `consultation`, `career_track`, `lead_magnet`.

**Sitewide “Start free trial”** → `personal_free_trial` → `personal_free` package signup (credit restore DIY), **not** bare `/signup` or role picker:

```text
/onboarding?package=personal_free&rail=stripe&focus=personal_restore&lane=other&role=client&skipRole=1&next=/portal/checkout?package=personal_free&rail=stripe&auth=signup
```

Used in: public nav (`App.tsx`), mobile nav (`MobileNav`), homepage CTA bands.

**Verify:** `/personal-credit` primary CTA → `personal_free_trial` (credit-restore signup onboarding, **not** `/free-guide`). Role hubs (`/agency`, `/affiliate`, `/case-help`, etc.) — each primary CTA should land with the correct onboarding query string, not a naked `/onboarding`.

### 15.2 Growth agents + marketing desk

| Goal | Admin route | Key files |
|------|-------------|-----------|
| Agent roster | `/admin/growth-agents` | `src/features/growthAgents/GrowthAgentsRoster.tsx`, `growthAgentRegistry.ts` |
| Find people (Caleb) | `/admin/growth-agents/lead-discovery` | `GrowthAgentCalebWorkspace.tsx`, `calebAutoFind.ts`, `calebQuotaMission.ts` |
| CTA / capture links (Hannah) | `/admin/growth-agents/capture-links` | `GrowthAgentHannahWorkspace.tsx` |
| Marketing director (Esther) | `/admin/growth-agents/marketing-director` | `GrowthAgentEstherWorkspace.tsx` |
| Pipeline (Benjamin) | Benjamin workspace + command guide | `benjaminPipelineQueue.ts` |
| Daily workroom | `/admin/marketing-desk` | `src/features/marketingDesk/MarketingDeskHome.tsx` |
| Growth automation | `/admin/growth-automation` | `FinelyAutomationConsole.tsx`, `src/lib/finelyAutomationOrchestrator.ts` |
| Capability scorecard | Admin growth surfaces | `FinelyCapabilityScorecard.tsx`, `src/lib/finelyCapabilityMetrics.ts` |

**Setup checklist:**

1. Admin → Settings → enable **`marketingDesk`** and **`leadIntel`** feature flags.
2. Supabase connected (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`).
3. Deploy edge functions **`lead-intel`** and **`lead-intel-worker-tick`**.
4. Set **`SERPER_API_KEY`** on `lead-intel` (required for Caleb Test search / Find).
5. **`GROWTH_WORKER_LIVE`** — leave **unset/false** until ready for live overnight ticks (default = simulation, no counter inflation).
6. Caleb → **Test search** → **Find new people** before flipping live worker.

**Deep reference:** `docs/GROWTH_AGENT_MASTER.md`, `docs/GROWTH_ACCEPTANCE.md` (S1–S12), `docs/GROWTH_AUTOMATION_CHARTER.md`.

### 15.3 Video + voice studio

**What works today (Presenter Mode):** AI storyboard plan → OpenAI scene stills → Voice Studio TTS → browser WebM stitch. Cinematic providers (Kling, Runway, Veo) are **Planned** — UI may show readiness badges but only Presenter Mode + optional Fal/Luma motion edge are real paths.

| Surface | Route | Key files |
|---------|-------|-----------|
| Content Studio home | `/admin/content-studio` | `ContentStudioDepartmentPage.tsx` |
| Easy wizard (5-step) | `/admin/content-studio?wizard=open` | `VideoCreateWizard.tsx` — Plan → Format → Scenes → Edit & Style → Export |
| Video copilot chat | Content Studio home + wizard step 1 | `VideoCreationCopilotPanel.tsx`, `videoCreationCopilotBrain.ts` |
| Advanced video room | `?view=advanced&room=video` | `VideoStudioPremiumShell.tsx` → `GeminiStyleVideoCommand.tsx` |
| Course lesson videos | `/admin/courses/:id` (Step 4) or `room=course_videos` | `AdminCourseEditorPage.tsx`, `CourseVideoBatchWorkroom.tsx` |
| Partner playback | `/portal/courses/:id` | `CourseLessonVideoPlayer.tsx` |
| Public presenter demo | `/resources#presenter-demo` | `LaunchPresenterDemoSection.tsx` (public player; admin quality-bar optional) |

**Pipeline router:** `src/lib/mediaProviderRouter.ts` (plan → stills → voice → stitch). **Shared actions:** `src/features/studioCommandOs/videoCommandActions.ts`.

**Generate launch demo WebM (public Resources player — 4-scene / ~34s reel):**

```powershell
npm run demo:launch:video
npm run demo:launch:video -- --force          # re-render (updates public/demos/finely-launch-demo.webm + .json)
npm run demo:launch:video -- --voice=studio   # Supabase Voice Studio narration
```

Scenes cover: live portal tools (not PDF-only), dispute vault, fight-back debt lane, CTA. Script: `scripts/generate-launch-demo-video.mjs`.

**Requirements:** ffmpeg on PATH **or** portable binary at `scripts/.tools/ffmpeg/bin/ffmpeg.exe` (gitignored — each dev installs locally). Output: `public/demos/finely-launch-demo.webm` — **commit this file** after render so deploy clones show the demo.

**Voice samples:**

```powershell
npm run voice:prerender
npm run voice:catalog:check
```

**Secrets (edge):** `OPENAI_API_KEY`, `CARTESIA_API_KEY`, `ELEVENLABS_API_KEY`, `VOICE_CLONE_FINELY_PRIMARY_ID`; optional motion: **`FAL_KEY`** on `video-motion-render`.

**Feature flag:** Admin → Settings → **`videoStudio`** (required for image gen in Media Studio).

**Asset map:** `docs/DEMO_VIDEOS.md` · acceptance QA: `docs/VIDEO_COMMAND_ACCEPTANCE.md` · master plan: `docs/PLAN_VIDEO_COURSE_MAXIMUM.md`.

### 15.4 LetterStream live production mail

LetterStream account is **live** — edge function must not send with debug/test flags.

| Secret (Supabase → `mailer` edge) | Effect |
|-----------------------------------|--------|
| **`MAIL_LIVE_MODE=true`** (or `LETTERSTREAM_LIVE_MODE=true`) | Forces production: no `debug` param, `testMode: false` |
| **Unset** `MAIL_TEST_MODE`, `LETTERSTREAM_TEST_MODE`, `MAIL_DEBUG`, `LETTERSTREAM_DEBUG` | Required when account is live |

| File | Role |
|------|------|
| `supabase/functions/mailer/index.ts` | `resolveMailLiveMode()`, `resolveMailTestMode()`, send path |
| `src/lib/mailerClient.ts` | `getMailProviderStatus()` — surfaces `liveMode` + `testMode` |
| `src/components/letters/LetterStreamStatusCard.tsx` | Admin mail readiness card |
| `src/components/mailing/MailProviderStatusBanner.tsx` | Partner letter-send banner |

**Deploy checklist:**

1. Supabase Dashboard → Edge Functions → **`mailer`** → Secrets: set `MAIL_LIVE_MODE=true`.
2. Remove/unset all test/debug mail secrets.
3. Redeploy: `npx supabase functions deploy mailer --no-verify-jwt`
4. Admin → Mail (or any letter send flow) → **Refresh** → confirm green **LIVE production mail** banner (not amber TEST MODE).

**`-904` page-count mismatch:** When LetterStream rejects a send because declared `pages` ≠ PDF body, `letterStreamSendSingleFile()` logs `detectedPages`, retries once **without** the `pages` field, and surfaces a clearer partner/admin message via `mailerClient.ts`. Deploy after changes: `npx supabase functions deploy mailer --no-verify-jwt`.

**Required secrets checklist (`mailer` edge):**

| Secret | Required when |
|--------|----------------|
| `MAIL_API_ID`, `MAIL_API_KEY` | Always — LetterStream credentials |
| `MAIL_LIVE_MODE=true` | Production USPS sends |
| `EDGE_ADMIN_EMAILS` | Admin mail-for-partner + guarded ops (comma-separated allowlist) |

Unset for live production: `MAIL_TEST_MODE`, `LETTERSTREAM_TEST_MODE`, `MAIL_DEBUG`, `LETTERSTREAM_DEBUG`.

### 15.5 Admin partner view-as

Lets admins open the partner portal as a specific partner without logging out.

| Piece | File |
|-------|------|
| Override state | `src/lib/adminPartnerViewAs.ts` |
| Session wiring | `src/auth/PartnerSessionContext.tsx` |
| UI button + banner | `AdminPartnerViewAsButton.tsx`, `AdminPartnerViewAsBanner.tsx` |
| Safe admin routes | `src/lib/adminPartnerRoutes.ts` |

**Rule:** Amber view-as banner must stay visible while impersonating. **`PartnerDetailPage.tsx`** — patch scripts only (`scripts/_patch-partner-detail-*.mjs`), never direct StrReplace.

### 15.6 Partner hub launchers (role dashboards)

Each role hub shows a tile grid → modal work surfaces (compact luxury density).

| Piece | File |
|-------|------|
| Presets per role | `src/components/partner/roleHubLauncherPresets.ts` |
| Tile + modal UI | `PartnerHubLauncherTile.tsx`, `PartnerHubWorkModal.tsx` |
| Hook | `usePartnerHubLauncher.ts` |

**Hubs wired:** Agency, AU Seller, Real Estate, Business Dashboard, Affiliate, Case Help, Agent, Business Profile — respective `*HubPage.tsx` files under `src/pages/`.

### 15.7 Client seed: Max Jr Ralph Jean-Baptiste

Idempotent partner record — email added later by admin.

| Field | Value |
|-------|--------|
| Display name | Max Jr Ralph Jean-Baptiste |
| Stable ID | `c7d4a291-5e83-4b6f-9a2c-1f8e6d3b7045` |
| Import key | `finely:max-jr-ralph-jean-baptiste-v1` |
| Route / lane | `personal_restore` / `funding_readiness` |
| Journey stage | `intake` |
| Email | Empty until admin adds in partner detail |

| Piece | Location |
|-------|----------|
| App seed (auto on Partners load) | `src/data/maxJeanBaptistePartnerSeed.ts` → `ensureMaxJeanBaptistePartnerAsync()` |
| SQL migration | `supabase/migrations/202608110001_max_jean_baptiste_partner_seed.sql` |
| Admin UI trigger | `src/pages/admin/PartnersListPage.tsx` (fires ensure before fetch) |

**After deploy:** `supabase db push` (or let CI apply migration) → Admin → **Partners** → **Refresh** → Max appears in directory.

### 15.8 Personal credit public UX

| Piece | Location |
|-------|----------|
| Glass hero shell | `src/features/personalCredit/PersonalCreditHeroShell.tsx` |
| Restore arc KPI | `src/components/marketing/RestoreScoreArc.tsx` |
| Visual CSS | `src/features/personalCredit/personalCreditRestoreVisual.css` |
| Public page | `/personal-credit` → `src/pages/PersonalCreditPage.tsx` |
| Hero image reference | `docs/PERSONAL_CREDIT_RESTORE_HERO_IMAGES.md` |

### 15.9 Finely Brain + public help

| Piece | Location |
|-------|----------|
| Page-aware public answers | `src/lib/finelyBrain/finelyPublicAnswer.ts` |
| Orchestration | `src/lib/finelyBrain/finelyBrainOrchestrate.ts` |
| Ask Finely strip | `MarketingStaffChatStrip` on public pages |

Partners see plain-English help on public routes (Voice + suggested chips). Not a replacement for legal advice — compliance strip stays near stats/AI surfaces.

### 15.10 Course command center

| Surface | Route | Key files |
|---------|-------|-----------|
| Admin course editor (5-step wizard) | `/admin/courses/:id` | `AdminCourseEditorPage.tsx` |
| Partner course player | `/portal/courses/:id` | `PartnerCoursePage.tsx`, `CourseLessonVideoPlayer.tsx` |
| Lesson content split | — | `src/components/courses/courseLessonContentSplit.ts` |

Video attach flow: course Step 4 → `VideoCreateWizard` modal → export attaches `video_asset` block to lesson.

### 15.11 Aug 2026 key files (quick index)

| File | What it owns |
|------|----------------|
| `src/lib/finelyCtaIntent.ts` | CTA spine — §15.1 |
| `scripts/audit-bare-onboarding.mjs` | CTA audit gate |
| `src/lib/finelyAutomationOrchestrator.ts` | Growth automation console |
| `src/lib/finelyCapabilityMetrics.ts` | Capability scorecard metrics |
| `src/lib/mediaProviderRouter.ts` | Video Presenter Mode router |
| `src/features/studioCommandOs/VideoCreateWizard.tsx` | 5-step video wizard |
| `src/features/studioCommandOs/videoCreationCopilotBrain.ts` | Video copilot brain |
| `scripts/generate-launch-demo-video.mjs` | Launch demo WebM generator (4-scene reel) |
| `src/components/resources/LaunchPresenterDemoSection.tsx` | Public demo player |
| `supabase/functions/mailer/index.ts` | Mail live/test mode |
| `src/data/maxJeanBaptistePartnerSeed.ts` | Max client seed |
| `src/lib/adminPartnerViewAs.ts` | Admin view-as |
| `src/components/partner/roleHubLauncherPresets.ts` | Role hub tiles |

---

## 16. Platform expansion ship (Aug 2026)

**Status: shipped** on branch `fix/debt-guide-mockup-video-wordmark`. Builds on §15 with letters reliability, unified public chat intelligence, nationwide marketing geo, Ruth Command strip, video copilot depth, self-book scheduling, and organic marketing differentiators.

### 16.1 Letters — preview, save, unified editor

| Fix | Key files |
|-----|-----------|
| Generate → single preview surface (no “No PDF stored yet” steal) | `LettersCommandCenter.tsx`, `LetterStudioSavedVaultStrip.tsx`, `SavedLetterCard.tsx` |
| Body-only PDF fallback in preview modal | `LetterFullPreviewModal.tsx` → `DebtLetterPreview` |
| Save text without PDF + HTML body consistency | `saveDebtDraftText`, `letterBodySafety.ts` |
| Unified rich editor (480px, toolbar, paper preview) | `LetterEditorShell.tsx`, `LetterBodyEditorModal.tsx` |
| Dispute vault edit → reload intro/footer from meta + PDF regen | `regenerateSavedLetterPdf.ts` |

**Verify:** Admin/partner Letters → Generate validation letter → one modal with preview → Edit → Save text → reopen confirms body.

### 16.2 Public chat + unified brain

| Piece | Location |
|-------|----------|
| eGuide RAG index (dispute, debt, BC, tradeline) | `src/lib/eguideKnowledgeFlatten.ts`, `finelyKnowledgeIndex.ts` |
| Public-safe filter (no admin/SOP leaks) | `searchFinelyKnowledgePublic()`, `finelyPublicAnswer.ts` |
| Public chat composer (full-width, emoji picker, chips below) | `PublicChatWidget.tsx` |
| Contextual reply emojis | `enrichPublicChatReply()` in `publicChatDocumentIntake.ts` |
| Portrait diversity audit | `scripts/audit-chat-portrait-diversity.mjs`, `staffRoster.ts` |
| Hub coach parity | `HubAiCoachPanel.tsx`, `knowledgeBaseRouter.ts` |

**Verify:** Public homepage → chat bubble → diverse on-duty face, emoji picker, lane chips with icons. Ask a guide question — answer cites public eGuide content only.

### 16.3 Marketing Desk — geo shards + Ruth Command

| Piece | Location |
|-------|----------|
| 62-metro US shard map + daily rotation | `usMetroShardMap.ts`, `marketingDeskHunt.ts`, `queryExpander.ts` |
| Caleb subagent pipeline | `growthAgentRegistry.ts`, `calebAutoFind.ts` |
| Edge hunt tick (optional live Serper) | `supabase/functions/marketing-hunt-tick/` |
| Swarm live bridge | `LeadIntelSwarmDashboard.tsx`, `leadIntelSwarmRepo.ts` |
| Ruth Command strip (co-owner weekly focus) | `MarketingDeskRuthCommandStrip.tsx`, `marketingDeskRuthFocus.ts` |
| Mail nurture auto-enroll + stop-on-reply | `marketingDeskMail.ts`, `nurtureEngine.ts`, `commsWebhookRepo.ts` |

**Note:** Page stays **Marketing Desk** — Ruth is a command strip, not a page rename.

**Deploy geo cron (optional):**

```powershell
npx supabase functions deploy marketing-hunt-tick
# Optional secret: MARKETING_HUNT_LIVE=true for one Serper probe per tick
```

### 16.4 Video studio — copilot + 5-step wizard + styles

| Piece | Location |
|-------|----------|
| Copilot chat (transcribe-only mic, no TTS on mic path) | `VideoCreationCopilotPanel.tsx`, `useFinelyVoiceInput.ts` |
| Brain task | `content.studio.video_copilot.v1` via `videoCreationCopilotBrain.ts` |
| 5-step wizard | `VideoCreateWizard.tsx` |
| Style presets + transitions | `videoStylePresets.ts`, `mediaExport.ts`, `VideoTimelineEditor.tsx` |
| Presenter quality reference loop | `presenterVideoQualityBridge.ts`, `LaunchPresenterDemoSection.tsx` |

**Verify:** `/admin/content-studio` → copilot chat → Continue to format → export. Voice mic writes text only.

### 16.5 Booking + Alex appointment agent

| Surface | Route | Key files |
|---------|-------|-----------|
| Admin invite links | `/admin/calendar` | `BookingInvitePanel.tsx`, `bookingInviteRepo.ts` |
| Public self-book | `/book/i/:token` | `PublicSelfBookInvitePage.tsx` |
| Audio-first guest join | `/meet/:eventId` | `GuestMeetingJoinPage.tsx`, `meetingUrls.ts` |
| Alex Rivera agent | `/admin/growth-agents/appointment-setter` | `GrowthAgentAlexWorkspace.tsx`, `alexAppointmentAutomation.ts` |
| Meeting reminders | Admin calendar load | `meetingReminderAutomation.ts` |

**Migration:** `supabase/migrations/202608112000_booking_invites.sql` (apply with `supabase db push` when ready).

### 16.6 Marketing wow layer (organic, no paid ads)

| Piece | Location |
|-------|----------|
| Differentiator chips + copy | `finelyMarketingDifferentiators.ts`, `FinelyMarketingWowStrip.tsx` |
| Public command strip | `FinelyOsPublicCommandStrip.tsx` |
| Lead magnet / guide copy | `leadMagnetFunnels.ts`, `freeGuides.ts`, `denefitsProgram.ts` |

**Positioning:** Guides open **live portal tools**; debt lane = **fight-back validation OS**; in-house financing **builds credit while you pay**.

### 16.7 QA gates before push

```powershell
npm run typecheck
node scripts/audit-chat-portrait-diversity.mjs
npm run demo:launch:video -- --force   # optional — refreshes public presenter reel
```

---

## 17. Restore lane + letters ship (Aug 2026)

**Status: shipped** on branch `fix/debt-guide-mockup-video-wordmark`. Builds on §16 with personal credit restore readability on dark package tiles, a text-only Ask Finely strip, per-class letter-mail pricing, mail-To meta backfill for saved letters, and partner portal hub modal fixes.

### 17.1 Personal credit restore — white text on package tiles

**Problem solved:** Ivory `PageShell` and the site-wide light-theme inversion rule remap `.text-white` → dark ink. Personal credit restore uses **dark accent pop tiles** (emerald, gold, navy, sky, rose) for featured packages and the compare catalog — prices, taglines, and meta chips must stay **white**, not inherit dark ink.

| Issue | Fix |
|-------|-----|
| Light theme inverts `.text-white` inside ivory shells | Carve-out in `src/index.css` under `[data-fc-restore-pricing="1"]` for `.fc-ivory-pop-tile` + `.fc-restore-catalog-panel [class*='fc-admin-solid']` |
| Gold `fc-admin-solid-gold` tiles use dark ink on transparent dark bed | `FinelyOsCatalogBrowser` prop `catalogDarkBed` → explicit `text-white` / `!text-white` on card shell when `adminSolid` + dark bed |
| Featured pop tiles + compare catalog inconsistent | `personalCreditRestoreVisual.css` theme-agnostic white rules on all `.fc-ivory-pop-*` accents and catalog solid cards |

| Piece | Location |
|-------|----------|
| Page scope marker | `PersonalCreditPage.tsx` — `data-fc-restore-pricing="1"` |
| Compare / DFY catalog | `PricingPackageCatalog.tsx` — passes `catalogDarkBed` |
| Catalog browser dark bed | `FinelyOsCatalogBrowser.tsx` — `catalogDarkBed` + `cardSurface="adminSolid"` |
| Visual CSS | `src/features/personalCredit/personalCreditRestoreVisual.css` |
| Light-theme exception | `src/index.css` (~line 1702) |

**Verify:** `/personal-credit` → scroll to featured package tiles + **Compare tiers** catalog → every price (`fc-ivory-glow-figure`), title, tagline, and meta chip is readable white on every accent (sky, emerald, navy, gold, rose). Toggle public light theme if enabled — text must not flip to dark ink.

### 17.2 Ask Finely — text-only strip

**Problem solved:** The sitewide help strip no longer exposes mic / TTS on public and portal chrome. Partners get prompt chips → plain-text answers via `finelyPublicAnswer()` — no voice input, no read-aloud.

| Piece | Location |
|-------|----------|
| Ask Finely strip (public + portal) | `FinelyLaunchHelpStrip.tsx` — mounted from `PageShell.tsx` |
| Brain | `finelyPublicAnswer()` in `src/lib/finelyBrain/finelyPublicAnswer.ts` |
| Prompt chips | `TEXT_PROMPTS` — “What is Finely?”, “Restore credit”, “Free guide” |
| Staff specialist grid (separate) | `MarketingStaffChatStrip.tsx` — opens `PublicChatWidget` on tap; still no mic on the strip itself |

**Not the same surface:** `HubAiCoachPanel.tsx` (portal workspace coach) and video studio copilot may still use **transcribe-only** mic — that is intentional workspace tooling, not the Ask Finely strip.

**Verify:** Any route using `PageShell` (public marketing or `/portal/*`) → **Ask Finely** strip visible → tap “What is Finely?” → plain-text reply appears below chips. No mic button, no TTS playback control on the strip.

### 17.3 Letter mail pricing — per-class `estCostCents`

**Problem solved:** Mail UI showed a flat certified-mail estimate (`DEFAULT_MAIL_COST_CENTS`) regardless of selected USPS class. Single-letter send now uses **per-class fallback cents** from `mailClassOptions.ts`; live LetterStream quotes override when addresses are complete.

| Mail class (`FinelyMailType`) | Fallback `estCostCents` | Typical use |
|-------------------------------|-------------------------|-------------|
| `firstclass` | 350 ($3.50) | Fastest path when proof/signature not required |
| `certnoerr` | 650 ($6.50) | Certified tracking without electronic return receipt |
| `certified` | 800 ($8.00) | Certified + ERR — default for court/validation/affidavit letters |

| Piece | Location |
|-------|----------|
| Class catalog + fallback cents | `src/lib/mailClassOptions.ts` — `MAIL_CLASS_CHOICES`, `mailClassChoice()`, `mailClassEstCostUsd()` |
| Single-letter modal pricing | `MailLetterModal.tsx` — `selectedCostCents` uses live quote when available, else `mailClassChoice(mailType).estCostCents` (not flat `DEFAULT_MAIL_COST_CENTS`) |
| Ledger default (wallet display only) | `mailCreditsRepo.ts` — `DEFAULT_MAIL_COST_CENTS = mailClassChoice('certified').estCostCents` |
| Default class heuristic | `defaultMailTypeForLetter()` / `defaultMailTypeForBatch()` in `mailClassOptions.ts` |

**Rule:** When adding mail-cost UI, always read `mailClassChoice(selectedType).estCostCents` for the active class. Reserve `DEFAULT_MAIL_COST_CENTS` for wallet/ledger fallbacks where no class is selected yet.

**Verify:** Partner Letters → open **Mail** on a saved letter with PDF → switch mail class (First Class vs Certified+ERR) → estimate line updates per class. Complete To/From addresses → live quote replaces fallback when LetterStream preauth succeeds.

### 17.4 Letter mail-To backfill for existing letters

**Problem solved:** Older saved letters lacked `meta.mailToName` / `meta.mailToAddress`, so the mail modal opened with an empty recipient even when the letter body had a TO block.

| Piece | Location |
|-------|----------|
| Single-letter backfill | `backfillLetterMailToMeta()` in `src/lib/letterMailToBackfill.ts` |
| Partner batch backfill | `backfillPartnerLettersMailTo(partnerId)` — parses body via `parseLetterRecipientBlock()`, falls back to bureau defaults for disputes |
| Letters hub (session once) | `LettersCommandCenter.tsx` — `useEffect` keyed on `partner.id`, sessionStorage guard `finely.letterMailToBackfill::<partnerId>` |
| Vault page (session once) | `PartnerLettersVaultPage.tsx` — same backfill + refreshes list when count > 0 |
| Mail modal (on open) | `MailLetterModal.tsx` — calls `backfillLetterMailToMeta()` before populate |

Backfill also aligns `meta.recipientName` / `meta.recipientAddress` and, for bureau disputes, `meta.bureauMailingName` / `meta.bureauMailingAddress` when missing or mismatched.

**Verify:** Open an older validation letter (body has creditor TO block, meta empty) → Mail modal → recipient fields pre-filled from body. Re-open Letters hub in a fresh tab — backfill runs once per partner session, not on every navigation.

### 17.5 Partner portal — hub modal fixes

**Problem solved:** Hub launcher modals were narrow, backdrop-blurred, and hard to read on the dark partner portal. Dashboard tiles lacked visible accent glow.

| Fix | Key files |
|-----|-----------|
| Full-width hub work modals, dim overlay only (no backdrop blur) | `PartnerHubWorkModal.tsx` — `max-w-[min(98vw,1760px)]`, `bg-black/70` scrim |
| Portal dashboard uses full container width | `PageShell.tsx` — `fc-container--portal-full` on partner dashboard |
| Glow launcher tiles on dark portal bed | `partnerHubLauncherUi.ts`, `partnerPortalVisual.css`, `PartnerHubLauncherTile.tsx` |
| Welcome banner readable on portal | `WelcomeBanner.tsx` — `surface="portal"` |
| Credit restore progression map in hub modal | `PartnerDashboardPage.tsx` — restore teaser → `PartnerHubWorkModal` → `JourneyMapView` |

**Verify:** `/portal/dashboard` → tap **Credit restore** or **Disputes** hub tile → modal spans viewport width, solid dark shell, content not clipped by blur. Launcher tiles show accent glow borders on the dark dashboard bed.

### 17.6 QA before push

```powershell
npm run typecheck
```

**Manual smoke:** §17.1 package tiles → §17.2 Ask Finely strip → §17.3 mail class estimate → §17.4 backfilled recipient → §17.5 hub modal width.

---

## 18. Growth Agents & Marketing Automation (Aug 2026)

A multi-phase build (Phases 1–5b+ in `docs/planning/round3_final_phases_*.md`) turned "growth agents" from static UI cards into a real, verifiable multi-agent system: an AI-gateway reasoning step every agent shares, a handoff ledger they coordinate through, an attribution/post-mortem engine that grades their decisions against real CRM outcomes, and a lead-intel swarm that is honestly labeled live vs. simulated per source. This section is the file map. It builds on §15.2 (setup checklist) and §16.3 (geo shards + Ruth Command) — read those first for the admin-facing quick path.

### 18.1 Agent roster & org hierarchy

Single source of truth: `src/features/growthAgents/growthAgentRegistry.ts` — `GROWTH_AGENTS: GrowthAgentDef[]` plus `AGENT_ARCHITECT`.

| Agent | id | Legacy id(s) | Role | Wave | `reportsTo` | `position` |
|---|---|---|---|---|---|---|
| Professor Apex | `agent-architect` | `professor_apex`, `professor-apex` | Chief Agent Architect — Ruth's chief of staff | 0 | `ruth` | `chief_of_staff` |
| Caleb Brooks | `lead-discovery` | `pipeline-titan` | Lead Discovery | 0 | `marketing-director` | `individual_contributor` |
| Esther Hayes | `marketing-director` | `cmo-prime` | Marketing Director | 1 | `agent-architect` | `team_lead` |
| Hannah Reed | `capture-links` | — | Capture & Links | 1 | `marketing-director` | `individual_contributor` |
| Alex Rivera | `appointment-setter` | — | Appointment Setter | 1 | `marketing-director` | `individual_contributor` |
| Lydia Chen | `seo-local` | `seo-sentinel` | SEO & Local Pages | 2 | `marketing-director` | `individual_contributor` |
| Miriam Cole | `social` | `social-commander` | Social & Short Video | 3 | `marketing-director` | `individual_contributor` |
| Jordan Ellis | `media` | `media-alchemist` | Media Producer | 3 | `marketing-director` | `individual_contributor` |
| Benjamin Cole | `partnerships` | — | Partnerships | 4 | `marketing-director` | `individual_contributor` |
| Rebecca Lane | `specialist-recruit` | — | Specialist Recruitment | 4 | `marketing-director` | `individual_contributor` |

`getGrowthAgent(id)` resolves either a canonical or legacy id (case-insensitive). `listGrowthAgentsByWave()` is the sort order the roster UI renders in.

**Org chain (`GrowthAgentPosition`):** `chief_of_staff` (Professor Apex) → `team_lead` (Esther) → `individual_contributor` (everyone else). This is a *real* reporting relationship the code reasons over — not title flavor text: `growthAgentArchitectBrief.ts` and the team-context brief render an actual chain, not a flat peer list.

**Ownership chain** — `src/domain/organizationHierarchy.ts`:
- `ORGANIZATION_OWNER` — Sanz St Louis, `kind: 'human_owner'`.
- `ORGANIZATION_CO_OWNER` — Ruth (`ruth_steward`, persona id from `src/domain/coOwnerIdentity.ts` → `CO_OWNER_PERSONA_ID = 'finely_coowner'`), `kind: 'ai_co_owner'`.
- `AI_ORCHESTRATOR_ID = 'professor_apex'` — documented there as "Chief Agent Architect — orchestrates AI departments; reports to Ruth, not owner." **Phase 3 repurposed this exact, previously-orphaned concept** into `AGENT_ARCHITECT` in `growthAgentRegistry.ts` rather than inventing a new persona — that's why `legacyIds: ['professor_apex', 'professor-apex']` exists on the registry entry.
- `isOrganizationOwner()` / `isOrganizationCoOwner()` — simple id checks other modules use to gate owner/co-owner-only behavior.

**Caleb's own sub-team** (`CALEB_SUBAGENT_WORKERS`, lead-discovery pipeline only) — Geo Scanner → Qualifier → Enricher → Handoff Router, in `order`. `isReasoning: true` only on Qualifier and Handoff Router (both genuine AI-gateway calls); Geo Scanner and Enricher are deliberately deterministic/mechanical (metro rotation lookup, contact-enrichment scrape) — kept as "agent" flavor text on purpose per the Phase 3 decision not to fake reasoning where there's nothing to reason about (see the doc-comment on `CalebSubagentWorker.isReasoning`).

### 18.2 Agent reasoning: the shared "brain" step & sub-agents

**Shared reasoning step:** `src/features/growthAgents/growthAgentBrain.ts` — `runAgentBrainStep(args)`. Every non-Caleb-pipeline agent capability marked `runKey: '...'` in the registry ultimately calls this. It:
1. Bails to a safe `no_action` fallback (never throws) if `aiGateway` flag is off or Supabase isn't configured.
2. Pulls the shared **team context** (`getGrowthTeamContext()`, §18.3) and an optional **psychology fragment** (`buildPsychologyAwareSystemPromptFragment()` in `agentCognitiveEngine.ts`, sourced from `src/data/agentPsychologyArchitectureRepo.ts` — communication tone, cognitive-load rule, top 2–3 bias-mitigation rules, one de-escalation line; kept short deliberately, per Cognitive Load Theory).
3. Calls `callAiGateway()` with a strict JSON-only system prompt (`{action, reasoning, confidence, targetAgentId?}`), parses defensively (`safeParseDirective`), and rejects any action not in `args.allowedActions`.
4. Auto-executes only if the action is in `args.autoExecutableActions` **and** confidence clears `minAutoConfidence` (default `0.72`) — otherwise it queues to the shared approval inbox (`enqueueGrowthApproval()`, `src/data/growthAgentApprovalQueueRepo.ts`).
5. Logs the decision (`logAgentAction()`), writes a handoff row if `action === 'route_handoff'` (`createGrowthHandoff()`), and always records the outcome for the learning loop (`recordAgentOutcome()`, §18.4).
6. Optionally accepts a `traceContext: AgentCallTraceContext` forwarded to `callAiGateway()` for structured call tracing (§18.3).

**Sub-agents** — `src/features/growthAgents/subagents/*.ts`:

| File | Agent | What it reads (real data, not fabricated) | Notable behavior |
|---|---|---|---|
| `calebReasoningSubagents.ts` | Caleb — Qualifier (`lead-discovery.qualifier`) + Handoff Router (`lead-discovery.handoff`) | CRM record fields via `getCrmRecord()`; matches free text (tags, contact title, next-action label, timeline) against `debtLitigationDoctrineRepo.ts` keyword tables to ground reasoning in a real playbook (`debtType`/`phase`/`statutoryBasis`/`remedyAction`) when a debt signal is present | `runCalebHandoffRouterForProspects()` decides per-prospect whether to route straight to Alex (hot score ≥70 + verified email) or hold in the normal queue; **logs both branches** (`handoff.routed_to_alex` and `handoff.no_action`) — the negative branch was a known prior gap, now fixed so the attribution post-mortem (§18.3) has real "held" data to join against |
| `alexNoShowRecovery.ts` | Alex — No-Show Recovery (`appointment-setter.no_show_recovery`) | `listCalendarEvents()` — confirmed sessions whose end time passed a 20-minute grace window without completion | Sets event status to `no_show`, creates a reschedule `BookingInvite`, sends a recovery email (suppression-checked), and opens a Marketing Desk follow-up task; idempotent via a local `recovered` log so the sweep is safe to re-run |
| `hannahSyndicationWatcher.ts` | Hannah — Syndication Watcher (`capture-links.performance_watcher`) | `listLeadCaptures()` + `listCrmRecords()`, joined by UTM/referral-code channel key | Scores real conversion rate per channel over a rolling window; if the top channel converts ≥1.5× the weakest, writes a `channel_performance_brief` handoff to Esther |
| `estherStrategySubagent.ts` | Esther — Weekly Strategy Review | `getGrowthWeekFocus()` + live CRM stage counts/week-over-week volume; also reads `businessCreditDoctrineRepo.ts` tier strategy | Decides whether the week's lane/city focus should shift or Caleb/Hannah need a nudge |
| `lydiaSeoHealthSubagent.ts` | Lydia — SEO Health Check | `auditPublicSeoCatalog()` against the static `publicSeoCatalog.ts` route registry (title/description length, missing JSON-LD) | Deliberately does **not** fake a live crawl — there is no crawler/rank-tracker in this codebase; asks the brain whether the worst offenders warrant a human fix task |
| `miriamContentPrioritySubagent.ts` | Miriam — Content Priority Review | `listContentStudioAssets()` (`contentStudioRepo.ts`) — real waiting social drafts | Recommends which draft to publish/promote next |
| `jordanVideoPipelineSubagent.ts` | Jordan — Video Pipeline Review | `listLatestPillarVideoCommandRecords()` (`growthPillarVideoPack.ts`) — real pillar-video lifecycle stage | Recommends promote / repurpose / hold |
| `benjaminPartnershipSubagent.ts` | Benjamin — Affiliate Check-in | `affiliateRepo.ts` (`listAffiliatesLocalSync`, `affiliateConversionStats`) | `send_email` directives go through the same suppression + frequency-cap + audit pipeline as every other growth-agent send — never a fabricated "sent" claim |
| `rebeccaRecruitingSubagent.ts` | Rebecca — Recruiting Follow-up | CRM records tagged `offer:credit_specialist_*` (`crmRecordsRepo.ts` → `leadToRecord`) | Flags open specialist applications before they go stale |
| `subagentCadence.ts` | shared | — | Once-per-day / once-per-week idempotency guard (`ranToday`/`ranThisWeek`/`markRan`), scoped per-entity — safe to call every `agent_team_tick` without duplicate spam |

Esther/Lydia/Miriam/Jordan/Benjamin/Rebecca are the **Phase 5b "real-reasoning upgrade"** pass — before this, several of these capabilities were static links with no agent logic behind them.

### 18.3 Team coordination & verifiability

**Handoff ledger** — `src/data/growthHandoffLedgerRepo.ts`. Every agent-to-agent transition becomes an explicit, timestamped `GrowthHandoff` row (`status: pending | acked | completed | stalled`) instead of "two agents happen to read the same localStorage key." Local-first (`finely.growth_handoffs.v1`), best-effort mirrored to Supabase `growth_agent_handoffs` (migration `supabase/migrations/202608131900_growth_agent_handoffs.sql`) so the Growth Command Hub can read cross-device. `sweepStalledHandoffs()` marks anything pending/acked past 48h as `stalled` — the reliability rail the Agent Architect brief (below) surfaces.

**Shared team-context feed** — `src/features/growthAgents/growthTeamContext.ts` — `getGrowthTeamContext()`. Every `runAgentBrainStep()` call reads this **first**: this week's focus (`growthWeekFocus.ts`), the 6 most recent handoffs, and the 6 most recent `actorType: 'agent'` audit events, flattened into a `briefText` string safe to drop into an AI-gateway prompt. This is what makes agents react to what teammates already did instead of reasoning in isolation.

**Agent Architect brief** — `src/features/growthAgents/growthAgentArchitectBrief.ts` — `buildAgentArchitectBrief()`. Sweeps stalled handoffs, reads pending approvals and per-agent confidence (§18.4), and produces the one decision Ruth should look at today — not a raw data dump. This is Professor Apex's entire job (`runKey: 'agent_architect_brief'` in the registry).

**Audit trail** — `src/lib/agentAuditLog.ts` — `logAgentAction()` writes into `auditRepo.ts` with `actorType: 'agent'`, `actorUserId: agentId`. `resolveAgentDisplayName(agentId)` turns `"lead-discovery.qualifier"` into `"Caleb Brooks - Qualifier"` for display. This closes what used to be a defined-but-unused `actorType: 'agent'` field.

**Structured LLM call tracing** — `src/lib/agentCallTrace.ts` (`buildAgentCallTrace()`, token/cost estimators) + `src/data/agentCallTraceRepo.ts` (`recordAgentCallTrace()`, local-first + best-effort Supabase mirror to `agent_call_traces`, migration `supabase/migrations/20260814020000_agent_call_traces.sql`). This is a **scaffold + pilot** (Phase H2) — wired as an additive, optional `traceContext` argument on `callAiGateway()`, piloted only on `calebReasoningSubagents.ts` and `estherStrategySubagent.ts`. Expanding it to the rest of the sub-agents is a documented follow-up, not yet done.

**Attribution & post-mortems** — `src/lib/agentAttributionEngine.ts`, surfaced by `src/features/crm/attribution/AgentAttributionPanel.tsx` (mounted in the CRM workspace hub tabs and reusable on the Growth Agents roster page):
- `computeAgentAttribution()` — last-touch join between `logAgentAction()`'s audit trail and CRM record `stage`: which agent's most recent touch preceded a record reaching a "won" stage.
- `runDecisionPostMortem()` (G2b) — revisits every logged `no_action`/held/skip decision and checks what actually happened to that record later (converted anyway, went cold, or stayed dead) — `wasLikelyMisjudged: true` flags a held decision that the record later won anyway.
- `computeConversionLikelihood()` (G4a) — an explicitly **transparent, rule-based** heuristic score (named weights in `CONVERSION_SCORE_WEIGHTS`, every factor surfaced in `reasoning`/`factors`) — internal staff-triage signal only, never shown to a partner, and explicitly not an ML prediction (no ML training infra exists in this codebase by design). Rendered as a chip on `CrmPipelineBoard.tsx` cards.
- **Mandatory caveat, always rendered (not a tooltip):** `ATTRIBUTION_DATA_COMPLETENESS_NOTE` — `auditRepo.ts` is localStorage-only today, so attribution/post-mortem/likelihood all only reflect **this browser's** action history, not cross-device ground truth.

### 18.4 Learning & timing intelligence

**Learning-loop confidence** — `src/features/growthAgents/growthAgentLearningLoop.ts`. `recordAgentOutcome(agentId, {...})` is called after every `runAgentBrainStep()` (win or fallback). `getAgentConfidence(agentId)` computes this-week vs. last-week **decisive rate** (directive ≠ `no_action`) and **auto-execute rate**, labeling the agent `new` / `learning` / `confident` / `highly confident`. Honestly framed in the file's own doc-comment: this tracks decision *confidence* trending over time, **not** a claim of revenue/conversion causality.

**Best-time-to-send** — `src/features/growthAgents/growthTimingIntel.ts`. `scoreTimingBuckets()` correlates real `nurtureSendLogRepo.ts` sends against whether the same CRM record progressed stage within 72h — there's no dedicated open/click/reply event stream in this codebase, so stage-progression-after-send is the outcome proxy (documented as approximate, not vanity output). `recommendedSendHourNow()` falls back to a 9am–12pm default with a `confidence: 'low'` label until ≥5 sends exist in a bucket.

### 18.5 Lead intelligence / scraping (overnight50 swarm)

**Source registry:** `src/features/overnight50/sourceAdapters.ts` — `LEAD_INTEL_SOURCE_ADAPTERS`. Every source is honestly labeled `live` or `simulation` via `getLeadIntelSourceRuntimeMode(id)` — **do not assume a source is real just because it's in the list.**

| Runtime mode | Sources | Notes |
|---|---|---|
| **Live** | `serper_web`, `serper_news`, `serper_places`, `dead_lead_revival`, `affiliate_referral_loop`, `seo_inbound_forms`, `csv_seed_expansion`, `reddit_geo`, `indiehackers_hn`, `bbb_complaints`, `craigslist_services` | Internal sources (`dead_lead_revival`, `affiliate_referral_loop`, `seo_inbound_forms`) pull real counts from `crmRecordsRepo`/`affiliateRepo`/`leadsRepo` — not random bumps. `reddit_geo` and `craigslist_services` are genuine network calls but frequently blocked (Reddit anti-bot 403s; Craigslist hCaptcha) — falls back to simulation on failure. `indiehackers_hn` (HN Algolia) and `bbb_complaints` (via the proxy) are confirmed working. |
| **Live-capable, needs admin config** | `local_event_calendars`, `google_alerts_ingest`, `meetup_event_watch` | `fetchAndParseRssLeads` runs against admin-configured `VITE_LEAD_INTEL_RSS_FEEDS` — simulation-only until a real feed URL is set (no universal per-city/per-account feed exists to auto-derive). |
| **Simulation only — verified blocked** | `quora_credit`, `chamber_of_commerce`, `indeed_role_watch`, `domain_expiry_lists`, `review_sites`, `ucc_public_record_watch` | Each has a specific verified reason in its `notes` field (e.g. Yelp PerimeterX 403, Quora bot protection, expireddomains.net requires login) — read the adapter's `notes` before assuming a fix is trivial. |
| **Known gap — webhook exists server-side, no frontend read-path** | `webhook_meta_leads`, `webhook_google_lsa`, `sms_reply_capture`, `email_reply_capture` | `supabase/functions/meta-webhook` genuinely writes Meta Lead Ads submissions server-side, but nothing in this swarm reads them back yet — tick counters stay simulated. No Google LSA/Twilio-SMS-reply/email-reply receiver exists at all yet. |
| Everything else | — | `notes: 'Queues gracefully when credentials are missing; uses public or official sources only.'` — effectively simulation/stub pending real integration. |

**Fetch path:** `src/features/overnight50/liveLeadFetchers.ts` — every fetcher is a genuine `fetch()` with an `AbortController` timeout, never throws, always resolves `{ ok:false, items:[] }` on any failure. Proxy-first via `supabase.functions.invoke('lead-intel-fetch-proxy', { body: { url } })` (avoids CORS — confirmed reddit.com and bbb.org send no `Access-Control-Allow-Origin`), falling back to a direct browser fetch only for permissive-CORS endpoints (confirmed HN's Algolia API).

**Edge function:** `supabase/functions/lead-intel-fetch-proxy/index.ts` — requires an authenticated Supabase session (`resolveAuthContext`), rate-limited (120/hr per user+IP), and only proxies to an **explicit hostname allowlist** (`reddit.com`, `craigslist.org`, `bbb.org`, `hn.algolia.com`, `ycombinator.com`, `indeed.com`, `yelp.com`, `google.com`, `meetup.com`, `chamberofcommerce.com`) to avoid becoming an open SSRF relay. Caps response size at 750KB.

### 18.6 CRM system

**Pipelines:** `src/features/crm/pipelines.ts` — `CRM_PIPELINES` (clients/affiliates/agents/teams/au_sellers/b2b_partners/inbound), each with its own stage set (`PROSPECT_STAGES` 8-stage funnel vs. `LEAD_STAGES` 5-stage funnel). `CrmPipelineBoard.tsx` renders one pipeline as a drag-drop Kanban, cards showing the conversion-likelihood chip (§18.3) and Finely Bridge program badges.

**Sequences (multi-touch cadence):**
- Domain types: `src/domain/crmSequences.ts` — `CrmSequence` (steps of type `wait | email | task | stage_move`), `CrmSequenceEnrollment`.
- Repo: `src/data/crmSequencesRepo.ts` — `DEFAULT_SEQUENCES` ship a default per target so every discovered prospect (not just `'clients'`) gets an escalating cadence instead of one-and-done outreach.
- Engine: `src/features/crm/sequences/runCrmSequenceEngine.ts` — `dueCrmSequenceSteps()` finds due action steps; `sendCrmSequenceEmail()` actually sends (checks `commsSuppressionRepo` + frequency cap first, attributes the send via `logAgentAction()`).
- Builder UI: `src/features/crm/sequences/CrmSequenceBuilder.tsx`.
- Runner/results UI: `src/features/crm/sequences/CrmSequenceRunnerPanel.tsx`.
- Auto-enroll: `src/features/crm/sequences/autoEnrollCrmRecord.ts`.

**A/B testing primitive (G3)** — `src/domain/crmSequences.ts` + `src/features/crm/sequences/crmSequenceVariantResults.ts`:
- An email step's base `emailSubject`/`emailBody` **is** the implicit `control` arm — no `variants.control` entry needed. Only `variants.variant_a` needs real content to activate a test (`crmSequenceStepHasVariants()`), so every pre-existing sequence stays byte-identical in behavior.
- `assignCrmSequenceVariantForSeed(enrollmentId)` — deterministic hash-based 50/50 split, sticky per enrollment. Duplicated verbatim in `supabase/functions/_shared/processDueCrmSequenceSteps.ts` (edge functions can't import from `src/`) so the client engine and the server-side platform-cron engine never disagree about an enrollment's bucket.
- `computeCrmSequenceVariantResults()` — per-arm `enrolled`/`resolved`/`advanced`/`advanceRate` over a 14-day (default) stage-advance window, plus a `leadingVariant` once both arms have a resolved sample. Same completeness caveat as §18.3: client-side/local-only, so enrollments the server processed while no admin tab was open aren't reflected until synced back.
- Migration: `supabase/migrations/20260814130000_crm_sequence_step_variants.sql` (server sync scaffolding: `20260814110000_crm_sequences_server.sql`).

### 18.7 Automation orchestration

**Client-side orchestrator:** `src/lib/finelyAutomationOrchestrator.ts` — `runGrowthAutopilotTick()`. `FinelyAutomationJobKind` union: `daily_find_pack`, `week_plan_sync`, `pillar_video_render`, `course_lesson_video_batch`, `course_auto_narrate`, `inbound_nurture_tick`, `scorecard_refresh`, `agent_team_tick`. Each job self-guards its own daily/weekly cadence (`jobRanToday`/`jobRanThisWeek`) so calling the tick repeatedly (e.g. on every Growth hub page load) is safe.

`agent_team_tick` is the one most relevant to this section — it runs, in order: Alex's outreach autopilot (`runAlexAppointmentAutopilotIfDue()`), Alex's no-show sweep (`runAlexNoShowRecoverySweep()`), Hannah's syndication watcher (weekly-gated), then Esther/Lydia/Miriam/Jordan/Benjamin/Rebecca's Phase 5b reasoning sub-agents (each self-cadence-gated via `subagentCadence.ts`, so calling every tick never spams). In `dryRun` mode (the default unless the autopilot toggle is on), it's a no-op that reports "not executed."

**Visual-flow graph engine:** `src/features/automation/graphEngine.ts`. Complements — does not replace — `src/automation/agentRunner.ts` (flat interval-rule execution) and the CRM sequence engine (§18.6): this walks the actual **flow graph** (wait / branch / goal nodes) built in `AutomationStudioShell.tsx`, per-enrollment, ticked client-side from `platformCron.ts`. `automation-runner` (edge function) has its own separate DB-backed interval-rule sweep for `trigger: interval` rules — the two engines cover different rule shapes, not competing implementations of the same thing. Branch conditions (`GraphBranchData`) support `stage | tag | score | target | kind | source` fields with `eq | neq | has | gte | lte` ops. Same suppression/frequency-cap/audit pipeline as everything else in this section.

### 18.8 Calendar & booking

- Domain types: `src/domain/calendar.ts` — `CalendarBookingSettings`, `ConsultationRequest`, `CalendarEvent` (`status: tentative | confirmed | completed | cancelled | no_show` — `no_show` is what Alex's recovery sub-agent sets), `BookingInvite`.
- Slot generation: `src/lib/calendarSlots.ts` — `generateDaySlots()` (Calendly-style, respects allowed weekdays/durations/blocked windows/previous-day cutoff).
- Invite links: `src/data/bookingInviteRepo.ts` — `createBookingInvite()` / `getBookingInviteByToken()` / `buildBookingInvitePath()`. Public self-book route: `/book/i/:token`.
- Email: `src/comms/meetingInviteEmail.ts` — `sendMeetingInviteEmail()` wrapper builds a branded HTML invite plus a no-dependency Google Calendar deep link (`buildGoogleCalendarUrl()`).
- UI: `src/components/calendar/BookingInvitePanel.tsx` (admin invite links, `/admin/calendar`), `BookingTimeSlotPicker.tsx` / `PublicSessionSlotPicker.tsx` (self-book slot pickers), `MeetingBookingPanel.tsx`, `CalendarSettingsPanel.tsx` (admin booking-window config), `VoiceTranscriptField.tsx` (voice-note capture on booking forms — transcribe-only, not TTS, consistent with the Ask Finely text-only rule in §17.2).
- Migration: `supabase/migrations/202608112000_booking_invites.sql`.

### 18.9 Comms safety rails

`src/data/commsSuppressionRepo.ts` — the **one unified do-not-contact list** every send path (nurture, CRM sequences, growth-agent outreach, automation graph engine) checks before dispatching:
- `checkSuppression({ email?, phone?, channel })` — merges manual suppressions (`unsubscribe | sms_stop | manual_dnc | bounce | complaint`) with `lead_captures` consent flags (`consentEmailMarketing` / `consentSmsMarketing`). Local-first (`finely.comms_suppression.v1`), best-effort mirrored to/from the shared `public.comms_suppression` table (migration `supabase/migrations/20260813200000_crm_server_sync_and_suppression.sql`) — note the table uses the literal server tenant id `'finely_cred'`, not the `FINELY_TENANT_ID` app constant, so client and server-dispatch paths (automation-runner, platform-cron, meta-webhook) genuinely share one list.
- `isWithinQuietHours()` — default 9am–8pm gate.
- `isOverFrequencyCap(recipientKey, windowHours=20, maxPerWindow=1)` + `recordSendForFrequencyCap()` — caps cross-agent pile-on (e.g. Caleb's cadence and Alex's outreach both trying to email the same lead the same day).
- `resolveFrequencyCapKey({ email?, phone?, crmRecordId? })` — when a CRM record id is available, resolves to that record's canonical contact identity so an email send and an SMS send against the *same* record share one frequency-cap bucket instead of two independent ones.

### 18.10 Where to find it in the UI

| Surface | Route | Key files |
|---|---|---|
| Growth Agents roster | `/admin/growth-agents` | `src/features/growthAgents/GrowthAgentsRoster.tsx`, `AdminGrowthAgentsPage.tsx` |
| Per-agent workspace | `/admin/growth-agents/:agentId` | `GrowthAgentWorkspaceView.tsx`, `GrowthAgentCalebWorkspace.tsx`, `GrowthAgentHannahWorkspace.tsx`, `GrowthAgentEstherWorkspace.tsx`, `GrowthAgentAlexWorkspace.tsx` |
| Results scoreboard | `/admin/growth-agents/results` | `GrowthResultsScoreboard.tsx` |
| Team trail (handoff feed) | `/admin/growth-agents?view=trail` | `AgentTrailTimeline.tsx` |
| Marketing Desk (daily workroom) | `/admin/marketing-desk` | `src/features/marketingDesk/MarketingDeskHome.tsx` |
| Leads & CRM | `/admin/crm` | `CrmPipelineBoard.tsx`, `CrmRecordDrawer.tsx`, `AgentAttributionPanel.tsx` |
| Growth Autopilot console | `/admin/growth-automation` | `FinelyAutomationConsole.tsx`, `finelyAutomationOrchestrator.ts` |
| Admin calendar / invites | `/admin/calendar` | `BookingInvitePanel.tsx` |

Nav wiring: `src/config/adminNavLanes.ts` — `/admin/crm` ("Leads & CRM"), `/admin/growth-agents` ("Growth Agents — Results · Caleb · Hannah · specialists"), `/admin/marketing-desk` ("Marketing Desk"), `/admin/growth-automation` ("Growth Autopilot — Scheduler · daily find · week sync ticks").

### 18.11 Feature flags & gotchas

All flags are client-side settings in `src/domain/settings.ts` (`FeatureFlags`), not env vars — see §4.3 for the general pattern.

| Flag | Default | Gates |
|---|---|---|
| `marketingDesk` | `false` | Marketing Desk home + Caleb's daily workroom |
| `leadIntel` | `false` | Lead Intelligence Agent (prospecting/search/enrichment) |
| `crm` | `true` | CRM pipelines module |
| `automationAutopilot` | `false` | Hands-free letter draft + staff task routing (also gates whether `runGrowthAutopilotTick()` runs live vs. dry-run) |
| `aiGateway` | `false` | Required for **every** `runAgentBrainStep()` call (all Phase 3/5b sub-agent reasoning) — without it every sub-agent silently falls back to `no_action` |
| `videoStudio` | `false` | Miriam/Jordan's video-related capabilities (Content Studio) |

Edge/server-only gates (not in `settings.ts` — see §15.2):
- **`GROWTH_WORKER_LIVE`** (edge secret on `lead-intel-worker-tick`) — leave unset/false until ready for live overnight ticks; default is simulation with zero counter inflation. When true, attempts exactly one real Serper search per tick (also needs `SERPER_API_KEY` on `lead-intel`).
- **`SERPER_API_KEY`** — required for Caleb's Test search / Find and for the `serper_*` live source adapters.

**Gotchas worth knowing before you touch this system:**
- **Everything agent-related is localStorage-first with best-effort Supabase sync.** Handoff ledger, audit trail (and therefore all attribution/post-mortem/learning-loop output), approval queue, and call traces all reflect *this browser's* history first. The `AgentAttributionPanel.tsx` caveat banner and `ATTRIBUTION_DATA_COMPLETENESS_NOTE` exist specifically because of this — don't remove them when restyling.
- **`isReasoning: false` sub-agents are not a bug.** Geo Scanner and Enricher are intentionally deterministic — don't "upgrade" them to call the AI gateway just for consistency; that repeats the exact decoration problem Phase 3 was fixing.
- **A lead-intel source labeled in the roster/dashboard isn't necessarily live.** Always check `getLeadIntelSourceRuntimeMode(id)` / the adapter's `notes` field in `sourceAdapters.ts` before promising a partner or stakeholder that a channel is really scraping.
- **Structured call tracing (`agentCallTrace.ts`) is pilot-only** on two sub-agents — don't assume every `runAgentBrainStep()` call produces a trace row yet.
- **CRM sequence A/B assignment logic is duplicated** between `src/domain/crmSequences.ts` (client) and `supabase/functions/_shared/processDueCrmSequenceSteps.ts` (edge, can't import from `src/`) — if you change `assignCrmSequenceVariantForSeed()`'s hash algorithm, update both or the client and server engines will disagree about which arm an enrollment is in.
- **`agent_team_tick` runs six-plus sub-agent reviews per call** but each self-gates its own cadence (`subagentCadence.ts`) — safe to call from every Growth hub page load; it will not spam sends or duplicate tasks.

## 19. Ruth (AI Co-Owner), public chat brain, knowledge/RAG, and compliance review gate (Aug 2026)

Builds on §6 (AI gateway) and §16.2 (public chat + unified brain). This section documents the co-owner agent (Ruth), the public chat persona system, the unified knowledge/RAG index that both draw from, the dormant pgvector upgrade path, and the legal/compliance pre-publish gate for doctrine-derived content.

### 19.1 Ruth (AI Co-Owner)

Ruth's code is split across `src/domain/coOwner*.ts` (identity, personality catalog, knowledge archive, executive org, role mastery) and `src/lib/coOwner*.ts` (system prompt, runtime context, tool-calling, staff/dev actions, automation runner). The most important files for understanding what's *real* vs. catalog data:

| File | Role |
|------|------|
| `src/domain/coOwnerIdentity.ts` | Canonical name/title/id (`CO_OWNER_IDENTITY`) |
| `src/domain/coOwnerPersona.ts` | `CO_OWNER_PERSONALITY` (20 traits), `CO_OWNER_SUPERPOWERS` (25 superpower *descriptions*), `CO_OWNER_AUTOMATIONS` (schedule labels), `CO_OWNER_AI_TIER` (routes to Anthropic, `taskType: 'ops.coowner_agent'`) |
| `src/domain/coOwnerSystemPrompt.ts` | `buildCoOwnerSystemPrompt()` — the actual system prompt sent to the gateway |
| `src/lib/coOwnerAgentTools.ts` | **Native Anthropic tool-calling schemas + executor** (Phase 5) — the real execution path |
| `src/lib/coOwnerStaffActions.ts` / `coOwnerDevActions.ts` | Fenced-markdown-block (`` ```coowner-action``` `` / `` ```coowner-dev``` ``) fallback parsers |
| `src/lib/coOwnerRuntimeContext.ts` | `buildCoOwnerIntelligenceBrief()` — turns the live tenant snapshot into a compact brief injected into the prompt |
| `src/pages/admin/AdminOpsAgentPage.tsx` | Her chat UI at `/admin/ops-agent` |

**What's genuinely wired (not just catalog decoration):**

- `CO_OWNER_SUPERPOWERS` (25 entries) and `CO_OWNER_AUTOMATIONS` are mostly **descriptive catalog data** — labels, schedules, and `executeKey` strings meant to be looked up by `coOwnerExecutionRegistry.ts` and run via `executeCoOwnerAutomationNow()`. Browsing them (Command tab) is a catalog view, not a live audit trail.
- The **real, current execution path** is `src/lib/coOwnerAgentTools.ts` — a Phase 5 addition. `buildCoOwnerAgentTools()` returns native Anthropic tool schemas (`hire_staff`, `promote_staff`, `promote_agent`, `deactivate_staff`, `run_automation`, `navigate`) that are passed as `tools:` on the `callAiGateway()` request in `AdminOpsAgentPage.tsx`'s `send()`. When Anthropic replies with `tool_use` blocks, `runCoOwnerToolCall()` executes them directly — no markdown-block parsing needed.
- `isHighRiskCoOwnerTool()` flags `deactivate_staff` and any `run_automation` call into a `billing`-domain execute key (or anything matching `/broadcast|mass[_\s-]?send|blast/i`) as requiring a human confirmation click (`pendingToolCalls` state → Confirm/Cancel buttons in the UI) instead of executing immediately.
- The **older fenced-block parsers** (`parseCoOwnerActionsFromAssistant()` / `parseCoOwnerDevActionsFromAssistant()` in `coOwnerStaffActions.ts` / `coOwnerDevActions.ts`) are kept only as a **fallback** for turns where the model doesn't emit native `tool_use` (e.g. a non-Anthropic provider, or Anthropic replying with a plain-text action block instead). `AdminOpsAgentPage.tsx`'s `send()` only runs the fallback parsers `if (!toolUses.length)`.
- `dynamicQuickPrompts` (the chip row above the chat) is **not static** — it computes chips from live state each render: open leads (`snapshot.recentLeads`), staff coverage gaps (`getCoOwnerStaffSnapshot().coverageGaps`), vacant executive hats (`getExecutiveOrgStats().vacant`), open validation clocks (`listOpenValidationClocks()`), and launch blockers (`getLaunchFinalReadiness().blockedCount`) — only falling back to a fixed tail of generic prompts once live-state chips run out.
- `buildCoOwnerSystemPrompt()` injects `buildPsychologyAwareSystemPromptFragment('ruth')` (see §19.6) directly into her system prompt — this is real wiring, not decoration.

**Ruth surfaces outside the ops-agent page:**

- `src/features/marketingDesk/marketingDeskRuthFocus.ts` — `getRuthCommandFocus()` builds the "Ruth Command" strip data (lane/city/offer/weekly tip) shown on Marketing Desk (§16.3). This is **derived from real repos** (`getGrowthWeekFocus()`, `getRuthWeeklyLaneTip()`, `getLaneCta()`) — not an LLM call, and not a page rename (Marketing Desk stays the page; Ruth is a command strip on it).
- `src/features/growthAgents/growthAgentArchitectBrief.ts` — `buildAgentArchitectBrief()`, the **Agent Architect (Professor Apex)**'s brief-to-Ruth generator. It reads `growthHandoffLedgerRepo.ts` (stalled/pending handoffs) and `growthAgentLearningLoop.ts` (per-agent confidence) to produce one headline + a handful of brief lines — e.g. "3 handoff(s) stalled >48h" or "Team is coordinated — nothing urgent right now." Consumed by `src/features/growthAgents/GrowthAgentsRoster.tsx` (the Growth Command Hub), not directly rendered inside Ruth's own chat.
- `src/features/growthAgents/AgentTrailTimeline.tsx` — the "verifiable" agent trail Ruth's brief points at. `AgentTrailForEntity` (per-CRM-record) and `AgentTeamTrailFeed` (team-wide) both read the same `growthHandoffLedgerRepo.ts` + `auditRepo.ts` data the brief reads, so what's displayed is literally what happened — not a marketing summary of it.

**Gotcha:** the fixed personality/superpower/automation catalogs (`CO_OWNER_PERSONALITY`, `CO_OWNER_SUPERPOWERS`, `CO_OWNER_AUTOMATIONS`) inflate `getCoOwnerCatalogStats().operatingBrainSize` (a marketing-facing "N+ effective capabilities" number shown in the page subtitle) — treat that number as a catalog-size metric, not a measure of what Ruth can actually execute unassisted. What she can actually *do* unassisted is exactly the six tools in `buildCoOwnerAgentTools()` plus whatever `coOwnerExecutionRegistry.ts` entries exist.

### 19.2 Public chat personas

`src/components/chat/PublicChatWidget.tsx` is the public-site chat bubble. Two persona layers exist and are easy to conflate:

1. **Visible face (launcher/header)** — `getPublicChatOnDutyPresentation()` in `src/components/chat/publicChatPersonaUi.ts` resolves whichever real staff-roster member (`resolveStaffOnDuty()` in `src/data/staffRoster.ts`) is on shift right now, and swaps their first name into the persona's canned `welcome` copy (`welcomeForDuty()`). This is the sitewide on-duty human face.
2. **In-thread AI receptionist** — `getPublicChatAiReceptionistPresentation()` always renders as **Aia** (`PUBLIC_CHAT_AI_PERSONA_ID = 'nurture_concierge'`), independent of who's on duty. The AI never claims to be human (`AI_RECEPTIONIST_PROMPT` in `PublicChatWidget.tsx` explicitly instructs "Do not pretend to be human").

`PRESENTATION` in `publicChatPersonaUi.ts` is a per-`AgentPersonaId` record (Morgan/finely_advisor, Taylor/dispute_coach, Marcus/funding_strategist, Casey/debt_strategist, Ruth/finely_coowner, etc.) — each entry supplies a gradient, avatar, welcome line, and chip styling; `avatarUrlFor()` falls back to a hardcoded `STAFF_ROSTER_FALLBACK` seed list when no live roster member resolves.

**Routing counters (G1 acceptance metric):** `src/lib/finelyBrain/finelyPublicAnswerMetrics.ts` — `recordFinelyPublicAnswerRoute('canned' | 'llm')` is a simple localStorage counter (`finely.publicAnswerRouting.v1`) incremented every time `PublicChatWidget.tsx` answers a message, so `classifyFinelyPublicTopic()`'s canned/local-knowledge coverage can be measured over time instead of shipped unmeasured:
- `'canned'` — `shouldUseFinelyPublicAnswer()` returned true and `finelyPublicAnswer()` (local knowledge, no LLM call) answered.
- `'llm'` — fell through to `converseWithFinelyAi()` → the real `ai-gateway` (`taskType: 'public_chat'`).
`getFinelyPublicAnswerRoutingStats()` returns `{ canned, llm, total, llmSharePct }` — there is no admin UI reading this yet; it's a raw counter for future telemetry.

**👍/👎 knowledge feedback (J4):** every bot reply that surfaced RAG chunks carries `kbChunkIds` + `kbQuery` on the `ChatMsg`. The thumbs buttons (`ThumbsUp`/`ThumbsDown` from `lucide-react`, rendered only `if (m.kbChunkIds?.length)`) call `submitKnowledgeFeedback(msg, helpful)` → `recordKnowledgeFeedback()` in `src/data/knowledgeFeedbackRepo.ts` — see §19.3 for how that feeds back into ranking. Feedback can only be given once per message (`!msg.feedbackGiven` guard); the UI then shows a static "Thanks — glad that helped! / we'll improve this." line instead of the buttons.

### 19.3 Knowledge base / RAG — `finelyKnowledgeIndex.ts`

`src/lib/finelyKnowledgeIndex.ts` is the single unified, in-browser, synchronous keyword/token index everything else in this section reads from. No vector DB is required for the default path — `buildFinelyKnowledgeChunks()` builds and memoizes (`CACHE`) one flat `FinelyKnowledgeChunk[]` from every knowledge source in the codebase:

| `KnowledgeSource` | Built from |
|---|---|
| `sop` | `src/domain/platformSops.ts` (`PLATFORM_SOP_LIBRARY`) |
| `tour` | `src/config/tourManifest.ts` |
| `module` | `src/config/modulePlaybooks.ts` |
| `article` | `getKnowledgeCorpus()` (`src/lib/kbFeatureMapSync.ts`) |
| `eguide` | Free guides (`ALL_FREE_GUIDES`) + the four long-form guide chapter sets (debt eradication, business credit power, tradeline advantage, dispute letter guide), flattened via `eguideKnowledgeFlatten.ts` |
| `reference` | `buildFinelyReferenceChunks()` — see below |

`buildFinelyReferenceChunks()` is the Phase 5 knowledge-expansion layer — it turns live catalog/spec modules into searchable chunks so they never drift from the UI that renders them: Letter Studio specs, debt-validation-doctrine scenarios, funding-readiness packages, affiliate payout structure, CRM pipeline stages, billing-state doctrine, pricing categories, **and every doctrine/knowledge repo listed below**.

**Scoring (`scoreChunk()`):** keyword/tag/title token matches (+2 each) + `routeAffinity()` (same route +6, sub-route +4, same top-level lane +1.5) + a small feedback nudge from `getKnowledgeFeedbackScoreAdjustment()` (see below). `searchFinelyKnowledge()` sorts by score, filters by `minScore` (default 1), caps `limit` at 24.

**Public-safety filter:** `isPublicSafeKnowledgeChunk()` is the single source of truth for what's allowed into public/partner-facing surfaces — `eguide`/`article` chunks always pass; `reference` chunks are excluded if tagged with anything in `INTERNAL_REFERENCE_TAGS` (`billing`, `crm`, `pipeline`, `dunning`, `agreements`, `entitlements`, `internal_only`); `sop`/`tour`/`module` chunks are excluded unless tagged `visitor`/`all` or their route isn't under `/admin`/`/portal`. `searchFinelyKnowledgePublic()` wraps this with `sources: PUBLIC_KNOWLEDGE_SOURCES = ['eguide', 'article', 'reference']` and is what `finelyPublicAnswer.ts` (and thus `PublicChatWidget.tsx`, §19.2) actually calls.

**Feedback-adjusted ranking (J4):** `getKnowledgeFeedbackScoreAdjustment(chunkId, queryTokens)` in `src/data/knowledgeFeedbackRepo.ts` looks up prior feedback records for that chunk (`knowledgeFeedbackRepo.ts`'s `finely.knowledgeFeedback.v1` localStorage store), computes token overlap between the current query and each past feedback record's stored query (only counts records above a `SIMILAR_QUERY_OVERLAP_MIN = 0.34` overlap bar), and returns a bounded `±1.5` adjustment (`MAX_SCORE_ADJUSTMENT`) — deliberately small relative to the `+2`-per-token keyword score, so it can only bias ranking among otherwise-similar candidates, never override keyword relevance or turn an irrelevant chunk into a top hit.

#### 19.3.1 Doctrine/knowledge repo files (`src/data/*Repo.ts`)

Each repo below is pure TypeScript data plus `getAllX()`/lookup helpers — no AI calls, no side effects. All of them are wired into `finelyKnowledgeIndex.ts`'s `buildFinelyReferenceChunks()`, and most are *also* rendered directly by one or more public/portal pages (so the knowledge base and the UI never drift):

| Repo | Entries | Subject matter | Consuming pages/components |
|---|---|---|---|
| `src/data/caseStudiesRepo.ts` | ~22 `CaseStudy` records | Compliant proof-of-results (aliased partner names, score deltas, funding secured) across personal credit, business credit, debt, tradelines, HETA — every numeric claim carries `STANDARD_DISCLAIMER` ("Results vary… not legal advice") and real FCRA/FDCPA/ECOA/UCC/GLBA statutory basis | Homepage "Proven results" strip (`src/components/landing/index.tsx`), `/results` (`ResultsPage.tsx`), `/results/before-after` (`BeforeAfterGalleryPage.tsx`), `/testimonials` (`TestimonialsPage.tsx`), several `/resources/*` doctrine pages, `outcomeWizardEngine.ts` |
| `src/data/authorityCitationsRepo.ts` | 43 `AuthorityCitation` records | Statute/regulation + real case-precedent + agency-guidance footnote pack (FCRA §1681i/e/c/b, Reg V, FDCPA §1692c/e/f/g, etc.) with a `marketingSafeSummary` per entry | Letter Studio "Legal authority" panel (`LettersCommandCenter.tsx`), `FdcpaCollectorViolationsPage.tsx`, `CreditRepairComparisonPage.tsx` |
| `src/data/internationalAndNonCitizenCreditRepo.ts` | 21 `NonCitizenFundingRule` entries + 4 `InternationalCreditSystem` entries (CA, UK, DE, EU_GENERAL) | Non-U.S.-citizen business funding paths (ITIN holders, E2/EB5, DACA, green-card, non-resident LLC × SBA/BLOC/equipment/MCA/term-loan/CRE) and how consumer credit reporting works in Canada/UK/Germany/EU generally — explicitly framed as general education, not immigration/lending advice | `BusinessProfilePage.tsx`, `NonCitizenBusinessCreditPage.tsx`, `InternationalCreditSystemsGuidePage.tsx`, `NonCitizenFundingRuleCard.tsx` |
| `src/data/debtLitigationDoctrineRepo.ts` | ~45 `DebtLitigationPlaybook` entries | Debt-collection/civil-litigation defense doctrine across 11 debt types (credit card, medical, auto repo, foreclosure, student loan, overdraft, personal loan, tax lien, MCA, payday, timeshare) × 5 phases (pre-suit validation → summons answer → discovery/motion → post-judgment emergency → counter-suit) | `PartnerDebtPage.tsx` (`/portal/debt`), a family of `/resources/debt-defense-*` pages (validation letters, summons answer, discovery demands, post-judgment, FDCPA collector violations) plus 3 state-specific pages (TX/NY/PA), `DebtLitigationPlaybookCard.tsx` |
| `src/data/businessCreditDoctrineRepo.ts` | 5 `BusinessCreditTierStrategy` tiers + 9 `BusinessFundingInstrument` entries | Tier 1–5 vendor-credit matrix (target bureaus, Paydex/score minimums, real vendor lists, PG-release strategy, common mistakes) plus the funding-instrument landscape a business graduates into (SBA 7(a)/504, BLOC, equipment financing, etc.) | `BusinessVendorsPage.tsx` (`/business/vendors`), `BusinessCreditTierMatrixPage.tsx`, `BusinessCreditFundingInstrumentsPage.tsx`, `BusinessCreditBuildingMistakesPage.tsx`, `BusinessCreditTierCard.tsx` / `BusinessFundingInstrumentCard.tsx` |
| `src/data/agentPsychologyArchitectureRepo.ts` | 11 `PersonaPsychologyProfile` records | OCEAN + DISC personality/behavioral profiles, cognitive-processing mode, bias-mitigation rules, and de-escalation protocol per persona (Ruth + growth agents + a default) — grounded in mainstream frameworks (Costa & McCrae, Marston DISC, Kahneman dual-process, Sweller cognitive load) | **Internal only** (tagged `internal_only` — excluded from public/partner search, see §19.3). Consumed by `agentCognitiveEngine.ts` → Ruth's system prompt and growth-agent reasoning (§19.6) |
| `src/data/contentStudioMediaEngineRepo.ts` | 18 video + 16 image + 14 voice + 14 script = 62 technique/framework entries | Video/image/voice/copywriting production-technique reference library (hook patterns, pacing, caption style, layered composites, voice-clone consent gating, AIDA script framework, etc.) — real tool names for inspiration only, no vendor/API claims | `MediaTechniqueLibraryPanel.tsx` (Content Studio, `/admin/content-studio`), `mediaGapCheck.ts` (production-gap detection). Also tagged `internal_only` — internal ops content, excluded from public search |

### 19.4 Vector search upgrade (pgvector) — scaffolded, **not wired into any live caller**

Phase H1 added an *additive, opt-in* embedding-based retrieval path alongside the synchronous keyword index above. Read the header comments in `finelyKnowledgeIndex.ts` carefully — they say this explicitly, and it's worth restating for anyone tempted to assume it's live:

| Piece | File | Status |
|---|---|---|
| Table + RPC | `supabase/migrations/20260814030000_knowledge_chunks_pgvector.sql` | `public.knowledge_chunks` (`vector(1536)`, `text-embedding-3-small`), `ivfflat` cosine index, RLS with **no anon/authenticated direct-SELECT policy** — only `public.match_knowledge_chunks()` (SECURITY DEFINER RPC) is a sanctioned non-admin read path |
| ETL | `scripts/export-knowledge-chunks.mjs` | Imports the **real** `buildFinelyKnowledgeChunks()` + `isPublicSafeKnowledgeChunk()` from `finelyKnowledgeIndex.ts` (no re-derivation), embeds via OpenAI directly (`ai-gateway` doesn't proxy embeddings yet), upserts by `id`. `npx tsx scripts/export-knowledge-chunks.mjs` dry-runs by default; `-- --write` (+ `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`) persists |
| Edge function | `supabase/functions/knowledge-search/index.ts` | Embeds the query server-side, calls `match_knowledge_chunks()`; `mode: 'internal'` requires a real signed-in (non-anon) caller regardless of what the client requests |
| Client fn | `searchFinelyKnowledgeVector()` in `finelyKnowledgeIndex.ts` | Async, feature-flag gated |

**Wiring status (confirmed by reading the code, not just comments):** `searchFinelyKnowledgeVector()` is feature-flagged off by default (`knowledgeVectorSearch: false` in `src/domain/settings.ts`) and **grepping the codebase shows zero callers of it anywhere except its own file** — `finelyPublicAnswer.ts`, `coOwnerSiteKnowledgeMap.ts`, `PublicChatWidget.tsx`, and every other consumer still call the synchronous `searchFinelyKnowledge()` / `searchFinelyKnowledgePublic()`. It fails closed (returns `[]`, never throws) if the flag is off, Supabase isn't configured, or the query is empty — so it's safe to leave dormant.

**To actually adopt it**, a future pass needs to: (1) apply the migration, (2) run the ETL script with `--write` at least once (and set up a recurring job or incremental re-run — the script's header calls out that **every edit to any `build*Chunks()` source module silently desyncs the table** until re-run, since there's no CI hook for this yet), (3) deploy `knowledge-search`, (4) flip the flag, and (5) actually change a caller (e.g. `finelyPublicAnswer.ts`) to call `searchFinelyKnowledgeVector()` instead of/alongside `searchFinelyKnowledgePublic()`. The J4 feedback adjustment (§19.3) is designed to carry over unchanged once that happens, since chunk ids are stable across both retrieval paths — but it is **only applied to the synchronous path today**.

### 19.5 Content compliance review gate

A lightweight pre-publish gate for public content whose factual claims are sourced from a doctrine repo (§19.3.1) — modeled on the existing social-post disclosure-review pattern (`socialDisclosureLayer.ts`).

| Piece | File | Role |
|---|---|---|
| Types | `src/domain/complianceReview.ts` | `ContentComplianceStatus` = `draft \| needs_review \| approved \| blocked`; `ComplianceContentType` = `public_article \| state_landing_page \| outcome_wizard`; `RE_VERIFICATION_CADENCE_MONTHS` (6 months general, **3 months for `state_landing_page`** — statutes/garnishment/service-of-process rules vary by state and change more often) |
| Repo | `src/data/complianceReviewRepo.ts` | `upsertComplianceReview()`, `approveComplianceReview()`, `blockComplianceReview()`, `isContentApprovedForPublish()`, plus five `ensureC{1..5}*ComplianceRecordsSeeded()` idempotent seed functions — one seeded `needs_review` record per already-shipped doctrine-derived route (debt-defense articles/state pages, business-credit articles, non-citizen/international articles, the outcome wizard, the before/after gallery, the DIY-comparison page) |
| Pure evaluation | `src/lib/complianceReviewLayer.ts` | `evaluateContentComplianceReadiness()` — checks status is `approved`, a compliance footnote is present, at least one `sourceRepoRefs` entry exists, and the re-verification window hasn't lapsed |
| Admin UI | `src/components/compliance/ContentComplianceReviewPanel.tsx` | Approve / Block / Flag-for-re-review buttons, pending/overdue counters, "Add content for review" form |
| Admin route | `src/pages/admin/AdminComplianceReviewPage.tsx` → `/admin/compliance-review` | Wraps the panel in `PageShell` |

**Workflow:** every doctrine-derived public route gets a seeded `ComplianceReviewRecord` (`status: 'needs_review'`, `sourceRepoRefs` naming which repo(s) back its claims) the first time the panel mounts (`ensureC1ArticleComplianceRecordsSeeded()` etc. run in a `useEffect`). A human reviewer opens `/admin/compliance-review`, types their name into the reviewer field, and clicks **Approve** (→ `approveComplianceReview()`, which also stamps `lastVerifiedAt`/`nextVerificationDueAt` using the content type's cadence) or **Block**. `isRecordOverdueForVerification()` flags any previously-approved record whose re-verification window has lapsed, surfacing it back at the top of the list with a "Needs re-verification" chip.

**Gotcha — this is a soft/manual gate, not an enforced one.** `isContentApprovedForPublish(contentRef)` exists in `complianceReviewRepo.ts` and is exactly the check you'd expect a route guard or build step to call — but grepping the codebase shows it has **zero callers** anywhere outside its own file. Nothing in `App.tsx`'s routing, the build pipeline (`npm run build`), or CI actually blocks an unapproved/`needs_review`/`blocked` route from shipping; the code comment on the function says as much ("does not itself block a build/deploy — see `docs/planning/round3_final_phases_C0_C_G_D.md` §C0.1"). Today this is purely a **human process gate**: the admin panel is where a reviewer is supposed to check status before merging, not a mechanism that prevents merging.

### 19.6 Psychology/neuroscience engine

`src/features/growthAgents/agentCognitiveEngine.ts`'s `buildPsychologyAwareSystemPromptFragment(personaId)` is the bridge between the psychology data repo (§19.3.1, `agentPsychologyArchitectureRepo.ts`) and any LLM system prompt. It's deliberately compact — per Cognitive Load Theory (cited in the repo's own header comment), it renders only 3–4 lines: communication tone, the cognitive-load guidance rule, up to 3 bias-mitigation rules (`MAX_BIAS_RULES`), and one de-escalation line — never the full OCEAN/DISC profile. `getPsychologyProfile(personaId)` resolves aliases and falls back to a `DEFAULT_PROFILE` so this never throws.

**Two real call sites:**
- `src/domain/coOwnerSystemPrompt.ts` — calls `buildPsychologyAwareSystemPromptFragment('ruth')` directly inline in `buildCoOwnerSystemPrompt()`, so every Ruth response is grounded by her psychology profile.
- `src/features/growthAgents/growthAgentBrain.ts` — `runAgentBrainStep()` calls `buildPsychologyAwareSystemPromptFragment(args.agentId)` and appends the fragment to the growth agent's reasoning-step system prompt (the JSON-directive prompt used for `no_action`/`route_handoff`/etc. decisions).

Both call sites wrap the call in `try/catch` and treat a thrown/empty result as `''` — a missing or broken profile degrades gracefully rather than breaking the agent's turn.

### 19.7 Feature flags relevant to this section

| Flag | Gates | Notes |
|------|-------|-------|
| `aiGateway` | Ruth's chat, public chat LLM fallback, growth-agent brain steps | Same flag as §6 — everything in this section that calls an LLM depends on it |
| `knowledgeVectorSearch` | `searchFinelyKnowledgeVector()` | Off by default (`src/domain/settings.ts`); see §19.4 — flipping it on today has **no effect on any caller** until a future pass wires a real consumer to it |

## 20. Server cron, reliability, Content Studio media & public funnel/referral (Aug 2026)

Builds on §15–§17 (launch sprint → platform expansion → restore lane) with the piece that actually makes automation trustworthy: **server-side cron processors** that don't depend on an admin/partner browser tab being open, a **retry queue** so failed sends aren't silently dropped, **server-enforced comms safety** (suppression + quiet hours), a real **Content Studio media production layer**, several **public funnel/proof/pricing** changes, and the **referral + ladder-progression** system. Full cron reference: [`docs/PLATFORM_CRON.md`](PLATFORM_CRON.md) — this section is the "how it fits into the rest of the app" companion to that doc, not a replacement for it.

### 20.1 Server-side cron migration — why this was a critical fix

**The problem it fixes:** most of this codebase's automation (`src/lib/finelyAutomationOrchestrator.ts`, `src/lib/nurtureEngine.ts`, `src/features/growthAgents/subagents/alexNoShowRecovery.ts`, `src/lib/meetingReminderAutomation.ts`, `src/lib/billingDunningEngine.ts`, `src/lib/billingSubscriptionEngine.ts`) reads/writes **localStorage-backed repos** and only ever runs from a `useEffect`/interval **inside a signed-in browser tab**. If no admin or partner has the app open, meeting reminders, no-show recovery, CRM sequence steps, dunning nudges, and win-back emails simply never fire — there is no "24/7" without a browser. `src/lib/finelyAutomationOrchestrator.ts` remains exactly that: a **client-side tick** or growth-agent daily-pack orchestrator (`daily_find_pack`, `week_plan_sync`, `agent_team_tick`, etc.) — it is not itself the fix, it's the thing this phase's server processors were built to stop being the only path for revenue/retention-critical sends.

**The fix:** `supabase/functions/platform-cron/index.ts` is a Supabase Edge Function meant to be hit by **pg_cron** (or any external scheduler) every 15 minutes, independent of any browser session. Each `action: 'tick'` call now runs a fixed list of steps (`CRON_STEPS`, `version: 8` in the `ping` response):

| Step | Server processor | Reads/writes | Phase |
|------|-------------------|--------------|-------|
| `social_publish` | inline in `platform-cron/index.ts` (`runSocialPublishSweep`) | `social_scheduled_posts`, `meta_connections` | pre-existing |
| `automation_sweep` | invokes `automation-runner` `cron_sweep` (service-role → service-role fetch) | `automation_rules`, lead scan | pre-existing |
| `task_overdue` | `_shared/processTaskOverdueSweep.ts` | `work_tasks` | Phase 2 |
| `meeting_reminders` | `_shared/processDueMeetingReminders.ts` | `calendar_events`, `partners` | **Phase F1** |
| `no_show_recovery` | `_shared/processDueNoShowRecovery.ts` | `calendar_events`, `booking_invites`, `work_tasks` | **Phase F1** |
| `crm_sequences` | `_shared/processDueCrmSequenceSteps.ts` | `crm_sequences`, `crm_sequence_enrollments`, `crm_records`, `work_tasks` | **Phase F2** (+ **G3** A/B) |
| `billing_dunning` | `_shared/processDueBillingDunning.ts` | `agreements`, `partners` | **Phase F3** |
| `win_back` | `_shared/processDueWinBack.ts` | `entitlements`, `agreements`, `partners` | **Phase F3** |
| `send_retry_queue` | `_shared/sendRetryQueue.ts` (`processDueRetries`) | `send_retry_queue` | **Phase F5** — see §20.2 |
| `nurture` (via `automation-runner`) | `_shared/processDueNurtureEnrollments.ts` | `nurture_enrollments` | reconciliation fix, see below |

`nurture` is **not** in `platform-cron`'s own `CRON_STEPS` array — `automation-runner`'s `cron_sweep` action calls `processDueNurtureEnrollments()` internally (see `supabase/functions/automation-runner/index.ts`), and `platform-cron`'s `automation_sweep` step invokes `automation-runner` with `cron_sweep`. So a full `platform-cron` tick transitively runs the nurture engine too — it isn't a second, disconnected cron.

Each processor is a **1:1 Deno-compatible port** of the equivalent client engine's detection/branching logic (documented in each file's header comment — e.g. `processDueNoShowRecovery.ts` ports `alexNoShowRecovery.ts`'s 20-minute grace window; `processDueCrmSequenceSteps.ts` ports `runCrmSequenceEngine.ts`'s wait/email/task/stage_move branching), not a re-imagined version — so client and server never disagree about *when* something is due.

**What's still client-only (real, documented gap — not silently missing):** `support_sla`, `admin_digest`, `partner_digest`, `social_autopilot`, and `trial_expiry` still only run from `src/lib/platformCron.ts` while an admin has the app open, because they read localStorage-only repos (support inbox threads, notification digests) with no server table yet. Porting them would follow the exact same dual-write pattern as `crmServerSync.ts`/`calendarServerSync.ts` (§20.4) — see `docs/PLATFORM_CRON.md`'s "Client-only cron steps" section for the up-to-date list.

**Calling it manually / debugging:**

```powershell
# Dry-run (default) — logs a heartbeat, runs no real sends:
# { "action": "tick", "dryRun": true, "source": "manual" }

# Live tick — actually sends:
# { "action": "tick", "dryRun": false, "source": "manual", "runAutomationSweep": true }
```

Invoke via Supabase Studio's function test panel, or **Admin → Deploy** (dry-run tick button). Every tick's result is written to `platform_cron_heartbeats` (`id = 'latest'`) and surfaced in **Admin → Workflow queue → Triage tab → Platform cron health panel** (§20.2).

### 20.2 Reliability: the send-retry queue (Phase F5)

**Problem this closes:** every server processor above previously caught a failed provider send (SendGrid/SMTP/Twilio error, network blip) into its own `result.errors` array and **dropped it** — no retry existed anywhere. `_shared/sendRetryQueue.ts` gives every failure path a durable landing spot:

- **`enqueueRetry()`** — called from the failure branch of `processDueMeetingReminders.ts`, `processDueNoShowRecovery.ts`, `processDueCrmSequenceSteps.ts` (email step only), `processDueBillingDunning.ts`, `processDueWinBack.ts`, and `_shared/missedCallTextBack.ts` (§20.9). Inserts a row into `public.send_retry_queue` (migration `supabase/migrations/20260814120000_send_retry_queue.sql`) with `next_retry_at` = now + 5 minutes.
- **`processDueRetries()`** — wired into `platform-cron` as its own `send_retry_queue` step (runs **last**, so a failure earlier in the *same* tick is retried on a *later* tick, never twice in one invocation). Backoff schedule: **5 min → 30 min → 2 hr**, then the row is marked `status: 'failed'` permanently (still visible in the admin panel, no longer retried).
- **Re-checks suppression before every retry attempt**, not just at enqueue time — a contact suppressed in the gap between the original failure and the retry firing must never get a stale queued send.
- `source_processor` is a checked enum: `meeting_reminders | no_show_recovery | crm_sequences | billing_dunning | win_back | nurture | missed_call_textback` (the last value added by the follow-up migration `supabase/migrations/20260814140000_send_retry_queue_missed_call.sql`).

**Gotcha:** `'nurture'` is a valid `source_processor` in both the TypeScript type and the DB check constraint, but **`processDueNurtureEnrollments.ts` does not actually call `enqueueRetry()` anywhere** today — a failed nurture email just increments `emailsSkipped` and is dropped, same as before F5. If you need nurture sends to survive a transient provider failure, that call needs to be added; don't assume it already works just because the queue schema accepts it.

**Admin visibility:** `src/features/inbox/OpsPlatformCronHealthPanel.tsx` (rendered in **Admin → Workflow queue → Triage tab**) shows:
- Last heartbeat timestamp + staleness (`> 45 min` = "Stale" chip) via `platformCronHeartbeatRepo.ts`.
- pg_cron schedule status + a **Copy pg_cron SQL** action (`platformCronScheduleRepo.ts`).
- A "N sends pending retry" / "N failed permanently" chip (from `fetchSendRetryQueueCounts()` / `fetchSendRetryQueueItems()`) that expands into a compact list — source processor, recipient (email/phone), attempt count, last error.

### 20.3 Comms safety enforced server-side (not just client-side)

`supabase/functions/_shared/commsSuppressionCheck.ts` is the server-side mirror of `src/data/commsSuppressionRepo.ts`, reading/writing the **same** `public.comms_suppression` and `public.comms_frequency_log` tables (migration `20260813200000_crm_server_sync_and_suppression.sql` + `20260814110000_crm_sequences_server.sql`) so a suppression added from the admin app or a server dispatch is honored everywhere:

- **`checkSuppressionServerSide()`** — normalizes email/phone, checks `comms_suppression`, fails **open** on an infra error (matches the client's failure behavior — never blocks a send outright on a DB hiccup).
- **`isWithinQuietHoursServerSide()`** — hardcoded 9am–8pm window on the **edge runtime's system clock (UTC)**, not the recipient's local timezone — a coarse but consistent guard, same caveat the client version documents.
- **`isOverFrequencyCapServerSide()` / `recordSendForFrequencyCapServerSide()`** — shared `comms_frequency_log` table so the pre-existing nurture engine and the new CRM-sequence engine can't independently email the *same* person the *same* day without cross-awareness (see `processDueCrmSequenceSteps.ts`'s header comment for the full two-systems reconciliation design — kept as two separate tables/processors on purpose, unified only by this shared per-recipient send log).
- **`resolveFrequencyCapKeyServerSide()`** — when a `crmRecordId` is available, resolves to that record's own contact identity so an email send and an SMS send against the same CRM record share one bucket.

Before this phase, **zero** server-side send path enforced quiet hours or a frequency cap — F1's meeting reminders/no-show recovery were the first to check it; F2's CRM-sequence processor and a dedicated reconciliation fix to `processDueNurtureEnrollments.ts` (which previously called **no** suppression, quiet-hours, or frequency-cap check at all) reuse the same three helpers.

### 20.4 Data sync — dual-write pattern (localStorage ↔ Supabase)

Three modules follow the **exact same shape**: every local repo write is mirrored **best-effort** to Supabase; if the call fails or Supabase isn't configured, the local write already succeeded and nothing throws. Each also exposes a guarded, idempotent one-time backfill (`runXServerBackfillOnce()`, gated by a `localStorage` flag) for migrating pre-existing local data up to the server on first load.

| File | Syncs | Tenant id | Backing tables |
|------|-------|-----------|-----------------|
| `src/data/calendarServerSync.ts` | `calendarRepo.ts` writes | literal `'finely_cred'` | `calendar_events` |
| `src/data/crmSequencesServerSync.ts` | `crmSequencesRepo.ts` writes | literal `'finely_cred'` | `crm_sequences`, `crm_sequence_enrollments` |
| `src/data/crmServerSync.ts` | `crmProspectsRepo.ts` / `crmRecordsRepo.ts` writes | literal `'finely_cred'` | `crm_prospects`, `crm_records` |

**Dual-tenant-id gotcha (documented repeatedly in code comments — worth internalizing once):** this codebase has **two** tenant-id conventions in the wild. `partners`/`agreements`/`entitlements` use `FINELY_TENANT_ID` (`'tenant_finely_primary'`, from `src/domain/tenants.ts`). Everything built in this phase — `calendar_events`, `crm_prospects`, `crm_records`, `crm_sequences`, `crm_sequence_enrollments`, `comms_suppression`, `comms_frequency_log`, `send_retry_queue`, `nurture_enrollments`, and every `platform-cron`/`automation-runner` edge function — uses the **literal string `'finely_cred'`** instead. `processDueBillingDunning.ts`/`processDueWinBack.ts` straddle both: they query `agreements`/`entitlements` with `AGREEMENTS_TENANT_ID = 'tenant_finely_primary'` but write suppression/frequency-cap checks against `COMMS_TENANT_ID = 'finely_cred'`. If you add a new table, check which family it belongs to before picking a tenant id literal — mixing them up silently zeroes out every query (no error, just no rows).

`crmServerSync.ts` additionally exposes a **pull path** (`pullCrmSnapshotFromSupabase()`) — a read-and-merge "restore this browser's CRM data from Supabase" call, not real-time sync; call it on demand (e.g. an admin "restore from server" action) or on page load.

### 20.5 Content Studio media production engine

A **knowledge-base layer**, not an integration — no new API calls, just structured reference data + two UI surfaces that turn it into copilot suggestions and a reusable proof-graphic renderer.

- **`src/data/contentStudioMediaEngineRepo.ts`** — four typed catalogs: `VIDEO_PRODUCTION_TECHNIQUES` (hook patterns, pacing, B-roll, captions, thumbnails, aspect ratio, color grading, audio mixing), `IMAGE_PRODUCTION_TECHNIQUES`, `VOICE_AUDIO_TECHNIQUES` (incl. `complianceNotes` for voice cloning/consent), and `COPYWRITING_SCRIPT_FRAMEWORKS` (AIDA, PAS, BAB, beat sheets — each with a fill-in-the-blank `template` + a Finely Cred-specific `exampleFilled`). `toolsThatDoThisWell` names real, well-known apps (CapCut, Descript, ElevenLabs, DaVinci Resolve, Canva, etc.) for inspiration/reference only — explicitly **not** an API integration claim.
- **`src/features/studioCommandOs/MediaTechniqueLibraryPanel.tsx`** — chip-based browser over the repo (media type → category → technique cards), paginated via `FinelyOsPaginatedStack`. Script frameworks get an expandable "template + example" reveal the other three media types don't need.
- **`src/features/studioCommandOs/mediaGapCheck.ts`** — pure, unit-testable function (`detectMissingTechniques(plan)`) that flags **at most 1–2** concrete technique suggestions a video plan doesn't yet account for (e.g. no caption plan on a short vertical cut → suggests `vid_caption_burn_in`; a cold-traffic hook-trigger intent on a ≤40s vertical/square cut → suggests a hook technique keyed by `VideoGenerationIntent`). Never fires for categories the plan already declares coverage for — feeds the video copilot brain, not a forced checklist.
- **`src/components/proof/BeforeAfterScoreGraphicCanvas.tsx`** — the **shared** canvas-drawing component (extracted so it has exactly one implementation): renders a 1080×1080 before/after credit-score comparison graphic (two progress rings, a delta arrow, alias caption, disclaimer footer) onto a `<canvas>`, themeable (`emerald` | `violet` | `amber` via `BEFORE_AFTER_GRAPHIC_THEMES`). Exports `clampScore()`, `scoreBand()`, `downloadBeforeAfterGraphicPng()`, and the canonical `BEFORE_AFTER_GRAPHIC_DISCLAIMER` string.
- **`src/features/studioCommandOs/BeforeAfterScoreGraphicPanel.tsx`** — the **admin** generator: pick a featured case study (`getFeaturedCaseStudies()` from `caseStudiesRepo.ts`) to quick-fill start/end scores + alias, or type your own; live-previews via the shared canvas; **Save to Content Studio** (`saveContentStudioAsset()`, lands in the Assets workroom as `status: 'draft'` for review/approval) or **Download PNG**.
- **`src/pages/BeforeAfterGalleryPage.tsx`** (`/results/before-after`) — the **public** gallery. Reuses the exact same `BeforeAfterScoreGraphicCanvas` component so the admin tool and the public page can never visually drift. Filters `caseStudiesRepo.ts` to entries with both `startingScore` and `endingScore` (funding-secured case studies — business credit, debt & legal — stay on `/results` instead, since a score-delta graphic doesn't apply). Two-way navigation with `/results`: each links to the other rather than duplicating the full case-study library.

### 20.6 Public funnel, proof & pricing changes

**Case studies & proof strips** — `src/data/caseStudiesRepo.ts` is the single source of truth for every proof number on the public site (never fabricated inline). `src/components/landing/index.tsx` exposes two **distinct, non-duplicate** proof surfaces:
- **`HomeHeroProofStrip`** — a single compact KPI row (case study count, avg score lift, funding secured, practice-area count from `getCaseStudyProofStats()`) placed directly under the homepage hero, sized to avoid a second tall marketing block.
- **`ProvenResultsStrip`** — the fuller case-study card grid, further down the page, each card showing a `Funded` or `Score lift` stat plus a statutory-basis-aware summary.

Both carry the compliance disclaimer inline ("Results vary · not legal advice · funding subject to underwriting").

**`/results` vs `/results/before-after`** (`src/pages/ResultsPage.tsx`) — `/results` is the curated text/number-led highlight library (a subset also visible in full on `/testimonials`'s "Case studies" tab); `/results/before-after` (§20.5) is its visual sibling. Neither duplicates the other — cross-linked both ways.

**`src/pages/resources/CreditRepairComparisonPage.tsx`** (`/resources/diy-vs-traditional-vs-finely`) — an honest three-way comparison (Pure DIY vs. Finely Cred DFY vs. traditional credit-repair agencies). Pricing pulled live from `getPackageById()`/`formatPrice()` (never a hand-typed number), "traditional agency" claims sourced only from the federal CROA statute (`authorityCitationsRepo.ts`) — no named competitor. Seeded into compliance review as `needs_review` via `ensureC3ComparisonPageComplianceRecordSeeded()` — left for review, not self-approved.

**A/B experiments** — `src/data/funnelExperimentsRepo.ts` stores `FunnelExperiment` rows keyed by `funnelId` (`credit_dispute`, `homepage_hero`, `debt_freedom`, `business_credit`), each with per-variant headlines/CTA labels and (for `homepage_hero`) per-variant **destination routes** (`ctaDestinations.control/variant_a/variant_b`). `assignFunnelVariant()` is deterministic-per-session (sessionStorage-sticky, 34/33/33 split) and records an impression on first assignment. `getAssignedCtaDestination(funnelId, fallback)` is the CTA-destination-test entry point.

**`src/lib/funnelCtaBridge.ts`** — closes a real gap: `assignFunnelVariant()`/`recordFunnelConversion()` are same-page primitives, but a CTA-*destination* test means the visitor is assigned a variant on the homepage and the real conversion (checkout start, intake submit) happens on a **different page** after the homepage's React tree has unmounted. `persistCtaBridgeVariant()` (call at CTA-click time) writes the assigned variant to `sessionStorage`; `reconcileCtaBridgeConversion()` (call from the destination page's real conversion event) reads it back, records the conversion against the *originating* funnel, and clears the key so it's never double-counted.

**CTA intent spine** — see [`docs/CTA_CONTRACT.md`](CTA_CONTRACT.md) in full (§15.1 already summarizes it). The contract: every public/funnel "next step" CTA resolves through `resolveFinelyCtaPath()`/`finelyCtaNavigate()` in `src/lib/finelyCtaIntent.ts` — never a bare hand-written path — enforced by `npm run cta:bare-onboarding:audit` (`scripts/audit-bare-onboarding.mjs`). Available intents as of this writing: `personal_free_guide`, `personal_free_trial`, `personal_intake`, `personal_package`, `business_intake`, `debt_intake`, `funding_intake`, `consultation`, `career_track`, `lead_magnet`, plus role/program-specific intents (`affiliate_intake`, `au_seller_intake`, `au_buyer_intake`, `tradeline_intake`, `agent_intake`, `score_roadmap_intake`, `heta_intake`). New CTAs should reuse an existing intent before adding a new one.

**Pricing tier simplification** — `src/config/pricingCatalog.ts`'s `PricingPackage` type carries two booleans every catalog consumer must respect:
- **`isPublic: boolean`** — `getPackagesByCategory(category)` filters to `isPublic: true` only (and sorts by `sortOrder`). Retired tiers are kept in the file with `isPublic: false` **forever** (never deleted) so existing partners' entitlement chains and historical agreements still resolve by id — see the `// isPublic:false only (never delete)` comments inline near `personal_restore_5000`, `debt_kill_plus`, etc.
- **`isCustomQuote?: boolean`** — a "retired-but-resolvable" pseudo-tier: routes to intake instead of checkout, shows "Custom quote" instead of a sticker price, `priceAmount` is `0` as a placeholder (never charged directly). `entryPackageForCategory()` in `partnerLadderProgression.ts` (§20.7) explicitly excludes `isCustomQuote` packages when picking the "natural entry rung" for a category.

### 20.7 Referral & ladder progression

**Referral tracking** — `src/lib/referralGrowthEngine.ts`:
- `recordReferralLinkVisit({ code, path })` — logs a click (`referralGrowthRepo.ts`) and emits an `automation.triggered` platform event.
- `recordReferralLeadCapture({ referralCode, leadId, funnelId })` — logs a conversion; every 5th conversion for a code (30-day window) fires an **admin notification** ("Referral milestone").
- `buildReferralGrowthSnapshot()` — admin-wide 30-day click/conversion rollup, top 8 codes by conversions.
- `buildReferralGrowthSnapshotForCode(code)` — **partner-scoped** version (Wave 4 / L1) so a partner panel can show just their own numbers without needing access to every other affiliate's data.

**`src/components/partner/PartnerReferralPanel.tsx`** — the partner-facing card: provisions (or loads) the partner's own `Affiliate` record via `affiliateRepo.ts` (`findAffiliateByPartnerId` / `createAffiliate`), scopes stats via `buildReferralGrowthSnapshotForCode()`, builds a shareable short link (`buildShortReferralUrl()` in `leadAttribution.ts`), and gives copy-link + pre-filled SMS/email share actions. Uses **partner** terminology throughout.

**Ladder progression (Wave 5 / L2)** — `src/domain/partnerLadderProgression.ts`:
- Ladder order: **Personal Credit Restore → Wealth Builder → Business Credit** (`LADDER_ORDER`). No forced upsell for categories without a clearly-scoped "next step" (debt/legal, privacy, tradeline, agency, bundles are excluded from this ladder entirely).
- Shares its "does this agreement count as revenue" definition with the **admin** E1a.3 metric by importing `REVENUE_RECOGNIZED_STATUSES` and `packageRungPriceForAgreement()` directly from `src/data/billingAdminAggregateRepo.ts` — so the admin "% of partners who graduate" number and the partner-facing "here's your next rung" card can never tell contradictory stories about the same partner.
- `recommendNextRung(input)` — pure function, returns `null` (no recommendation) unless: the partner has a revenue-recognized agreement on the ladder, is "graduation-ready" (agreement `status: 'completed'`, **or** a flat/improving credit-score trend over the last 3+ readings via `isScoreTrendStabilizedOrImproving()`), and doesn't already hold the next tier.
- **`src/components/partner/PartnerNextRungPanel.tsx`** — renders `recommendNextRung()`'s output or **nothing** (no forced upsell, no permanent empty box — per the workspace's no-duplicate-UI-layers rule). Reads real agreement history (`listAgreementsByPartner`) and real score history (`listCreditScoreSnapshots`).

### 20.8 Instant lead acknowledgment (Phase N1)

Closes a real "lead submits, hears nothing for hours" gap on two separate ingestion paths:

- **Client-captured leads** (`submitLeadCapture()` → `runLeadCapturePipeline()`) — `src/lib/instantLeadAck.ts`'s `sendImmediateWelcomeSms()`. Same gating shape as `sendImmediateWelcomeEmail()` in `funnelEmail.ts`: requires `consentToContact` + `consentSmsMarketing`, the `commsDelivery` feature flag, Supabase configured, and a clean `checkSuppression()` result. Gives the lead a **real next action** — a booking-invite link (`createBookingInvite()`/`buildBookingInvitePath()`), not a bare "thanks." No frequency-cap check — this is the very first touch on a brand-new lead, not a cadence step.
- **Server-ingested leads** (currently: Meta Lead Ads via `meta-webhook/index.ts`, which upserts directly into `lead_captures` via service role and previously got **zero** acknowledgment) — `supabase/functions/_shared/sendInstantLeadAck.ts`'s `sendInstantLeadAckServerSide()`. Sends both email + SMS (independently gated), explicitly refuses to email the `meta+<id>@lead.local` placeholder address Meta's webhook falls back to when the Graph API can't resolve a real email, and never throws — every branch resolves to a result object.
- **`src/lib/leadFirstTouchTracking.ts`**'s `markLeadFirstTouch(leadId, channel)` — shared by both the client sender and (mirrored server-side inline in `sendInstantLeadAckServerSide`) the server sender, so whichever path sends first sets `lead_captures.first_touch_at` / `first_touch_channel` exactly once (`.is('first_touch_at', null)` guard). Migration: `supabase/migrations/20260813210000_lead_captures_first_touch_ack.sql`.

### 20.9 Missed-call text-back & calendar-sync groundwork (newest additions)

**Missed-call text-back (Phase J3)** — `supabase/functions/_shared/missedCallTextBack.ts`. Unlike every `platform-cron` processor above, this does **not** poll on a schedule — it fires **synchronously inside `twilio-webhook`'s existing voice-status callback handler** the moment Twilio reports a missed call (`no-answer`/`busy`/`failed`/`canceled`) or a completed voicemail (`TranscriptionText`/`RecordingUrl` present), so the caller gets an SMS within the same request instead of waiting for the next tick. Deliberately **not** a second Twilio webhook endpoint — it reuses the already-configured `supabase/functions/twilio-webhook/index.ts` voice callback.

- Sends a suppression-checked SMS with a real `booking_invites` link (same server-booking-invite pattern as `processDueNoShowRecovery.ts`) and queues a high-priority `work_tasks` follow-up (`tags: ['missed-call-textback', 'twilio-webhook']`) so a human still calls back.
- A failed SMS falls into the **same** `send_retry_queue` (`source_processor: 'missed_call_textback'`) `platform-cron`'s `send_retry_queue` step already sweeps every tick.
- **Idempotent per `CallSid`** via `requireIdempotency()` (Deno KV, 24h TTL) — Twilio's own multiple status callbacks for the same call never trigger a second text-back.
- **Gated by both**: the `MISSED_CALL_TEXTBACK_ENABLED=true` edge secret (explicit opt-in — the client-visible `missedCallTextBack` flag in `src/domain/settings.ts` is informational only, since this fires from a service-role webhook with no browser/session in the loop) **and** real Twilio credentials (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`) being configured (`isMissedCallTextBackEnabled()` checks both). **Off by default** — do not enable before a real support number is wired to `twilio-webhook`'s voice webhook URL in the Twilio Console.
- Migrations: `send_retry_queue`'s `source_processor` check constraint needed a follow-up migration to add the new value — `supabase/migrations/20260814140000_send_retry_queue_missed_call.sql`.

**External calendar sync groundwork (Phase J1 — deferred/stubbed, behind a flag)** — `src/lib/calendarProviderSync.ts` + `src/domain/calendarProviderConnection.ts`. This is **evaluation groundwork, not a working feature**:

- Every adapter (`getCalendarProviderAdapter('google' | 'microsoft')`) is a `notConfiguredAdapter(...)` stub — `pushEvent()` always returns `{ ok: false, reason: 'not_configured' }`, `pullBusyBlocks()` always returns `[]`. No OAuth app is registered with Google or Microsoft.
- Gated by the `calendarExternalSync` feature flag (`src/domain/settings.ts`, default `false`) via `isCalendarExternalSyncEnabled()` — but **fails closed regardless of the flag**: even with the flag on, the stub adapters still report "not configured." Flipping it on today only reveals a "coming soon" admin affordance in `CalendarSettingsPanel.tsx` (via `getCalendarExternalSyncPreviewStatus()`) — it changes zero runtime send/sync behavior.
- Schema is real and ready for real credentials: `calendar_provider_connections` table (migration `supabase/migrations/20260814140000_calendar_provider_connections.sql`), admin-only RLS (carries OAuth token material — no partner-read policy yet), `unique (tenant_id, owner_kind, owner_id, provider)`. When real credentials land, the intended path is a new OAuth callback edge function mirroring `meta-oauth`'s existing pattern (`meta_connections`) — every current caller of `pushCalendarEventExternally()`/`pullExternalBusyBlocks()` keeps working unchanged since the adapter interface shape doesn't change.
- One-way (Finely → external) push is the evaluation's recommended first slice; two-way sync (external edits flowing back into `calendar_events`) is explicitly out of scope for this stub pass.

### 20.10 Admin analytics — real MRR/revenue by tier

`src/pages/admin/AdminAnalyticsPage.tsx` pulls real Supabase-backed revenue via `src/data/billingAdminAggregateRepo.ts`'s `pullAdminRevenueSnapshot()` — **not** the 100%-localStorage `AdminBillingPage.tsx`, and **not** partner-scoped like `billingSupabaseSync.ts`. It queries `agreements` directly with **no `partner_id` filter** (safe under existing RLS: `is_partner_owner()` was patched in `20260521000001_add_admin_bypass_to_rls.sql` to return `true` for every row when the caller `is_admin()` — no new migration needed for this cross-partner read).

Splits revenue into three distinct views (per the enhancement plan — never one blended number):
1. **One-time DFY/DIY program revenue** — excludes the recurring membership SKU and agency buy-ins; broken down by `revenueByCategory`.
2. **Recurring membership MRR** — sum of `active` `personal_core` agreements only (the one true subscription SKU in the catalog).
3. **Agency revenue-share pipeline** — one-time buy-in revenue across the $1K–$499K agency ladder (§14.3), broken down `agencyByTier`.

`REVENUE_RECOGNIZED_STATUSES = new Set(['active', 'completed'])` is exported from this file specifically so `partnerLadderProgression.ts` (§20.7) can import the identical definition rather than re-deriving its own — keeping the admin "% of partners who graduate" metric and the partner-facing "next rung" recommendation from disagreeing about what counts as revenue. `AdminRevenueSnapshot.dataSource` is `'unavailable'` (with an `error` string) rather than throwing when Supabase isn't configured or the query fails — `AdminAnalyticsPage.tsx` checks `hasRevenueError` to render a degraded state instead of crashing.

### 20.11 Key migrations index (this phase)

| Migration | Adds |
|-----------|------|
| `20260813200000_crm_server_sync_and_suppression.sql` | `crm_prospects`, `crm_records`, `comms_suppression` |
| `20260813210000_lead_captures_first_touch_ack.sql` | `lead_captures.first_touch_at` / `.first_touch_channel` (N1) |
| `20260814100000_calendar_events_server.sql` | `calendar_events` (F1) |
| `20260814110000_crm_sequences_server.sql` | `crm_sequences`, `crm_sequence_enrollments`, `comms_frequency_log` (F2) |
| `20260814120000_send_retry_queue.sql` | `send_retry_queue` (F5) |
| `20260814130000_crm_sequence_step_variants.sql` | `crm_sequence_enrollments.assigned_variant` / `.stage_at_enrollment` (G3 A/B) |
| `20260814140000_calendar_provider_connections.sql` | `calendar_provider_connections` (J1, stub groundwork) |
| `20260814140000_send_retry_queue_missed_call.sql` | Adds `'missed_call_textback'` to `send_retry_queue.source_processor` (J3) |
| `202608112000_booking_invites.sql` | `booking_invites` (referenced by no-show recovery + missed-call text-back reschedule links) |

Apply all with `supabase db push` (§5.2) — this phase's migrations are additive-only (new tables / new columns / new check-constraint values), no destructive changes.

### 20.12 Feature flags touched in this phase (`src/domain/settings.ts`)

| Flag | Default | Gates |
|------|---------|-------|
| `missedCallTextBack` | `false` | Client-visible status only — the real gate is the `MISSED_CALL_TEXTBACK_ENABLED` edge secret + Twilio config (§20.9) |
| `calendarExternalSync` | `false` | Reveals the "coming soon" admin affordance in `CalendarSettingsPanel.tsx` — stub adapters fail closed regardless (§20.9) |

Neither flag currently changes real send/sync behavior when flipped — both gate UI affordances or document a server-side secret's job, not a live capability switch. Don't treat enabling either as "turning the feature on."

## 21. Letter lifecycle hardening (Aug 2026)

An end-to-end audit of the letter lifecycle (template → rich-text edit → save → PDF → mail → notify) found and fixed 4 real bugs. `npm run typecheck` passes clean after all fixes.

### 21.1 Silent data-loss fixes in both letter editors

- **`src/components/letters/LettersCommandCenter.tsx`** (the main draft editor) — previously, closing the modal (✕ or backdrop click) discarded any unsaved edits with no warning. A `draftSyncedHtmlRef` now tracks the last-persisted HTML; closing auto-saves any pending edits first (and blocks closing if that save fails). A live **"Unsaved edits" / "All changes saved"** badge is shown in the modal header.
- **`src/components/letters/LetterBodyEditorModal.tsx`** (the saved-letter re-editor) — previously, editing a previously-saved letter and clicking Cancel/✕/backdrop silently discarded the edits. A snapshot of the loaded content is now taken on open; closing checks for real changes and prompts "Discard your unsaved edits to this letter?" before closing, with the same "Unsaved" header badge.

### 21.2 Mail-send / credits-ledger reconciliation fix

**`src/components/letters/MailLetterModal.tsx`** — the LetterStream provider send and the internal mail-credits ledger charge were previously coupled: if the physical mail send succeeded but the ledger charge threw (e.g. balance drifted), the whole operation was reported as **failed** even though the letter was already in the mail — risking a partner or admin re-sending a letter that already went out. The two steps are now decoupled: a ledger-charge failure surfaces as a non-blocking amber **reconciliation warning** on the Track step, while the mailed status is correctly reported as successful.

### 21.3 Evidence-exhibit regression fix (Partner Detail page)

**`src/pages/admin/PartnerDetailPage.tsx`** — `SavedLetterCard` on the admin Partner Detail letters tab wasn't passed the partner's `evidence` array, so editing a dispute letter from there (Edit → `LetterBodyEditorModal` → regenerate PDF) silently regenerated the PDF with **zero evidence exhibits** attached, even when screenshots existed. Fixed by wiring `evidence={evidence}` onto that card via a patch script (`scripts/_patch-partner-detail-letters-evidence-prop.mjs`) — per this repo's standing rule to never use `StrReplace` directly on `PartnerDetailPage.tsx`.

### 21.4 Verified solid (no regressions)

`richText.ts` whitespace/blank-line fidelity, `generateTextPdf.ts`/`generateDisputePdfInline.ts` line-wrap preservation, the 30-day validation closing block + swappable intro variants, `mailWhiteLabel.ts` branding constants, and both `letterMailedNotify.ts` email-confirmation call sites (`AdminMailLettersPage.tsx` and `PartnerLettersVaultPage.tsx`) were all re-verified end to end and found correct.

### 21.5 Known, out-of-scope items (flagged, not changed)

- `src/lib/letterBodySafety.ts` broadly scrubs *any* email address pattern from letter bodies (not just Finely-branded ones), which could theoretically strip legitimate partner-authored content — a content-safety policy question, not a lifecycle bug, left for explicit product direction.
- `src/components/letters/BatchMailWizard.tsx` still silently swallows a ledger-charge failure (code comment only, no user-facing warning) unlike the single-mail flow's new reconciliation warning (§21.2) — low risk since the physical mail still succeeds and reports correctly, but worth mirroring later for full consistency.

---

## See also

- `docs/LOCAL_DEV.md` — quick start + modes + key routes
- `docs/DEVELOPER_HANDOFF.md` — production ops runbook (golden rules, onboarding flows, AI gateway, edge auth matrix, RLS, automation/nurture, mail, deploy checklist)
- `docs/PRODUCTION_DEPLOY.md` — environments, pre-deploy checklist, feature flags, rollback, CI workflows
- `docs/CREDIT_REPORT_PARSING_DIAGNOSTICS.md` — report parsing diagnostics panel
- `docs/SECURITY_ARCHITECTURE_SUPABASE.md` — target-state RLS/tenant model
- `docs/PLATFORM_CRON.md` — server cron ticks (digest, nurture, billing)
- `docs/VOICE_STUDIO_API.md` — Voice Studio render API
- `docs/DEMO_VIDEOS.md` — demo video assets, ffmpeg setup, launch presenter WebM
- `docs/GROWTH_AGENT_MASTER.md` — growth agents quick path map
- `docs/plans/partner-overview-profile-professional-ui.md` — Platinum Workspace (admin Overview/Profile) plan (§14.4, §14.8)
- `docs/plans/admin-color-pop-agency-buyins-push.md` — admin color-pop + 6-tier agency buy-ins + guide update (§14.3, §14.4, §14.8)
- `DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md`, `DEV_URGENT_MAIL_AND_LITIGATION.md`, `DEV_URGENT_LITIGATION_ROLES_MEETINGS.md`, `DEV_URGENT_BC_PRICING_ONESHEETS.md` (repo root) — current in-flight priority handoffs
