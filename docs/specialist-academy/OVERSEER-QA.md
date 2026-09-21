# Overseer QA — PR #28 Platform OS

**PR:** [#28](https://github.com/sadiss/finely-cred/pull/28) · **Branch:** `cursor/specialist-credit-methodology-04e1`  
**Base:** `main` today — for live Haitian/Kreyòl + full sales-pack studio, **prefer merge/rebase onto `launch/ready-sovereign-supreme`** when that branch is the ship lane (this PR is additive; does not replace launch-only pages like `HaitianKitStudioPage`).

**Rule:** Additive only — Haitian desk, Public/Portal chat, partner LMS/courses untouched unless noted.

## SHIPPED / PARTIAL / MISSING

| Area | Status | Evidence / notes |
| --- | --- | --- |
| `/free-kreyol-guide` unlock funnel | **SHIPPED** | `FreeKreyolGuidePage` — **no** `<Navigate to="/haitian" />`; lead `interest: kreyol_companion_kit_unlock` |
| `/haitian` + `/kreyol` desk + capture | **SHIPPED** | `HaitianCompanionPublicPage`; form interests `haitian_desk_kreyol_chat` / `haitian_desk_en_chat`; global `PublicChatWidget` on public shell |
| FICO intel (KB + academy) | **SHIPPED** | `docs/knowledge-base/{en,ht}/fico-score-models-literacy.md`, card `cards/FICO-01-score-talk-track.md`, quiz `fico-literacy` |
| Specialist Academy UI (motion, quizzes, EN\|HT) | **SHIPPED** | `AdminSpecialistAcademyPage`, `components/training/academy/*` |
| Trainee email nurture | **SHIPPED** | `nurtureEngine` → `academyTraineeEmailPipeline` → `send-email` |
| Trainee outbox enterprise | **PARTIAL** | `academy_trainee_email_outbox` migration + `academy-trainee-outbox` edge; browser `localStorage` dedupe/outbox **interim** |
| KB router + personas | **SHIPPED** | `knowledgeBaseRouter`, `agentPersonas`, `docs/knowledge-base/` (incl. FICO literacy via glob) |
| KB vector / pgvector | **MISSING** | `VITE_FINELY_KB_VECTOR=1` stub only |
| Specialist Lounge | **SHIPPED** | `AdminSpecialistLoungePage`, `specialistLoungeRepo` |
| Lead Intel (CSE/Serper/OSM) | **SHIPPED** | `lead-intel` edge, `AdminLeadIntelPage` |
| Guest meet `/meet/:eventId` | **SHIPPED** | `GuestMeetingJoinPage`, Jitsi External API |
| Guest calendar lookup | **PARTIAL** | `calendar-guest-lookup` edge + sync on `upsertCalendarEvent`; guests on other devices need server row + migration applied |
| Meeting touch-up video | **PARTIAL** | Lobby **preview** uses canvas pipeline (`meetingBeautyPipeline`); **in-call processed video** only when `hasLobbyVisualEffects` + `meetingOutboundVideo` / lib-jitsi path (`FinelyJitsiMeetingRoom`) — iframe-only when effects off. Label **Touch-up v1**, not Beauty AI / Zoom parity |
| Meeting cancel email + ICS | **SHIPPED** | `meetingInviteEmailSend` cancel intent; Admin Calendar “Cancel + email” |
| Meeting reschedule email | **SHIPPED** | `rescheduleEventAndNotifyGuest` on `AdminCalendarPage` |
| 21-day sales packs (Finely) | **PARTIAL** | `docs/sales-packs/finely/` footer + day-1 stub; full 21-day tree **MISSING** on this branch |
| Voice Studio staff TTS | **MISSING** | Files on `reconcile-ours-wins` / launch branch — see `PLATFORM-OS.md` §3 |
| Partner social | **PARTIAL** | Blueprint + `/partner-community` waitlist stub |
| HT lesson parity | **PARTIAL** | Expanded `05–07`, `06` HT; EN still longer on several lessons |
| Teach cards F03–F14, F-BUILD, FICO-01 | **PARTIAL** | Teach sections on F03+; FICO-01 added; F01 remains flash-only (quiz OK) |
| `platform-cron` | **MISSING** | Documented in `docs/PLATFORM_CRON.md` |
| PublicChatWidget | **SHIPPED** | Lead/routing bot — **not** KB-routed |
| PortalChatWidget | **SHIPPED** | KB via `knowledgeBaseRouter`; `haitian_desk` when `replyLang === 'ht'` |

## Build gate

```bash
npm run build
```

## Content verification (legacy academy pack)

| # | Requirement | Pass location |
| --- | --- | --- |
| 1 | Track F EN + HT | [TRACK-F EN](./TRACK-F-credit-methodology-EN.md) · [TRACK-F HT](./TRACK-F-credit-methodology-HT.md) |
| 2 | BUILD honesty | F-BUILD cards + SOP-15 |
| 3 | SOPs 08–15 | [sops/](./sops/README.md) |
| 4 | WORKFLOW-MAP | [WORKFLOW-MAP.md](./WORKFLOW-MAP.md) |
| 5 | Compliance footers | Spot-check `docs/specialist-academy/**` |
| 6 | FICO research lock | [KB EN](../../knowledge-base/en/fico-score-models-literacy.md) · quiz `fico-literacy` |

## Sanz trainee session (60 min)

1. Academy hub → `fico-literacy` quiz → methodology quiz dry-run (comms flag).  
2. `/free-kreyol-guide` unlock → `/haitian?lang=ht` form + public chat.  
3. Lounge → meeting lobby → guest `/meet/:eventId` (note demo-calendar banner if no server sync).  
4. WORKFLOW-MAP + FICO-01 teach card.  
5. Live scrub: SOP-08 → evidence (HT lesson 05).

---

*Educational only. Not legal advice.*
