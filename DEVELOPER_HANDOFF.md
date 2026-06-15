# Developer Handoff — Finely Cred (Sovereign Supreme)

**Audience:** Developer with GitHub + Supabase + deploy access.  
**Owner:** Non-developer; local testing only. **You** own live SQL, secrets, CI, and production deploy.

---

## Table of contents

1. [Start here (30 minutes)](#1-start-here-30-minutes)
2. [GitHub repository](#2-github-repository)
3. [Local development](#3-local-development)
4. [Environment variables](#4-environment-variables)
5. [Launch & deploy playbook](#5-launch--deploy-playbook)
6. [Supabase database & storage](#6-supabase-database--storage)
7. [Edge functions](#7-edge-functions)
8. [External APIs & AI services](#8-external-apis--ai-services)
9. [Feature flags (Admin → Settings)](#9-feature-flags-admin--settings)
10. [Architecture & routing](#10-architecture--routing)
11. [CI/CD & GitHub Actions](#11-cicd--github-actions)
12. [Testing & QA commands](#12-testing--qa-commands)
13. [Admin & operator URLs](#13-admin--operator-urls)
14. [Email, SMS & signup flows](#14-email-sms--signup-flows)
15. [Voice Studio & tour audio](#15-voice-studio--tour-audio)
16. [Historical fixes (context)](#16-historical-fixes-context)
17. [Troubleshooting](#17-troubleshooting)
18. [Documentation index](#18-documentation-index)

---

## 1. Start here (30 minutes)

```bash
git clone https://github.com/sadiss/finely-cred.git
cd finely-cred
git checkout launch/ready-sovereign-supreme   # latest launch-ready build (merge to main via PR)

npm install
cp .env.example .env.local                    # never commit .env.local
npm run env:setup                               # fills missing keys from example
# Edit .env.local — paste Supabase URL + anon key (use DEV project first)

npm run env:check
npm run dev                                     # http://127.0.0.1:5173
```

**Before first production deploy, run in order:**

| Step | Command / action |
|------|------------------|
| 1 | Create **dev** Supabase project → paste keys → `npm run env:check` |
| 2 | SQL Editor → run `supabase/LIVE_SETUP_run_all.sql` |
| 3 | Add staff emails to `public.admin_emails` |
| 4 | `npm run launch:gate` (fast) or `npm run launch:bundle` (full QA) |
| 5 | `npm run deploy:functions` (after `supabase link`) |
| 6 | Set **edge secrets** in Supabase dashboard (see [§4](#4-environment-variables)) |
| 7 | `npm run build` → deploy `dist/` to host with `VITE_*` env vars |
| 8 | `npm run post-deploy:verify -- https://your-domain.com` |
| 9 | Manual QA: `docs/SENIOR-QA-WALKTHROUGH.md` (voice mic on `/start-here`) |

**One-screen operator checklist:** `npm run launch:handoff`  
**Secrets overview (non-blocking):** `npm run secrets:summary`  
**Host deploy steps:** `npm run deploy:host-guide -- vercel|netlify|cloudflare`

---

## 2. GitHub repository

| Item | Value |
|------|--------|
| **Repo** | https://github.com/sadiss/finely-cred |
| **Launch-ready branch** | `launch/ready-sovereign-supreme` |
| **Default branch (existing history)** | `main` |
| **Open PR to merge launch build** | https://github.com/sadiss/finely-cred/pull/new/launch/ready-sovereign-supreme |

**Repo root = app root** (not a monorepo subfolder). CI workflows run from repository root.

**Never commit:** `.env.local`, `node_modules/`, `dist/`, `test-results/`, secrets.

**Included deploy configs:** `vercel.json`, `netlify.toml`, `public/_redirects`, `public/_headers`, `public/_routes.json`, `deploy/env.production.template`

Each production build generates **`dist/DEPLOY_HANDOFF.txt`** inside the artifact.

---

## 3. Local development

| Mode | Requirements | What works |
|------|--------------|------------|
| **Marketing-only** | No Supabase keys | Public site, pricing, resources, funnels (local JSON) |
| **Full** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local` | Auth, portal, admin, cloud sync, edge-backed features |

```bash
npm run dev              # http://127.0.0.1:5173 (strict port)
npm run dev:host         # 0.0.0.0:5173
npm run typecheck
npm run env:check
npm run dev:check        # typecheck + env:check
```

**Recommended:** Use a **separate dev Supabase project**, not production keys.

```bash
npm run env:dev-supabase   # prints step-by-step dev project setup
npm run supabase:login
npm run supabase:link
npm run supabase:db:push
```

**Local persistence without Supabase:** partners, letters, evidence fall back to `localStorage` / IndexedDB when `!isSupabaseConfigured` (see `partnersRepo.ts`, `lettersRepo.ts`, `evidenceRepo.ts`).

More detail: [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)

---

## 4. Environment variables

Copy template: **`deploy/env.production.template`** · Full list: **`.env.example`**

### Client-side (Vite — set on host at **build time**)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | **Yes** (live) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **Yes** (live) | Public anon key |
| `VITE_SUPABASE_PRIVATE_BUCKET` | Recommended | Storage bucket id (default `pii`) — must match SQL migration |
| `VITE_SITE_URL` | Recommended | Canonical URL for sitemap/OG (default `https://finelycred.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | When Stripe live | Client checkout |
| `VITE_SMARTCREDIT_PID` | Optional | Live affiliate PID (placeholder `54821` in dev) |
| `VITE_SENTRY_DSN` | Optional | Error reporting |
| `VITE_VOICE_ALLOW_BROWSER_PREVIEW` | Optional | `false` in prod — browser TTS dev-only |

Local file: **`.env.local`** (git-ignored). Bootstrap: `npm run env:setup`

### Edge function secrets (Supabase Dashboard → Edge Functions → Secrets)

**Not** in Vite env. Set on Supabase project:

| Secret | Used by | Purpose |
|--------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Most admin/claim functions | Bypass RLS for service operations |
| `SUPABASE_URL` | Auto / deploy | Project URL |
| `SUPABASE_ANON_KEY` | JWT verify flows | Anon key |
| `APP_BASE_URL` | Stripe, comms, checkout | e.g. `https://finelycred.com` |
| `EDGE_ADMIN_EMAILS` | Admin gates | Comma-separated admin emails |
| `OPENAI_API_KEY` | `ai-gateway`, TTS fallback | LLM dispute drafts, chat, `tts-1-hd` |
| `CARTESIA_API_KEY` | `voice-studio` | **Recommended** premium TTS |
| `CARTESIA_MODEL` | `voice-studio` | Default `sonic-2` |
| `ELEVENLABS_API_KEY` | `voice-studio`, `guide-audio` | Clone + fallback TTS |
| `ELEVENLABS_MODEL` | voice | Default `eleven_multilingual_v2` |
| `VOICE_CLONE_FINELY_PRIMARY_ID` | voice | Brand voice clone id |
| `VOICE_CLONE_NORA_PRIMARY_ID` | voice | Nora clone (optional) |
| `VOICE_PIPELINE_VERSION` | voice cache | Bump to invalidate prerendered audio |
| `STRIPE_SECRET_KEY` | `stripe-*`, checkout | Payments |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Webhook verify |
| `SENDGRID_API_KEY` | `send-email`, comms | Transactional + nurture email |
| `TWILIO_ACCOUNT_SID` | SMS | Twilio |
| `TWILIO_AUTH_TOKEN` | `twilio-webhook`, SMS | **Required for live phone** |
| `TWILIO_FROM_NUMBER` | SMS | Outbound SMS |
| `META_APP_ID` | Meta OAuth | Social hub |
| `META_APP_SECRET` | `meta-webhook`, OAuth | Lead ads |
| `META_VERIFY_TOKEN` | Meta webhook | Verification |
| `NORA_CAPITAL_BASE_URL` | `nora-capital` | Nora API base |
| `NORA_CAPITAL_API_KEY` | `nora-capital` | Nora auth |
| `NORA_CAPITAL_WEBHOOK_SECRET` | `nora-capital-webhook` | Inbound webhooks |
| `NORA_CAPITAL_ALLOWED_PATHS_JSON` | nora | Path allowlist JSON array |
| `FINELY_PARTNER_API_KEYS_JSON` | `finely-partner-api` | Partner API keys array |

Validate locally: `npm run secrets:check` (strict) · `npm run secrets:summary` (overview)

---

## 5. Launch & deploy playbook

### Command tiers

| Speed | Command | What it runs |
|-------|---------|--------------|
| Instant | `npm run launch:status` | File/dist/env snapshot (~5s) |
| Fast | `npm run launch:gate` | typecheck + SEO + signup emails + dist verify |
| Operator | `npm run launch:handoff` | Handoff checklist + typecheck |
| Full QA | `npm run launch:complete` | All audit gates + **24** Playwright paths |
| Build + QA | `npm run launch:bundle` | `build` + `launch:complete` |
| Refresh artifact | `npm run launch:refresh` | `build` + `launch:status` |
| With Supabase keys | `npm run launch:go-live` | env + preflight + deploy checklist |
| Backend blockers | `npm run launch:ops` | Ops dashboard (no full re-audit) |

### Production deploy sequence

```bash
# 1. Code gates
npm run launch:bundle                    # or: npm run predeploy:code (no rebuild)

# 2. Database (once per project / after new migrations)
npm run live-setup:rebuild               # regenerates LIVE_SETUP_run_all.sql
# Paste supabase/LIVE_SETUP_run_all.sql in Supabase SQL Editor OR:
npm run supabase:db:push

# 3. Edge
npm run deploy:functions                 # launch subset; add -- --all for every function
# Set all edge secrets (§4)

# 4. Frontend
npm run build                            # outputs dist/ + DEPLOY_HANDOFF.txt
# Deploy dist/ to Vercel / Netlify / Cloudflare Pages
# Set VITE_* on host (deploy/env.production.template)

# 5. Post-deploy
npm run post-deploy:verify -- https://finelycred.com

# 6. Enable feature flags in Admin → Settings when secrets are live (§9)
```

### Static host configs

| Host | Config |
|------|--------|
| **Vercel** | `vercel.json` — build: `npm run build`, output: `dist` |
| **Netlify** | `netlify.toml` |
| **Cloudflare Pages** | `public/_redirects` + `public/_routes.json` |
| **Local preview** | `npm run start` → http://127.0.0.1:8080 |

Full guide: [docs/PRODUCTION_DEPLOY.md](docs/PRODUCTION_DEPLOY.md)

### GitHub Actions secrets (for CI deploy workflow)

Set in repo **Settings → Secrets**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Workflows: `.github/workflows/ci.yml`, `.github/workflows/deploy-manual.yml`

---

## 6. Supabase database & storage

### One-shot setup

Run **`supabase/LIVE_SETUP_run_all.sql`** in the Supabase SQL Editor (idempotent).

Regenerate after new migrations:

```bash
npm run live-setup:rebuild
npm run migrations:check
```

Includes (non-exhaustive): tenants/partners, workflow tables, RLS, `admin_emails`, voice studio, lead captures, staff, social posts, platform cron, nurture/automation persistence, server automation queue, work tasks, **private `pii` storage bucket**.

### Admin emails

Staff who create partners / access admin must be in `public.admin_emails`:

```sql
insert into public.admin_emails (email) values ('you@finelycred.com');
```

Seeded in migrations: `partnersupport@`, `sanzstlouis@`, `shellystlouis@` @ finelycred.com

### Storage bucket

- Default bucket id: **`pii`**
- Env `VITE_SUPABASE_PRIVATE_BUCKET` must match bucket id in SQL
- Used for: report PDFs, letter PDFs, evidence screenshots
- Policy: partner owner + admin via `is_partner_owner()`

### Partner claim (`claimed_user_id`) — critical for live letter/evidence saves

- **New self-signup:** partner created with `claimedUserId = auth user id` → RLS passes
- **Admin-created partner:** partner claims via **`claim-profile`** edge function (email must match)
- **Claim link:** `/claim?token=…` → `ClaimPartnerProfilePage`
- Deploy **`claim-profile`** with `SUPABASE_SERVICE_ROLE_KEY`

Verify: `npm run rls:check` (requires linked Supabase)

---

## 7. Edge functions

Deploy:

```bash
npm run deploy:functions          # launch-critical subset (see below)
npm run deploy:functions -- --all # every folder under supabase/functions
```

Requires: `supabase link`, Supabase CLI (`npx supabase`)

### Launch subset (default deploy)

| Function | Purpose |
|----------|---------|
| `claim-profile` | Partner claim by email/token |
| `admin-list-partners` | Admin partner CRUD (service role) |
| `admin-events` | Admin telemetry |
| `ai-gateway` | **LLM** — dispute drafts, chat, co-owner |
| `voice-studio` | **TTS** — Cartesia / ElevenLabs / OpenAI |
| `guide-audio` | Legacy guide audio shim |
| `platform-cron` | Server cron — nurture, digests, social queue |
| `automation-runner` | Automation rule execution |
| `send-email` / `send-invite-email` | SendGrid outbound |
| `send-sms` / `send-invite-sms` | Twilio outbound |
| `twilio-webhook` | Inbound SMS/voice → Phone Hub |
| `stripe-checkout` / `stripe-webhook` / `stripe-verify` | Payments |
| `public-session-checkout` | Paid strategy call checkout |
| `meta-oauth` / `meta-webhook` / `meta-publish-post` | Social Hub + lead ads |
| `finely-partner-api` | External partner API |
| `nora-capital` / `nora-capital-webhook` | Nora Capital integration |
| `nora-llc-api` | Nora LLC API |
| `denefits-webhook` | Denefits contracts |
| `doc-intel` | Document OCR/classification |
| `lead-intel` | Lead prospecting agent |
| `image-generate` | Image generation |
| `report-error` | Client error reporting |
| `mailer` | Mailer utility |

Config: `supabase/config.toml` · Deploy script: `scripts/deploy-supabase-functions.mjs`

**Twilio webhook URL (after deploy):**  
`https://YOUR_PROJECT.supabase.co/functions/v1/twilio-webhook`  
Configure in Twilio Console + verify in **Admin → Phone Hub**.

**Platform cron:** Schedule via pg_cron — see [docs/PLATFORM_CRON.md](docs/PLATFORM_CRON.md)

---

## 8. External APIs & AI services

### OpenAI (`ai-gateway` edge function)

- **Dispute letter AI drafts** — `LettersCommandCenter` → `ai-gateway`
- **Public/partner chat** — `HubAiCoachPanel`, conversational AI
- **Co-owner / admin ops agent** — `AdminOpsAgentPage`
- Secret: `OPENAI_API_KEY`
- Enable flag: **`aiGateway`** (Admin → Settings)

### Voice / TTS (`voice-studio` edge function)

Engines (priority): **Cartesia** → ElevenLabs clone → OpenAI TTS fallback

- Guide narration: Resources pages, ebooks, courses
- Admin: `/admin/voice-studio`
- Prerender for prod: `npm run voice:prerender` (needs service role + voice keys)
- Catalog: `npm run voice:catalog:check` (41 guides/ebooks)
- Docs: [docs/VOICE_STUDIO_API.md](docs/VOICE_STUDIO_API.md)

### Stripe

- Strategy calls, portal checkout, public session payment
- Functions: `stripe-checkout`, `stripe-webhook`, `public-session-checkout`
- Client: `VITE_STRIPE_PUBLISHABLE_KEY` · Edge: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Enable flag: **`stripeEnabled`**
- Docs: [docs/PUBLIC_BOOKING.md](docs/PUBLIC_BOOKING.md)

### SendGrid + Twilio (comms)

- Welcome emails, nurture sequences, invites, dunning
- Functions: `send-email`, `send-invite-email`, `send-sms`, `twilio-webhook`
- Enable flags: **`inviteDelivery`**, **`commsDelivery`**
- Admin comms: `/admin/comms-studio`

### Meta (Facebook/Instagram)

- Lead ads webhook → `lead_captures`
- Social scheduling + inbox
- Functions: `meta-oauth`, `meta-webhook`, `meta-publish-post`
- Docs: [docs/SOCIAL_HUB_META.md](docs/SOCIAL_HUB_META.md)

### Nora Capital / Nora LLC

- Funding handoff, bidirectional API
- Functions: `nora-capital`, `nora-capital-webhook`, `nora-llc-api`
- Docs: [docs/NORA_CAPITAL_API.md](docs/NORA_CAPITAL_API.md), [docs/NORA_LLC_API.md](docs/NORA_LLC_API.md)

### Finely Partner API

- External integrations: lead capture, embed config, voice render
- Function: `finely-partner-api`
- Keys: `FINELY_PARTNER_API_KEYS_JSON`

### Denefits

- Contract webhooks
- Function: `denefits-webhook`
- Flag: **`denefitsEnabled`**

---

## 9. Feature flags (Admin → Settings)

Defaults are conservative (most integrations **off** until secrets + flags enabled).

| Flag | Default | Enable when |
|------|---------|-------------|
| `commsDelivery` | off | SendGrid/Twilio live — nurture, dunning, digests |
| `inviteDelivery` | off | Invite email/SMS via edge |
| `stripeEnabled` | off | Stripe secrets + checkout tested |
| `aiGateway` | off | `OPENAI_API_KEY` set |
| `automationAutopilot` | off | Comms + cron stable — auto letter draft + staff tasks |
| `lightThemePublic` | off | After admin spot-check of light theme |
| `publicChat` | on | Public Ask Finely (needs gateway for live AI) |
| `portalChat` | on | Partner portal coach |
| `crm` | on | CRM pipelines |
| `partnerImport` | off | Legacy partner import tools |
| `docIntel` | off | Document intelligence edge |
| `leadIntel` | off | Lead intel agent |
| `courses` | off | Course builder |
| `videoStudio` | off | Video script tools |
| `apiAccess` | off | REST partner API |

Source of truth: `src/domain/settings.ts` → `DEFAULT_SETTINGS.features`

---

## 10. Architecture & routing

### Post-login home (important)

| User | Lands on |
|------|----------|
| Admin email | `/dashboard` (Mastery OS — left sidebar) |
| Partner / client | `/portal/dashboard` |
| Affiliate | `/affiliate/hub` |
| Agent / credit specialist | `/credit-specialist/hub` |
| AU seller | `/au-seller/hub` |

Logic: `src/lib/postAuthRouting.ts` → `resolvePostAuthHomePath()`

### Key route map

| Audience | Routes |
|----------|--------|
| **Public** | `/`, `/start-here`, `/pricing`, `/resources`, `/free-guide`, `/enlightenment-session`, `/fundability-readiness` |
| **Partner portal** | `/portal/dashboard`, `/portal/reports`, `/portal/disputes`, `/portal/letters`, `/claim` |
| **Mastery OS (admin-style workspace)** | `/dashboard` — **not** the partner portal |
| **Admin** | `/admin`, `/admin/partners`, `/admin/workflow`, `/admin/launch-os`, `/admin/phone-hub`, `/admin/settings` |
| **Launch OS** | `/admin/launch-os` — deploy checklist UI + wave audits |

Dev port: **5173** (strict). See [docs/VIEW_LINKS.md](docs/VIEW_LINKS.md) for full route list.

### Theme toggle policy

- Public visitors: **dark only** (light theme hidden unless admin enables `lightThemePublic`)
- Admins: Appearance settings + theme toggle
- Logic: `src/lib/finelyThemeAccess.ts`

---

## 11. CI/CD & GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push / PR | `ci:check` → build → dist verify → Playwright senior QA |
| `deploy-manual.yml` | manual | Full gate + build artifact upload |

Manual deploy artifact: **`finely-cred-dist-staging`** or **`finely-cred-dist-production`**

CI uses placeholder Supabase keys for build; real keys go on deploy host secrets.

---

## 12. Testing & QA commands

```bash
npm run e2e:smoke              # Module smoke (no browser)
npm run launch:senior:qa       # 24 Playwright paths
npm run launch:complete        # Audits + senior QA
npm run signup:email:audit     # 24 signup welcome templates
npm run seo:check              # robots, sitemap, OG meta
npm run tour:capture:audit     # 17 silent tour MP4s
npm run tour:voice:audit       # Voiced MP3 coverage (optional)
npm run staff:portraits:check  # 48 unique staff portraits
npm run predeploy:code         # Full code gate (no live RLS/secrets)
npm run predeploy:check        # Full gate incl. secrets + RLS
```

Manual walkthrough: [docs/SENIOR-QA-WALKTHROUGH.md](docs/SENIOR-QA-WALKTHROUGH.md)

Playwright install: `npm run e2e:playwright:install`

Optional E2E creds in `.env.local`: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`

---

## 13. Admin & operator URLs

| Surface | URL |
|---------|-----|
| Launch OS / go-live | `/admin/launch-os` |
| Deploy status | `/admin/monitoring` (deploy panel) |
| Phone Hub + Twilio setup | `/admin/phone-hub` |
| Voice Studio | `/admin/voice-studio` |
| Feature flags | `/admin/settings?tab=features` |
| Partner import (legacy) | `/admin/partners/import` |
| Senior QA guide (in-app) | `/launch-help` |

---

## 14. Email, SMS & signup flows

### Signup welcome emails (24 funnels)

- Builder: `src/comms/signupWelcomeHtmlEmail.ts`
- Senders: `funnelEmail.ts`, `partnerWelcomeEmail.ts`
- Audit: `npm run signup:email:audit`
- Requires: **`commsDelivery`** + SendGrid + `SENDGRID_API_KEY`

Covers: lead magnets, portal lanes, agency signup, affiliate, AU seller, strategy call, Meta leads, bookstore purchase, tradeline package, contact inquiry, etc.

### Nurture sequences

- Definitions: `src/domain/nurtureSequences.ts`
- Engine: `src/lib/nurtureEngine.ts`
- Server cron: `platform-cron` + `_shared/processDueNurtureEnrollments.ts`

---

## 15. Voice Studio & tour audio

| Item | Status |
|------|--------|
| Silent tour MP4s | **17/17** captured |
| Voiced tour MP3s | **0/17** (optional — needs Cartesia + Supabase) |
| Guide voice catalog | **41** items — `npm run voice:catalog:check` |

```bash
npm run tour:voice:prerender -- --all   # optional voiced tours
npm run voice:prerender                 # guide/ebook masters
```

Docs: [docs/TOUR-FACTORY.md](docs/TOUR-FACTORY.md), [docs/TOUR-RECORDING-PLAYBOOK.md](docs/TOUR-RECORDING-PLAYBOOK.md)

---

## 16. Historical fixes (context)

These were root-cause fixes already in the **`launch/ready-sovereign-supreme`** branch:

| Issue | Fix |
|-------|-----|
| Partners work on live but not locally | `partnersRepo.ts` localStorage fallback when no Supabase |
| Letters/evidence lost on sync | Non-destructive merge in `workflowSupabaseSync.ts` |
| Generic dispute reasons | `disputeReasons.ts` — Metro2 contradictions + label fixes |
| "TUC" shown in UI | Bureau display helpers in `src/utils/bureaus.ts` |
| Partner can't save on live | `claimed_user_id` + `claim-profile` edge function |
| Partner lands on wrong dashboard | `postAuthRouting.ts` — partners → `/portal/dashboard` |
| Credit report + analysis free | `FREE_ENTITLEMENT_KEYS` in billing |

### Remaining optional dev work

- Parser: extract **Date Last Active** for one more contradiction check
- Text/PDF parser typed fields parity with HTML parser
- Paid enlightenment repeat sessions — Stripe product wiring (calendar flags `paymentRequired`)
- Lead capture referral columns on live if not migrated

---

## 17. Troubleshooting

| Symptom | Check |
|---------|-------|
| Letters/screenshots don't save on live | `claimed_user_id` on partner row; storage bucket `pii`; RLS migrations applied |
| Console shows RLS error | Partner not claimed — run claim flow or `claim-profile` |
| Admin can't create partner | Email in `admin_emails`; `admin-list-partners` deployed |
| Emails don't send | `commsDelivery` flag + `SENDGRID_API_KEY` + edge `send-email` |
| SMS / phone dead | `TWILIO_*` secrets + webhook URL in Twilio Console |
| AI draft fails | `aiGateway` flag + `OPENAI_API_KEY` + `ai-gateway` deployed |
| Voice won't play in prod | Run `voice:prerender`; check `voice-studio` secrets |
| Build fails typecheck | `npm run typecheck` |
| Playwright path 9 flake | Mastery OS sidebar — re-run `npm run launch:senior:qa` |
| White screen on boot | Check console; circular import issues were fixed via `coOwnerIdentity.ts` |

**DevTools → Console** now logs explicit Supabase/storage errors on letter save failures.

---

## 18. Documentation index

| Doc | Topic |
|-----|-------|
| [docs/PRODUCTION_DEPLOY.md](docs/PRODUCTION_DEPLOY.md) | Full deploy pipeline |
| [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) | Local dev modes |
| [docs/LAUNCH-READY-SPRINT.md](docs/LAUNCH-READY-SPRINT.md) | Launch sprint scope |
| [docs/SENIOR-QA-WALKTHROUGH.md](docs/SENIOR-QA-WALKTHROUGH.md) | Manual QA script |
| [docs/PLATFORM_CRON.md](docs/PLATFORM_CRON.md) | Server cron |
| [docs/VOICE_STUDIO_API.md](docs/VOICE_STUDIO_API.md) | Voice render API |
| [docs/NORA_CAPITAL_API.md](docs/NORA_CAPITAL_API.md) | Nora integration |
| [docs/PUBLIC_BOOKING.md](docs/PUBLIC_BOOKING.md) | Strategy call + Stripe |
| [docs/SOCIAL_HUB_META.md](docs/SOCIAL_HUB_META.md) | Meta leads |
| [docs/AUTOMATION_STUDIO.md](docs/AUTOMATION_STUDIO.md) | Automation recipes |
| [docs/STAFF_OS.md](docs/STAFF_OS.md) | Staff + autopilot |
| [docs/ROLE_OS.md](docs/ROLE_OS.md) | Roles & lanes |
| [docs/SECURITY_ARCHITECTURE_SUPABASE.md](docs/SECURITY_ARCHITECTURE_SUPABASE.md) | Security model |
| [docs/RLS_HARDENING_CHECKLIST.md](docs/RLS_HARDENING_CHECKLIST.md) | RLS verification |
| [docs/LAUNCH-OS-SOP-MASTER.md](docs/LAUNCH-OS-SOP-MASTER.md) | SOP catalog |
| [README.md](README.md) | Quick reference + all npm scripts |

---

**Questions?** Start with `npm run launch:handoff` and `npm run secrets:summary`, then open `/admin/launch-os` on a dev/staging deploy.
