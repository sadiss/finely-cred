# Finely Cred — Master Execution Plan

**Status:** Living roadmap. When you say **“continue”**, work proceeds in phase order below unless you reprioritize.

**Last updated:** 2026-07-02

---

## Executive summary

The platform has strong bones (staff OS, automations engine, social hub, CRM, portal lanes) but several surfaces were **simplified for layout** (Comms Studio, Automation Scenarios grid) without replacing the depth. This plan restores **enterprise-grade communication** (Outlook-class), completes **publish bridges**, wires **staff social presence** to live posting, and finishes **partner success** + **on-duty coaches** everywhere they matter.

---

## What you reported (acknowledged)

| Issue | Root cause | Plan phase |
|-------|------------|------------|
| Comms Studio feels downgraded | `CommsStudioPremiumPage` replaced full workspace with template card deck only | **Phase 1** |
| Need 500+ comms options, 300+ email alone | Depth lives in seeds, sequences, CRM, nurture — not unified in one UI | **Phase 1–2** |
| Publish bridges don’t work | Cards were static `<div>`s, not links | **Phase 0** (fixed: clickable → admin routes) |
| Staff social media | Catalog exists; Meta OAuth + per-agent page binding not done | **Phase 3** |
| Prior suggestions not tracked | Scattered across chat | **This document** |

---

## Phase 0 — Quick fixes (done or in progress)

- [x] **Publish bridges clickable** — Content Studio bridge cards navigate to Resources, Courses, Lead Magnets, Tour Studio.
- [x] **Automation “locked grid”** — Scenarios vs Flow builder vs Trigger catalog tabs; misleading lock badges removed.
- [x] **HOS dashboard strip** — Compact dashboard variant; flyer hidden until expand.
- [x] **Black executive staff** — C-suite + VPs on roster + Human Staff OS.
- [x] **On-duty coach on bureau/debt** — `PartnerLaneCoachPanel` + staff header on dispute/debt pages and debt coaches.
- [x] **Partner success modules** — Quizzes, reviews, checklists on dispute/debt overview.

---

## Phase 1 — Communication Command Center (Outlook-class)

**Status:** Phase 1A shipped — `CommsStudioDepartmentPage` with Inbox, Compose, Templates, Sequences, Campaigns, Calendar link, Settings + capability catalog.

**Goal:** `/admin/comms` becomes the **highest-level communication surface** — not a template gallery.

### 1A — Restore unified Comms Department layout

- [x] `CommsStudioDepartmentPage` — tabs: Inbox, Compose, Templates, Sequences, Campaigns, Calendar, Settings
- [x] Seed all template packs on mount (nurture, HTML, billing, digest, funnel session)
- [x] KPI strip with email/SMS/sequence/capability counts
- [x] `CommsCommandLibrary` — full paginated template library, merge fields, HTML preview, test send
- [x] `CommsStudioInboxPanel` — Meta inbox bridge + support inbox link + paginated unified log
- [x] `STUDIO_CAPABILITY_DEPTH_RULES` enforced in `studioLayoutSystem.ts`

| Tab | Purpose |
|-----|---------|
| **Inbox** | Unified sent/received: portal threads, email log, SMS log, Meta inbox bridge |
| **Compose** | Rich composer: To/Cc/Bcc, subject, HTML body, attachments, schedule send |
| **Templates** | 300+ email templates (seeded + searchable), categories, merge fields |
| **Sequences** | Nurture + CRM sequences visual editor (link `NURTURE_SEQUENCES`, `commsSequencesRepo`) |
| **Campaigns** | Broadcasts: segment, A/B subject, throttle, compliance gate |
| **Calendar** | Scheduled sends + meeting bridges (`/admin/calendar`) |
| **Settings** | From-address, domains, unsubscribe, TCPA/CAN-SPAM, dry-run vs live |

**Files to extend:** `CommsStudioPremiumPage`, new `CommsStudioDepartmentPage`, reuse `commsWorkspaceModel`, `commsEngine`, `commsDeliveryClient`.

### 1B — Email field & option catalog (300+ email capabilities)

