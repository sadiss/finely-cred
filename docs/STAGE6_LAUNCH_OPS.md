# Stage 6 — Production ops (owner checklist)

Code gates are green when `npm run launch:sprint:status` exits **0**. This stage is **your** environment and smoke tests.

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
