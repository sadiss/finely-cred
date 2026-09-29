# LOCAL ADMIN NAV FIX

**When:** Tue Sep 29, 2026 ~12:35 AM ET (America/New_York)
**Machine:** DESKTOP-GLNB7GM (`43411104-b9fb-4408-8f20-1b6ca5955fe8`)
**Repo:** `E:\Finely-Cred\Tishobe\finely-cred-main`
**Branch:** `sync/launch-521910f` tracking `origin/launch/ready-sovereign-supreme`
**Preview:** `http://127.0.0.1:5173/` (vite PID serving this tree, `--strictPort`)

---

## HEAD / ahead

| Item | Value |
|------|-------|
| Before this fix commit | `0799dba` (default mode `full`) on top of `a7646d8` (7-group lanes + Partner Email Desk) |
| Origin tip | `origin/launch/ready-sovereign-supreme` still defaulted `readAdminNavMode` to `simple` |
| Ahead before shell wiring | **8** (0 behind) |

---

## Before / after default mode

| Surface | Before | After |
|---------|--------|-------|
| `src/lib/finelyAdminNavMode.ts` `readAdminNavMode()` fallback | `return 'simple'` (committed on tip + local HEAD `a7646d8`) | `return 'full'` (commit `0799dba`) |
| Vite-served module `/src/lib/finelyAdminNavMode.ts` | n/a | Confirmed `return "full"` over HTTP 200 |
| Live `/admin` chrome | `ProductWorkspaceShell` `fc-wlp-admin-rail` always rendered thin `workspaceProductNav` primary list (ignored `adminNavLanes` / nav mode) | Full mode renders **ADMIN_NAV_GROUPS** (7 groups) inside the same WLP rail |

---

## adminNavLanes + partnerEmailDesk

- Path: `src/config/adminNavLanes.ts` (not `src/lib/`)
- 7 groups present: Home, Clients & work, Learn & train, Marketing, Money, Settings, More
- Required items present: Marketing Desk, Social Media, Content studio, Partner playbooks, Partner Email, Training academy, Specialist lounge, Business credit
- `partnerEmailDesk` on disk (no restore needed):
  - `src/features/partnerEmailDesk/PartnerEmailDesk.tsx`
  - `src/features/partnerEmailDesk/partnerEmailDesk.ts`
  - `src/features/partnerEmailDesk/partnerEmailDrafts.ts`
  - `src/pages/admin/AdminPartnerEmailDeskPage.tsx`

---

## Root cause (refined)

1. Default nav mode was `simple` after tip sync.
2. Even with `full`, live `/admin` uses `ProductPageLayout` -> `ProductWorkspaceShell`, which previously **never** consulted `readAdminNavMode` / `ADMIN_NAV_GROUPS`. The thin Operations rail was always shown.

## Code change (this pass)

- `src/lib/finelyAdminNavMode.ts`: default `full` (`0799dba`)
- `src/features/workspaceLightPreview/product/components/ProductWorkspaceShell.tsx`: when `adminNavMode === 'full'`, render grouped `ADMIN_NAV_GROUPS` in `fc-wlp-admin-rail`; simple keeps prior primary list + All tools. Toggle persists via `finely.adminNavMode.v1`.

---

## 5173 proof (Playwright + offline/dev auth)

- HTTP `/admin`: **200**
- Auth: offline/dev session via `finely.devAuth.user.v1` (Supabase URL empty locally). Unsigned screenshot: login wall only.
- Signed-in rail `aside.fc-wlp-admin-rail` visible labels (CSS uppercases group titles):

**Groups:** HOME, CLIENTS & WORK, LEARN & TRAIN, MARKETING, MONEY, SETTINGS, MORE

**Open-group items observed:** Overview; Courses; Training academy; Specialist lounge; Onboarding; Success; Launch OS; Tour Studio; Resources; Marketing Desk; Partner Email; Marketing HQ; Social Media; Partner playbooks; Content studio; Comms Studio; Testimonials; Marketing Director; Lead acquisition; Growth Autopilot; Simple nav

- `navModeKey` left unset (null) so default `full` applies.
- Artifacts: `docs/ops/LOCAL-ADMIN-NAV-PROOF.png` (auth wall), `docs/ops/LOCAL-ADMIN-NAV-PROOF-SIGNEDIN.png`, `docs/ops/LOCAL-ADMIN-NAV-PROOF.json`

---

## Typecheck / push / VPS

- Typecheck: started; prior overnight runs hung >4-5 min with no emit — re-run status recorded below after this write.
- Push: FULL push of `sync/launch-521910f` to `origin/launch/ready-sovereign-supreme` after commit of shell wiring.
- VPS: only after push; see follow-up in this file.

NO Desktop/Notepad dumps. NO `.env.local` edits.