- [x] Searchable capability registry (`commsCapabilityCatalog.ts`) — 300+ options in Settings tab

**Compose & headers (40+)**
- To, Cc, Bcc, Reply-To, List-Unsubscribe, custom headers
- Priority, read receipt request, delay delivery, send-as alias
- Per-tenant from domains, DKIM status chip, bounce handling

**Body & design (50+)**
- HTML + plain-text dual part
- Rich text blocks: hero, CTA button, divider, testimonial, FAQ, footer
- Brand presets (Finely dark/gold), mobile preview, dark-mode safe
- Snippet library, emoji-safe subject lines, preheader field

**Personalization (60+)**
- Merge fields: `{{firstName}}`, `{{lane}}`, `{{city}}`, `{{trackedLink}}`, `{{appointmentUrl}}`, `{{portalDeepLink}}`, …
- Conditional blocks: lane=debt, stage=letters, entitlement=disputes
- Dynamic CTA by funnel, geo, staff on duty name

**Delivery & routing (40+)**
- Channel: email, SMS, portal message, push (future)
- Thread strategy: new vs append-by-subject
- Route to Hub topic, support inbox, specialist thread
- Staff owner assignment, escalation to compliance

**Compliance (30+)**
- Velvet Hammer / David Okonkwo approval queue
- Forbidden phrase scan, guarantee blocker
- Consent flags, STOP/unsubscribe enforcement
- Educational disclaimer injection

**Automation hooks (40+)**
- Trigger: lead captured, report uploaded, letter mailed, SLA breach
- Enroll sequence, send template, create task, notify admin
- Link to Automation Studio recipes

**Analytics (20+)**
- Open/click tracking (when provider wired)
- Template performance, sequence drop-off
- A/B winner selection

**Integrations (20+)**
- Resend/SendGrid/SES abstraction (existing `commsDeliveryClient`)
- Meta inbox → comms thread bridge (`socialHubCommsBridge`)
- CRM record timeline sync

### 1C — Re-seed and surface existing assets

- Run `ensureNurtureCommsTemplatesOnce`, `commsHtmlTemplateSeed`, `commsBillingTemplatesSeed`, `commsDigestTemplatesSeed`
- Expose counts in KPI strip: “312 email templates · 48 sequences · 89 SMS”
- Link each template to **Preview → Test send → Enable**

### 1D — Partner-facing parity

- Hub threads receive Comms Studio outbound (already designed)
- Proactive nudges (`CommsProactiveNudges`) tied to journey stage
- Credit specialist comms panel stays in sync

**Exit criteria:** Admin can compose, schedule, sequence, and broadcast without leaving Comms Studio; template count visible ≥300 email entries (seed + nurture + CRM).

---

## Phase 2 — Promote · Nurture · Communicate operating lanes

**Status:** Shipped — `/admin/growth-command` with Promote / Nurture / Communicate tabs; each tile opens full department workspace (no downgrade).

**Goal:** One place to run **everything you promote**.

| Lane | Tools united |
|------|----------------|
| **Promote** | Lead magnets, Social Hub, Content Studio, CMO console, funnel experiments |
| **Nurture** | Comms sequences, Automation recipes, Training Academy drips, portal messages |
| **Communicate** | Hub, Support Inbox, Calendar, Phone Hub, Comms campaigns |

- [x] `GrowthCommandDepartmentPage` + `AdminGrowthCommandPage` route + nav entry
- [x] KPI strip: sends this week, leads, social posts, comms depth
- [x] `STUDIO_CAPABILITY_DEPTH_RULES` — layout may change; capabilities may not be removed

Deliverable: **Sovereign Growth / Leads OS** cross-links or new **Growth Command** tab strip with KPIs: sends this week, replies, bookings, recruits.

---

## Phase 3 — Staff social media (agent presence → live)

**Already scaffolded:** `staffSocialPresence.ts`, `StaffSocialPresenceStrip`, Social Hub autopilot with `assignedStaffId`.

