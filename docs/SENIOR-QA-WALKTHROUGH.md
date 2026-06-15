# Senior QA walkthrough (Part D5)

Use this checklist with a **non-technical tester** (target: comfortable reading large text, not daily app user).

## Before you start

- Run `npm run dev` and open http://127.0.0.1:5173/start-here
- Zoom browser to 100%; no devtools open during the test
- **Local dev (no Supabase keys):** portal paths 4, 6–9 run via dev mock auth in `npm run launch:senior:qa`
- **With Supabase keys:** set `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` in `.env.local` for real-auth portal tests

## Pass criteria

Each step should complete in **under 2 minutes** without asking "what does this mean?"

| # | Path | Tester should be able to… | Automated |
|---|------|---------------------------|-----------|
| 1 | `/start-here` | Pick one of three lanes without reading fine print | ✓ |
| 2 | `/resources#monitoring` | Find a credit monitoring link and understand why | ✓ |
| 3 | `/onboarding` | See one obvious next step (Now do this strip) — no jargon like “Foundation Fractures” | ✓ |
| 4 | Any portal hub | Tap **Watch how** or **Ask Finely**; calendar says **strategy call** | ✓ (dev auth) |
| 5 | `/help-center` | Search "upload report" and open a playbook | ✓ |
| 6 | `/affiliate/hub` | Copy a referral pitch from the pitch helper | ✓ signed-in (dev auth); ✓ logged-out redirect |
| 7 | Mail letter flow | See Letter Studio (plain steps, no “Command Center”) | ✓ (dev auth) |
| 8 | `/admin/partners` | Partner cards: **Upload report** without broken nested buttons | ✓ (dev auth + seeded partner) |
| 9 | Mastery workspace | Sidebar jump lands on labeled sections (Overview, Disputes, etc.) | ✓ (dev auth) |

**Also covered:** `/resources#videos`, `/pricing`, `/fundability-readiness`, strategy-call booking, homepage command strip, **Watch how tour player**, **Ask Finely easy-read + read-aloud** — **23 Playwright tests** in `e2e/senior-qa-*.spec.ts`.

Run all automated paths (no Supabase required in local dev):

```powershell
npm run launch:senior:qa
```

## Voice concierge (Part E5)

- ✓ Automated: Ask Finely panel, easy read mode, plain answer, read-aloud button (`launch:senior:qa`)
- Manual: tap mic in Chrome/Edge → question transcribed (browser permission required)

## Automated gates

```powershell
npm run launch:senior:audit
npm run launch:plain:audit
npm run intel:audit
npm run launch:check
npm run launch:preflight
npm run launch:ops
```

## Sign-off

- [ ] All nine paths pass with a non-tech tester (automated via `launch:senior:qa` in dev; re-check manually before prod)
- [ ] Voice concierge mic + read-aloud (Part E5) verified in Chrome/Edge
- [ ] Text is readable without squinting (18px+ on help surfaces)
- [ ] No nested broken buttons on Partners list (admin) — spot-check after deploy
