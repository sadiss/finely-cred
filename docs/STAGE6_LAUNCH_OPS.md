# Stage 6 — Production ops (owner checklist)

Code gates are green when `npm run launch:sprint:status` exits **0**. This stage is **your** environment and smoke tests.

**Matrix:** [`PLAN_COMPLETION_STATUS.md`](./PLAN_COMPLETION_STATUS.md) · **Spine:** [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md)

## Pre-push checklist (repo → GitHub)

Run before you push the working tree to `origin` (see workspace rule: full tree, no secrets).

1. [ ] `npm run typecheck` — must pass
2. [ ] `npm run launch:sprint:status` — exit **0**
3. [ ] `git status` — no `.env`, `.env.*`, credentials, or `NUL.css` staged
4. [ ] Optional but recommended: `npm run launch:senior:qa` if this push includes UX/tour/portal changes
5. [ ] After push: note branch + commit hash for pull; report any leftover untracked files

Code-only pushes can stop at steps 1–3. Treat step 4 as required when touching public hubs, Resources, Ask Finely, or portal restore flows.

## Pre-production checklist (go-live)

Run on the machine that will serve production (after Supabase keys are set).

1. [ ] `npm run env:check`
2. [ ] `npm run launch:preflight` (or `launch:complete` + manual blockers from `launch:ops`)
3. [ ] `npm run launch:senior:qa` — 23 paths; portal mock auth OK locally without keys
4. [ ] Human spot-check: Ask Finely mic / read-aloud ([`SENIOR-QA-WALKTHROUGH.md`](./SENIOR-QA-WALKTHROUGH.md))
5. [ ] Supabase: deploy edge functions (below) before enabling live worker
6. [ ] S6 smoke: **Test worker** → `mode: simulation` with live flag off
7. [ ] S11 (optional): `GROWTH_WORKER_LIVE=true` only after deploy; verify ≤1 job per tick

## Commands

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main
npm run env:check
npm run launch:preflight
npm run launch:ops
npm run launch:senior:qa
```

### Senior QA (`launch:senior:qa`)

- **23 Playwright paths** — public hubs, Resources lanes, **Watch how**, **Ask Finely** (easy read + read-aloud), and portal restore flows (`e2e/senior-qa-walkthrough.spec.ts`, `e2e/senior-qa-portal.spec.ts`).
- **Local dev without Supabase keys:** portal paths use dev mock auth; no `.env.local` required for the automated run.
- **Real portal auth:** set `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` in `.env.local` when keys are configured.
- Included in `npm run launch:complete`, `launch:preflight`, and `launch:ops` rollups — run standalone before go-live or after UX changes.
- Human spot-check: mic permission for Ask Finely voice (see [`SENIOR-QA-WALKTHROUGH.md`](./SENIOR-QA-WALKTHROUGH.md)).

## Supabase / Growth live worker (optional)

1. Deploy `lead-intel` with `SERPER_API_KEY`.
2. Deploy `lead-intel-worker-tick`.
3. Set `GROWTH_WORKER_LIVE=true` only when ready for **one** real search per tick (see GROWTH_ACCEPTANCE S11).
4. Keep simulation default until you verify JSON response says `mode: simulation` when live is off.

## Video

- In-app cinematic providers (Phase 21) are **optional** — Google Labs + Content Studio `room=video` is the supported path.
- Voiced tours: `npm run tour:voice:prerender -- --all` after Cartesia/Supabase configured.

## Honesty

- Do not enable UI that implies live Serper overnight counts while worker is in simulation.
- Paid Meta/Google campaigns remain out of scope until you opt in.

Detail: [`LAUNCH-READY-SPRINT.md`](./LAUNCH-READY-SPRINT.md) · [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md)
