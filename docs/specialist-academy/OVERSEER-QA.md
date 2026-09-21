# Overseer QA — PR #28 Platform OS

**PR:** [#28](https://github.com/sadiss/finely-cred/pull/28) · **Branch:** `cursor/specialist-credit-methodology-04e1`  
**Rule:** Additive only — Haitian desk, Public/Portal chat, partner LMS/courses untouched unless noted.

## SHIPPED / PARTIAL / MISSING

| Area | Status | Evidence / notes |
| --- | --- | --- |
| Specialist Academy UI (motion, quizzes, EN\|HT) | **SHIPPED** | `AdminSpecialistAcademyPage`, `components/training/academy/*` |
| Trainee email nurture | **SHIPPED** | `nurtureEngine` → `academyTraineeEmailPipeline` → `send-email` |
| Trainee outbox enterprise | **PARTIAL** | `academy_trainee_email_outbox` migration + `academy-trainee-outbox` edge; browser `localStorage` dedupe/outbox **interim** |
| KB router + personas | **SHIPPED** | `knowledgeBaseRouter`, `agentPersonas`, `docs/knowledge-base/` |
| KB vector / pgvector | **MISSING** | `VITE_FINELY_KB_VECTOR=1` stub only |
| Specialist Lounge | **SHIPPED** | `AdminSpecialistLoungePage`, `specialistLoungeRepo` |
| Lead Intel (CSE/Serper/OSM) | **SHIPPED** | `lead-intel` edge, `AdminLeadIntelPage` |
| Guest meet `/meet/:eventId` | **SHIPPED** | `GuestMeetingJoinPage`, Jitsi External API |
| Guest calendar lookup | **PARTIAL** | `calendar-guest-lookup` edge + sync on `upsertCalendarEvent`; guests on other devices need server row + migration applied |
| Meeting touch-up video | **PARTIAL** | Touch-up **v1** (filters + radial matte) — label **not** “Beauty AI” / not Zoom parity |
| Meeting cancel email + ICS | **SHIPPED** | `meetingInviteEmailSend` cancel intent; Admin Calendar “Cancel + email” |
| Meeting reschedule email | **PARTIAL** | `buildMeetingRescheduleEmail` + send helper exist; UI reschedule flow not full calendar editor |
| Voice Studio staff TTS | **MISSING** | Files on `reconcile-ours-wins` only — see `PLATFORM-OS.md` §3 |
| Partner social | **PARTIAL** | Blueprint + `/partner-community` waitlist stub |
| HT lesson parity | **PARTIAL** | Expanded `05–07`, `06` HT; EN still longer on several lessons |
| Teach cards F03–F14, F-BUILD | **PARTIAL** | Teach sections added; F01 remains flash-only (quiz OK) |
| `platform-cron` | **MISSING** | Documented in `docs/PLATFORM_CRON.md` |
| PublicChatWidget / PortalChatWidget | **SHIPPED** (unchanged) | Extended earlier via KB router only — no wipe |

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

## Sanz trainee session (60 min)

1. Academy hub → quiz → material pack dry-run (comms flag).  
2. Lounge → meeting lobby → guest `/meet/:eventId` (note demo-calendar banner if no server sync).  
3. WORKFLOW-MAP + expanded teach cards F03+.  
4. Live scrub: SOP-08 → evidence (HT lesson 05).

---

*Educational only. Not legal advice.*
