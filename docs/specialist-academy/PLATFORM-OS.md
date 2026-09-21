# Finely Platform OS — extension map (audit lock)

Additive extensions on PR #28 **Specialist Academy**. **Do not** fork parallel chat/KB/voice/meeting/email stacks — wire through the paths below.

**Git safety:** Haitian desk, partner portals, `AdminCoursesPage` / LMS courses, and prior academy markdown remain intact. `npm run build` required before merge.

---

## 1) Trainee email journey

| Piece | Path |
| --- | --- |
| Sequence defs | `src/nurture/nurtureSequences.ts` (`academy_trainee_v1`, `lounge_welcome_v1`) |
| Dispatch + retry queue | `src/nurture/nurtureEngine.ts` → `dispatchAcademyTraineeNurture`, `processNurtureRetryQueue` |
| Templates + Comms keys | `src/specialistAcademy/academyTraineeComms.ts` (`academy_trainee_*`) |
| Send pipeline | `src/specialistAcademy/academyTraineeEmailPipeline.ts` → existing `send-email` / `commsDelivery` |
| Material pack body | `src/specialistAcademy/academyMaterialPack.ts` |
| Admin 1–N send UI | `src/components/training/academy/AcademyMaterialPackSender.tsx` |
| Enroll hooks (welcome, module, quiz, complete, pack) | `src/pages/admin/AdminSpecialistAcademyPage.tsx` |
| Feature toggles | `src/domain/settings.ts`, `src/data/settingsRepo.ts`, `AdminSettingsPage.tsx` |
| Cron intent | `docs/PLATFORM_CRON.md` (edge `platform-cron` **not in this snapshot** — schedule on deploy) |
| Runbook | `docs/specialist-academy/ACADEMY_TRAINEE_EMAILS.md` |

**Note:** `funnelEmail` / `commsEngine` / `nurtureEngine` server cron from the Sep 21 audit are **not duplicated** here; this branch uses the academy pipeline as the single client dispatch until server nurture merges.

---

## 2) KB depth + personality

| Piece | Path |
| --- | --- |
| Markdown corpus | `docs/knowledge-base/**` (+ academy lessons under `docs/specialist-academy/lessons/`) |
| Build-time bundle | `src/lib/knowledgeBase/kbContent.ts` |
| Canonical index + vector gate | `src/lib/finelyKnowledgeIndex.ts` (`VITE_FINELY_KB_VECTOR=1`, ETL stub in `searchFinelyKnowledgeVector`) |
| Retrieval router | `src/lib/knowledgeBaseRouter.ts` (`retrieveKnowledge`, `retrieveKnowledgeSync`) |
| HT/EN detect | `src/lib/knowledgeBase/kbLang.ts` |
| Personas | `src/lib/knowledgeBase/agentPersonas.ts` |
| Consumers | `PortalChatWidget.tsx`, `AcademyCoachChat.tsx`, `AdminSpecialistLoungePage.tsx` |

**Audit gaps in this snapshot:** `humanCreditTalk`, `knowledgeBaseRouter` server-side, pgvector ETL script — enable vector when edge worker lands; do not add a second KB index.

---

## 3) Voice (extend when present)

| Piece | Path / status |
| --- | --- |
| Academy narrate hook | `src/lib/academyNarrateClient.ts`, `AcademyNarrateButton.tsx` |
| Media / TTS client (existing) | `src/lib/voiceGenClient.ts`, `AdminMediaStudioPage` |
| Env slots (optional, safe if unset) | `VITE_ACADEMY_NARRATE_URL`, `VITE_VOICE_STT_ENDPOINT` (Whisper/Deepgram-compatible) |
| **MISSING on branch** | `voiceStudioCore`, `voiceProfiles.ts`, `publicChatStaffVoice`, `useFinelyVoiceInput` (present on `origin/reconcile-ours-wins` only). Map `finely_kreyol_companion` + `finely_female_executive` when merged; route staff TTS through Voice Studio, not browser `speechSynthesis` |

---

## 4) Meetings + video quality (shipped on PR #28)

