# Overseer QA — PR #28 Platform OS

**PR:** [#28](https://github.com/sadiss/finely-cred/pull/28) · **Branch:** `cursor/specialist-credit-methodology-04e1`  
**Base:** `main` today — for full Haitian kit studio + voice + 21-day pack tree, **prefer merge/rebase onto `launch/ready-sovereign-supreme`** when that is the ship lane.

**Rule:** Additive only — Haitian desk, Public/Portal chat, partner LMS/courses untouched unless noted.

## SHIPPED / PARTIAL / MISSING

| Area | Status | Evidence / notes |
| --- | --- | --- |
| `/free-kreyol-guide` unlock funnel | **SHIPPED** | `FreeKreyolGuidePage` — no auto-redirect to `/haitian` |
| `/haitian` + `/kreyol` desk + capture | **SHIPPED** | `HaitianCompanionPublicPage` + `PublicChatWidget` |
| **Track I — Credit score intelligence** | **SHIPPED** | `score-intelligence/` lessons EN+HT, cards FICO-01 / SCI-02 / SCI-03, quizzes `fico-literacy` + `score-intelligence`, academy nav track **I** |
| KB score snippets | **SHIPPED** | `fico-score-models-literacy`, `credit-score-intelligence-overview` (EN+HT); `knowledgeBaseRouter` pins on FICO/Vantage queries |
| Meeting touch-up → live Jitsi | **SHIPPED** (scoped) | `MeetingPipelineKeepAlive` + `jitsiLibConference` when `hasLobbyVisualEffects`; iframe path when effects off. **Not** ML beauty / not iframe processed video |
| Host meeting CTA | **SHIPPED** | `HubMeetingsPanel` — “Host — pre-join + live touch-up” |
| Meeting honesty docs | **SHIPPED** | `PLATFORM-OS.md` §4, `MEETING-COACH.md` pre-call note |
| Specialist Academy UI | **SHIPPED** | `AdminSpecialistAcademyPage`, academy components |
| Trainee outbox enterprise | **PARTIAL** | migration + edge; browser `localStorage` interim |
| KB vector / pgvector | **MISSING** | stub only |
| Guest calendar lookup | **PARTIAL** | server row + migration for cross-device guests |
| 21-day sales packs | **PARTIAL** | [BRAND-KIT-LOCK](../../sales-packs/finely/BRAND-KIT-LOCK.md), 3 HTML one-sheets, 2 guide v2 covers, `21-day/MANIFEST.md`; days 2–21 TODO |
| Brand kit lock | **SHIPPED** | `public/brand/*` official logos; `_brand/finely-brand.css`; no `#39ff14` primary / no shield-F |
| Voice Studio | **MISSING** | launch / reconcile branch |
| PublicChatWidget | **SHIPPED** | not KB-routed |
| PortalChatWidget | **SHIPPED** | KB router + `haitian_desk` when HT |

## Build gate

```bash
npm run build
```

## Content verification

| # | Requirement | Pass location |
| --- | --- | --- |
| 1 | Track I lessons | [score-intelligence/README.md](./score-intelligence/README.md) |
| 2 | FICO research lock | [KB EN](../../knowledge-base/en/fico-score-models-literacy.md) · quizzes `fico-literacy`, `score-intelligence` |
| 3 | Partner one-sheet | [restore-to-funding-readiness.md](../../sales-packs/finely/partner-one-sheets/restore-to-funding-readiness.md) |
| 4 | Meeting processed stream honesty | [PLATFORM-OS.md](./PLATFORM-OS.md) §4 |
| 5 | Brand kit on packs | [BRAND-KIT-LOCK.md](../../sales-packs/finely/BRAND-KIT-LOCK.md) · HTML one-sheets |

## Brand kit (sales / one-sheets / guide v2)

| Rule | Lock |
| --- | --- |
| Colors | Primary `#fbbf24`, shell `#0b1110`/`#060908`, text `#f8faf9`, CTA gradient metal, ink `#1a1400` |
| Logo | `finely-cred-logo.svg`, `finely-cred-logo-dark.png`, `finely-cred-mark.png` only |
| Typography | Inter; FINELY 0.14em wt 200; Cred title case |
| Voice | Restore / file accuracy / wealth tool — not “credit repair” lead |
| Nora | Text handoff only on Finely-primary cold creatives |

## Sanz trainee session (60 min)

1. Track **I** lesson → `score-intelligence` quiz.  
2. Lounge → **Host — pre-join + live touch-up** → confirm outbound banner in room.  
3. `/free-kreyol-guide` → `/haitian?lang=ht` capture.  
4. Portal chat: ask “why is my mortgage score different?” — KB pin should surface score intel docs.

---

*Educational only. Not legal advice.*
