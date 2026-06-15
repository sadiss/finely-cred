# Local development

## Quick start

```bash
cd Tishobe/finely-cred-main
npm install
npm run dev
```

Open **http://127.0.0.1:5173**

## Modes

| Mode | Requirements | What works |
|------|----------------|------------|
| **Marketing-only** | No Supabase keys | Homepage, `/personal-credit`, `/pricing`, `/resources`, `/fundability-readiness` |
| **Full** | `.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Auth, portal, admin, cloud sync, edge-backed features |

Check your setup:

```bash
npm run env:setup    # bootstrap .env.local from .env.example
npm run env:check
npm run launch:ops   # code vs env vs manual QA blockers
```

Copy `.env.example` → `.env.local` and paste keys from Supabase → Project Settings → API.

### DEV Supabase project (recommended first)

Do **not** paste production keys into `.env.local` for day-to-day dev — create an isolated project:

```bash
npm run env:dev-supabase   # step-by-step checklist in the terminal
```

Summary:

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (e.g. `finely-cred-dev`)
2. **Project Settings → API** → paste URL + anon key into `.env.local`
3. **SQL Editor** → run `supabase/LIVE_SETUP_run_all.sql`
4. Add your email to `public.admin_emails` if needed
5. `npm run env:check` → `npm run launch:go-live`

Optional CLI (no global install — uses `npx`):

```bash
npm run supabase:login
npm run supabase:link
npm run supabase:db:push
```

Restart `npm run dev` after editing `.env.local`.

## Launch Sprint gates (no Supabase required)

```bash
npm run launch:code
npm run launch:senior:qa   # 23 Playwright paths (public + portal + Ask Finely + Watch how)
npm run launch:preflight
```

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/personal-credit` | Personal credit marketing hub |
| `/portal/dashboard` | Partner portal |
| `/portal/letters` | Letter Studio (unified hub) |
| `/admin/dashboard` | Admin OS |
| `/fundability-readiness` | Fundability unified hub |

## Before production deploy

```bash
npm run live-setup:rebuild   # after adding migrations
npm run predeploy:check
```

See `docs/PRODUCTION_DEPLOY.md` for Supabase SQL, secrets, and `npm run deploy:functions`.
