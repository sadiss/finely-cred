# Finely Platform OS — Specialist / KB / Voice / Meetings (plan)

Additive extension to PR #28. **Nothing here removes** Haitian desk, portals, or prior academy work.

## Shipped in this PR (baseline)

| Area | Status |
| --- | --- |
| Interactive Specialist Academy | Motion walkthroughs, quizzes, progress, EN\|HT, coach chat hook |
| Trainee emails | Pipeline + templates + admin toggles + material pack 1–N |
| Knowledge Base | `docs/knowledge-base/` + client retrieval + portal/academy coach prompts |
| Lead Intel search | Google CSE slot (cx default), Serper optional, OSM Nominatim fallback |
| Resources shelf | Academy links + public regulator URLs |

## A) Knowledge Base OS — next

- [ ] Vector index (Supabase pgvector or edge chunker) over `docs/knowledge-base/` + `docs/specialist-academy/`
- [ ] Persona switcher in portal chat UI (`haitian_desk`, `funding_desk`)
- [ ] HT parity articles for all EN compliance topics

## B) Voice (free-first) — env slots only

| Slot | Purpose |
| --- | --- |
| `VITE_ACADEMY_NARRATE_URL` | POST `{ text, lang }` → audio blob (Edge TTS / Piper worker) |
| `VITE_VOICE_STT_ENDPOINT` | Optional Whisper-compatible STT |
| Browser | `speechSynthesis` / Web Speech API — labeled “basic”, last resort |

**Flow target:** speak → transcript → KB-grounded LLM → TTS in detected language.  
**Meeting + chat:** share `src/lib/knowledgeBase/*` + `agentPersonas.ts`.

No API keys in repo. Document provider signup in runbook.

## C) Guest Meet-style meetings — spec

Prefer extend calendar/consultation if present; else:

| Slot | Provider |
| --- | --- |
| `DAILY_API_KEY` or `LIVEKIT_*` | Guest join links without Finely signup |
| `MEETING_BASE_URL` | Public join route |

Emails: invite, reminder, cancel, reschedule + ICS attachments. Templates EN (+ HT). Recording stub OK.

## D) API adapters (documented)

| Adapter | Key | Use |
| --- | --- | --- |
| OSM Nominatim | None | Lead Intel fallback |
| Google CSE | `GOOGLE_CSE_CX` (815aa44b612a64808), `GOOGLE_CSE_API_KEY` secret | Lead Intel primary when set |
| Bing | `BING_SEARCH_API_KEY` slot | Future prospecting |
| OpenCorporates | Optional | B2B verify |
| CFPB/FDIC | Public URLs | Academy resources shelf |

## Git safety checklist

- [x] Additive files only
- [x] Portal chat extended, not replaced
- [x] Courses module untouched
- [x] `npm run build` before merge

---

*Educational platform — not legal advice.*
