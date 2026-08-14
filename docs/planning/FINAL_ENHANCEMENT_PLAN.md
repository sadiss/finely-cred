# Finely Cred — FINAL Enhancement Plan (execution-ready)

**Status:** This document **supersedes** `docs/planning/enhancement_plan_draft_v2.md` and all three Round 3 sub-files (`round3_final_phases_A_N_E1a_B_F.md`, `round3_final_phases_C0_C_G_D.md`, `round3_final_phases_K_L_H_I_J.md`). It is self-contained — a reader/execution agent should not need to open any other planning document to build from this one. It merges three parallel Round 3 finalization passes plus this pass's own Phase K/L/H/I/J work into one master spec with one unified execution wave plan.

**Inputs merged:** `enhancement_plan_draft_v2.md` (the draft this finalizes) + `round2_critique_feasibility_sequencing.md` + `round2_critique_business_impact.md` + `round2_critique_completeness_gaps.md` + all three Round 3 outputs. No application code has been changed by any planning pass to date — this is planning only. Every file path, line reference, and behavior claim below was verified against the real source tree during one of the three Round 3 passes (see the three sub-files' "Verified" notes for the underlying evidence trail, though you should not need them to execute).

---

## Executive summary

This plan closes the loop on a four-round planning process (3 parallel Round 1 audits → 3 parallel Round 2 critiques → 3 parallel Round 3 execution specs → this merge) covering the entire Finely Cred codebase: public/marketing site, lead-magnet funnels, the partner portal, the admin console, the nine-agent growth-automation layer, and the Supabase server-cron backend. The single biggest reprioritization from Round 2, carried through unchanged by Round 3, is this: **Phase F ("stronger contact & revenue protection") is not a server-reliability chore, it is the highest-leverage lever in the entire plan.** Every prospect/affiliate/partner follow-up sequence, meeting reminder, and no-show recovery currently stops dead the instant no admin has a browser tab open — nights, weekends, sick days — and 2026 speed-to-lead research shows a 5-minute vs. 30-minute response gap is worth a **21× qualification swing** and a **2.6× close-rate swing**. Layered directly on top of that finding is the plan's single highest-leverage **net-new** item, **Phase N (instant lead acknowledgment)** — not proposed anywhere in the original v1 draft — which closes the gap between "a sequence will eventually reach this lead" (what F2 delivers) and "this lead got a reply in under five minutes" (what actually moves qualification odds). Round 3's own re-verification found N1 is *narrower* than originally scoped: a real, working instant-email acknowledgment already fires today from the lead-magnet funnel path; the genuine, still-open gaps are SMS acknowledgment, and — the most consequential single finding of this pass — **Meta Lead Ads leads ingested via the `meta-webhook` server function receive zero acknowledgment of any kind today.**

Beyond the F/N reprioritization, this pass corrected several effort estimates that were meaningfully under-scoped in the original draft: F1 (meeting reminders) is a full **L**, not M — it requires the exact same new-table-plus-server-cron-pattern shape as F2, just on a smaller table, because `calendarRepo.ts` is 100% localStorage with zero server table today. A5 (cross-channel frequency cap) is genuinely **M**, not S, once the SMS-reminder path's separate de-dupe mechanism and the identity-resolution requirement are accounted for. H1 (pgvector) remains **L** but now carries an explicit, named ongoing-tooling-cost deliverable (a re-embed-and-upsert ETL script), not just a one-time migration. And this pass's own mechanical audit (Phase I5, executed live during planning, not deferred) found a **fourth orphaned admin page** (`AdminDashboardLayoutPreview.tsx`) beyond the three already identified in Round 2 — all four are unrouted, unreachable dead code, confirmed by grepping every `src/pages/admin/*.tsx` filename against `App.tsx`'s full import/route table. Two genuinely good-news corrections also came out of this pass: billing/`Agreement` revenue data needs **zero new migration or RLS policy** for an admin-wide aggregate query (the existing `is_admin()` RLS bypass already permits it) even though `AdminBillingPage.tsx` itself turned out to have zero reusable rollup logic to build on; and G2 (agent-action → CRM-outcome attribution) is **confirmed buildable today**, independent of Phase F, using data that already exists in the client's audit log — its output just needs an honest, UI-rendered "as complete as this browser's history" caveat until Phase F closes the underlying localStorage gap.

The remainder of this document is organized as: the full revised priority order; every phase (A, N, E1a, B, F, C0, C, G, D, K, L, H, I, J) with every item spec'd to execution-ready detail (files, migrations, approach, ownership, dependencies, acceptance criteria, effort); a single consolidated Execution Wave Plan merging all three Round 3 passes' file-ownership constraints into one wave sequence; and a final QA/verification checklist referencing this repo's existing `.cursor/rules/` conventions. Build from this document top to bottom — the Execution Wave Plan section is the one to hand directly to parallel execution agents.

---

## Full revised priority order

This is `enhancement_plan_draft_v2.md`'s "Revised priority order" section, carried forward with Round 3 corrections annotated inline. Priority reflects genuine business impact (revenue, conversion, retention, risk-reduction) tested against the owner's stated bar — *more efficiency, more results driven, stronger contact, what's working/not working, unique approaches, results driven, knowledge is overly superb* — not raw effort size.

1. **Phase A** — Zero-risk accuracy/honesty fixes. Ship as one cleanup batch; no strategic weight, but also zero reason to delay. *(Round 3: all 7 items — A1-A7 — confirmed accurate and execution-ready, no scope changes except A5's effort re-rating, already reflected in v2.)*
2. **Phase N — Instant Lead Acknowledgment.** Highest "stronger contact" leverage of any net-new item in the plan. *(Round 3 correction: narrower scope than drafted — a real client-side email ack already exists and fires; the concrete open gaps are SMS + the Meta Lead Ads webhook path, which currently sends zero acknowledgment of any kind.)*
3. **Phase E1a** — Revenue/MRR dashboard from already-server-truth billing data. No Phase F dependency. *(Round 3 correction: `AdminBillingPage.tsx` has zero reusable rollup logic — build from scratch — but zero new migration/RLS is needed since existing admin RLS bypass already permits the cross-partner query. Net effort unchanged.)*
4. **Phase B** — Surface what already exists publicly. *(Round 3: B2/B3/B7's gaps confirmed total, not partial — zero trust-strip-near-hero, zero funding-page link to the existing non-citizen panel, zero click-to-call anywhere in visitor-facing code. New finding: B2 and Phase D's D3 both edit the same homepage hero region of `App.tsx` — sequence as one agent, not two, see Execution Wave Plan.)*
5. **Phase F** — Stronger Contact & Revenue Protection infra. Confirmed the single largest and highest-impact phase in the plan. *(Round 3: F1 re-confirmed L, not M. New finding: the existing server-side nurture cron has **zero** suppression/quiet-hours/frequency-cap enforcement today — folded into F2's required scope, not left as a caveat. A4/A5 are now hard prerequisites for F2, not just "nice to fix first.")*
6. **Phase C0** — Compliance/legal review gate. Must precede C1, C4, and C5 (the outcome wizard is exactly as sensitive as the static articles — same gate, not a lighter one).
7. **Phase C** — Public SEO content from existing doctrine. *(Round 3: `/resources/...` prefix confirmed as the naming decision, not `/learn/...`. B3/C1 non-citizen overlap fully resolved — one new article, one workstream, owned by C1's agent.)*
8. **Phase G2** — Agent-action → CRM-outcome attribution. Build now against client data (confirmed no Phase F dependency); note it undercounts until Phase F lands. G2b and G4a extend it immediately after.
9. **Phase D** — Pricing & funnel simplification. *(Round 3: D1+D2+D5's shared-file conflict is fully mapped — one sequential chain, D5 first (downgrades to a verification-only step under the recommended "keep `banking_reports` separate" decision), then D1, then D2. D3 and D4 are independent of that chain.)*
10. **Phase K** — Fixes found only by reading actual sprint code (small, cheap, high-integrity value). *(K2 lives under Phase A as A7 — do not schedule twice.)*
11. **Phase L** — Partner (post-sale) portal gaps. *(New finding: L1 and L2 both edit `PartnerDashboardPage.tsx`, which Phase B's B4 also edits — three items, one file, one sequential chain: B4 → L1 → L2.)*
12. **Remaining G (G1, G3, G4b-deferred), H, I, J** — longer-horizon / lower-priority items. *(New finding: I5's mechanical audit found a 4th orphaned admin page beyond the 3 already known. New finding: G2b, H2, and K4 all touch the same two subagent files — `calebReasoningSubagents.ts` and `estherStrategySubagent.ts` — sequence as noted in the Execution Wave Plan.)*

---

## Phase A — Zero-Risk Accuracy & Honesty Fixes

Ship as one cleanup batch. Total effort: S across the board except A5.

### A1 — Fix Hannah's "(AI)" label mismatch
- **File:** `src/features/growthAgents/growthAgentRegistry.ts` (line 199).
- **Approach:** Change `'Channel performance watcher (AI)'` → `'Channel performance watcher'`. Confirmed `hannahSyndicationWatcher.ts` never calls `runAgentBrainStep()` — pure deterministic aggregation. Do **not** wire it into real reasoning under this ticket (that's a separate M-effort change matching `estherStrategySubagent.ts`'s pattern, out of scope here).
- **Note to carry into the PR:** cosmetic-only — Hannah's watcher still doesn't run unattended until F2/F3 land. Don't report this as fixing the reliability gap.
- **Ownership:** Isolated file. **Dependencies:** None. **Acceptance:** Registry label no longer contains "(AI)" for `channel_performance`; roster page renders the corrected label. **Effort: S.**

### A2 — Wire Ruth's psychology profile into `coOwnerSystemPrompt.ts`
- **File:** `src/domain/coOwnerSystemPrompt.ts`.
- **Approach:** Import `buildPsychologyAwareSystemPromptFragment` from `src/features/growthAgents/agentCognitiveEngine.ts` (already called the same way by `growthAgentBrain.ts:84`) and add `buildPsychologyAwareSystemPromptFragment('ruth'),` to the array `buildCoOwnerSystemPrompt()` returns, after the `Personality:` line and before `Operating brain:`. `agentPsychologyArchitectureRepo.ts:226` already has a full `personaId: 'ruth'` profile ready to consume.
- **Ownership:** Only reads `agentCognitiveEngine.ts` (no modification) — isolated write to `coOwnerSystemPrompt.ts`. **Dependencies:** None. **Acceptance:** A co-owner chat response's assembled system prompt includes Ruth's OCEAN/DISC fragment (verify via debug log of the assembled string). **Effort: S.**

### A3 — Fix live-source label mismatch in `sourceAdapters.ts`
- **File:** `src/features/overnight50/sourceAdapters.ts`.
- **Approach:** Remove `'sms_reply_capture'`, `'email_reply_capture'`, `'webhook_meta_leads'`, `'webhook_google_lsa'` from the `LIVE_SOURCE_IDS` `Set` literal (lines 21-37) — their own `notes` fields (lines 73/74/79/80) already say these tick counters are simulated.
- **Important scope boundary:** This flag is about the **lead-intel swarm's simulated tick counters**, a different subsystem from the real lead-capture-to-CRM path Phase N's N1 touches (`meta-webhook/index.ts`). Do not conflate the two — N1 adding a real acknowledgment send does not change this item's `webhook_meta_leads` status flag.
- **Ownership:** Isolated file. **Dependencies:** None. **Acceptance:** These four sources render "simulation" status wherever `LIVE_SOURCE_IDS` drives a badge; `notes` text unchanged. **Effort: S.**

### A4 — Call `isWithinQuietHours()` in `sendCrmSequenceEmail`
- **File:** `src/features/crm/sequences/runCrmSequenceEngine.ts` (`sendCrmSequenceEmail`, ~line 85).
- **Approach:** Import `isWithinQuietHours` from `src/data/commsSuppressionRepo.ts`; add an early-return guard before the `sendEmail(...)` call (after suppression/frequency-cap checks) — if `!isWithinQuietHours()`, log `Email deferred — outside quiet hours` via `logSequenceActivity` and return without sending.
- **Critical sequencing:** **Must land before F2** — F2 ports this exact function's logic server-side; if A4 lands after, the server port has to be redone.
- **Ownership:** Shared file with A5 (sequence A4 → A5, same agent) and F2 (F2 reads/ports the post-A4/A5 version — F2 must start after both). **Dependencies:** None (blocks F2). **Acceptance:** Manually invoking `runDueCrmSequenceSteps()` outside 9am–8pm defers the send with the correct log note; inside quiet hours it sends normally. **Effort: S.**

### A5 — Cross-channel frequency-cap awareness (confirmed M, not S)
- **Files:** `src/data/commsSuppressionRepo.ts` (new identity-resolution helper), `src/features/crm/sequences/runCrmSequenceEngine.ts`, `src/features/growthAgents/alexAppointmentAutomation.ts`; scoping decision affecting `src/lib/meetingReminderAutomation.ts` (confirmed: its SMS path has its own independent `SMS_SENT_KEY`/`eventId` de-dupe and never calls `isOverFrequencyCap`/`recordSendForFrequencyCap` today).
- **Approach (build the full scope, don't under-build):**
  1. Add `resolveFrequencyCapKey(args: { email?: string; phone?: string; crmRecordId?: string }): string` to `commsSuppressionRepo.ts` — prefer a stable per-CRM-record key (look up the record's contact via `crmRecordsRepo.ts`, use `contact.email?.toLowerCase() || contact.phone` normalized) over a raw string, so email and phone sends against the same record share one bucket.
  2. Update `runCrmSequenceEngine.ts`'s `sendCrmSequenceEmail` and `alexAppointmentAutomation.ts`'s outreach loop to call `isOverFrequencyCap(resolveFrequencyCapKey(...))`/`recordSendForFrequencyCap(resolveFrequencyCapKey(...))` instead of a raw email string.
  3. **Explicit decision (make it now, document it):** meeting-reminder SMS does **not** share the marketing-cadence cap — it's time-bound to a specific confirmed event, not discretionary outreach. Keep its existing `SMS_SENT_KEY`/`eventId` de-dupe as-is. Add a one-line code comment at the top of `meetingReminderAutomation.ts` recording this decision so a future reader doesn't "fix" it into the shared cap by mistake.
  4. Spot-check `graphEngine.ts` and `benjaminPartnershipSubagent.ts` for the same raw-string pattern; update if found.
- **If timeline pressure forces a cut:** narrow to "email-only, keyed by normalized email" — that sub-scope is genuinely S; state explicitly which version shipped, don't silently ship the narrow cut while claiming full scope.
- **Critical sequencing:** **Must land before F2**, same reasoning as A4. Sequence after A4 (same file, trivial ordering).
- **Ownership:** Same file cluster as A4; also shared with F1 (via the `meetingReminderAutomation.ts` exclusion decision, which F1 needs settled before porting reminder logic server-side) — **order: A4 → A5 → F1 → F2**.
- **Dependencies:** None (blocks F1's reminder-SMS decision and F2). **Acceptance:** A CRM record with both email and phone that receives an Alex outreach email is correctly blocked from also receiving a CRM-sequence email in the same window; meeting-reminder SMS for a confirmed event still sends regardless of other same-day sends (confirms the explicit exclusion). **Effort: M** (or S if explicitly narrowed — state which shipped).

### A6 — Soften the "Coming soon" fallback in `growthAgentMaturity.ts`
- **File:** `src/features/growthAgents/growthAgentMaturity.ts` (`getAgentMaturity`, lines 348-366; fallback lines 361-365).
- **Approach:** Confirmed unreachable for the current 9-agent roster. Do **not** delete outright — add `console.warn('[growthAgentMaturity] No maturity branch for agent', agent.id)` at the top of the fallback block before it returns, so a future 10th agent added without a maturity branch fails loudly instead of silently showing "Coming soon."
- **Ownership:** Isolated file. **Dependencies:** None. **Acceptance:** All 9 current agents resolve to their real (non-fallback) maturity report; a temporary 10th fake agent id triggers the console warning. **Effort: S.**

### A7 (was "K2") — Tag media-engine knowledge chunks `internal_only`
- **File:** `src/lib/finelyKnowledgeIndex.ts` (`buildContentMediaEngineChunks`, lines 423-485 — four sub-builders: `videoChunks`, `imageChunks`, `voiceChunks`, `scriptChunks`).
- **Confirmed bug (re-verified independently in two of the three Round 3 passes):** each of the four chunk arrays tags with content-descriptive tags only (`'video_production'`/`'image_production'`/`'voice_audio_production'`/`'script_framework'`, category name, `'content_studio'`, `'media_production'`) — **none appear in `INTERNAL_REFERENCE_TAGS`** (`{'billing','crm','pipeline','dunning','agreements','entitlements','internal_only'}`, line 662-666), unlike the sibling `buildPersonaPsychologyChunks()` (lines 402-420), which correctly tags every chunk `'internal_only'`. These four staff-only production-technique chunk sets currently pass `isPublicSafeKnowledgeChunk()` and are eligible for public/partner chat retrieval.
- **Approach:** Add `'internal_only'` to each of the four `tags` arrays (lines 435, 450, 465, 480), mirroring the psychology-chunk pattern exactly.
- **Ownership:** Isolated write to `finelyKnowledgeIndex.ts`. **Sequence before H1 and J4** (both also touch this file later — see those items). **Dependencies:** None. **Acceptance:** `searchFinelyKnowledgePublic()` with a query matching a known media-technique term (e.g. "caption burn-in") returns zero media-technique chunks; the same query against the internal/admin search path still surfaces them. **Effort: S.**

---

## Phase N — Instant Lead Acknowledgment

**Re-scoped per Round 3's re-verification — narrower and more concrete than drafted.** A real, working instant email acknowledgment already exists and fires today: `src/lib/leadCapturePipeline.ts`'s `runLeadCapturePipeline()` calls `sendImmediateWelcomeEmail()` (`src/lib/funnelEmail.ts`), a genuine `sendEmail()` call gated on consent + the `commsDelivery` feature flag — not a stub. The real, still-open gaps are: (a) no SMS instant-ack exists at all, (b) **leads captured via `supabase/functions/meta-webhook/index.ts` (Meta Lead Ads) get zero acknowledgment of any kind** — that function inserts directly into `lead_captures` server-side and never touches the client pipeline, and (c) the existing email ack is client-side fire-and-forget, not server-guaranteed the way Phase F's philosophy demands elsewhere.

### N1 — Close the three real instant-ack gaps
- **Files to create:**
  - `src/lib/instantLeadAck.ts` — `sendImmediateWelcomeSms(args: { lead: LeadCapture })`, parallel in shape to `sendImmediateWelcomeEmail`. Gate on `lead.phone?.trim()` present, `lead.consentToContact && lead.consentSmsMarketing`, `isFeatureEnabled('commsDelivery')`, and `checkSuppression({ phone, channel: 'sms' })` not suppressed. Message includes a booking link (reuse `getPublicSiteOrigin()` + `buildBookingInvitePath`, already used in `alexAppointmentAutomation.ts`) — always give the lead a concrete next action, never a bare "thanks."
  - `supabase/functions/_shared/sendInstantLeadAck.ts` — `sendInstantLeadAckServerSide(admin, args: { email?, phone?, fullName?, tenantId? })` for server-sourced leads. Must call `checkSuppressionServerSide()` (existing) before sending, then `sendServiceEmail`/`sendServiceSms` (existing, same helpers `executeAutomationAction.ts` already uses).
- **Files to modify:**
  - `src/lib/leadCapturePipeline.ts` — add a fire-and-forget call to `sendImmediateWelcomeSms({ lead })` alongside the existing `sendImmediateWelcomeEmail(...)` call (~line 122).
  - `supabase/functions/meta-webhook/index.ts` — in `ingestLeadgen()` (lines 108-142), after the `lead_captures` upsert succeeds, call `sendInstantLeadAckServerSide(admin, { email: details?.email, phone: details?.phone, fullName: details?.fullName, tenantId: 'finely_cred' })`. **This is the single highest-value line in N1** — Meta Lead Ads leads currently receive zero acknowledgment of any kind, confirmed by reading this file end to end.
  - **New migration** `supabase/migrations/<next-timestamp>_lead_captures_first_touch.sql` — add `first_touch_at timestamptz null`, `first_touch_channel text null` (`'email'`/`'sms'`/`null`) to `lead_captures`. Both client and server ack paths best-effort update these columns on first successful send (client: guarded the same way `submitLeadCapture` already guards its own insert, never blocking the UI; server: direct `admin.from('lead_captures').update(...)`).
- **Explicitly out of scope:** rearchitecting lead capture into a single Postgres-trigger-driven ack path. Ship the three additive gaps above; revisit a true single-path architecture only if double-send/missed-send issues surface in production logs.
- **Ownership:** Isolated files (`instantLeadAck.ts`, `sendInstantLeadAck.ts` new; `leadCapturePipeline.ts`, `meta-webhook/index.ts` — no other item in this plan touches these). **Dependencies:** None on other phases; conceptually should reuse A4/A5's corrected suppression behavior but shares no file with them. **Should share design with J3** (missed-call text-back) — same "immediate ack off a real-time webhook, reusing the suppression check" pattern; build N1 first, J3's agent reads N1's final implementation before starting.
- **Acceptance criteria:** (1) submitting a test lead with phone + both consents + `commsDelivery` on triggers an SMS within the same request cycle as the existing email, and `first_touch_channel` is set; (2) a simulated Meta Lead Ads webhook POST with a resolvable email triggers `sendInstantLeadAckServerSide` and populates `first_touch_at`, where today it never fires; (3) a lead with `consentSmsMarketing: false` triggers no SMS attempt and no error.
- **Effort: M** (re-rated from S/M — the webhook-side gap and new migration push this past pure S, though it is not a from-scratch build either).

### N2 — Time-to-first-touch and reply-rate KPIs
- **Files:** Extends whichever module computes E1a's dashboard aggregates (`src/data/billingAdminAggregateRepo.ts`, see E1a below) — add `avgTimeToFirstTouchMinutes`, computed client-side from `select created_at, first_touch_at from lead_captures where first_touch_at is not null order by created_at desc limit 500` (no new RPC needed at this volume).
- **Reply/response rate:** requires a definition of "reply." Recommend keying off inbound `meta_inbox_messages` rows (already exists per `meta-webhook.ts`'s `ingestMessage`) matched to a lead within N days of first touch. **No inbound-SMS capture path exists today** (confirmed: `sourceAdapters.ts`'s own notes for `sms_reply_capture` still say no Twilio inbound-SMS read-path exists) — scope N2's first cut to **time-to-first-touch only**; log raw reply-rate as a stretch add-on once an inbound-SMS path exists (building that path is out of scope here).
- **Ownership:** Isolated addition, lands inside E1a's dashboard surface. **Dependencies:** **Hard dependency on N1** (needs its new columns populated). Feeds E1a as a KPI tile but doesn't need E1a's full build finished first — can land as a standalone tile.
- **Acceptance criteria:** A KPI tile shows real average minutes-to-first-touch computed from actual `lead_captures` rows; with fewer than 5 populated rows (fresh deploy), shows an honest "not enough data yet" state, not 0/NaN. **Effort: S** (once N1's columns exist).

---

## Phase E1a — Revenue/MRR Dashboard

**Confirmed does NOT depend on Phase F.** Billing/`Agreement` data is genuine server truth via the Stripe webhook, independent of the CRM local-first problem Phase F solves.

**Two corrections from this pass, one bad-news / one good-news:**
- **Bad news:** `AdminBillingPage.tsx` has **zero reusable rollup logic** — confirmed it does `loadJson('finely.billing.v1', ...)` and renders whatever happens to be in *that admin's own browser's* local store. There is no existing admin-wide Supabase pull anywhere in the codebase. Build from scratch.
- **Good news:** **No new migration or RLS policy is needed.** `agreements_select_own` (`20260211000100_full_mode_core.sql`) uses `is_partner_owner(partner_id)`, and `is_partner_owner()` was patched in `20260521000001_add_admin_bypass_to_rls.sql` to return `true` for any row when `is_admin()` is true. A plain authenticated-admin `supabase.from('agreements').select(...)` with **no** `.eq('partner_id', …)` filter already returns every partner's rows under existing RLS.

### E1a.1 — Admin-scoped aggregate revenue query + dashboard rebuild
- **Files to create:** `src/data/billingAdminAggregateRepo.ts` — exports `pullAdminRevenueSnapshot(): Promise<AdminRevenueSnapshot>`:
  1. Query `supabase.from('agreements').select('id, tenant_id, partner_id, package_id, status, amount_cents, rail, created_at, started_at, ended_at').order('created_at', { ascending: false }).limit(2000)` — no partner filter (safe per the RLS confirmation above).
  2. Cross-reference `packageId` against `src/config/pricingCatalog.ts`'s exported package arrays (`personalCreditPackages`, `businessCreditPackages`, `debtLegalPackages`, `wealthBuilderPackages`, agency arrays) to resolve each agreement's category.
  3. Compute: total one-time revenue, MRR (sum of active `personal_core` agreements — confirmed the only true subscription SKU), revenue-by-category breakdown, month-over-month trend.
- **Files to modify:** `src/pages/admin/AdminAnalyticsPage.tsx` — add a revenue section (keep the existing 5 ops counters — leads/tasks/openTasks/cases/openCases, they're still useful) using `FinelyOsOverviewStatTile` (already imported), same `useEffect` pattern already in the file, compact-luxury spacing.
- **Ownership:** Isolated to this new repo file + this one page. **Dependencies:** None. **Acceptance:** Dashboard shows non-zero MRR/revenue on a project with seeded `agreements` across ≥2 partners (proves cross-partner, not per-browser-local); figures match a manual `SELECT sum(amount_cents) FROM agreements WHERE status = 'active'`. **Effort: M.**

### E1a.2 — Three distinct revenue views, not one blended metric
- **Files:** Same repo file + page. Extend the snapshot type with `oneTimeProgramRevenue`, `recurringMembershipMrr`, `agencyRevenueSharePipeline` as explicit named sections (agency detection: filter by `agencyBuyInPackages`/`agencyTiers` ids). **Acceptance:** dashboard visually separates these three — a reviewer can answer "how much agency pipeline exists" and "what's true MRR" as two independently-visible numbers, not one blended figure. **Effort:** folded into E1a.1's M.

### E1a.3 — Ladder-progression tracking
- **Files:** Same repo file. Add `computeLadderProgression(agreements)`: group by `partnerId`, order by `createdAt`, check whether a partner's second agreement is a higher tier than their first using `pricingCatalog.ts`'s package ordering within category. Surfaces `% of multi-agreement partners who progressed` and `% with only 1 agreement` (the graduation-candidate pool). **This is the shared definition of "graduated partner" that Phase L's L2 must reuse** — do not let L2 invent its own. **Acceptance:** a seeded partner who bought Starter then later Wealth Builder counts as progressed; a single-agreement partner is excluded from the denominator, not counted as "did not progress." **Effort:** folded into E1a.1's M.

### E1a.4 — `AdminBillingPage.tsx` reuse check — resolved, nothing to reuse
- No action follows from this beyond E1a.1 as specified. Do not spend build time re-checking.

### E1b / E1c — Explicitly deferred
CAC (needs a new manual ad-spend input UI — nothing tracks actual spend anywhere today) and a compliance-risk-exposure companion view remain deferred, each its own future small feature. Not part of this execution batch — flagging only so no agent folds them into E1a's PR.

---

## Phase B — Surface What Already Exists Publicly

**Round 3 confirmed three gaps as total, not partial:** zero `tel:` links anywhere in visitor-facing code (only two admin-only pages use `tel:`); the homepage proof strip is section **#10** of the `LandingRoute` (nine full sections separate the hero from the first trust signal — Hero → Path chooser → Cinematic video stage → Solutions snapshot → Debt eradication band → Authorized User section → Financing preapproval → Mastery OS → Free-guide teaser → *then* proof strip); `BusinessFundingPage.tsx` has zero reference to `/business/profile` or non-citizen content.

### B1 — `/results` page + nav entry
- **Files:** New `src/pages/ResultsPage.tsx` (confirm exact naming convention against sibling `TestimonialsPage.tsx` before finalizing filename) reusing `caseStudiesRepo.ts` (already consumed by `TestimonialsPage.tsx`/homepage strip — no new case-study data). Modify `src/config/siteWayfinderLanes.ts` (`PUBLIC_RESOURCES_SECTIONS`, near the existing `testimonials` entry at line 279) and `src/App.tsx` (one new route).
- **Ownership:** Run as one agent's sequential pass together with B2 (both touch `App.tsx`, do B2 first). **Dependencies:** None. **Acceptance:** `/results` is reachable from primary nav, renders real case-study data, and is a deliberate curated-subset-or-duplicate-entry-point choice, not an accidental content fork. **Effort: S.**

### B2 — Move proof/trust strip beneath the hero (promoted — highest-ROI item in this phase)
- **File:** `src/App.tsx`, `LandingRoute` function (~lines 419-530).
- **Approach:** Move the "Social proof + compliance" section (`FinelyOsComplianceStrip` + `TestimonialDossier` grid, currently ~line 513 onward, section #10) to immediately after `<HeroSection .../>` (line 447) and before `LandingPathChooserSection`. **Pure JSX reorder** — do not rewrite section internals. A condensed variant (e.g. 3 cards instead of the full set) is the minimum bar; the full strip may also stay in its later position for reinforcement.
- **Cross-document file conflict — resolve explicitly:** **D3 (Phase D) also edits this exact hero region of `App.tsx`** (D3 changes the Hero's `onGetStarted` handler at line 447 from a hardcoded `navigate('/pricing/business-credit')` to a variant-driven destination). **One agent must do B1 → B2 → D3 sequentially, in that order, not three separate agents.** See the Execution Wave Plan for the merged lane.
- **Ownership:** See above — merged lane with B1 and D3. **Dependencies:** None. **Acceptance:** loading `/` and scrolling ~1 viewport height shows a trust/proof signal without passing through 8+ other sections first; no layout regression to reordered sections. **Effort: S.**

### B3 — Link non-citizen doctrine (portal-side linking only — public equivalent is C1's job)
- **Confirmed:** `BusinessProfilePage.tsx:41-46, 205-334` already has a real, working gated portal panel (a `<details>` disclosure titled "Non-citizen & international credit") importing `getFundingRulesForApplicantType`/`getInternationalCreditSystem` from `internationalAndNonCitizenCreditRepo.ts`, rendering applicant-type chips and country chips with matched funding rules. `BusinessFundingPage.tsx` has zero reference to it.
- **File to modify:** `src/pages/business/BusinessFundingPage.tsx` — add one link/CTA card to `/business/profile` (or a deep-link anchor if supported) near existing applicant-eligibility content. Keep it to one card, not a new page section.
- **Resolved overlap (do not re-litigate):** this ticket is portal-side linking only. **The non-citizen public article under C1 (`NonCitizenBusinessCreditPage.tsx` at `/resources/non-citizen-business-credit`) IS this item's public equivalent** — one sentence, resolved. No public-page code belongs in this ticket.
- **Ownership:** Isolated file, no conflict with C1's agent (different file). **Dependencies:** None (informational link only to the future C1 article). **Acceptance:** a partner on `/business/funding` reaches the non-citizen panel within one click; no new public route created here. **Effort: S.**

### B4 — Partner-facing "who's working on your case" timeline (stronger version, not just marketing copy)
- **Files to create:** `src/components/portal/CaseTeamActivityTimeline.tsx`, sourced from `src/data/growthHandoffLedgerRepo.ts` (confirm its exported query function name before wiring, e.g. `listHandoffsForPartner`/`listHandoffsForRecord`; add a narrow partner-scoped read function there if none exists yet, rather than querying the raw store from the component).
- **Files to modify:** `src/pages/portal/PartnerDashboardPage.tsx` — insert near the existing activity-surface pattern (check `PartnerActivityTimeline`/`PartnerCreditRestoreCommandStrip` for placement convention; this must feel like a natural extension, not a second competing timeline, per the no-duplicate-UI-layers rule).
- **Marketing-copy half (lighter, separable):** a copy-only pass naming the psychology-science grounding and cross-agent coordination model as trust signals — no code, can be split off as its own small task.
- **Cross-document file conflict — resolve explicitly:** **Phase L's L1 and L2 also edit `PartnerDashboardPage.tsx`.** Sequence: **B4 → L1 → L2**, one file, one hand-off chain (can be different agents working sequentially, but never concurrently on this file). See Execution Wave Plan.
- **Ownership:** See above. **Dependencies:** None. **Acceptance:** a partner with ≥1 real handoff event sees a chronological, human-readable timeline entry sourced from real data (e.g. "Caleb qualified this lead → handed off to Alex for booking → Alex sent a booking invite"); zero-event partners see an honest empty state, not a broken panel. **Effort: S/M** (copy half separately S).

### B5 — FAQ coverage for Debt & Legal, Non-Citizen/International, Wealth Builder
- **Files:** Whatever data file backs the existing FAQ component/page — locate the exact file via the live FAQ page's import before starting; do not create a second FAQ data source.
- **Ownership:** Isolated. **Dependencies:** None. **Acceptance:** new entries render live under the three categories, sourced from the doctrine repos (not freehand legal claims). **Effort: S.**

### B6 — Canonical "next step" CTA contract (dev-process task, not user-facing)
- **File:** New `docs/CTA_CONTRACT.md` documenting the one approved "what happens on primary-CTA click" pattern. No application code change.
- **Ownership:** Isolated doc. **Dependencies:** None. **Acceptance:** doc exists, discoverable, not counted as a user-facing deliverable in status reporting. **Effort: S.**

### B7 — Click-to-call CTA on high-intent mobile pages
- **Confirmed:** zero `tel:` links exist in any visitor-facing page today.
- **Files to modify:** The real component files behind the `/free-debt-guide` and `/free-business-guide` routes in `App.tsx` (locate via `App.tsx`'s import statements — they are referenced, not defined, there). Add a `tel:` CTA alongside the existing form, secondary-styled (`FINELY_OS_SECONDARY_BTN` or the site's public secondary-CTA token), primarily mobile-visible. Source the phone number from existing tenant/site config (check `getActiveTenant()`'s settings, already used in `App.tsx`) — do not hardcode if a config field exists.
- **Ownership:** Isolated to these two funnel-page files. **Dependencies:** None. **Acceptance:** both funnels show a tappable phone CTA in addition to the form on mobile, using a real config-sourced number. **Effort: S.**

---

## Phase F — Stronger Contact & Revenue Protection Infra

**The single largest and highest-impact phase in the plan.** Requires sequential internal waves, not parallel agents, because F1/F2/F3 all extend the same `supabase/functions/platform-cron/index.ts` file's `CRON_STEPS` array and tick-payload shape.

**Confirmed reusable pattern (from the existing `nurture_enrollments`/`automation_rules` infrastructure, migration `20260619000000_nurture_automation_persistence.sql`, processor `_shared/processDueNurtureEnrollments.ts`):** new table → RLS via `is_admin()`-only policy (+ a narrower partner-select policy where partner-visible) → a `_shared/processXxx.ts` pure-function processor taking `{ admin, dryRun, tenantId }` → one new line in `platform-cron/index.ts`'s tick handler → one new `CRON_STEPS` entry. **F1 and F2 must both follow this exact shape.**

**Confirmed, previously-unflagged gap (must be fixed as part of F2, not left as a caveat):** the existing server-side nurture cron (`processDueNurtureEnrollments.ts`) calls **no** suppression, quiet-hours, or frequency-cap check at all today — not even the one server check that exists (`checkSuppressionServerSide`, which `executeAutomationAction.ts`'s send actions *do* call). And `supabase/functions/_shared/commsSuppressionCheck.ts` has **no** `isWithinQuietHours`/`isOverFrequencyCap` server-side equivalent at all — confirmed by direct inspection. Every server-side send path today can send outside quiet hours with no cross-agent frequency cap.

**Reconciliation decision (make before F2 starts, not after):** keep `nurture_enrollments` (existing) and the new `crm_sequences`/`crm_sequence_enrollments` (F2) as **two separate systems** — they have genuinely disjoint trigger models (nurture = lead-magnet/guide-download driven, keyed by `leadId`; CRM sequences = CRM-record/stage driven, keyed by `recordId`, with richer step types including `stage_move`). Do **not** fold F2 into `nurture_enrollments` with a discriminator column. **Do** fix `processDueNurtureEnrollments.ts` to call the same new suppression/quiet-hours/frequency-cap checks F2 adds, as part of F2's PR, since F2 is already building that shared infra.

### F1 — Meeting reminders + no-show detection → `platform-cron` (confirmed L, not M)
- **Confirmed:** `src/data/calendarRepo.ts` is 100% localStorage (`loadJson('finely.calendar.v1', ...)`) — zero server table exists. `src/lib/meetingReminderAutomation.ts` and `src/features/growthAgents/subagents/alexNoShowRecovery.ts` are both client-only.
- **New migration:** `supabase/migrations/<next-timestamp>_calendar_events_server.sql` — table `calendar_events`: `id text primary key`, `tenant_id text not null default 'finely_cred'`, `partner_id text not null`, `type text not null`, `status text not null` (must include `'no_show'`, already a valid client-side `CalendarEventStatus`), `title text not null`, `description text`, `start_at timestamptz not null`, `end_at timestamptz not null`, `meeting_url text`, `location text`, `timezone text`, `reminder_sent_at timestamptz`, `sms_reminder_sent_at timestamptz`, `no_show_recovery_sent_at timestamptz`, `source_request_id text`, `created_at`/`updated_at timestamptz not null default now()`. RLS: `is_admin()`-only for admin/service-role writes, plus a `for select` policy allowing a partner to see their own rows via `is_partner_owner`.
- **New sync module:** `src/data/calendarServerSync.ts` — dual-write following `crmServerSync.ts`'s exact pattern: `syncCalendarEventToSupabase(event)` called from every `calendarRepo.ts` write path, best-effort/never-throws, plus `runCalendarServerBackfillOnce()`.
- **New processors:** `supabase/functions/_shared/processDueMeetingReminders.ts` (reads `calendar_events` where `status='confirmed'` and due, sends via `sendServiceEmail`/`sendServiceSms` after `checkSuppressionServerSide` — a net-new safety improvement, since the client path has no suppression check either today) and `processDueNoShowRecovery.ts` (ports `detectLikelyNoShows`'s 20-minute grace-window logic, sets `status='no_show'`, sends reschedule invite server-side).
- **File to modify:** `platform-cron/index.ts` — add `meeting_reminders` to `CRON_STEPS`, wire the processor(s) into the tick handler.
- **Doc update:** `docs/PLATFORM_CRON.md`.
- **Ownership:** First in the F1→F2→F3 sequential lane on `platform-cron/index.ts`. **Dependencies:** A5's decision on whether meeting-reminder SMS shares the frequency cap must land first (see A5). **Acceptance:** with zero admin browser tabs open, a confirmed event within the reminder window (seeded directly + manual `dryRun:false` tick) triggers a real reminder and sets the timestamp columns; a past-grace-window event auto-flags `no_show` and sends a reschedule invite purely from a server tick; existing client-side reminders don't double-send (shared timestamp-column guard). **Effort: L** (confirmed — matches F2's shape on a smaller table; do not under-budget as M).

### F2 — Port CRM sequence engine to `platform-cron`/`automation-runner` (confirmed L, biggest single item in the plan)
- **Confirmed:** `crmServerSync.ts` only syncs `crm_prospects`/`crm_records`, never sequences/enrollments. `src/data/crmSequencesRepo.ts` is 100% localStorage. Zero `crm_sequences`/`crm_sequence_enrollments` tables exist. Source logic to port: `src/features/crm/sequences/runCrmSequenceEngine.ts`'s `dueCrmSequenceSteps`/`executeCrmSequenceStep`/`sendCrmSequenceEmail` — **port the post-A4/A5 version.**
- **New migration:** `supabase/migrations/<next-timestamp>_crm_sequences_server.sql`:
  - `crm_sequences`: `id text primary key`, `tenant_id text not null default 'finely_cred'`, `name text not null`, `target text not null`, `enabled boolean not null default true`, `steps jsonb not null default '[]'`, `created_at`/`updated_at timestamptz not null default now()`.
  - `crm_sequence_enrollments`: `id text primary key`, `tenant_id`, `sequence_id text not null references public.crm_sequences(id) on delete cascade`, `record_id text not null` (not a hard FK to `crm_records` — that sync is best-effort and a hard FK could cause silent enrollment-sync failures), `enrolled_at`, `updated_at`, `last_completed_step_index integer not null default -1`, `completed_at timestamptz`, `paused_at timestamptz`. Index `(tenant_id, completed_at, paused_at)` for the due-step scan.
  - `comms_frequency_log`: `id bigserial primary key`, `tenant_id`, `recipient_key text not null`, `sent_at timestamptz not null default now()`. Index `(tenant_id, recipient_key, sent_at)`.
  - RLS: `is_admin()`-only on all three (internal ops data, no partner-select policy needed).
- **New sync module:** `src/data/crmSequencesServerSync.ts`, following `crmServerSync.ts`'s pattern.
- **New processor:** `supabase/functions/_shared/processDueCrmSequenceSteps.ts` — ports the `email`/`task`/`stage_move` branching into Deno, using `crm_records` for contact info and `work_tasks` (already server-tabled, `20260622000000_work_tasks.sql`) for the `task` step. **Must call, in order:** `checkSuppressionServerSide`, new `isWithinQuietHoursServerSide()` (add to `commsSuppressionCheck.ts`), new `isOverFrequencyCapServerSide()`/`recordSendForFrequencyCapServerSide()` (new, backed by `comms_frequency_log`).
- **Reconciliation fix (bundle into this same PR):** update `processDueNurtureEnrollments.ts` to call the same three new server-side checks before its send.
- **File to modify:** `platform-cron/index.ts` — add `crm_sequences` to `CRON_STEPS`.
- **Ownership:** Second in the F1→F2→F3 lane. **Dependencies:** A4, A5 must land first (same source file being ported). F1 should land first purely for file-ownership on `platform-cron/index.ts` (no functional dependency on F1). **Acceptance:** with zero admin tabs open, a due `email` step sends server-side respecting suppression/quiet-hours/frequency-cap (test each guard individually), advances `last_completed_step_index`; a due `task` step creates a real `work_tasks` row; a due `stage_move` step updates `crm_records.stage`; `processDueNurtureEnrollments.ts`'s send now also respects all three checks. **Effort: L** (do not compress into the same wave as F1 — budget as the biggest single item in the entire plan).

### F3 — Port `billing_dunning` and `win_back` to server cron
- **Files:** Both currently client-only per `docs/PLATFORM_CRON.md`'s "Client-only cron steps" table. Locate the exact win-back source module before starting (search `win_back`/`winBack` across `src/lib/` — not independently re-verified beyond its docs-listed client-only status).
- **Approach:** Because `agreements` already has server truth, `billing_dunning` likely needs **less** new infra than F1/F2 — may reduce to "new `_shared/processBillingDunning.ts` + `platform-cron/index.ts` wiring," no new table, if its trigger logic only needs `agreements.status`/`amountCents`/timestamps. Win-back likely needs a small new table for "last win-back email sent" state if none exists server-side — confirm during implementation.
- **File to modify:** `platform-cron/index.ts` (third and final edit in the F1→F2→F3 chain).
- **Ownership:** Third in the lane. **Dependencies:** F1, F2 (file-ownership sequencing only, no functional dependency). **Acceptance:** a `past_due` agreement triggers a server-tick dunning email; a lapsed partner meeting win-back criteria receives a win-back email server-side; both respect suppression. **Effort: M** (confirm during implementation — if win-back needs a from-scratch table, this pushes toward L).

### F4 — CRM read path from Supabase
- **Confirmed:** `crmServerSync.ts` only exports `sync*`/`backfill*` — no `pull*FromSupabase`, unlike `billingSupabaseSync.ts`'s `pullBillingSnapshotFromSupabase` (use as template).
- **File to modify:** `src/data/crmServerSync.ts` — add `pullCrmSnapshotFromSupabase(): Promise<{ prospects; records }>` following `pullBillingSnapshotFromSupabase`'s structure exactly; merge into local store via a new `replaceCrmSnapshot`-style function in `crmProspectsRepo.ts`/`crmRecordsRepo.ts`.
- **Ownership:** Isolated — different file from F1/F2/F3, can run in parallel with that lane. **Dependencies:** None. **Acceptance:** a record created/synced in one browser session is restored in a different session (or after clearing local storage) via a manual/triggered pull — real-time sync not required. **Effort: M.**

### F5 — Retry queue for failed sequence/nurture sends
- **New migration:** `supabase/migrations/<next-timestamp>_send_retry_queue.sql` (`id`, `tenant_id`, `kind` [`nurture`/`crm_sequence`/`meeting_reminder`], `payload jsonb`, `attempts int default 0`, `last_error text`, `next_retry_at timestamptz`, `created_at`). New `_shared/processSendRetryQueue.ts` step wired into `platform-cron`. F1/F2/F3's processors and `processDueNurtureEnrollments.ts` enqueue here instead of log-and-drop.
- **Ownership:** Isolated new table/processor, but logically must follow F1-F3 (needs their processors to enqueue into it). **Dependencies:** F1, F2, F3. **Acceptance:** a simulated send failure (e.g. temporarily invalid `SENDGRID_API_KEY`) enqueues a retry row instead of silent loss; a subsequent tick with valid credentials retries and clears it. **Effort: M.**

### F6 — Bounce/complaint webhook → `addSuppression`
- **Files:** New `supabase/functions/sendgrid-webhook/index.ts` (or extend an existing generic webhook receiver — check `email-webhook/index.ts` first) that verifies SendGrid's signature and calls `recordSuppressionServerSide()` (`commsSuppressionCheck.ts`) with `reason: 'bounce'`/`'complaint'`.
- **Ownership:** Isolated, independent of F1-F5. **Dependencies:** None. **Acceptance:** a simulated bounce/complaint payload creates a `comms_suppression` row; a subsequent send to that address is blocked by both client (`checkSuppression`) and server (`checkSuppressionServerSide`) checks. **Effort: S/M.**

---

## Phase C0 — Compliance/Legal Review Gate

**Must precede C1, C4, C5** (and, later, G4b once it's picked up). **Verified reusable pattern:** `src/features/social/SocialDisclosureReviewPanel.tsx` + `src/lib/socialDisclosureLayer.ts` — pure evaluation function → `complianceStatus` field on the content record → a filter for unreviewed/flagged items → an admin Approve/Block panel. C0 clones this for legal/doctrine content.

### C0.1 — Legal/compliance review pass before publishing doctrine-derived content
- **Files to create:**
  - `src/domain/complianceReview.ts` — `ContentComplianceStatus = 'draft' | 'needs_review' | 'approved' | 'blocked'`; `ComplianceReviewRecord { id; contentType: 'public_article' | 'state_landing_page' | 'outcome_wizard'; contentRef; status; reviewedBy?; reviewedAt?; reviewNotes?; sourceRepoRefs: string[]; lastVerifiedAt?; nextVerificationDueAt?; }`.
  - `src/data/complianceReviewRepo.ts` — CRUD following `localJsonStore`'s pattern (key `finely.complianceReview.v1`). Exports `listComplianceReviews()`, `upsertComplianceReview()`, `getComplianceReviewForContent(contentRef)`, `listContentNeedingReview()`.
  - `src/lib/complianceReviewLayer.ts` — `evaluateContentComplianceReadiness(record, opts)` mirroring `evaluateDisclosureReview()`'s shape, returning `{ readyToPublish, reasons }`. Checks: has the compliance footnote (reuse `FINELY_OS_COMPLIANCE_FOOTNOTE`, already used on `PricingPage.tsx:234-236`), has a human `status: 'approved'`, `nextVerificationDueAt` still in the future.
  - `src/components/compliance/ContentComplianceReviewPanel.tsx` — structural clone of `SocialDisclosureReviewPanel.tsx`.
  - New admin surface: embed inside an existing admin page or add a lightweight `/admin/compliance-review` route.
- **No Supabase migration needed** — this is a pre-merge process gate (checked before a PR adding a new `/resources/*` route is merged), not a runtime/build-time gate; there's no server-side "unpublish" mechanism for a CSR route once bundled, so a localStorage-backed checklist gate is sufficient for v1.
- **Ownership:** Isolated new files. **Dependencies:** None — build in parallel with, or immediately before, C1's first article. **Acceptance:** every new C1/C4/C5 route has a `ComplianceReviewRecord` with `status: 'approved'` before merge; the panel correctly lists any record `!== 'approved'` or past-due. **Effort: S.**

### C0.2 — Recurring re-verification cadence
- **Files:** `complianceReviewRepo.ts` — on approval, stamp `nextVerificationDueAt` (default `approvedAt + 6 months`, shorter 3-month default for `state_landing_page` per C0.3). Surface overdue items at the top of the C0.1 panel (no new component). No automated reminder/cron wiring in this pass — a visible badge is sufficient v1; a future notification is a natural Phase F/K follow-on. **Effort: S** (extends C0.1's repo).

### C0.3 — Flag C4 (state-specific pages) as highest scrutiny
- **Files:** `complianceReviewRepo.ts`'s cadence logic (3 months for `state_landing_page`) + `ContentComplianceReviewPanel.tsx` (sort/badge state-landing-page records first, distinct visual flag — reuse the `finelyOsStatusChip('blocked')`-style token already used in `BusinessProfilePage.tsx:248-252`). **Effort: S** (bundle into the same PR as C0.1/C0.2).

---

## Phase C — Public SEO Content From Existing Doctrine

**Naming decision (confirmed against live routes):** all new routes use the **`/resources/...`** prefix (matches `/resources/personal-credit-restore-sheet`, `/resources/business-credit-one-sheets`, etc.) — not `/learn/...`. **Page-shell pattern:** every new article imports `PageShell`, `FinelyOsPageFooter`, `MarketingStaffChatStrip`, calls `usePublicSeoMeta({ title, description, path })` — copy `PersonalCreditRestoreSheetPage.tsx`'s shell exactly.

### C1 — Publish 8–12 public SEO articles from doctrine repos
- **Files to create** (all under `src/pages/resources/`): `DebtDefenseValidationLettersPage.tsx` (`/resources/debt-defense-validation-letters`, from `debtLitigationDoctrineRepo.ts`'s `pre_suit_validation` entries), `DebtDefenseSummonsAnswerPage.tsx` (`/resources/debt-defense-summons-answer`, `summons_answer` entries), `DebtDefensePostJudgmentPage.tsx` (`/resources/debt-defense-post-judgment`, `post_judgment_emergency` entries), `BusinessCreditTierMatrixPage.tsx` (`/resources/business-credit-tier-matrix`, from `businessCreditDoctrineRepo.ts`'s tiers 1-5), `BusinessCreditVendorFundingLandscapePage.tsx` (`/resources/business-credit-funding-instruments`), **`NonCitizenBusinessCreditPage.tsx`** (`/resources/non-citizen-business-credit` — **this resolves B3's public-surface requirement, one article not a separate page**, content pulled from `internationalAndNonCitizenCreditRepo.ts`'s `NON_CITIZEN_FUNDING_RULES`/`INTERNATIONAL_CREDIT_SYSTEMS` as static SEO-readable prose/tables, distinct from the interactive gated portal chip-picker which stays unchanged), plus 2-5 more articles at the team's discretion (garnishment-exemption explainer, FDCPA counter-suit overview, ECOA business-credit-discrimination explainer) to reach 8-12.
- **Files to modify:** `src/data/publicSeoCatalog.ts` (one entry per article), `src/App.tsx` (one lazy import + one route per article, adjacent to the existing `/resources/*` block at lines 1497-1503).
- **No Supabase migration needed.** `scripts/generate-public-sitemap.mjs` already regex-parses `publicSeoCatalog.ts` and is wired into `npm run build` — no manual sitemap step.
- **Approach:**
  1. Create a `draft`-status `ComplianceReviewRecord` per planned article first (C0 dependency).
  2. Write each page sourcing prose directly from the relevant doctrine repo's structured fields — no paraphrasing away from the repo's own citations, no new statutory claims.
  3. Add the `FINELY_OS_COMPLIANCE_FOOTNOTE` block to every article (required for `readyToPublish`).
  4. Add SEO catalog entry + route.
  5. Get the compliance record flipped to `approved` before merging the route.
  6. Confirm `npm run build` regenerates the sitemap with the new paths.
- **Known, accepted limitation:** CSR-only SPA means non-JS social-preview crawlers may show generic homepage OG data on first share — pre-existing, site-wide, shared by 15+ existing `/resources/*` pages, not new to C1.
- **Ownership:** New files only, plus additive edits to `publicSeoCatalog.ts` and the `/resources/*` route block (a different `App.tsx` region than B1/B2/D3's hero region — low collision, but be mindful of other agents editing `App.tsx` concurrently). **Dependencies:** C0 (each article's record must be `approved` before merge). **Acceptance:** 8-12 routes live under `/resources/*`, each with an approved compliance record, each in the sitemap after build, each reusing (not duplicating) its doctrine repo. **Effort: M.**

### C2 — Public before/after proof gallery
- **Files to create:** `src/pages/resources/BeforeAfterGalleryPage.tsx` — coordinate the exact route with whoever owns B1: nest at `/results/gallery` if B1's `/results` page ships first, else ship standalone at `/resources/before-after-results` and redirect later. Modify `publicSeoCatalog.ts`, `App.tsx`. Reuses `src/features/studioCommandOs/BeforeAfterScoreGraphicPanel.tsx`'s output (confirmed admin-only today with no public destination — check its persistence; if purely ephemeral/download-only, add a lightweight persistence step first).
- **Ownership:** New file; coordinate route naming with B1's agent (informational, no shared file edit). **Dependencies:** C0; sequence after B2/D3/C1 per business-impact ranking (lower marginal lift — score-delta proof already exists in text form in every case study). **Acceptance:** at least the existing case-study score deltas (528→671, 542→698, 561→705) are represented visually with the standard disclaimer. **Effort: S/M.**

### C3 — "vs. DIY / vs. traditional credit repair" comparison page
- **Files:** New `src/pages/resources/CreditRepairComparisonPage.tsx` → `/resources/diy-vs-traditional-vs-finely`; modify `publicSeoCatalog.ts`, `App.tsx`. Factual, feature-based comparison only — no unverifiable competitor claims.
- **Ownership:** Isolated. **Dependencies:** C0. **Acceptance:** page ships with no unverifiable competitor claims; compliance record approved. **Effort: S/M.**

### C4 — State-specific debt-defense landing pages (stretch, highest compliance scrutiny in the plan)
- **Files to create:** 3-5 pages under `src/pages/resources/state/` (pick top-volume states from real lead-source data if available, else the 3 largest states by population) at routes like `/resources/debt-defense/texas`. Modify `publicSeoCatalog.ts`, `App.tsx` (per-state files recommended over a templated dynamic route, since content review happens per-state anyway).
- **Approach:** Create the `ComplianceReviewRecord` (`contentType: 'state_landing_page'`) per state before writing content (triggers the 3-month cadence automatically). Source state-specific claims only from what `debtLitigationDoctrineRepo.ts` already contains with an explicit state citation; where the repo says "varies by state, verify locally," the page must carry the same hedge, never assert a specific answer to fill a gap. Do not publish an unapproved state page.
- **Ownership:** Isolated new files. **Dependencies:** C0 (hard); sequence after C1 (reuses its sourcing discipline). **Acceptance:** every state page has a distinct approved compliance record with the shorter cadence; no state-specific claim appears without a corresponding doctrine-repo citation. **Effort: L.**

### C5 — Interactive public outcome/program-fit wizard
- **Verified:** `getDebtPackageGuidanceForBalance(amountCents)` (`pricingCatalog.ts:2119-2130`) already maps balance → package. `CaseStudy` (`caseStudiesRepo.ts:16-32`) has `startingScore?`/`endingScore?` per entry with an existing `STANDARD_DISCLAIMER` constant.
- **Files to create:** `src/domain/outcomeWizard.ts` (types: `OutcomeWizardStep`, `OutcomeWizardInput { category; debtBalanceCents?; startingScoreBand?; }`, `OutcomeWizardResult { recommendedPackage?; outcomeRangeLabel; sampleSize; disclaimer; }`), `src/lib/outcomeWizardEngine.ts` (`computeOutcomeWizardResult()` — calls the existing `getDebtPackageGuidanceForBalance()` directly for balance inputs; for score-band ranges, filters `CASE_STUDIES` by category + starting-score band, computes a real min/max/median `endingScore - startingScore` delta, **always exposing `sampleSize`** so a small `n` is visible, not presented as a large-sample statistic), `src/pages/resources/OutcomeWizardPage.tsx` → `/resources/which-program-fits` (multi-step UI; reuse `LeadMagnetFunnelShell.tsx`'s existing step-based pattern rather than inventing a new stepper). Modify `publicSeoCatalog.ts`, `App.tsx`.
- **No Supabase migration** — pure client-side computation over existing static TS data.
- **Approach:** Compliance gate first (this is the single most sensitive new artifact in Phase C — it produces a personalized-feeling number). Build the engine with unit-testable pure functions before UI. Every result screen shows sample size, the standard disclaimer, and a link to full case-study detail (`/testimonials?tab=case_studies` or the future `/results` page).
- **Ownership:** New files, read-only against `getDebtPackageGuidanceForBalance()`/`CASE_STUDIES`. **Dependencies:** C0 (hard); not blocked by C1-C4, can build in parallel. **Acceptance:** every outcome range states its sample size; every screen carries the disclaimer; the debt-balance path calls the existing guidance function rather than duplicating it; compliance record approved before merge. **Effort: M.**

---

## Phase G — Agent Intelligence Upgrades

### G1 — Narrower "escalate to real reasoning" threshold
- **File:** `src/lib/finelyBrain/finelyPublicAnswer.ts` — `classifyFinelyPublicTopic()` (line 88) and `shouldUseFinelyPublicAnswer()` (lines 83-86), which currently short-circuits to a canned answer whenever `classifyFinelyPublicTopic()` returns non-null.
- **Approach:** Enumerate every currently-matched topic; narrow the matched set to only genuinely repetitive, low-variance FAQ-style questions (e.g. "what is FCRA," "how much does it cost"); remove topics where the visitor's specific situation/numbers would make a real LLM response meaningfully better. No new files.
- **Ownership:** Isolated file. **Dependencies:** None — independent of everything in this plan. **Acceptance:** measurable increase in the share of public-chat messages reaching a real LLM call (instrument via existing chat analytics or a minimal new counter if none exists). **Effort: S/M** (the edit is small; choosing what to keep canned needs care — narrowing too aggressively raises LLM cost/latency for genuinely repetitive questions).

### G2 — Agent-action → CRM-outcome attribution (build now, does not need Phase F)
- **Verified:** `logAgentAction()` (`agentAuditLog.ts:32-46`) already writes `actorType: 'agent'`, `entityType`, `entityId` via `addAuditEvent()` on every agent action (confirmed from `runCrmSequenceEngine.ts`, `alexAppointmentAutomation.ts`, `calebReasoningSubagents.ts:64-70`). `auditRepo.ts` is confirmed 100% localStorage — no Supabase sync. `CrmRecord.stage` is already tracked per record via `crmRecordsRepo.ts`'s `setCrmRecordStage()`.
- **Files to create:**
  - `src/domain/agentAttribution.ts` — **shared data model used by G2 and (if picked up later) E2's channel-level view**, per Round 2's explicit "one model, two views" recommendation: `AttributionTouch { agentId; action; entityId; entityType; occurredAt; auditEventId; }`, `AttributionOutcome { entityId; finalStage: CrmRecordStage; resolvedAt?; }`, `AgentAttributionSummary { agentId; touches; entitiesTouched; entitiesWon; conversionRate; dataCompletenessNote; }` — `dataCompletenessNote` is **mandatory**, not optional.
  - `src/lib/agentAttributionEngine.ts` — `computeAgentAttribution(): AgentAttributionSummary[]` — reads `listAuditEvents()` filtered to `actorType: 'agent'` + `entityType: 'crm_record'`, joins by `entityId` to `getCrmRecord(entityId).stage`, does last-touch attribution, aggregates per agent.
  - `src/features/crm/attribution/AgentAttributionPanel.tsx` — mountable from both an E-dashboard location and a growth-agents-roster location, so the shared engine truly has one call site pattern feeding two UI destinations.
- **No Supabase migration** — pure read/join over existing client-side data.
- **Ownership:** New files only. **Sequence: G2b and G4a both extend this file pair immediately after — same lane, same agent recommended.** **Dependencies:** None (does not need Phase F). Output quality improves once Phase F lands, but do not block on it. **Mandatory honesty label:** every rendered summary must visibly state "as complete as this browser's activity history — actions from other sessions aren't counted yet," not buried in a tooltip. **Acceptance:** panel renders real per-agent touch counts/win rates/conversion rates; completeness caveat visibly rendered; `agentAttribution.ts`'s types are reusable by a future channel-level view without redefinition. **Effort: M** (a real join/aggregation engine + UI panel, not a one-file edit).

### G2b — "Why didn't this convert" post-mortem loop
- **Verified:** `calebReasoningSubagents.ts:47` confirms `allowedActions: ['route_handoff', 'no_action']` is a real, already-used decision vocabulary.
- **Files to create:** `src/features/growthAgents/agentDecisionPostMortem.ts` — `runDecisionPostMortem(lookbackDays): PostMortemFinding[]`, querying `auditRepo.ts` for `no_action`/`skip` decisions, joining each flagged decision's `entityId` forward to its actual eventual `stage`. Produces `PostMortemFinding { agentId; entityId; decisionAt; decisionAction; actualOutcome; wasLikelyMisjudged; }`.
- **Prerequisite step (do first, not optional):** audit every subagent with a `no_action`/skip-equivalent branch (`calebReasoningSubagents.ts` confirmed; check `estherStrategySubagent.ts`, `benjaminPartnershipSubagent.ts`, and the rest per the registry) and add missing `logAgentAction()` calls on the negative branch where absent — G2b cannot analyze decisions that were never logged.
- **Surface:** extend `AgentAttributionPanel.tsx` (from G2) with a "missed opportunities" sub-section — do not build a second standalone panel.
- **Cross-document file conflict — flag explicitly:** **this item and H2 (Phase H) and K4 (Phase K) all touch `calebReasoningSubagents.ts` and `estherStrategySubagent.ts`.** Three different phases modify the same two files. Recommended order: **G2b (adds `logAgentAction` calls to negative branches) → H2 (adds `traceContext` to `callAiGateway` calls) → K4 (adds doctrine-repo context to reasoning)** — each is an additive, narrow-region edit, but must land as one PR chain, not three concurrent agents. See Execution Wave Plan.
- **Ownership:** See above. **Dependencies:** G2 (shares its data model + UI surface — build immediately after, same PR chain). **Acceptance:** any CRM record that reached `'won'` after a prior `no_action` decision from any agent is surfaced as a "possible missed opportunity" with the original reasoning shown alongside the eventual outcome. **Effort: S/M** (mostly reuses G2's join infra; the real work is the logging audit).

### G3 — A/B variant-testing primitive for a high-volume send path
- **Files:** Extend `src/domain/funnelExperiments.ts`'s pattern into the CRM/outreach domain — new `SendVariantExperiment` type (or extend `runCrmSequenceEngine.ts`'s email-step model with an optional `variants: { control; variant_a }` field), plus a variant-assignment + outcome-recording pair analogous to `assignFunnelVariant()`/`recordFunnelConversion()`.
- **Approach:** Target CRM sequences (`runCrmSequenceEngine.ts`), not Alex's outreach (more ad hoc) — CRM sequences already have a defined step/email model to extend. Add a `variantId` field to the enrollment/step-execution record, assign deterministically keyed by CRM record/prospect ID (not `sessionStorage`, since these are cross-session server-eventual sends). Record outcome (reply/booking/stage-advance) back to the variant.
- **Critical file-sequencing note:** this item **modifies `runCrmSequenceEngine.ts`'s client-side email-step model** — the same file F2 is simultaneously porting to a server-side Deno module. **G3 must land after F2 completes**, so F2 ports a stable, final version of the file rather than one mid-flux from concurrent G3 edits. Do not run G3 in the same wave as F2.
- **Ownership:** See above — sequence after F2. **Dependencies:** File-hard-dependency on F2 (not just "more valuable after," a real edit-conflict risk if concurrent). **Acceptance:** at least one CRM sequence step runs two variants and reports per-variant conversion counts. **Effort: M.**

### G4 — Internal CRM-record conversion-probability signal (G4a only — G4b explicitly deferred)
- **Decision (resolves draft v2's open scope question):** G4 splits into two features that share a name in the original draft. **G4a** (internal-only signal, build now) is scoped here. **G4b** (the actual DisputePro-AI-style partner-facing pre-mail outcome simulator) is **not built as a separate feature** — it is deferred and re-scoped as "mount C5's already-compliance-reviewed outcome-range component inside the portal's Letter Studio / dispute-drafting flow, scoped to the partner's own dispute type." Pick up G4b only after C5 ships **and** a second compliance review confirms the disclaimer language holds up post-signup (higher stakes than a generic public visitor plugging in hypothetical numbers — the same C0 gate applies a second time, in the portal context).
- **Files to create (G4a):** Extend `src/lib/agentAttributionEngine.ts` (same file as G2) with `computeConversionLikelihood(record, attributionSummary): { likelihood: 'low'|'medium'|'high'; reasoning: string; }` — a transparent, rule-based heuristic (record `score`, touch count from G2's data, source channel's win rate, time-in-stage), never an opaque ML score (no ML training infra exists in this codebase, and building one is out of scope). Surface as a "likelihood" chip on `src/features/crm/components/CrmRecordDrawer.tsx` and/or `CrmPipelineBoard.tsx`.
- **Ownership:** Same file lane as G2/G2b. **Dependencies:** G2 (hard — needs its join output); sequence directly after G2, ideally same wave. **No compliance gate needed for G4a** (internal-only, staff-facing, same risk category as an existing CRM lead score). **Acceptance:** every CRM record shows a likelihood bucket with a human-readable, factor-named reason (not a black box). **Effort: S/M.**

---

## Phase D — Pricing & Funnel Simplification

**D1 + D2 + D5 file-ownership is a hard, confirmed constraint.** All three touch `getPackagesForTab()` (`PricingPage.tsx:158-196`) and either `personalCreditPackages` or `debtLegalPackages` in `pricingCatalog.ts`. **One agent, three sequential steps, in this order:**

| Step | Owns | Does |
|---|---|---|
| **1. D5 first** | `TABS`/`TAB_ACCENT` (`PricingPage.tsx:65-87`), the `banking_reports` case in `getPackagesForTab()` | Decide: keep `banking_reports` as its own tab (recommended — it's a distinct product from credit-bureau disputes) or fold it into `personal_credit`. **Recommendation: keep separate — downgrades D5 to a verification/copy-only pass, no functional change.** |
| **2. D1 second** | `pricingCatalog.ts`'s `personalCreditPackages` (6 `personal_restore*` entries, lines 306-456), `PricingPage.tsx`'s `personal_credit` case | Collapse Starter/Pro/Elite/Supreme/Apex/Dynasty → e.g. Starter/Pro/Elite + a "Custom (Supreme+)" quote-only tier. **Entitlement-key risk:** each tier's `entitlementKeys` is cumulative — do not delete retired package IDs; set `isPublic: false` so `getPackageById()`/checkout/webhook code still resolves them for existing partners. Add a new `priceAmount: 0, badge: 'Custom quote'` pseudo-tier routing to intake instead of checkout. |
| **3. D2 third** | `pricingCatalog.ts`'s `debtLegalPackages` (8 `debt_kill_*` entries, lines 806-1042), `PricingPage.tsx`'s `debt_legal` case | Collapse to 3-4 headline tiers (e.g. Starter/Pro/High-Balance + custom-quote), same retire-not-delete pattern, preserve `debtBalanceGuidance` on at least one surviving tier per band so the balance-guidance table (`PricingPage.tsx:439-467`, reads `debtLegalPackages.filter(p => p.debtBalanceGuidance)` directly) still spans the full $0-$100k+ range without gaps. |

**Do not split D1/D2/D5 across 3 parallel agents** — any two running concurrently on `getPackagesForTab()` will merge-conflict on the same ~40-line function, and D1/D5 share the same filter predicate as inverse conditions of each other.

### D3 — A/B test homepage hero CTA destination (confirmed S/M, not S)
- **Verified:** `App.tsx:447` hardcodes `navigate('/pricing/business-credit')` for the hero CTA — zero experimentation exists. `domain/funnelExperiments.ts` only has `headlines`/`ctaLabels`/`stats` fields, no destination field.
- **Files to modify:** `src/domain/funnelExperiments.ts` (add `ctaDestinations: Partial<Record<FunnelExperimentVariant, string>>`), `src/data/funnelExperimentsRepo.ts` (add `getAssignedCtaDestination(funnelId, fallback): string`), `src/App.tsx` (replace the hardcoded hero navigate call with `navigate(getAssignedCtaDestination('homepage_hero', '/pricing/business-credit'))`).
- **New cross-page bridge (genuinely new, not "reuse already-built infra"):** new `src/lib/funnelCtaBridge.ts` — on hero-CTA click, `sessionStorage.setItem('finely.heroCta.variant', variant)` alongside navigation; on the destination page's own conversion event (checkout start, intake submit — likely `PricingPage.tsx`'s `handleSelect()`, line 130), read the key back, call `recordFunnelConversion('homepage_hero', variant)`, clear the key.
- **Cross-document file conflict — resolved:** **run as one agent's B1 → B2 → D3 sequential chain**, all editing the same `App.tsx` hero region (see B2 above).
- **Ownership:** See B2. **Dependencies:** None functionally; file-sequenced after B1/B2. **Acceptance:** homepage visitors are deterministically bucketed into a hero-CTA-destination variant; conversions on the destination page correctly attribute back via the `sessionStorage` bridge; existing headline/CTA-label experiments elsewhere are unaffected (additive-only domain-type change). **Effort: S/M.**

### D4 — Populate 2-3 more funnel experiments
- **Files:** Whatever calls `ensureDefaultExperiments()` — add headline/CTA-label experiments targeting `/free-debt-guide`/`/free-business-guide`, confirming both are `LeadMagnetFunnelShell`-based first (so `assignFunnelVariant`/`recordFunnelConversion` already wire in with zero new plumbing).
- **Ownership:** Isolated config/content work. **Dependencies:** None. **Acceptance:** both funnels show variant-specific headlines/CTAs and record conversions using existing infra. **Effort: S** (genuinely just uses already-built infra, unlike D3).

### D5 — Resolve the Banking Reports tab indirection
- Folded into the D1/D2/D5 chain above as Step 1. **Effort: S** if "keep separate tab" is accepted (verification-only); S/M if folding into `personal_credit` (reopens D1's work — not recommended).

---

## Phase K — Fixes Found Only By Reading Actual Sprint Code

### K1 — Wire the media-technique library into the Content Studio copilot brain
- **Confirmed (re-verified independently):** `contentStudioMediaEngineRepo.ts`'s header states its intended consumer is `videoCreationCopilotBrain.ts`/`mediaCommandBrain.ts`; neither file references it or any of its six getter exports (`getAllVideoTechniques`, `getVideoTechniquesByCategory`, `getAllImageTechniques`, `getImageTechniquesByCategory`, `getAllVoiceTechniques`, `getVoiceTechniquesByCategory`, `getAllScriptFrameworks`, `getScriptFrameworksByCategory`). Only `MediaTechniqueLibraryPanel.tsx` (a manual chip picker) consumes it today.
- **Files to create:** `src/features/studioCommandOs/mediaGapCheck.ts` — pure `detectMissingTechniques(plan): { category; suggestion; techniqueId }[]`. Maps `intent`/`aspect`/`durationSec` to 2-3 relevant technique categories, calls the existing getters, returns 1-2 concrete suggestions (title + `whenToUse[0]` + `toolsThatDoThisWell[0]`) — capped, not a data dump.
- **Files to modify:** `src/features/studioCommandOs/videoCreationCopilotBrain.ts` — call `detectMissingTechniques()` in both `localCopilotReply()` and the AI-gateway branch of `runVideoCreationCopilotTurn()`, appending one tip line to the reply in both paths (no path should skip the check). `src/features/studioCommandOs/mediaCommandBrain.ts` — call it once in `buildFallbackVideoPlan()`, push results into the existing `renderChecklist` array.
- **Ownership:** Isolated to these 3 files in `src/features/studioCommandOs/`. **Dependencies:** None. **Acceptance:** `detectMissingTechniques()` is pure/unit-testable and returns `[]` for a plan that already covers checked categories; both copilot-brain paths surface identical-shaped tips; a representative 28s vertical `lead_magnet_ad` plan's `renderChecklist` includes at least one technique-derived line. **Effort: S/M.**

### K2 — *(lives under Phase A as A7 — do not schedule separately; see A7 above)*

### K3 — Per-partner communication-preference signal
- **Files to create:** `src/domain/partnerCommunicationSignal.ts` (`PartnerCommunicationSignal { partnerOrRecordId; preferredTone: 'direct_short'|'reassurance_first'|'unknown'; sampleSize; lastComputedAt; confidence: 'low'|'medium'|'high' }` + pure `deriveCommunicationSignal(events)`), `src/data/partnerCommunicationSignalRepo.ts` (localStorage-first, house `loadJson`/`saveJson` pattern).
- **Files to modify:** `src/features/growthAgents/agentCognitiveEngine.ts` — extend `buildPsychologyAwareSystemPromptFragment()` or add a sibling `buildRecipientAdaptedPromptFragment()` to optionally append a line when a `confidence !== 'low'` signal exists. Call sites in `alexAppointmentAutomation.ts` and `growthAgentBrain.ts` where outbound copy is constructed.
- **Ownership:** New files isolated. `agentCognitiveEngine.ts` is only read (not modified) by A2 — no actual file conflict there, just a shared-convention note (both add prompt-fragment logic; keep the style consistent). `alexAppointmentAutomation.ts` is also touched by A5 (earlier, Wave 1) — no conflict since K3 runs much later.
- **Dependencies:** **Hard dependency on G2** — needs real reply/engagement data to derive a signal from. Do not schedule before G2 has shipped and accumulated data. **Acceptance:** derivation is a pure, unit-testable function; a `confidence: 'low'` or below-threshold `sampleSize` (e.g. <3) never changes agent output; removing the repo entirely doesn't break any existing flow. **Effort: M.**

### K4 — Wire doctrine repos into growth-agent reasoning
- **Files to modify:** `src/features/growthAgents/subagents/calebReasoningSubagents.ts` — in the Qualifier's `runAgentBrainStep()` context, when a lead's notes match debt-related keywords (reuse `debtLitigationDoctrineRepo.ts`'s own `debtType`/`phase` field patterns), pull the matching doctrine entry's structured fields into context as a named field, not plain-English text. `src/features/growthAgents/subagents/estherStrategySubagent.ts` — pull `businessCreditDoctrineRepo.ts`'s tier-progression data for weekly-focus case-study angle selection.
- **Cross-document file conflict:** same two files as G2b and H2 (see G2b above) — **land in the order G2b → H2 → K4**, all additive/narrow-region edits, one PR chain.
- **Ownership:** See above. **Dependencies:** Sequence after **C1** ships (the public articles give the doctrine repos' structured fields a reviewed shape worth reusing — building K4 first risks wiring against a shape C0's review of C1 might still adjust). **Acceptance:** Caleb's Qualifier demonstrably changes its note/next-action for a synthetic debt-litigation-keyword lead vs. one without, naming the doctrine's `phase`/`debtType` fields in `reasoning`. **Effort: M.**

---

## Phase L — Partner (Post-Sale) Portal Gaps

### L1 — Partner-facing referral panel
- **Confirmed:** zero `referral` matches anywhere in `src/pages/portal/`. Backend is fully built and already partner-aware: `src/lib/referralGrowthEngine.ts` (`recordReferralLinkVisit`, `recordReferralLeadCapture`, `buildReferralGrowthSnapshot`), `src/lib/referralRewardsEngine.ts` (`processReferralReward` — credits an affiliate, fires reward-threshold events at $100/$250/$500 cumulative, sends the linked partner a notification with `href: '/affiliate'` — **verify this route exists, see below**), `src/data/affiliateRepo.ts` (`findAffiliateByPartnerId(partnerId)` — the exact partner→affiliate→`referralCode` lookup this panel needs, already built).
- **Files to create:** `src/components/partner/PartnerReferralPanel.tsx` — on mount, calls `findAffiliateByPartnerId(partnerId)`; if none, shows a compact "become an affiliate" CTA calling `createAffiliate({ partnerId, email, fullName })` (auto-provisions a `FC-XXXXXXXX` code); if found, shows the referral link, a copy button, and 3 compact KPI tiles (clicks/leads/conversion rate) — reuse `AdminReferralGrowthPanel.tsx`'s structure and `finelyOsGlassShell`/`FINELY_OS_ENTITY_*` tokens, scoped to this one code only.
- **Files to modify:** `src/lib/referralGrowthEngine.ts` — add `buildReferralGrowthSnapshotForCode(code: string)` (additive only; do not change `buildReferralGrowthSnapshot()`'s existing signature, the admin dashboard depends on it as-is). `src/pages/portal/PartnerDashboardPage.tsx` — mount the new panel near the existing `PartnerCreditRestoreCommandStrip`/`PartnerHubLauncherGrid` region (a new card, not a competing list, per the no-duplicate-UI-layers rule). Verify/fix the `href: '/affiliate'` notification link — repoint to `/portal` or a new `/portal/referrals` route if `/affiliate` doesn't resolve.
- **Cross-document file conflict — resolved:** **`PartnerDashboardPage.tsx` sequencing chain is B4 → L1 → L2** (see B4 above).
- **Ownership:** See above. **Dependencies:** None functionally; file-sequenced after B4. **Acceptance:** a partner with no affiliate record sees a working provisioning CTA; a partner with one sees their own `referralCode`-scoped clicks/conversions (not the global admin aggregate); copy button works; KPI tiles render `0` gracefully for a new code; the `/affiliate` link resolves or is repointed. **Effort: S/M.**

### L2 — Lifecycle-stage-aware upsell/cross-sell surface
- **Files to create:** `src/domain/partnerLadderProgression.ts` — pure `recommendNextRung(partner: { activeAgreements; creditScoreTrend? }): { fromTier; toTier; rationale } | null`, using `pricingCatalog.ts`'s ladder (Restore → Wealth Builder → Business Credit) and a stabilization heuristic (flat/positive score trend + an active/completed Restore-tier agreement). **Must share its "graduated partner" definition with E1a.3** — read E1a.3's `computeLadderProgression()` logic before finalizing this heuristic; do not invent a second, divergent definition. `src/components/partner/PartnerNextRungPanel.tsx` — compact card, one sentence + one CTA, renders only when a recommendation exists (no empty-state clutter, per the compact-luxury-UI and no-duplicate-UI-layers rules).
- **Files to modify:** `src/pages/portal/PartnerDashboardPage.tsx` — mount conditionally, **after L1's edit to this file lands** (third in the B4 → L1 → L2 chain).
- **Ownership:** See above. **Dependencies:** Soft dependency on E1a.3 (shared "graduated" definition, not a hard build blocker). **Acceptance:** recommendation logic is pure/unit-testable; never recommends a tier the partner is already active in; card renders nothing (no empty state) when no recommendation applies. **Effort: M.**

---

## Phase H — Knowledge Base & Trace Infrastructure

### H1 — Evaluate Supabase pgvector upgrade for `finelyKnowledgeIndex.ts`
- **Scope for this batch: evaluation-and-scaffold, not a full production migration.** `finelyKnowledgeIndex.ts` (687 lines, 20+ imported content-source modules) does synchronous, in-browser `scoreChunk()` keyword matching over TS-constant content. A real upgrade needs a pgvector table, an async RPC path, and — critically — **an ongoing re-embed-and-upsert tooling process for every future content addition**, not a one-time migration.
- **New migration (draft):** `supabase/migrations/<next-timestamp>_knowledge_chunks_pgvector.sql` — `knowledge_chunks` table (`id text primary key`, `source_tag text`, `tags text[]`, `route text`, `content text`, `embedding vector(1536)`, `updated_at timestamptz`); requires `create extension if not exists vector;`.
- **New file:** `scripts/export-knowledge-chunks.mjs` — Node ETL script importing the same content-source modules `finelyKnowledgeIndex.ts` imports, calling its existing chunk-builder functions, generating embeddings (via `ai-gateway` if it proxies embeddings, else confirm a direct provider during implementation), upserting into `knowledge_chunks`. **Document in its header that it must be re-run after every content-repo edit** until an automated CI/build-time hook replaces manual re-runs — this is the answer to the ongoing-tooling-cost caveat, not an afterthought.
- **New file:** `supabase/functions/knowledge-search/index.ts` — pgvector cosine-similarity query, returning `FinelyKnowledgeChunk[]` in the same shape existing callers expect.
- **File to modify:** `src/lib/finelyKnowledgeIndex.ts` — add a feature-flagged async path (`searchFinelyKnowledgeVector()`) alongside the existing sync path, gated by a new settings flag (same pattern as `isFeatureEnabled('aiGateway')`).
- **Ownership:** Isolated new migration/scripts/function; one additive change to `finelyKnowledgeIndex.ts`. **Sequence after A7/K2** — the ETL script must propagate the `internal_only` tag (and any future tags) into `knowledge_chunks.tags`, or A7's fix is silently undone by the new retrieval path; add an assertion in the ETL script refusing to upsert a chunk missing tags present in its TS-side source. **Dependencies:** Soft (A7/K2 tag propagation). **Acceptance:** migration is RLS-reviewed (no anon `select` on `knowledge_chunks` without the same public/internal filter `isPublicSafeKnowledgeChunk()` enforces client-side); ETL is idempotent (upsert on `id`); `internal_only`-tagged chunks are provably excluded from the new function's public-mode query; the new path is off by default and toggling it off fully restores today's behavior. **Effort: L.**

### H2 — Structured, replayable per-agent-call audit trace
- **Files to create:** `src/domain/agentCallTrace.ts` (`AgentCallTrace { id; agentId; taskType; promptTokensEst?; completionTokensEst?; latencyMs; costUsdEst?; input; output; linkedEntityType?; linkedEntityId?; outcomeAtCapture?; createdAt }`), `src/data/agentCallTraceRepo.ts` (localStorage-first + Supabase dual-write following `crmServerSync.ts`'s pattern — new `agent_call_traces` table + `supabase/migrations/<next-timestamp>_agent_call_traces.sql`, since this repo's whole purpose is cross-session replay, which localStorage-only defeats).
- **Files to modify:** `src/lib/aiClient.ts` — wrap `callAiGateway()`'s call sites with an **optional** `traceContext` argument that measures `latencyMs` and persists a trace when supplied. This must be a pure addition — omitting the argument must be byte-identical to today's behavior for every existing caller. Pilot rollout on the highest-volume call sites first: `src/features/growthAgents/subagents/calebReasoningSubagents.ts`, `estherStrategySubagent.ts`.
- **Cross-document file conflict:** same two pilot files as G2b/K4 — **land in order G2b → H2 → K4** (see G2b above).
- **Ownership:** New files isolated; `aiClient.ts` is a widely-shared file but this is additive-optional-argument only — no other item in this plan touches it. **Dependencies:** None hard; pairs well with G2/K3 as a future data source. **Acceptance:** adding `traceContext` to a call site is provably non-breaking (typecheck + smoke-test an unmodified call site); a captured trace round-trips through the Supabase dual-write and is readable via a `pull*FromSupabase`-style function; no new PII/data-sensitivity category beyond what `agentAuditLog.ts` already stores. **Effort: M.**

---

## Phase I — Admin Consolidation

### I1 — Growth/CMO command page cleanup
- **Re-verified:** `AdminSovereignGrowthCommandPage.tsx` and `AdminCmoAutopilotPage.tsx` are confirmed unrouted (zero matches against `App.tsx`'s full import/route table). The 4 live pages are distinctly labeled in `adminNavLanes.ts`: `/admin/growth-command` "Growth Command", `/admin/growth-agents` "Growth Agents", `/admin/growth-automation` "Growth Autopilot", `/admin/cmo` "CMO Command".
- **Approach:** (1) Decision checkpoint (not auto-decided): finish-and-route vs. delete each of the two orphans — open each file and assess completeness first. **Default recommendation if no strong preference: delete both** — the 4 live pages already cover the space distinctly; reviving 2 more nav entries risks recreating the "six confusing peer items" the original v1 draft incorrectly worried about. (2) If deleting, `Delete` both files, then grep the repo once more for stray references. (3) Only after the decision, skim the 4 live pages' top-level component trees for genuinely duplicate controls — since they're already distinctly labeled, the bar for merging is "do two show literally the same data," not "there are 4 of them." If none found, close as no-op.
- **Ownership:** Isolated to the two named files plus a read-only skim of 4 others. **Sequence with I3 and I5** — bundle all orphan deletions into one PR/agent pass rather than 3 separate agents doing near-identical deletions. **Dependencies:** None. **Acceptance:** `npm run typecheck`/`npm run build` succeed after deletion; repo-wide grep for both filenames returns zero remaining references. **Effort: S/M.**

### I2 — CRM surfaces nesting — CLOSED, no action item
- Re-confirmed: `/admin/crm`, `/admin/crm/legacy` (redirect), `/admin/crm/sequences`, `/admin/crm/routing`, `/admin/crm/referrals`, `/admin/crm/records/:id` all remain nested under `/admin/crm/*`. No file changes needed.

### I3 — Leads-surface consolidation decision
- **Re-verified:** `AdminLeadEngineSystemDevPage.tsx` confirmed unrouted (same check as I1). Live leads pages: `/admin/leads` → `AdminLeadsOsPage` (also has a `/admin/leads-os` redirect alias), `/admin/lead-intel` → `AdminLeadIntelPage`, `/admin/lead-acquisition` → `AdminLeadAcquisitionPage`.
- **Approach:** (1) Same delete-vs-finish decision as I1 for the orphan, default recommendation delete. (2) Consolidation check: `AdminLeadsOsPage.tsx` already directly imports `LeadIntelHub` inline (confirmed via its own import list, alongside `CrmPipelineBoard`/`LeadDistributionHub`) — **verify during implementation whether `AdminLeadIntelPage.tsx` is a thin wrapper around the same `LeadIntelHub` component**; if so, this is a genuine duplicate surface worth collapsing (e.g., redirect `/admin/lead-intel` into a tab/anchor on `/admin/leads`, per the no-duplicate-UI-layers rule). If the two render meaningfully different scope, leave both.
- **Ownership:** `AdminLeadEngineSystemDevPage.tsx` deletion isolated; if the consolidation is pursued, this touches `App.tsx`'s route table and `adminNavLanes.ts` — **the same shared region I1 may also touch if its own merge evaluation proceeds; run I1 and I3 sequentially (one agent) if both pursue route-table changes**, in parallel if only the orphan-deletion halves are done. **Dependencies:** None hard. **Acceptance:** same as I1. **Effort: S (orphan) + M (if consolidation pursued).**

### I4 — Confirm `AdminSitewideUxCommandPage`/`AdminStudioUxCommandPage` don't duplicate controls
- **Verified:** `AdminSitewideUxCommandPage.tsx` is a 3-line re-export of `SitewideUxCommandPage` (sitewide layout refactor tooling). `AdminStudioUxCommandPage.tsx` wraps `StudioUxCommandDashboard`, whose own subtitle explicitly claims *"site-wide layout refactors"* as part of its scope — the same domain the Sitewide page owns. **This overlap risk is real, not hypothetical** — closer scrutiny than draft v2's "quick check" framing implied.
- **Approach:** Open `StudioUxCommandDashboard.tsx` and check whether its "site-wide layout refactors" section renders its own controls or links out to the Sitewide page's route. If it reimplements, collapse to one source of truth (link out instead); if it already just links out, close as confirmed-no-duplication.
- **Ownership:** Isolated to at most one file (`StudioUxCommandDashboard.tsx`). **Dependencies:** None. **Acceptance:** one-paragraph written confirmation of which outcome applied, plus the fix if duplication was found. **Effort: S.**

### I5 — Mechanical audit: orphaned admin pages (executed live during this planning pass, not deferred)

**Method:** Globbed every `src/pages/admin/*.tsx` file, grepped `src/App.tsx`'s full lazy-import block for each basename.

**Result — 4 orphans found, one more than Round 2's original 3:**

| File | Status |
|---|---|
| `AdminSovereignGrowthCommandPage.tsx` | Confirmed orphan (re-verified) — see I1 |
| `AdminCmoAutopilotPage.tsx` | Confirmed orphan (re-verified) — see I1 |
| `AdminLeadEngineSystemDevPage.tsx` | Confirmed orphan (re-verified) — see I3 |
| **`AdminDashboardLayoutPreview.tsx`** | **NEW — confirmed orphan.** Grepped `DashboardLayoutPreview` against the entire `src/` tree, not just `App.tsx` — the only match is the file's own definition. Not imported anywhere, including no reference from its likely sibling `AdminDashboardIvoryPreviewPage.tsx` (which **is** routed). |

**Recommended action:** same delete-vs-finish pattern; default recommendation **delete**, given the name suggests an early/alternate preview of the concept `AdminDashboardIvoryPreviewPage.tsx` already covers live — pending a quick content skim first to confirm nothing unique/salvageable is inside.

- **Ownership:** Bundle into the same PR/agent as I1 and I3's orphan deletions — 4 nearly-identical deletions, one pass. **Dependencies:** None — audit is complete, only the delete-or-finish execution remains. **Acceptance:** `npm run typecheck`/`npm run build` succeed after all 4 deletions in one batch; a follow-up repo-wide grep (same method) finds zero additional orphans among the remaining ~88 admin page files. **Effort: S (execution only — audit already done).**

---

## Phase J — Longer-Horizon / Stretch

*Lighter-spec by design — these are stretch/evaluation items in the source draft, not committed builds. Each gets a concrete first step and file list so a future agent doesn't have to re-derive scope.*

### J1 — Evaluate Google Calendar / Outlook sync
- **First step:** Read `src/domain/calendar.ts`, `src/data/calendarSettingsRepo.ts`, `src/data/calendarSlots.ts` to confirm the current domain shape. Spike a **read-only** Google Calendar OAuth + free/busy pull feeding `src/lib/suggestBookingSlots.ts`'s existing slot logic — do not attempt two-way write sync in the first pass. New file: `src/lib/calendarProviderSync/googleCalendarAdapter.ts` (prototype).
- **Ownership:** Isolated new file. **Dependencies:** Soft-sequence after **F1** (needs the new server-side `calendar_events` table to reconcile against). **Effort: M (evaluation/read-only prototype), L (full two-way sync).**

### J2 — Short, compliant explainer/demo video for homepage + `/pricing`
- **First step:** This is a content-production task, not an engineering one — production is out of this codebase's scope. Once an asset exists, embed via `src/components/landing/index.tsx` and a compact player on `PricingPage.tsx`'s header.
- **Ownership:** These files are also touched by Phase B (homepage) and Phase D (pricing) work — **do not schedule the embed in the same wave as any Phase B/D item touching the same files; sequence after both are done.** **Dependencies:** Blocked on off-platform video production. **Effort: S** (code side only).

### J3 — Missed-call text-back / instant voicemail-to-SMS acknowledgment
- **Re-justified** under the Phase N speed-to-lead framing, not "voice-agent competitive parity."
- **First step:** Read `src/pages/admin/AdminPhoneHubPage.tsx` and its backing telephony integration (grep for Twilio/phone-webhook handlers under `supabase/functions/`). New file: `supabase/functions/_shared/missedCallTextBack.ts` — on a missed-call webhook, send an SMS ack within the same request (reusing the suppression/quiet-hours pattern from `_shared/commsSuppressionCheck.ts`).
- **Ownership:** New shared function; **coordinate directly with N1's final implementation before starting** — both are "fire an immediate ack off a real-time webhook, using the shared suppression check," and should share a utility, not duplicate one. **Dependencies:** Should reuse N1's design (build after N1 ships). **Effort: M.**

### J4 — Relevance/quality feedback signal on RAG retrieval
- **First step:** Add a lightweight thumbs-up/down capture on chat/RAG-answer surfaces (`finelyPublicAnswer.ts`'s and `coOwnerSiteKnowledgeMap.ts`'s callers), logging `{ chunkIds, query, helpful }` to a new `src/data/knowledgeFeedbackRepo.ts` (localStorage-first, house pattern). Use the signal to weight `scoreChunk()`'s heuristic, or — once H1 ships — feed it into the ETL script's per-chunk metadata.
- **Ownership:** New repo file isolated; touches `finelyKnowledgeIndex.ts`'s `scoreChunk()` — **coordinate with H1's agent if both are in flight** (H1's change is an additive parallel path, low actual collision risk, just a heads-up). **Dependencies:** Soft — more valuable after H1, can ship independently against the current keyword-based scoring. **Effort: S/M.**

### J5 — Cross-agent *model* learning (restored from Round 2, design-only in this pass)
- **Problem:** Today, one agent's findings only reach another as human-readable shared context a person has to act on — no agent's own decision weights change automatically from another agent's outcome data.
- **First step (design-only, no code in this pass):** Define what a "weight" means for this architecture — `runAgentBrainStep()` calls take prompt-context, not a tunable numeric model. A real version likely means a small, explicit scoring table (e.g. `channel_performance_weights` keyed by channel + agent) Hannah's watcher writes to and Caleb's search-scan step reads as a multiplier. **Recommend scoping this properly in a future planning pass**, once H2's structured trace data and G2's attribution data have both been live long enough to know what's actually worth weighting.
- **Ownership:** Not applicable — no files committed in this pass. **Dependencies:** Hard dependency on both G2 and H2 shipping and accumulating real data first. **Do not schedule into any near-term execution wave.** **Effort: L.**

---

## Cross-phase file-ownership matrix (all three Round 3 passes merged)

Read this before assigning any execution agent. Every row lists files touched by more than one plan item — these **must** be edited by one agent working sequentially, never by two agents in the same wave.

| File(s) | Touched by | Rule |
|---|---|---|
| `supabase/functions/platform-cron/index.ts` | F1, F2, F3 | One agent, strictly sequential F1 → F2 → F3. |
| `src/features/crm/sequences/runCrmSequenceEngine.ts` | A4, A5, F2 (port source), G3 (client-side variant model) | A4 → A5 → F2 (F2 needs the post-A4/A5 version). **G3 must land after F2 completes** — concurrent edits risk F2 porting a stale/mid-flux version. |
| `src/features/growthAgents/alexAppointmentAutomation.ts` | A5, K3 | A5 first (Wave 1); K3 much later (needs G2) — no real collision, just sequential by nature of K3's own dependency. |
| `src/lib/meetingReminderAutomation.ts` | A5 (exclusion decision), F1 (port) | A5's decision on whether reminder-SMS shares the frequency cap must land before F1 ports this logic server-side. |
| `src/data/commsSuppressionRepo.ts` | A4, A5 | Same file, non-overlapping regions — one agent doing both in sequence is cleanest. |
| `supabase/functions/_shared/commsSuppressionCheck.ts` | F2 (adds server-side quiet-hours + frequency-cap) | Only F2 touches this. |
| `src/App.tsx` — hero region (`LandingRoute`, ~line 419-530 incl. line 447) | B1, B2, D3 | **One agent, sequential: B1 → B2 → D3.** All three edit the same region of the largest shared file in the codebase. |
| `src/App.tsx` — `/resources/*` route block (~line 1497+) | C1, C2, C4, C5, (B1's new route, different sub-region) | Lower collision risk (different sub-region from the hero block), but avoid two agents editing this block in the exact same wave without a quick rebase check. |
| `src/pages/portal/PartnerDashboardPage.tsx` | B4, L1, L2 | **One sequential chain: B4 → L1 → L2.** |
| `src/lib/referralGrowthEngine.ts` | L1 (additive function only) | No conflict — additive-only change, safe for concurrent reads. |
| `src/pages/PricingPage.tsx` + `src/config/pricingCatalog.ts` | D1, D2, D5 | **One agent, sequential: D5 → D1 → D2.** Never split across parallel agents. |
| `src/lib/finelyKnowledgeIndex.ts` | A7 (tag fix), H1 (additive async path), J4 (scoring weight) | Sequential: A7 → H1 → J4. A7 must land first so H1's ETL script propagates the tag correctly. |
| `src/lib/aiClient.ts` | H2 (additive `traceContext` argument) | No other item touches this file — low risk, but confirm the addition is byte-identical-when-omitted for every other caller. |
| `src/features/growthAgents/subagents/calebReasoningSubagents.ts` + `estherStrategySubagent.ts` | G2b (adds `logAgentAction` to negative branches), H2 (adds `traceContext` to call sites), K4 (adds doctrine-repo context) | **One sequential chain: G2b → H2 → K4.** Three different phases, same two files — narrow, additive, non-overlapping regions, but land as one PR chain. |
| `src/lib/agentAttributionEngine.ts` (+ `AgentAttributionPanel.tsx`) | G2 (build), G2b (extend), G4a (extend) | One agent/lane owns all three — build G2, then immediately extend with G2b + G4a in the same PR chain. |
| `src/pages/admin/AdminAnalyticsPage.tsx` | E1a, N2 | E1a builds the dashboard; N2 adds one KPI tile to the same surface once N1's columns exist — sequence N2 after both E1a's build and N1 land, but it's a small additive tile, not a structural conflict. |
| `src/pages/admin/AdminSovereignGrowthCommandPage.tsx`, `AdminCmoAutopilotPage.tsx`, `AdminLeadEngineSystemDevPage.tsx`, `AdminDashboardLayoutPreview.tsx` | I1, I3, I5 | Bundle all 4 deletions into one PR/agent pass rather than 3-4 separate near-identical agents. |
| `src/components/landing/index.tsx`, `src/pages/PricingPage.tsx` (header region) | J2 (video embed), B/D work | J2 sequences after any Phase B/D item touching the same files, and is separately blocked on off-platform video production. |

---

## Execution Wave Plan

This is the section to hand directly to parallel execution agents. Waves are ordered by the priority list above, sized to respect every file-ownership constraint in the matrix above (not a rigid headcount) — most waves run 4-6 independent lanes; a "lane" is one agent working through one file cluster, sometimes sequentially through several small items. Do not start a wave's lane before its stated dependency has shipped.

### Wave 1 — Zero-risk fixes, revenue visibility, instant-ack, foundation-laying (all zero-dependency or Wave-1-internal-only)

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 | A1, A2, A3, A6, A7 | `growthAgentRegistry.ts`, `coOwnerSystemPrompt.ts`, `sourceAdapters.ts`, `growthAgentMaturity.ts`, `finelyKnowledgeIndex.ts` | All S, all different files, zero collision with each other or anything else — batch as one cleanup PR. |
| 2 | A4 → A5 (sequential) | `runCrmSequenceEngine.ts`, `commsSuppressionRepo.ts`, `alexAppointmentAutomation.ts` | Must complete before F2 (Wave 3) starts; A5's meeting-reminder exclusion decision must also precede F1 (Wave 3). |
| 3 | E1a.1 → E1a.2 → E1a.3 → E1a.4 | `billingAdminAggregateRepo.ts` (new), `AdminAnalyticsPage.tsx` | One build, isolated files. Zero dependency. |
| 4 | N1 → N2 | `instantLeadAck.ts` (new), `sendInstantLeadAck.ts` (new), `leadCapturePipeline.ts`, `meta-webhook/index.ts`, new migration | Zero dependency, isolated files — no reason to wait. |
| 5 | C0.1 → C0.2 → C0.3 | `complianceReview.ts`, `complianceReviewRepo.ts`, `complianceReviewLayer.ts`, `ContentComplianceReviewPanel.tsx` (all new) | Zero dependency; must exist before C1/C4/C5 (Wave 4+) can merge. |
| 6 | G2 | `agentAttribution.ts`, `agentAttributionEngine.ts`, `AgentAttributionPanel.tsx` (all new) | Confirmed no Phase F dependency — build now. Feeds G2b/G4a/K3 later. |
| 7 | I1 + I3 + I4 + I5 | 4 orphan admin page deletions, `StudioUxCommandDashboard.tsx` skim | All isolated, all S-effort, bundle as one cleanup pass. |
| 8 | K1 | `mediaGapCheck.ts` (new), `videoCreationCopilotBrain.ts`, `mediaCommandBrain.ts` | Isolated, zero dependency. |
| 9 | H2 (scaffold + pilot) | `agentCallTrace.ts`, `agentCallTraceRepo.ts` (new), `aiClient.ts`, pilot on `calebReasoningSubagents.ts`/`estherStrategySubagent.ts` | Isolated new files; additive `aiClient.ts` change. **This is the first of the 3-phase chain landing on the two subagent files — G2b and K4 come later, in Wave 4+.** |
| 10 | F4 + F6 | `crmServerSync.ts` (add pull path), new `sendgrid-webhook/index.ts` | Both isolated, independent of the F1→F2→F3 lane — run in parallel with it starting Wave 3. |

### Wave 2 — Surface existing proof, pricing cleanup start, D3 groundwork

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 | B1 → B2 → D3 (sequential, one agent) | `App.tsx` hero region, `siteWayfinderLanes.ts`, `ResultsPage.tsx` (new), `domain/funnelExperiments.ts`, `funnelExperimentsRepo.ts`, `funnelCtaBridge.ts` (new) | **Hard file-ownership rule** — all three edit the same `App.tsx` hero region; must be one sequential chain. |
| 2 | B3 + B5 + B6 + B7 | `BusinessFundingPage.tsx`, FAQ data file, new `docs/CTA_CONTRACT.md`, `/free-debt-guide`/`/free-business-guide` component files | All small, independent, isolated files — bundle into one lane for efficiency. |
| 3 | B4 | `CaseTeamActivityTimeline.tsx` (new), `growthHandoffLedgerRepo.ts` (read/extend), `PartnerDashboardPage.tsx` | **Must land before L1 (Wave 4)** — first in the B4 → L1 → L2 chain on this file. |
| 4 | D5 → D1 → D2 (sequential, one agent) | `PricingPage.tsx`, `pricingCatalog.ts` | **Hard file-ownership rule** — never split across parallel agents. |

### Wave 3 — Stronger-contact infra begins (biggest lane in the plan)

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 (dedicated, do not split) | F1 → F2 → F3 (strictly sequential) | `platform-cron/index.ts`, new `calendar_events`/`crm_sequences`/`crm_sequence_enrollments`/`comms_frequency_log` tables + migrations, `calendarServerSync.ts`, `crmSequencesServerSync.ts`, `_shared/processDueMeetingReminders.ts`, `_shared/processDueNoShowRecovery.ts`, `_shared/processDueCrmSequenceSteps.ts`, `_shared/commsSuppressionCheck.ts` (server-side quiet-hours/frequency-cap additions), `_shared/processDueNurtureEnrollments.ts` (reconciliation fix) | The single largest, highest-impact item in the entire plan. One dedicated agent/lane, no parallelization attempted even with careful coordination — treat as this batch's critical path. Needs A4/A5 (Wave 1) and A5's meeting-reminder decision done first. |

*(F4/F6 already ran in Wave 1, in parallel with this lane's eventual start — no need to wait for them.)*

### Wave 4 — Public content unlocked, attribution extensions, referral panel, pgvector

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 | C1 (all 8-12 articles incl. non-citizen) | New page files under `src/pages/resources/`, `publicSeoCatalog.ts`, `App.tsx` `/resources/*` block | Gated by Wave 1's C0. Resolves B3's public-surface requirement as one of its articles. |
| 2 | C5 | `outcomeWizard.ts`, `outcomeWizardEngine.ts`, `OutcomeWizardPage.tsx` (new), `publicSeoCatalog.ts`, `App.tsx` | Gated by Wave 1's C0; reuses `getDebtPackageGuidanceForBalance()`/`CASE_STUDIES` read-only — can run alongside C1. |
| 3 | G2b → K4 (sequential; H2's pilot from Wave 1 already landed) | `agentDecisionPostMortem.ts` (new), `AgentAttributionPanel.tsx` extension, `calebReasoningSubagents.ts`, `estherStrategySubagent.ts` | Completes the G2b → H2 → K4 chain on the two shared subagent files (H2 was first, Wave 1). K4 additionally needs C1 (this same wave) — land G2b first, K4 after C1's articles are merged (may slip to Wave 5 if C1 finishes late in this wave). |
| 4 | G4a | `agentAttributionEngine.ts` (extend), `CrmRecordDrawer.tsx`, `CrmPipelineBoard.tsx` | Needs G2's output (Wave 1) — build immediately, same lane as G2b if capacity allows. |
| 5 | D4 + G1 | `funnelExperimentsRepo.ts` seed data, `finelyPublicAnswer.ts` | Small, independent, no natural larger partner — bundle. |
| 6 | L1 | `PartnerReferralPanel.tsx` (new), `referralGrowthEngine.ts` (additive), `PartnerDashboardPage.tsx` | Second in the B4 → L1 → L2 chain — needs B4 (Wave 2) done. |
| 7 | H1 | New `knowledge_chunks` migration, `export-knowledge-chunks.mjs`, `knowledge-search/index.ts`, `finelyKnowledgeIndex.ts` (additive async path) | Needs A7 done (Wave 1) for correct tag propagation. |

*(This is the largest wave — 7 lanes — because Wave 3's F1→F2→F3 lane runs concurrently and consumes only one agent slot; other work continues in parallel.)*

### Wave 5 — Finish stronger-contact infra, L2, remaining K, highest-scrutiny content

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 | (F1→F2→F3 lane continues/completes here if not already done in Wave 3-4's timeframe) | `platform-cron/index.ts` | Same dedicated lane from Wave 3. |
| 2 | L2 | `partnerLadderProgression.ts` (new), `PartnerNextRungPanel.tsx` (new), `PartnerDashboardPage.tsx` | Third in the B4 → L1 → L2 chain — needs L1 (Wave 4). Shares "graduated partner" definition with E1a.3 (Wave 1). |
| 3 | K3 | `partnerCommunicationSignal.ts`, `partnerCommunicationSignalRepo.ts` (new), `agentCognitiveEngine.ts`, `alexAppointmentAutomation.ts`, `growthAgentBrain.ts` | Hard dependency on G2 (Wave 1) having accumulated some real data — don't rush this immediately after G2 ships with zero data; give it time within this wave's timeframe. |
| 4 | J4 | `knowledgeFeedbackRepo.ts` (new), `finelyKnowledgeIndex.ts` (`scoreChunk()`) | Soft dependency on H1 (Wave 4). |
| 5 | C4 | New state-landing-page files, `publicSeoCatalog.ts`, `App.tsx` | Needs C0 (Wave 1) + C1 (Wave 4) — highest compliance scrutiny in the plan, do not rush alongside Wave 4's throughput. |

### Wave 6 — Remaining stretch content, retry queue, A/B primitive, cleanup

| Lane | Items | Files | Why this grouping |
|---|---|---|---|
| 1 | F5 | New `send_retry_queue` migration, `_shared/processSendRetryQueue.ts` | Needs F1-F3's processors to exist (Wave 3/5) so it has something to wire into. |
| 2 | C2 | `BeforeAfterGalleryPage.tsx` (new), `publicSeoCatalog.ts`, `App.tsx` | Needs C1 (Wave 4); coordinate route naming with B1 (Wave 2) to avoid two competing "results" surfaces. |
| 3 | C3 | `CreditRepairComparisonPage.tsx` (new), `publicSeoCatalog.ts`, `App.tsx` | Needs C0 (Wave 1) only — could move earlier if capacity allows; placed here to not compete with C1/C5 for Wave 4 slots. |
| 4 | G3 | `runCrmSequenceEngine.ts` (client-side variant model), `funnelExperiments.ts` pattern extension | **Hard file dependency on F2 completing** (Wave 3/5) — must not run concurrently with F2's porting work. |

### Wave 7 — Longer-horizon, opportunistic, or explicitly deferred (no fixed schedule — pick up as capacity allows)

| Item | Status | Trigger to pick up |
|---|---|---|
| K4 (if not already folded into Wave 4/5) | Ready once C1 lands | C1 complete |
| J1 | Ready once F1 lands | F1 complete (Wave 3) |
| J3 | Ready once N1 lands and its design is reviewed | N1 complete (Wave 1) |
| J2 | Blocked on off-platform video production | Video asset delivered |
| G4b | Deferred by design — not a separate build | C5 ships (Wave 4) + a second compliance review for the portal context |
| J5 | Deferred by design — needs live data, not just code | G2 (Wave 1) and H2 (Wave 1) have both been live long enough to have real accumulated data (weeks/months, not the same sprint) |

---

## Final QA / verification checklist

Run before considering any wave "done," and again before the full plan is considered shipped:

1. **Typecheck & build.** `npm run typecheck` must pass with zero errors after every wave's merges — this repo's own `.cursor/rules/git-push-full-working-tree.mdc` convention requires this before any push; treat it the same way before marking a wave complete internally.
2. **No orphaned admin pages beyond what's intentionally deferred.** Re-run I5's mechanical audit (glob `src/pages/admin/*.tsx`, grep each basename against `App.tsx`'s import/route table) after the Phase I waves land — should return zero unexplained orphans.
3. **No duplicate UI layers** (`.cursor/rules/no-duplicate-ui-layers.mdc`). Specifically verify: B4/L1/L2's three new `PartnerDashboardPage.tsx` cards don't show contradictory empty states or repeat the same data already shown by `PartnerCreditRestoreCommandStrip`/`PartnerHubLauncherGrid`; I1/I3's admin-page merge evaluations didn't leave two nav entries pointing at functionally identical controls; C2's gallery route doesn't compete with B1's `/results` page as two answers to "where do I see proof."
4. **Compact luxury UI** (`.cursor/rules/compact-luxury-ui.mdc`). Every new admin/portal panel in this plan (`AgentAttributionPanel.tsx`, `PartnerReferralPanel.tsx`, `PartnerNextRungPanel.tsx`, `ContentComplianceReviewPanel.tsx`, `CaseTeamActivityTimeline.tsx`) uses `FINELY_OS_COMPACT_PAGE`/`finelyOsGlassShell`/`finelyOsCatalogCardCompact` tokens, not tall marketing-style spacing; no new `p-6 lg:p-8` panels inside workspace tools.
5. **Partner terminology** (`.cursor/rules/partner-terminology.mdc`). Every public-facing string introduced by Phase C's new articles/wizard, Phase B's new components, and Phase N's SMS/email copy uses "partner," never "client"/"customer"/"user," in visitor-facing copy. Internal/admin surfaces (Phase I, H, K panels) may use "client" where it aids internal clarity per the rule's own exception.
6. **Communication standard** (`.cursor/rules/communication-standard.mdc`). Every new screen/panel answers "where am I / what matters now / what do I do next" — specifically check C5's outcome wizard (must carry the "results vary / not legal advice" compliance line near any stat, per this rule's own compliance clause) and every new C1/C4 article (same compliance line requirement, enforced structurally by Phase C0's gate).
7. **Compliance gate enforcement** (Phase C0, this plan). Zero C1/C4/C5 routes merged without a `ComplianceReviewRecord` at `status: 'approved'`. Spot-check `nextVerificationDueAt` is set correctly (6 months for articles, 3 months for state pages) on at least one record per content type.
8. **Suppression/quiet-hours/frequency-cap parity between client and server** (Phase F, A4/A5). After F2 ships, confirm both `processDueCrmSequenceSteps.ts` and the now-patched `processDueNurtureEnrollments.ts` enforce the same three checks (`checkSuppressionServerSide`, `isWithinQuietHoursServerSide`, `isOverFrequencyCapServerSide`) — this was a confirmed, previously-unflagged gap in this pass; do not let it regress.
9. **Data-completeness honesty labels rendered, not just documented.** G2/G2b/G4a's UI must visibly show the "as complete as this browser's history" caveat — check this is actually rendered in the shipped panel, not just present in the spec.
10. **Entitlement-key safety for D1/D2.** After the pricing-tier collapse ships, confirm no existing partner's `entitlementKeys` resolution broke — retired package IDs must still resolve via `getPackageById()` (set `isPublic: false`, never deleted) for checkout/webhook code paths that look up by ID.
11. **Retire, don't break, `webhook_meta_leads`'s status semantics** (A3 vs. N1). Confirm A3's `LIVE_SOURCE_IDS` fix and N1's real Meta-webhook acknowledgment send don't get conflated in status reporting — they are different subsystems (lead-intel swarm tick counters vs. lead-capture-to-CRM acknowledgment).
12. **PowerShell/Windows environment conventions** (this workspace). Any new npm scripts, ETL scripts (H1), or shell instructions added as part of this plan's documentation should use `;` not `&&` for command chaining where PowerShell is the target shell, per this workspace's established convention.
