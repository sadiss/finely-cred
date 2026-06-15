# Production Deploy Pipeline (Phase 45)

## Environments

| Env | Purpose | Supabase project | Vite mode |
|-----|---------|------------------|-----------|
| **local** | Dev on `127.0.0.1:5173` | Dev project or local JSON stores | `development` |
| **staging** | Pre-prod smoke + QA | Separate Supabase project | `staging` |
| **production** | Live traffic | Production Supabase project | `production` |

## Pre-deploy checklist

Run the full gate in one command:

```bash
npm run live-setup:rebuild   # after adding migrations
npm run launch:preflight     # Launch Sprint code + senior QA (marketing-only OK)
npm run predeploy:check      # full deploy orchestrator (includes launch:senior:qa)
```

`npm run launch:ops` prints env blockers and manual QA paths without re-running every audit.

After Supabase keys are in `.env.local`:

```bash
npm run launch:go-live
```

This runs, in order: `sitemap:generate` → `typecheck` → `e2e:smoke` → `voice:catalog:check` → `launch:check` → `hub:audit` → `migrations:check` → `rls:check` → `secrets:check`.

Manual steps after checks pass:

1. Run pending SQL from `supabase/LIVE_SETUP_run_all.sql` on target project (includes `20260621000000_server_automation_queue` + `20260622000000_work_tasks`)
2. Set Supabase secrets (see `VOICE_STUDIO_API.md`, `NORA_CAPITAL_API.md`)
3. `npm run deploy:functions` (includes `platform-cron`, `automation-runner`, `claim-profile`, `public-session-checkout`)
4. Schedule server cron — see `PLATFORM_CRON.md`
5. Bump `VOICE_PIPELINE_VERSION` when narration scripts change → re-run `npm run voice:prerender`
6. Enable **`commsDelivery`** feature flag when SendGrid/Twilio secrets are live (nurture, dunning, digests)
7. Enable **`stripeEnabled`** for paid strategy calls — see `PUBLIC_BOOKING.md`
8. Enable **`automationAutopilot`** for hands-free letter draft + staff task routing — see `STAFF_OS.md` and `/admin/ops-autopilot`

## Build & deploy (static frontend)

```bash
npm run build   # runs sitemap:generate first, then Vite build
# Deploy dist/ to your host (Vercel, Netlify, Cloudflare Pages, etc.)
```

Verify `public/sitemap.xml` and `public/robots.txt` ship with `dist/`. Regenerate locally with `npm run sitemap:generate`.

Set environment variables on the host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` (optional — sitemap canonical URL, default `https://finelycred.com`)
- Optional: `VITE_SENTRY_DSN`, feature flag overrides

After deploy, smoke-check the live URL:

```bash
npm run post-deploy:verify -- https://your-production-domain.com
```

Each build ships `dist/DEPLOY_HANDOFF.txt` with env vars and backend steps. Operator checklist: `npm run launch:handoff`. Fast gate before deploy: `npm run launch:gate`.

### Host-specific configs (included in repo)

| Host | Config file | Notes |
|------|-------------|--------|
| **Vercel** | `vercel.json` | SPA rewrites + security headers |
| **Netlify** | `netlify.toml` | Build command, SPA redirect, headers |
| **Cloudflare Pages** | `public/_redirects` + `public/_routes.json` | SPA fallback + static asset exclusions |
| **Any static host** | `npm run start` | Uses `serve -s dist` (SPA mode) |

## Feature flags

Admin → Settings → Feature Flags controls rollout switches stored in local settings (production: persist in Supabase `tenant_settings` when wired).

Flags to verify before prod:

- **`commsDelivery`** — live nurture, dunning, digest email (not dry-run)
- **`stripeEnabled`** — paid strategy calls + portal checkout
- **`automationAutopilot`** — hands-free letter draft + staff tasks ([STAFF_OS.md](./STAFF_OS.md))
- **`VITE_VOICE_ALLOW_BROWSER_PREVIEW=false`** — Voice Studio masters only in production (browser TTS is dev-only)
- **Automation runner** — browser autopilot + server `platform-cron` edge
- **Public chat / AI gateway** — Supabase + gateway keys wired
- **Lead capture remote sync** — Meta webhook + partner API when live

## Rollback

1. **Frontend:** redeploy previous `dist` artifact from CI
2. **Edge functions:** redeploy prior function bundle from git tag
3. **Database:** migrations are forward-only; use compensating migration for schema rollback
4. **Voice masters:** lower `VOICE_PIPELINE_VERSION` does not delete old assets; bump version to force re-render

## Content invalidation

| Change | Action |
|--------|--------|
| Guide narration script | Bump `VOICE_PIPELINE_VERSION`, run `voice:prerender` |
| Funnel copy A/B variant | Admin toggle in funnel experiments — no deploy |
| RLS policy change | Apply migration, verify with admin + partner test accounts |
| Public marketing route added | Add to `publicSeoCatalog.ts`, run `npm run sitemap:generate` |
| Cron / digest templates | Redeploy functions if edge changes; client cron picks up comms templates on reload |

## Monitoring post-deploy

- Admin dashboard → Ops Health panel
- Admin → Monitoring → edge event stream
- Support inbox SLA breaches
- Stripe / Nora webhook delivery logs

## GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push / PR | `ci:check` → build → dist verify → Playwright |
| `deploy-manual.yml` | workflow_dispatch | Pre-deploy gate + build artifact + dist verify (set `VITE_*` repo secrets) |

Plan execution summary: [FINELY-OS-400-COMPLETE.md](./FINELY-OS-400-COMPLETE.md)

## E2E testing

```bash
# Module smoke (no browser)
npm run e2e:smoke

# CI-safe full gate (GitHub Actions uses this)
npm run ci:check

# Full gate incl. local Supabase keys (before production deploy)
npm run predeploy:check
```
