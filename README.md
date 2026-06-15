# Finely Cred

Sovereign Supreme build: public site, partner portal, admin ops, dispute letters, credit report intelligence, voice studio, and launch automation.

## Quick start

```bash
cd Tishobe/finely-cred-main
npm install
cp .env.example .env.local   # add Supabase URL + anon key
npm run dev
```

Dev server: **http://127.0.0.1:5173/** — see [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md) for routes and marketing-only vs full Supabase mode.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run env:check` | Local Supabase keys present? (marketing-only vs full mode) |
| `npm run dev:check` | typecheck + env:check |
| `npm run build` | Sitemap + typecheck + production bundle |
| `npm run typecheck` | `tsc --noEmit` only (faster CI) |
| `npm run preview` | Serve `dist/` locally |
| `npm run start` | Serve production build on port 8080 |
| `npm run sitemap:generate` | Regenerate `public/sitemap.xml` from SEO catalog |
| `npm run audit:legacy` | Audit legacy SQL export |
| `npm run extract:legacy-reasons` | Extract dispute reasons from legacy DB |
| `npm run deploy:functions` | Deploy launch-critical Supabase edge functions (`-- --all` for every function) |
| `npm run launch:check` | Verify launch files, bundled legacy export, and edge function folders |
| `npm run secrets:check` | Validate production edge-function secret names |
| `npm run rls:check` | RLS smoke checks against linked Supabase |
| `npm run migrations:check` | Verify migration files are present |
| `npm run ci:check` | CI-safe pre-deploy gate (skips local Supabase keys; used in GitHub Actions) |
| `npm run launch:summary` | One-screen readiness snapshot (code, dist, Supabase, deploy configs) |
| `npm run launch:status` | Instant file-based status (no e2e — fast) |
| `npm run launch:gate` | Fast pre-deploy gate (~1 min, no Playwright) |
| `npm run launch:handoff` | Operator go-live handoff checklist |
| `npm run launch:refresh` | Rebuild dist + instant status (before deploy) |
| `npm run seo:check` | Validate robots, sitemap, manifest, index meta |
| `npm run secrets:summary` | Non-blocking secrets overview |
| `npm run signup:email:audit` | Verify 24 signup welcome email templates |
| `npm run deploy:host-guide` | Print Vercel/Netlify/Cloudflare deploy steps |
| `npm run launch:bundle` | Build + full QA gate in one command (deploy artifact prep) |
| `npm run post-deploy:verify` | Smoke-check live URL after deploy (`-- https://your-domain.com`) |
| `npm run predeploy:code` | Full code gate without live Supabase secrets/RLS |
| `npm run launch:complete` | Launch Sprint code gates + 24-path senior QA + env summary |
| `npm run launch:ready` | Same as launch:complete + verify `dist/` is deployable (run `build` first) |
| `npm run launch:senior:qa` | Playwright senior QA (public + portal dev auth) |
| `npm run predeploy:check` | Full production gate incl. local secrets + RLS |
| `npm run launch:go-live` | After Supabase keys: preflight + deploy checklist |
| `npm run launch:ops` | Go-live blockers in one view |
| `npm run e2e:smoke` | Critical-path module smoke + typecheck (no browser) |
| `npm run e2e:playwright` | Browser E2E via Playwright (includes senior QA specs) |
| `npm run e2e:playwright:install` | Install Playwright Chromium |
| `npm run voice:prerender` | Pre-render voice catalog assets for production |
| `npm run voice:catalog:check` | Verify prerender catalog covers all guides + ebooks |

## Environment variables

See [`.env.example`](.env.example). Required for live features:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PRIVATE_BUCKET` (default `pii`)
- `APP_BASE_URL` (edge functions — Stripe checkout return URLs, comms links)

## Launch Sprint (Parts A–E)

Code-complete gates (no Supabase required for QA):

```bash
npm run launch:bundle      # build + code audits + 24 Playwright paths
npm run launch:complete    # code audits + 24 Playwright paths
npm run launch:summary     # one-screen readiness snapshot
npm run launch:ops         # blockers summary
```

After `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are in `.env.local`:

```bash
npm run build              # production dist/ + verify
npm run launch:ready       # QA + dist verify
npm run predeploy:code     # full code gate (no live secrets)
npm run launch:go-live     # preflight + deploy checklist
npm run post-deploy:verify -- https://finelycred.com
```

Details: [docs/LAUNCH-READY-SPRINT.md](docs/LAUNCH-READY-SPRINT.md) · [docs/SENIOR-QA-WALKTHROUGH.md](docs/SENIOR-QA-WALKTHROUGH.md)

## Production / live Supabase