| Step | Work |
|------|------|
| 3.1 | **Connect Meta** in Social Hub Settings (App ID + OAuth) — existing |
| 3.2 | **Assign page → agent** wizard — `StaffSocialPageAssignWizard` in Social Hub Settings + Staff Command **Social** tab | Done |
| 3.3 | **Recruiting SOP autopilot** for Partner Recruiter, Affiliate Wrangler, Scout Supreme | Done — `recruitingSopAutopilot.ts` + 3 SOPs |
| 3.4 | **Disclosure layer** — AI vs human executive posts; compliance review queue | Done — `socialDisclosureLayer.ts` + `SocialDisclosureReviewPanel` |
| 3.5 | **LinkedIn/TikTok** placeholders → API when approved | Done — Settings placeholder panel |
| 3.6 | **Partner-facing** optional: show “your specialist” social proof links (brand pages only) | Done — `PartnerSocialProofStrip` on dashboard |

**Exit criteria:** At least one connected FB/IG page; autopilot drafts queue with staff name; human exec posts require approval.

---

## Phase 4 — Content Studio publish bridges (deep wiring)

| Bridge cards navigate | Done |
| Publish status chips | Done — Draft / In review / Bridged / Live on site |

| Bridge | Deep action |
|--------|-------------|
| Resources | One-click push selected asset → `resourceVideosRepo` with metadata |
| Courses | Open course editor with lesson pre-selected + video attached |
| Lead magnets | Open funnel editor with hero media slot filled |
| Tours | Open Tour Studio with new clip job queued |

- [x] One-click push on all four bridge cards + per-asset Tour demo button (`tourClipJobsRepo`)

Add **publish status chips** on assets: Draft → Bridged → Live on site.

---

## Phase 5 — Partner success & education

| Item | Status |
|------|--------|
| Quizzes on dispute/debt overview | Done |
| Reviews / CSAT | Done (local store) |
| Expand to all portal lanes | Done (bankruptcy + dashboard `all` lane) |
| Training Academy link per module | Done — `trainingLessonId` + Academy button in panel |
| Admin editor for success modules | Done — `/admin/partner-success` |
| Milestone triggers (first letter, first case) | Done — `partnerSuccessMilestones.ts` hooks |

---

## Phase 6 — Staff & automation (prior thread carryover)

- [x] Human executives on **client-facing partner roster** (Naomi, David, Marcus, Tamara)
- [x] `staffRosterProfiles` — Sanz + Ruth
- [x] `humanStaffDirectory` — Sanz + Ruth at executive suite
- [x] **Staff portraits** — catalog covers 40 expansion + executives; `StaffPortraitImg` fallback chain; roster v7
- [x] Staff Command Center: **Social presence** tab (strip + page assignment wizard)
- [x] Automation: 3 new blueprint scenarios (letter mailed, bankruptcy nurture, comms sequence enroll); default `room=scenarios`
- [x] James Holloway (VP Tech) monitoring strip on automation health

---

## Phase 7 — Portal lane polish

- [x] Bankruptcy page: liberation hub + coach + success modules
- [x] Disputes/debt: collapsible `PartnerLaneCoachDock` on non-overview tabs
- [x] Partner dashboard: compact success strip

---

## Phase 8 — Admin dashboard & layout

- [x] HOS compact strip
- [x] Staff social presence strip
- [x] Comms KPI card: scheduled sends, failed deliveries (admin dashboard)
- [x] Staff social presence strip

---

## Phase 9 — Integration & go-live hardening

- [x] **comms_send_logs** + **email_webhook_events** tables with admin RLS (`20260702120000_comms_integration_hardening.sql`)
- [x] **commsSupabaseSync** — boot sync + push on every `addCommsSend`
- [x] **commsWebhookRepo** — ingest + mirror email provider events
- [x] **IntegrationGoLivePanel** — Integration Hub + Comms Settings health strip
- [x] **Meta OAuth production redirect URIs** — `metaOAuthUrls.ts` + Social Hub / Comms settings
- [x] **social_scheduled_posts.poster_type** column for disclosure sync
- [x] Boot: `ensureCommsSyncedOnce` + `syncEmailWebhooksFromSupabase` in `main.tsx`
- [x] Inbound map: `/functions/v1/email-webhook` documented
- [x] Comms capability catalog — paginated (no 80-cap downgrade)