| Piece | Path |
| --- | --- |
| Guest join (no signup) | `src/pages/GuestMeetingJoinPage.tsx` → `/meet/:eventId` |
| Host / huddle room | `src/pages/VideoMeetingRoomPage.tsx` → `/admin/meet/:eventId?ctx=lounge\|academy_huddle` |
| Jitsi External API | `src/hooks/useJitsiMeetingApi.ts` |
| Room URLs | `src/lib/meetingUrls.ts` (`VITE_DAILY_DOMAIN`, `VITE_JITSI_DOMAIN`) |
| Pre-join lobby | `src/components/meeting/MeetingPreJoinLobby.tsx` |
| Lounge lobby UI | `src/components/meeting/HubMeetingsPanel.tsx` |
| Touch-up v1 + virtual BG | `src/lib/meetingBeautyPipeline.ts` (radial matte — **not** ML segmentation) |
| Guest calendar lookup | `calendar-guest-lookup` edge + `calendarGuestLookup.ts` |
| Meeting lifecycle email | `meetingInviteEmailSend.ts` — invite/cancel/reschedule + ICS in text body |
| Prefs + host defaults | `src/lib/meetingVideoPrefs.ts`, `meetingVideoQuality.ts` |
| Calendar source | `calendarRepo.ts` |

### Meeting video quality (honest scope)

- [x] Pre-join camera preview with **touch-up v1** (filters + radial matte — not Zoom/Teams AI parity)
- [x] Virtual backgrounds: blur + Finely executive / pro office / brand gradient (procedural HD canvases)
- [x] HD vs Smooth modes — WebRTC `ideal` 720p@30 vs 540p@24; Jitsi simulcast + layer suspension on
- [x] Echo cancellation, noise suppression, AGC on by default in `getUserMedia` audio constraints
- [x] Specialist Lounge + academy huddle host defaults (`LOUNGE_HOST_VIDEO_DEFAULTS`, `ACADEMY_HUDDLE_VIDEO_DEFAULTS`)

| Env / flag | Purpose |
| --- | --- |
| `VITE_DAILY_DOMAIN` | Optional Daily.co rooms (else Jitsi `meet.jit.si`) |
| `VITE_JITSI_DOMAIN` | Self-hosted Jitsi domain for External API |
| `VITE_MEETING_VIDEO_BEAUTY=0` | Disable canvas beauty pipeline (future; prefs in localStorage today) |

**GPU note:** Canvas preview beauty/background compositing is GPU-accelerated when available (~1–3 ms/frame at 720p). Use **Smooth** on low-power devices.

---

## 5) Specialist Lounge (shipped)

| Piece | Path |
| --- | --- |
| Domain | `src/domain/specialistLounge.ts` |
| Store (local) | `src/data/specialistLoungeRepo.ts` |
| Admin UI | `src/pages/admin/AdminSpecialistLoungePage.tsx` |
| Routes | `App.tsx` `/admin/specialist-lounge`, `AdminNav.tsx` |
| Academy deep links | Hub CTA, `module_huddle` posts with `moduleLessonId`, `?ch=` channel param |

Weekly lounge digest + review→coach email: spec in `docs/PLATFORM_CRON.md` (future cron).

---

## 6) Partner social (blueprint + stub only)

| Piece | Path |
| --- | --- |
| Blueprint | `docs/specialist-academy/PARTNER-SOCIAL-BLUEPRINT.md` |
| Waitlist | `src/pages/PartnerCommunityWaitlistPage.tsx` → `submitLeadCapture` (`interest: partner_journey_community_waitlist`) |

---

## 7) Lead Intel (existing edge)

| Piece | Path |
| --- | --- |
| Edge function | `supabase/functions/lead-intel/index.ts` (Google CSE → Serper → OSM) |
| Admin UI | `src/pages/admin/AdminLeadIntelPage.tsx` |
| Default CSE cx | `815aa44b612a64808` (API key via secrets only) |

---

## 8) Interactive academy UI (shipped)

| Piece | Path |
| --- | --- |
| Page shell | `src/pages/admin/AdminSpecialistAcademyPage.tsx` |
| Components | `src/components/training/academy/*` |
| Walkthroughs / nav | `academyWalkthroughs.ts`, `academyNav.ts`, lesson `08-visual-product-walkthrough` |
| Styles | `src/styles/finelyAcademyMaterials.css` |

---

## Critical paths unchanged

- `PublicChatWidget` / `PortalChatWidget` — extended with KB router, not replaced  
- `UnifiedTrainingPanel` / `AcademyQuizPanel` — still drive quizzes  
- `trainingAcademy` / partner course pages — not removed  
- Haitian desk copy and HT lesson tracks — preserved  

---

*Educational platform — not legal advice.*