Follow **[DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md)** and **[docs/PRODUCTION_DEPLOY.md](docs/PRODUCTION_DEPLOY.md)**:

1. Run `supabase/LIVE_SETUP_run_all.sql` on live SQL Editor
2. Add staff emails to `public.admin_emails`
3. `npm run launch:check` — verify repo launch artifacts
4. `npm run deploy:functions` against linked Supabase project
5. Set Edge Function secrets (`npm run secrets:check` for the list)
6. Schedule Supabase cron → `platform-cron` (see [docs/PLATFORM_CRON.md](docs/PLATFORM_CRON.md))
7. `npm run voice:prerender` before frontend deploy
8. `npm run predeploy:check` — full gate before go-live
9. Legacy partners: Admin → Import → audit SQL → import → send claim links (`/claim?token=…`)
10. Redeploy frontend with env vars at build time

Enable feature flags in Admin → Settings when keys are live: **`commsDelivery`**, **`stripeEnabled`**.

### Finely Voice Studio

Guide and Nora Capital narration uses the **`voice-studio`** Supabase Edge Function (multi-engine: Cartesia presets + ElevenLabs clone + OpenAI fallback). Browser speech is dev-only.

- Deploy: `npm run deploy:functions` (includes `voice-studio`)
- Migration: `supabase/migrations/20260612000000_voice_studio.sql`
- Secrets: `CARTESIA_API_KEY`, `ELEVENLABS_API_KEY` + `VOICE_CLONE_FINELY_PRIMARY_ID`
- Nora Capital (5173): same Supabase project — see [`docs/VOICE_STUDIO_API.md`](docs/VOICE_STUDIO_API.md)
- Admin: `/admin/voice-studio`

Legacy `guide-audio` remains as a compatibility shim.

## Key routes

| Audience | Entry |
|----------|-------|
| Public | `/`, `/pricing`, `/credit-specialists`, `/free-guide`, `/enlightenment-session` |
| Partner | `/dashboard`, `/portal/partner`, `/claim` (profile claim) |
| Credit Specialist | `/credit-specialist/hub` |
| Admin | `/admin`, `/admin/workflow`, `/admin/partners`, `/admin/deploy` |
| Legal / compliance | `/privacy`, `/terms`, `/disclaimer`, `/unsubscribe` |

Canonical consultation booking: `/enlightenment-session` (`/consultation` redirects).

## Docs

| Doc | Topic |
|-----|-------|
| [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md) | Live DB, RLS, storage, claim flow |
| [docs/PRODUCTION_DEPLOY.md](docs/PRODUCTION_DEPLOY.md) | Deploy checklist + orchestrator |
| [docs/PLATFORM_CRON.md](docs/PLATFORM_CRON.md) | Server cron ticks (digest, nurture, billing) |
| [docs/AUTOMATION_STUDIO.md](docs/AUTOMATION_STUDIO.md) | Event recipes + automation runner |
| [docs/PUBLIC_BOOKING.md](docs/PUBLIC_BOOKING.md) | Enlightenment session + paid Stripe checkout |
| [docs/VOICE_STUDIO_API.md](docs/VOICE_STUDIO_API.md) | Voice render API (Finely + Nora) |
| [docs/NORA_CAPITAL_API.md](docs/NORA_CAPITAL_API.md) | Nora ↔ Finely bidirectional API |
| [docs/NORA_LLC_API.md](docs/NORA_LLC_API.md) | Nora LLC partner API |
| [docs/RLS_HARDENING_CHECKLIST.md](docs/RLS_HARDENING_CHECKLIST.md) | Row-level security verification |
| [docs/SECURITY_ARCHITECTURE_SUPABASE.md](docs/SECURITY_ARCHITECTURE_SUPABASE.md) | Security model |
| [docs/SOCIAL_HUB_META.md](docs/SOCIAL_HUB_META.md) | Meta lead ads + inbox |
| [docs/SUPABASE_LEAD_CAPTURES_SETUP.md](docs/SUPABASE_LEAD_CAPTURES_SETUP.md) | Lead capture table setup |
| [docs/VIEW_LINKS.md](docs/VIEW_LINKS.md) | Internal route reference |
| [docs/CREDIT_REPORT_PARSING_DIAGNOSTICS.md](docs/CREDIT_REPORT_PARSING_DIAGNOSTICS.md) | Report parse debugging |
| [docs/COLLECTIONS_AUDIT.md](docs/COLLECTIONS_AUDIT.md) | Collections audit notes |
| [docs/partner_overall_score.md](docs/partner_overall_score.md) | Partner scoring |

Execution tiers and phase history: `.cursor/plans/`