---

## Phase 10 — Content & course video factory

- [x] **courseVideoBridge** — lesson-aware Content Studio intake, deep links, attach `video_asset` blocks
- [x] **courseVideoPipelineRepo** — per-lesson stage tracking (Draft → Script → Storyboard → Render → Attached → Published)
- [x] **CourseVideoProductionCommand** — full pipeline UI in course builder Video tab + bulk queue
- [x] **CourseVideoBatchWorkroom** — Content Studio workroom `course_videos` with GeminiStyleVideoCommand
- [x] **tourVideoBridge** — manifest step prompts for navigation tutorials
- [x] **SiteNavigationVideoWorkroom** — Content Studio workroom `navigation_tours` + batch queue all tours
- [x] **TourVideoFactoryPanel** — Tour Studio AI tutorial factory + clip job queue
- [x] Deep links: `/admin/content-studio?room=course_videos&courseId=&lessonId=` and `?room=navigation_tours&tourId=`

---

## Phase 11 — Comms Studio enterprise + dispute round power

- [x] **Professional template seed** — dispute R1–R4, litigation, restore, specialist, SMS alerts (`commsProfessionalTemplateSeed.ts`)
- [x] **Modern template UI** — `CommsTemplateCard` grid, category + provider filters, HTML iframe preview
- [x] **Email providers** — Outlook, Gmail, Zoho, Finely native (`CommsEmailProviderPanel`)
- [x] **Conversation bridge** — Hub threads → prep email/SMS/portal in Comms (`CommsConversationBridgePanel`)
- [x] **Chat integration** — `HubTeamChatPanel` + `DisputeCaseWorkflowPanel` → Comms Studio handoff
- [x] **Dispute R1–R4 + Litigation** — extended pipeline, response playbooks, restore-after-R1 steps
- [x] **Response received playbooks** — real steps per outcome (deleted, verified unchanged, no response, etc.)

---

## Phase 12 — Comms OAuth + dispute automation

- [x] **commsEmailProviderRepo** — persist Outlook/Gmail/Zoho connections + dispute comms flags
- [x] **commsEmailOAuthUrls** — redirect URI builder + authorize URL templates
- [x] **CommsEmailProviderPanel** — OAuth connect, redirect URI copy, automation toggles
- [x] **disputeRoundCommsAutomation** — auto email/SMS on round mailed + response received
- [x] **casesRepo hooks** — `markCaseRoundMailed` / `markCaseRoundResponseReceived` trigger automation
- [x] **email-webhook edge function** — Resend/SendGrid/SES ingest → `email_webhook_events`
- [x] Integration health — email provider OAuth status chip

---

## Phase 13 — Production go-live + bankruptcy comms automation

- [x] **productionGoLiveChecklist** — deploy steps with copy-paste Supabase commands
- [x] **ProductionGoLiveChecklist** — Integration Hub UI with local progress tracking
- [x] **comms-oauth-callback** — edge function stub for Outlook/Gmail/Zoho code exchange
- [x] **Bankruptcy comms templates** — `tpl_bk_*` email + `sms_bk_*` SMS in professional seed
- [x] **bankruptcyLaneCommsAutomation** — scenario selected → thread + email/SMS + partner success milestone
- [x] **BankruptcyFilingCenterView** — wires liberation path selection to comms automation
- [x] **automation trigger** — `bankruptcy_scenario_selected` in Automation Studio matcher
- [x] Boot seed — `ensureProfessionalCommsTemplatesOnce()` in `main.tsx`
- [x] Inbound map — `comms-oauth-callback` route documented

---

## Phase 14 — Go-live verification + bankruptcy lane polish

