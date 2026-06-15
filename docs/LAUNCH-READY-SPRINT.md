# Launch-Ready Sprint — Parts A–E

North star: a non-technical user always sees **what this page is for**, **one obvious next step**, and **Watch how** / **Ask Finely** help.

## Code-complete gates (run locally)

```powershell
cd Tishobe/finely-cred-main
npm run typecheck
npm run launch:check
npm run launch:sprint:status
npm run launch:code
npm run launch:complete
npm run launch:ops
npm run e2e:smoke
```

| Gate | Command | What it verifies |
|------|---------|------------------|
| Master | `npm run launch:check` | Docs, edge functions, scroll, tours, strips, SOPs |
| Rollup | `npm run launch:sprint:status` | One-page Parts A–E status |
| SOPs ↔ tours | `npm run launch:sops:audit` | 24 SOPs linked to 17 manifest tours |
| Now do this | `npm run launch:strips:audit` | 27 routes with proactive strip |
| Finely noticed | `npm run launch:noticed:audit` | 26 routes + onboarding monitoring |
| Scroll hubs | `npm run launch:scroll:audit` | Admin + portal scroll sections |
| Tour factory | `npm run tour:capture:audit` | PNG + MP4 + narration sidecars |
| Senior UX | `npm run launch:senior:audit` | 18px body, 48px tap targets, fc-senior-simple on Start Here + key public hubs |
| Intelligence | `npm run intel:audit` | RAG, voice concierge, audit log, letter chain |
| Tour on Resources | `npm run launch:tour-resources:audit` | Factory MP4s wired to /resources#videos |
| Plain language | `npm run launch:plain:audit` | Onboarding copy free of legacy jargon |
| Senior QA (public + portal) | `npm run launch:senior:qa` | 23 Playwright paths — dev mock auth when Supabase blank |
| Launch complete | `npm run launch:complete` | Code gates + senior QA + env summary |
| Go-live (post-Supabase) | `npm run launch:go-live` | Preflight + deploy checklist (requires keys) |
| Go-live rollup | `npm run launch:preflight` | env + code gates + smoke + senior QA |
| Ops dashboard | `npm run launch:ops` | Code vs env vs manual QA blockers in one view |

## What shipped

### Part A — Launch OS
- `src/domain/platformSops.ts` — 24 platform SOPs
- `docs/LAUNCH-OS-SOP-MASTER.md` — plain-English catalog
- `/help-center` + `/admin/launch-os` — searchable SOP browser

### Part B — Discoverability
- Resources + Admin dashboard scroll sections with lane jumpers
- **Resources `#videos`** — all 17 factory tour MP4s with Watch tour buttons
- Credit monitoring partners grid (4 providers, `VITE_SMARTCREDIT_PID` override)
- `/start-here` in public nav
- `docs/TOUR-RECORDING-PLAYBOOK.md` — regenerate + upload playbook

### Part C — Tour factory
- `src/config/tourManifest.ts` — 17 tours
- `npm run tour:capture` → Playwright screenshots
- `npm run tour:narration:export` → step scripts + JSON
- `npm run tour:assemble` → ffmpeg MP4
- `/admin/tour-studio` — preview + pipeline instructions

### Part D — Senior-simple UX
- `fc-senior-simple` on **PageShell** (all admin, portal, and public app routes) plus onboarding + mastery workspace
- `FinelyNowDoThisStrip` on 27 key routes
- `FinelyLaunchHelpStrip` on PageShell (Watch how + Ask Finely)

### Part E — Finely Intelligence
- `finelyBrainOrchestrate.ts` — local RAG + persona routing
- `FinelyNoticedStrip` — proactive next-best-action
- **Ask Finely voice** — mic + read aloud on help strip (Part E5)
- **AI action audit** — `/admin/hands-free-ops` log (Part E8)
- `docs/FINELY-INTELLIGENCE-OS.md`

## Operational before production

1. **Supabase** — set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local` (`npm run env:setup` then `npm run env:check`)
2. **Voiced tours** — `npm run tour:voice:prerender -- --all` then `npm run tour:assemble -- --all` (needs Cartesia via Voice Studio)
3. **SmartCredit affiliate** — set `VITE_SMARTCREDIT_PID` when live PID is known
4. **Deploy** — run `supabase/LIVE_SETUP_run_all.sql`, deploy edge functions, enable platform-cron (see `docs/PLATFORM_CRON.md`)
5. **Manual QA** — automated via `npm run launch:senior:qa` (23 paths); human mic spot-check before prod
6. **Go-live** — after Supabase keys: `npm run launch:go-live`

## Regenerate a single tour

```powershell
npm run tour:capture -- --tour=tour-onboarding-start
npm run tour:narration:export -- --tour=tour-onboarding-start
npm run tour:assemble -- --tour=tour-onboarding-start
```

See `docs/TOUR-FACTORY.md` for full pipeline details.