- [x] **productionDeployVerifier** — auto-detect checklist steps (webhooks, live comms, templates, OAuth)
- [x] **ProductionGoLiveChecklist** — auto-verified badges + required-step counter
- [x] **bankruptcyLaneCommsAuto** — separate toggle in Comms Settings (alongside dispute automation)
- [x] **bankruptcyLaneStateRepo** — persist last scenario + thread for partner handoff
- [x] **BankruptcyCommsHandoffStrip** — partner portal messages CTA after path selection
- [x] **recipe_bankruptcy_scenario_nurture** — automation recipe + trigger catalog entry
- [x] **platformNotificationBridge** — partner + admin notifications on bankruptcy path selected
- [x] **comms-oauth-callback** — browser redirect to Comms Settings after OAuth
- [x] **CommsEmailProviderPanel** — handles `connected=1` return param from edge callback

---

## Phase 15 — Production deploy execution toolkit

- [x] **productionEdgeUrls** — derive webhook + OAuth URLs from `VITE_SUPABASE_URL`
- [x] **productionEdgeHealthProbe** — OPTIONS probe for `email-webhook` + `comms-oauth-callback`
- [x] **ProductionDeployUrlsPanel** — copy-paste URLs, edge health chips, full deploy script bundle
- [x] **buildProductionDeployCommandBundle** — one-click copy of all Supabase deploy commands
- [x] **env_site_url** checklist step — `FINELY_SITE_URL` secret for OAuth redirect
- [x] **bankruptcyCommsTemplateMap** — shared scenario → template map for lane + automation comms
- [x] **automationEventComms** — scenario-aware bankruptcy templates + SMS channel support

---

## Phase 16 — Bankruptcy scenario coaches + comms handoff depth

- [x] **staffBankruptcyScenarioCoaches** — liberation path → dedicated specialist (Kenya, Alicia, Tiffany, etc.)
- [x] **resolveStaffForBankruptcyScenario** — scenario-aware on-duty coach (not same person every lane)
- [x] **OnDutyStaffCoachHeader** + **PartnerLaneCoachPanel** — `scenarioId` drives coach portrait/name
- [x] **PartnerBankruptcyPage** — passes active scenario to coach panel from lane state
- [x] **BankruptcyCommsHandoffStrip** — shows dedicated coach portrait + name
- [x] **bankruptcyCommsHandoff** — admin prep email/SMS from scenario without thread
- [x] **CommsConversationBridgePanel** — bankruptcy path chip + prep bankruptcy email/SMS
- [x] **commsConversationHandoff** — bankruptcy template hints for `debt_summons` threads

---

## Phase 17 — Dispute bureau + debt workstation coaches

- [x] **staffLaneFocusCoaches** — EQF/EXP/TUC bureau specialists + debt workstation map
- [x] **resolveStaffForLaneFocus** — dedicated coach per bureau tab or debt workstation
- [x] **disputeLaneStateRepo** — persist partner bureau focus for dispute coach routing
- [x] **debtLaneStateRepo** — persist active debt workstation focus
- [x] **PartnerDisputesPage** — bureau specialist chips + `focusId` on coach panels
- [x] **PartnerDebtPage** — workstation-aware coach (`validation`, `court`, `foreclosure`, etc.)
- [x] **PartnerDisputeDetailPage** — case bureau drives on-duty specialist
- [x] **CommsConversationBridgePanel** — dispute bureau focus chip for admin prep context

---

## Phase 18 — Funding coaches + unified specialist dashboard

- [x] **FUNDING_FOCUS_COACH_IDS** — wealth path lanes → Keisha, Gregory, Antonio, Rachel
- [x] **fundingLaneStateRepo** — persist selected wealth path per partner
- [x] **partnerLaneSpecialistSnapshot** — aggregate bankruptcy + dispute + debt + funding specialists
- [x] **PartnerLaneSpecialistStrip** — dashboard “your specialists by lane” with portraits
- [x] **DisputeLaneHandoffStrip** + **DebtLaneHandoffStrip** — mirror bankruptcy comms handoff UX
- [x] **PartnerWealthPathsPage** — funding coach panel + lane selection saves specialist focus
- [x] **CommsConversationBridgePanel** — wealth path focus chip for admin context

---

## Phase 19 — Video upload intelligence

- [x] **videoUploadIntelligence** — high-level classify uploaded MP4/WebM (educational, testimonial, commercial, entertainment, course raw)
- [x] **videoUploadAnalysisRepo** — persist analyses with scrape hints and suggested uses
- [x] **VideoUploadIntelligencePanel** — drag-drop upload workroom with importance tags and course-scrape routing
- [x] **VideoStudioPremiumShell** — unified video OS tabs: Create | Upload & analyze | Voices & sounds | Pro pipeline

---

## Phase 20 — Video Studio UI v2 + expanded media catalogs

- [x] **expandedVoiceCatalog** — 252 voice personas (100+ requirement) with gender, tone, region, use-case filters
- [x] **soundEffectsCatalog** — 336 SFX/music beds (300+ requirement) across 12 categories
- [x] **VoiceSoundLibraryPanel** — searchable browse + selection for render plans
- [x] **ContentStudioDepartmentPage** — Video workroom uses premium shell; Voice workroom wired to library
- [x] **VideoCommandRequest** — optional `voicePersonaId` + `soundEffectIds` for next-gen pipeline

---

## Phase 21 — Next-gen video generation pipeline

- [x] **VideoStudioPremiumShell** — pro pipeline checklist (storyboard, VO, SFX, export, provider hooks)
- [x] **GeminiStyleVideoCommand** — still powers create tab inside premium shell (no capability removal)
- [x] **videoProviderRenderPlan** — live provider readiness panel (Kling, Runway, avatar, gateway, WebM)
- [ ] **Live provider render** — wire Kling/Runway API calls when keys configured (manual env)

---

## Phase 22 — Credit restore rounds R1–R4+ enhancement

- [x] **RESTORE_AFTER_ROUND_TWO/THREE/FOUR** + **getRestoreAfterRound** — round-aware restore playbooks
- [x] **partial** + **reinserted** response outcome playbooks
- [x] **responseOutcome** persisted on `DisputeCaseRound`
- [x] **markCaseRoundMailed** — resets `dueAt` (+35 days from mail date)
- [x] **markCaseRoundResponseReceived** — saves `responseOutcome`
- [x] **DisputeCaseWorkflowPanel** — gated restore-after UI per active mailed round
- [x] **creditRestoreRoundRollup** — partner-level round summary
- [x] **PartnerCreditRestoreHud** — steps 5–6 for round tracking + bureau responses
- [x] **PartnerCreditRestoreCommandStrip** — round-aware primary action + rollup feed

---

## How “continue” works

When you say **continue**:

1. Read this file and pick the **first incomplete phase** (Phases 0–22 largely shipped — optional: live provider render keys + production deploy).
2. Implement in **focused PR-sized chunks** (1A → 1B → …).
3. Run TypeScript check after each chunk.
4. Update checkboxes in this document.
5. Report what shipped and what’s next.

**Suggested next session:** Configure Kling/Runway/ElevenLabs live keys → Integration Hub production deploy → enable live comms.

---

## Reference paths

| Area | Path |
|------|------|
| Video upload intelligence | `src/lib/videoUploadIntelligence.ts`, `VideoUploadIntelligencePanel.tsx` |
| Voice + sound catalogs | `src/data/expandedVoiceCatalog.ts`, `soundEffectsCatalog.ts` |
| Video premium shell | `src/features/studioCommandOs/VideoStudioPremiumShell.tsx` |
| Credit restore rounds | `disputeRoundResponsePlaybook.ts`, `creditRestoreRoundRollup.ts`, `PartnerCreditRestoreHud.tsx` |
| Comms Studio (current) | `src/features/studioCommandOs/CommsStudioPremiumPage.tsx` |
| Comms domain | `src/domain/comms.ts`, `src/data/commsRepo.ts` |
| Content bridges | `src/features/studioCommandOs/ContentStudioDepartmentPage.tsx` |
| Course video pipeline | `src/features/educationStudio/CourseVideoProductionCommand.tsx`, `courseVideoBridge.ts` |
| Dispute playbooks | `disputeRoundResponsePlaybook.ts`, `DisputeCaseWorkflowPanel.tsx` |
| Master plan | `docs/MASTER_EXECUTION_PLAN.md` |
