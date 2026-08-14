# Round 3 — Final Execution-Ready Spec: Phases A, N, E1a, B, F

**Status:** Final planning pass. Turns `enhancement_plan_draft_v2.md`'s Phases A, N, E1a, B, F into build-agent-ready specs. No application code was changed in this pass — planning document only.

**Method:** Read `enhancement_plan_draft_v2.md` + all three Round 2 critiques in full, then independently re-verified the highest-effort/highest-risk items against the actual current source tree (not just against the Round 2 critique's own claims — several of *those* needed updating too, see §0). Every file path, line reference, and behavior claim below was confirmed by opening the real file in this pass, not carried forward from the draft on trust.

---

## 0. Corrections found in this pass (read this first)

These are net-new findings beyond Round 2 — either Round 2 flagged something as "not confirmed" and this pass confirmed it, or this pass found something neither Round 1 nor Round 2 caught.

1. **`AdminBillingPage.tsx` has zero reusable rollup logic for E1a — it is 100% localStorage, not a Supabase aggregate query.** Round 2 flagged this as "worth a fast follow-up check, not confirmed either way." Confirmed now: the page does `loadJson('finely.billing.v1', ...)` and renders whatever agreements happen to be in *this admin's own browser's* local store. `billingSupabaseSync.ts` only exports a **partner-scoped** `pullBillingSnapshotFromSupabase({ partnerId })` (built for the portal, not admin). There is **no existing admin-wide Supabase pull anywhere in the codebase.** E1a must build this net-new — it is not a "wire up existing logic" task.
2. **Good news that lowers E1a's effort: no new RLS/migration is needed for the admin aggregate query.** `agreements_select_own` policy (`20260211000100_full_mode_core.sql`) uses `is_partner_owner(partner_id)`, and `is_partner_owner()` was patched in `20260521000001_add_admin_bypass_to_rls.sql` to return `true` for any row when `is_admin()` is true. A plain authenticated-admin `supabase.from('agreements').select(...)` **with no `.eq('partner_id', …)` filter already returns every partner's rows** under existing RLS. E1a is a pure application-layer build (new query module + new page), zero database migration required.
3. **The server-side nurture cron (`_shared/processDueNurtureEnrollments.ts`) calls no suppression, quiet-hours, or frequency-cap check at all** — not even the one server-side check that exists (`checkSuppressionServerSide`, which `executeAutomationAction.ts`'s `send_email`/`send_sms` actions *do* call). This is a real, previously unflagged gap sitting directly next to the ones Phase F is supposed to close, and should be fixed as part of F2's reconciliation work, not treated as pre-existing acceptable behavior.
4. **Confirmed by direct inspection: `supabase/functions/_shared/commsSuppressionCheck.ts` has no `isWithinQuietHours` or `isOverFrequencyCap` equivalent — only a suppression check exists server-side.** This makes A4/A5's Round 2 warning ("verify the server path enforces the same rule") concrete and proven, not hypothetical: today, **every** server-side send path (nurture cron, automation-runner dispatch) can send outside quiet hours and has no cross-agent frequency cap. F2 must add both, not just port the suppression check.
5. **N1 is not a build-from-scratch item — a real, working instant email acknowledgment already exists and fires today.** `src/lib/leadCapturePipeline.ts`'s `runLeadCapturePipeline()` calls `sendImmediateWelcomeEmail()` (`src/lib/funnelEmail.ts`), which is a genuine `sendEmail()` call (not a stub), gated only on consent + the `commsDelivery` feature flag. This directly contradicts the Round 2 business-impact critique's Missing Item #1 ("no speed-to-lead / instant-response layer exists anywhere in the codebase") — that search only covered `src/features/growthAgents/`, and missed `src/lib/funnelEmail.ts`. **The real, still-open gaps are:** (a) no SMS instant-ack exists at all, (b) **leads captured via `supabase/functions/meta-webhook/index.ts` (Meta Lead Ads) get zero acknowledgment of any kind** — that function inserts directly into `lead_captures` server-side and never touches the client pipeline that sends the welcome email, and (c) the existing email ack is fired client-side, fire-and-forget, immediately after form submit — it is not server-guaranteed the way Phase F's philosophy demands for everything else. N1 is re-scoped below to close these three specific gaps, not to build an ack mechanism that doesn't exist.
6. **B3 gap confirmed literal and total, not partial:** `BusinessFundingPage.tsx` has zero references to `/business/profile`, `internationalAndNonCitizenCreditRepo`, or non-citizen/international content of any kind (grepped directly, zero matches).
7. **B7 gap confirmed total, not partial:** a repo-wide search of `src/pages` for `tel:` found **zero** click-to-call links anywhere in partner- or public-facing pages — the only `tel:` usage in the entire codebase is inside two admin-only pages (`AdminSettingsPage.tsx`, `AdminPhoneHubPage.tsx`), which are internal tools, not visitor-facing.
8. **B2's proof strip is worse-positioned than "not above the fold" — it is section #10 of the homepage**, confirmed by reading `LandingRoute` in `src/App.tsx` end to end: Hero → Path chooser → Cinematic video stage → Solutions snapshot → Debt eradication band → Authorized User section → Financing preapproval → Mastery OS → Free-guide teaser → **then** the "Partner success stories" proof strip. Nine full sections separate the hero from the first trust signal.

---

## 1. Cross-phase file-ownership matrix

Read this before assigning agents. Files listed under more than one item **must** be edited by one agent working sequentially through those items, never by two agents in parallel.

| File | Touched by | Rule |
|---|---|---|
| `supabase/functions/platform-cron/index.ts` | F1, F2, F3 | **One agent, sequential: F1 → F2 → F3.** Each adds its own `CRON_STEPS` entry and tick-payload field to the same shared file/array. |
| `docs/PLATFORM_CRON.md` | F1, F2, F3, F4, F5, F6 | Update incrementally as each F-item lands; whoever finishes an F-item last in a wave updates the "Client-only cron steps" table. Low conflict risk (docs file), but keep it in the same sequential hand-off as the code. |
| `src/features/crm/sequences/runCrmSequenceEngine.ts` | A4, A5, F2 | **A4 and A5 must land before F2 starts porting this file's logic server-side.** F2 is porting *this exact file's* branching logic into a new Deno module — if A4/A5 land after F2's port, the server copy silently misses the quiet-hours/frequency-cap fixes and the port has to be redone. Order: A4 → A5 → F2. |
| `src/features/growthAgents/alexAppointmentAutomation.ts` | A5 | Only A5 touches this in this batch. No conflict. |
| `src/lib/meetingReminderAutomation.ts` | A5 (maybe), F1 | A5's identity-resolution/frequency-cap decision explicitly includes "should meeting-reminder SMS participate in the shared cap at all" — **A5 must decide this before F1 ports the reminder logic server-side**, so F1 isn't porting a code path that's about to change shape. Order: A5 → F1. |
| `src/data/commsSuppressionRepo.ts` | A4, A5 | A4 adds a call site; A5 adds a new identity-resolution helper. Same file, small non-overlapping regions — one agent doing both in sequence (A4 then A5) is cleanest, but two agents could work in parallel with a quick manual merge if needed. Lower risk than the others in this table. |
| `supabase/functions/_shared/commsSuppressionCheck.ts` | F2 (add quiet-hours + frequency-cap server-side, per §0.4) | Only F2 touches this in this batch. |
| `src/App.tsx` (`LandingRoute` function) | B1 (new route entry, near top of file), B2 (JSX reorder inside `LandingRoute`, ~line 419-530) | Different regions of a very large file. Low collision risk, but because `App.tsx` is the single most shared file in the whole codebase, run B1 and B2 as one agent's sequential pass (B2 first — pure reorder, quick — then B1's route addition) rather than two parallel agents both opening this file. |
| `src/lib/funnelEmail.ts` | N1 | Only N1 touches this in this batch. |
| `src/data/leadsRepo.ts` / `src/lib/leadCapturePipeline.ts` | N1 | Only N1. |
| `supabase/functions/meta-webhook/index.ts` | N1 | Only N1 in this batch (no other item here touches this file). |
| `src/pages/admin/AdminAnalyticsPage.tsx` | E1a | Only E1a. |
| `src/pages/business/BusinessFundingPage.tsx` | B3 | Only B3. |

Everything else below (A1, A2, A3, A6, A7, N2, E1a's new repo file, B4–B7, F4–F6) touches files no other item in this batch touches, and can run in any wave/parallel grouping.

---

## 2. Phase A — Zero-Risk Accuracy & Honesty Fixes

Ship as one cleanup batch. No item here has meaningful file overlap except A4/A5 (see matrix above) and their downstream relationship to F2.

### A1 — Fix Hannah's "(AI)" label mismatch
- **File:** `src/features/growthAgents/growthAgentRegistry.ts` (line 199).
- **Change:** `'Channel performance watcher (AI)'` → `'Channel performance watcher'`. Confirmed `hannahSyndicationWatcher.ts` never calls `runAgentBrainStep()` — this is pure deterministic aggregation, so removing the "(AI)" suffix is the only correct S-effort fix. Do **not** attempt the "wire it into real reasoning" alternative under this ticket — that is an M-effort change matching the pattern in `estherStrategySubagent.ts`, and is out of scope for Phase A.
- **Note to include in the PR/commit:** this is cosmetic-only. Hannah's watcher still does not run unattended until F2/F3 land — do not report this as fixing the reliability gap.
- **Acceptance criteria:** Registry label no longer contains "(AI)" for `channel_performance`. Admin Growth Agents roster page renders the corrected label. No other agent label with a genuinely live LLM call is affected.
- **Effort:** S.
- **Dependencies:** None.

### A2 — Wire Ruth's psychology profile into `coOwnerSystemPrompt.ts`
- **File:** `src/domain/coOwnerSystemPrompt.ts`.
- **Change:** Import `buildPsychologyAwareSystemPromptFragment` from `agentCognitiveEngine.ts` (same function already called by `growthAgentBrain.ts:84`) and add one line to the array returned by `buildCoOwnerSystemPrompt()`, e.g. `buildPsychologyAwareSystemPromptFragment('ruth'),` inserted after the `Personality:` line and before `Operating brain:`. Confirmed `agentPsychologyArchitectureRepo.ts:226` has a full `personaId: 'ruth'` profile (OCEAN/DISC/bias-mitigation/de-escalation) ready to consume.
- **Acceptance criteria:** A co-owner chat response includes a system-prompt fragment reflecting Ruth's OCEAN/DISC traits (verify via a debug/log of the assembled prompt string, not just "it compiles"). No regression to existing co-owner prompt sections.
- **Effort:** S.
- **Dependencies:** None.

### A3 — Fix live-source label mismatch in `sourceAdapters.ts`
- **File:** `src/features/overnight50/sourceAdapters.ts`.
- **Change:** Remove `'sms_reply_capture'`, `'email_reply_capture'`, `'webhook_meta_leads'`, `'webhook_google_lsa'` from the `LIVE_SOURCE_IDS` `Set` literal (currently lines 21-37). Their own `notes` fields (lines 73, 74, 79, 80) already say the tick counters are simulated — this is the one-line fix that makes the status badge match the note.
- **Acceptance criteria:** These four sources render as "simulation" status (not "live") in whatever admin UI surfaces `LIVE_SOURCE_IDS`-derived status. Their `notes` text is unchanged and still accurate.
- **Effort:** S.
- **Dependencies:** None. (Note: N1 below adds a *real* server-side lead-capture path via `meta-webhook`, but that does not change `webhook_meta_leads`' status here — that flag is specifically about the **lead-intel swarm's simulated tick counters**, a different subsystem from the lead-capture-to-CRM path N1 touches. Do not conflate the two when doing this fix.)

### A4 — Call `isWithinQuietHours()` in `sendCrmSequenceEmail`
- **File:** `src/features/crm/sequences/runCrmSequenceEngine.ts` (function `sendCrmSequenceEmail`, ~line 85).
- **Change:** Add `import { isWithinQuietHours } from '../../../data/commsSuppressionRepo';` and an early-return guard before the `sendEmail(...)` call (after the suppression + frequency-cap checks, before the `isFeatureEnabled('commsDelivery')` check or immediately after it): if `!isWithinQuietHours()`, log `Email deferred — outside quiet hours` via `logSequenceActivity` and return without sending.
- **Must land before F2** per the file-ownership matrix — F2 ports this exact function's logic server-side, and needs the quiet-hours guard already in place in the source it's porting from.
- **Acceptance criteria:** Manually invoke `runDueCrmSequenceSteps()` with system clock set outside 9am-8pm — email step is deferred, not sent, and a `[Sequence] Email deferred — outside quiet hours` note appears on the underlying prospect/lead. Invoke again inside quiet hours — email sends normally (no regression).
- **Effort:** S.
- **Dependencies:** None (must precede F2, per matrix).

### A5 — Cross-channel frequency-cap awareness (re-rated S→M per Round 2, confirmed correct)
- **Files:** `src/data/commsSuppressionRepo.ts` (new identity-resolution helper), `src/features/crm/sequences/runCrmSequenceEngine.ts`, `src/features/growthAgents/alexAppointmentAutomation.ts`, and a scoping decision affecting `src/lib/meetingReminderAutomation.ts` (confirmed: its SMS path has its own independent `SMS_SENT_KEY` dedupe-by-`eventId` and never calls `isOverFrequencyCap`/`recordSendForFrequencyCap` at all today — verified directly).
- **Confirmed scope (do not under-build this):**
  1. Add an identity-resolution helper in `commsSuppressionRepo.ts`, e.g. `resolveFrequencyCapKey(args: { email?: string; phone?: string; crmRecordId?: string }): string` that returns a canonical key. Simplest correct implementation: if a `crmRecordId` is available, look up the CRM record's contact object (`crmRecordsRepo.ts`) and use `contact.email?.toLowerCase() || contact.phone` normalized — i.e., prefer a stable per-record key over a raw string, so email and phone sends against the *same* CRM record share one frequency-cap bucket.
  2. Update `runCrmSequenceEngine.ts`'s `sendCrmSequenceEmail` and `alexAppointmentAutomation.ts`'s outreach loop to call `isOverFrequencyCap(resolveFrequencyCapKey(...))` / `recordSendForFrequencyCap(resolveFrequencyCapKey(...))` instead of the raw email string.
  3. **Explicit decision required (make it, don't defer it):** meeting-reminder SMS (`meetingReminderAutomation.ts`) should **not** share the marketing-cadence frequency cap — it is time-bound to a specific confirmed event, not discretionary outreach. Keep its existing `SMS_SENT_KEY`/`eventId` dedupe as-is; do not wire it into `isOverFrequencyCap`. Document this decision in a one-line code comment at the top of `meetingReminderAutomation.ts` so a future reader doesn't "fix" it into the shared cap by mistake.
  4. Spot-check `graphEngine.ts` and `benjaminPartnershipSubagent.ts` for the same raw-string frequency-cap pattern while in this file; update if found.
- **If timeline pressure forces a smaller cut:** narrow to "email-only, still keyed by normalized email" (drop the CRM-record-lookup identity resolution) — that sub-scope is genuinely S, per Round 2. Do not silently ship the narrow version while claiming the full M-scope is done.
- **Must land before F2** per the file-ownership matrix, same reasoning as A4.
- **Acceptance criteria:** A CRM record with both an email and phone on file that receives an Alex outreach email is correctly blocked from also receiving a CRM-sequence email within the same frequency window (test by triggering both paths against the same seeded record and confirming only one send occurs). Meeting-reminder SMS for a confirmed event still sends regardless of other same-day sends to that partner (confirms the explicit exclusion in point 3 works).
- **Effort:** M (or S if explicitly narrowed per the cut above — state which version shipped).
- **Dependencies:** Should land after A4 (same file, trivial ordering), before F2.

### A6 — Soften the "Coming soon" fallback in `growthAgentMaturity.ts`
- **File:** `src/features/growthAgents/growthAgentMaturity.ts` (function `getAgentMaturity`, lines 348-366; fallback branch lines 361-365).
- **Change:** Confirmed the fallback (`percent: agent.wave > 2 ? 15 : 35, label: ... 'Coming soon' ...`) is unreachable for the current 9-agent roster (every `id`/`wave` combination is already branched above it). Do **not** delete the fallback outright — instead, add a `console.warn('[growthAgentMaturity] No maturity branch for agent', agent.id)` call at the top of the fallback block before returning its object, so a future 10th agent added without a maturity branch fails loudly in the console instead of silently showing "Coming soon."
- **Acceptance criteria:** All 9 current agents still resolve to their real (non-fallback) maturity report — verify by calling `getAgentMaturity()` for each entry in `GROWTH_AGENTS` and confirming none hit the fallback. Temporarily add a 10th fake agent id in a test/dev console and confirm the warning fires.
- **Effort:** S.
- **Dependencies:** None.

### A7 (was K2) — Tag media-engine knowledge chunks `internal_only`
- **File:** `src/lib/finelyKnowledgeIndex.ts` (function `buildContentMediaEngineChunks`, lines 423-485 — four sub-builders: `videoChunks`, `imageChunks`, `voiceChunks`, `scriptChunks`).
- **Confirmed bug:** each of the four chunk arrays tags with `['video_production'/'image_production'/'voice_audio_production'/'script_framework', category, 'content_studio', 'media_production']` — **none of these tags appear in `INTERNAL_REFERENCE_TAGS`** (line 662-666: `{'billing','crm','pipeline','dunning','agreements','entitlements','internal_only'}`), unlike the sibling `buildPersonaPsychologyChunks()` (line 402-420) which correctly tags every chunk `'internal_only'`. Because `isPublicSafeKnowledgeChunk()` (line 668) only excludes `reference`-source chunks by tag match, these four staff-only production-technique chunk sets currently pass the public-safe check and are eligible for public/partner chat retrieval.
- **Change:** Add `'internal_only'` to each of the four `tags` arrays in `buildContentMediaEngineChunks()` (lines 435, 450, 465, 480), mirroring the psychology-chunk pattern exactly.
- **Acceptance criteria:** Call `searchFinelyKnowledgePublic()` (or `searchFinelyKnowledge(query, { publicSafe: true })`) with a query matching a known media-technique term (e.g. "caption burn-in" or similar phrase from `contentStudioMediaEngineRepo.ts`) — zero media-technique chunks should appear in results. The same query against the internal/admin search path should still surface them (no regression for `/admin/content-studio`'s own consumers).
- **Effort:** S.
- **Dependencies:** None.

---

## 3. Phase N — Instant Lead Acknowledgment (re-scoped per §0.5 — real gaps only, not a from-scratch build)

### N1 — Close the three real instant-ack gaps
- **Files to create:**
  - `src/lib/instantLeadAck.ts` — new client-side module: `sendImmediateWelcomeSms(args: { lead: LeadCapture })`, parallel in shape to the existing `sendImmediateWelcomeEmail` in `funnelEmail.ts`. Gate on `lead.phone?.trim()` present, `lead.consentToContact && lead.consentSmsMarketing`, `isFeatureEnabled('commsDelivery')`, and `checkSuppression({ phone, channel: 'sms' })` from `commsSuppressionRepo.ts` not suppressed. Message: short SMS with a booking link (reuse `getPublicSiteOrigin()` + `buildBookingInvitePath` pattern already used in `alexAppointmentAutomation.ts`) — do not send a generic "thanks" with no next action; the entire point is to give the lead something to do in the next 5 minutes.
  - `supabase/functions/_shared/sendInstantLeadAck.ts` — new shared Deno module for **server-side-sourced leads** (i.e., leads that never pass through the browser's `submitLeadCapture()`). Exports `sendInstantLeadAckServerSide(admin, args: { email?: string; phone?: string; fullName?: string; tenantId?: string })`. Must call `checkSuppressionServerSide()` (existing, `commsSuppressionCheck.ts`) before sending, then `sendServiceEmail`/`sendServiceSms` (existing, `_shared/commsSendEmail.ts` / `_shared/commsSendSms.ts` — same helpers `executeAutomationAction.ts` already uses).
- **Files to modify:**
  - `src/lib/leadCapturePipeline.ts` — add a call to `sendImmediateWelcomeSms({ lead })` alongside the existing `sendImmediateWelcomeEmail(...)` call (near line 122), non-blocking (`void` or fire-and-forget, matching the file's existing style for the marketing-desk auto-enroll call at the bottom).
  - `supabase/functions/meta-webhook/index.ts` — in `ingestLeadgen()` (line 108-142), after the successful `lead_captures` upsert, call `sendInstantLeadAckServerSide(admin, { email: details?.email, phone: details?.phone, fullName: details?.fullName, tenantId: 'finely_cred' })`. This is the single highest-value line in N1: **Meta Lead Ads leads currently receive zero acknowledgment of any kind**, confirmed by reading this file end to end — they land in `lead_captures` via a pure server upsert with no send of any kind afterward.
  - `supabase/migrations/` — new migration adding two columns to `lead_captures`: `first_touch_at timestamptz null`, `first_touch_channel text null` (values: `'email'`, `'sms'`, or `null` if never acknowledged). Both `sendImmediateWelcomeSms`/`sendImmediateWelcomeEmail` (client) and `sendInstantLeadAckServerSide` (server) should best-effort update these two columns on the corresponding `lead_captures` row on first successful send (client path: a small Supabase update call guarded the same way `submitLeadCapture` already guards its own insert — never block the UI on this write; server path: direct `admin.from('lead_captures').update(...)`).
- **Explicitly out of scope for this ticket (do not attempt):** rearchitecting lead capture to route through a single Postgres-trigger-driven ack (the "fully server-guaranteed, single-send-path" redesign considered during this planning pass). That is a bigger, cleaner future architecture, but doing it now risks **double-sending** the existing working email ack while also being a genuinely bigger lift than the M-effort budget here. Ship the three additive gaps above first; revisit true single-path architecture only if double-send or missed-send issues are observed in production logs after N1 ships.
- **Acceptance criteria:**
  1. Submit a test lead through any existing lead-magnet funnel with a phone number and both consents checked, with `commsDelivery` feature flag on — confirm an SMS is received within the same request cycle as the existing welcome email, and `lead_captures.first_touch_channel` is set.
  2. Simulate a Meta Lead Ads webhook POST to `meta-webhook` (using the existing test/dry-run pattern for that function) with a resolvable email — confirm `sendInstantLeadAckServerSide` fires and the lead's `first_touch_at` is populated, where today it is confirmed to never fire.
  3. Submit a lead with `consentSmsMarketing: false` — confirm no SMS is attempted, no error thrown, and the existing email path is unaffected.
- **Effort:** M (re-rated from the draft's S/M — the webhook-side gap and the new migration push this past a pure S; see §0.5 for why this is not a from-scratch build either).
- **Dependencies:** None on other phases. Should use the corrected `checkSuppression`/`isOverFrequencyCap` behavior from A4/A5 conceptually but does not share a file with them — can run in parallel with Phase A.

### N2 — Time-to-first-touch and reply-rate KPIs
- **Files:** Small addition to whatever module/page ends up computing E1a's dashboard aggregates (see E1a below) — add a `avgTimeToFirstTouchMinutes` computation reading `lead_captures.created_at` vs. `first_touch_at` (added by N1) directly via a Supabase query (`select created_at, first_touch_at from lead_captures where first_touch_at is not null order by created_at desc limit 500`, computed client-side in JS — no new RPC needed for this volume).
- **Reply/response rate:** requires a definition of "reply" — recommend keying off inbound `meta_inbox_messages` rows (already exists per `meta-webhook.ts`'s `ingestMessage`) and/or a future SMS-inbound webhook, matched to a lead's phone/email within N days of first touch. If no inbound-reply capture path exists yet for SMS (confirmed: `sourceAdapters.ts`'s own notes for `sms_reply_capture` say "no Twilio inbound-SMS repo/read-path was found" — this is still true after this pass), **scope N2's first cut to time-to-first-touch only**, and log raw reply-rate as a stretch add-on once an inbound-SMS capture path exists (that path itself is out of scope for N — do not build it here).
- **Acceptance criteria:** A new KPI tile/number is visible in the admin analytics surface showing average minutes from lead capture to first touch, computed from real `lead_captures` rows (not a placeholder/hardcoded value). If fewer than 5 leads have a `first_touch_at` value yet (fresh deploy), show an honest "not enough data yet" state rather than a misleading 0 or NaN.
- **Effort:** S (time-to-first-touch only, once N1's columns exist).
- **Dependencies:** **Hard dependency on N1** (needs the `first_touch_at`/`first_touch_channel` columns to exist and be populated). Feeds into E1a's dashboard as a KPI tile — build N1 → N2 → surface in E1a, in that order, but N2 itself is a small enough addition that it doesn't need E1a's other work finished first (it can land as a standalone tile and be moved into the fuller E1a dashboard layout later).

---

## 4. Phase E1a — Revenue/MRR Dashboard

**Confirmed does NOT depend on Phase F** (billing/`agreements` data is genuine server truth via Stripe webhook, independent of the CRM local-first problem Phase F solves — re-confirmed in this pass, see §0.1-0.2 for what actually changed vs. the draft's assumption).

### E1a.1 — Admin-scoped aggregate revenue query + dashboard rebuild
- **Files to create:** `src/data/billingAdminAggregateRepo.ts` — new module, one exported function `pullAdminRevenueSnapshot(): Promise<AdminRevenueSnapshot>` that:
  1. Queries `supabase.from('agreements').select('id, tenant_id, partner_id, package_id, status, amount_cents, rail, created_at, started_at, ended_at').order('created_at', { ascending: false }).limit(2000)` — **no partner_id filter** (confirmed safe under existing RLS per §0.2; no migration needed).
  2. Cross-references `packageId` against `src/config/pricingCatalog.ts`'s exported package arrays (`personalCreditPackages`, `businessCreditPackages`, `debtLegalPackages`, `wealthBuilderPackages`, and the agency arrays) to resolve each agreement's `category` (`personal_credit` / `business_credit` / `debt_legal` / `wealth_builder` / agency).
  3. Computes: total one-time revenue (sum of `amountCents` where package category is not the recurring membership SKU), MRR (sum of `amountCents` for active agreements where `packageId === 'personal_core'` — confirmed the only true subscription SKU), revenue-by-category breakdown, and a simple month-over-month trend (group by `created_at` month).
- **Files to modify:** `src/pages/admin/AdminAnalyticsPage.tsx` — replace the current 5-counter grid (leads/tasks/openTasks/cases/openCases — keep these, they're still useful ops counters) with an added revenue section above or beside it, calling `pullAdminRevenueSnapshot()` on mount (same `useEffect` pattern already in the file). Use `FinelyOsOverviewStatTile` for the new KPI tiles (already imported in this file), respecting the compact-luxury spacing rules already in use.
- **Acceptance criteria:** Dashboard shows non-zero MRR/revenue figures on a Supabase project with real seeded `agreements` rows across at least 2 partners (verifies the aggregate query is truly cross-partner, not per-browser-local like the old `AdminBillingPage.tsx` pattern). Figures match a manual `SELECT sum(amount_cents) FROM agreements WHERE status = 'active'` run directly against the same database.
- **Effort:** M.
- **Dependencies:** None.

### E1a.2 — Three distinct revenue views (not one blended metric)
- **Files:** Same `billingAdminAggregateRepo.ts` + `AdminAnalyticsPage.tsx` from E1a.1 — extend the snapshot type with three explicit named sections rather than one blended object: `oneTimeProgramRevenue`, `recurringMembershipMrr`, `agencyRevenueSharePipeline`. Agency detection: filter agreements whose `packageId` matches the agency buy-in package ids (`agencyBuyInPackages`/`agencyTiers` arrays in `pricingCatalog.ts`).
- **Acceptance criteria:** Dashboard visually separates these three into distinct cards/sections (not one merged "LTV" number) — a reviewer should be able to answer "how much agency revenue-share pipeline exists" and "what's true MRR" as two different, independently-visible numbers, not one blended figure requiring math to separate.
- **Effort:** Folded into E1a.1's M estimate (same files, same PR).
- **Dependencies:** E1a.1 (same build).

### E1a.3 — Ladder-progression tracking
- **Files:** Same repo file — add `computeLadderProgression(agreements: AdminAgreementRow[]): LadderProgressionStats`, grouping agreements by `partnerId`, ordering by `createdAt`, and checking whether a partner's *second* agreement (if any) is a higher tier than their first, using `pricingCatalog.ts`'s package ordering within each category as the "rung" reference (e.g. within `personal_credit`, is the second purchase a higher-priced/higher-named tier than the first).
- **Metric surfaced:** `% of partners with >1 agreement who progressed to a higher rung` and `% of partners with only 1 agreement` (the graduation-candidate pool).
- **Acceptance criteria:** With seeded test data of a partner who bought a Starter tier then later a Wealth Builder tier, the dashboard correctly counts them as "progressed." A partner with only one agreement is correctly excluded from the progression-rate denominator (not counted as "did not progress").
- **Effort:** Folded into E1a.1's M estimate.
- **Dependencies:** E1a.1.

### E1a.4 — `AdminBillingPage.tsx` reuse check
- **Resolved in this pass (§0.1): there is nothing to reuse.** `AdminBillingPage.tsx` is fully localStorage-scoped with no admin-wide Supabase aggregate logic. Do not spend build-agent time re-checking this — go straight to building `billingAdminAggregateRepo.ts` from scratch as specified in E1a.1.
- **Effort:** N/A (this was a research task; resolved, no code follows from it beyond E1a.1).

### E1b / E1c — Explicitly deferred, not part of this Round 3 execution batch
- **E1b (CAC via manual ad-spend input)** and **E1c (compliance-risk-exposure view)** remain deferred per the draft. Not specced further here — they are genuinely separate small features requiring their own design pass, and building them now would scope-creep this batch. Flagging only so a build agent doesn't accidentally fold them into E1a's PR.

---

## 5. Phase B — Surface What Already Exists Publicly

### B1 — `/results` page + nav entry
- **Files to create:** `src/pages/ResultsPage.tsx` (or `src/pages/PublicResultsPage.tsx` to match existing public-page naming conventions — check sibling files like `TestimonialsPage.tsx` for the house convention before naming). Reuse `caseStudiesRepo.ts` (already consumed by `TestimonialsPage.tsx` and the homepage strip) — do not create new case-study data.
- **Files to modify:** `src/config/siteWayfinderLanes.ts` — add a nav entry to `PUBLIC_RESOURCES_SECTIONS` (or a more prominent top-level section if warranted — check how `testimonials` is currently nested, line 279, and decide whether `/results` deserves equal or more prominent placement). `src/App.tsx` — add the route (near the other public content routes, e.g. alongside `/testimonials`).
- **Acceptance criteria:** `/results` is reachable from primary nav (not just deep-linkable), renders real case-study data (not empty state), and does not duplicate `/testimonials` content verbatim — if it's a curated highlight subset, say so in the page copy; if it's the same content with a different entry point, that's acceptable but should be a deliberate choice, not an accidental duplicate maintained in two places.
- **Effort:** S.
- **Dependencies:** None. File-ownership note: run after or with B2 as one `App.tsx`-touching pass (see matrix).

### B2 — Move proof/trust strip beneath the hero (promoted — highest-ROI item in this phase)
- **File:** `src/App.tsx`, `LandingRoute` function (currently ~lines 419-530 based on this pass's read).
- **Change:** Move the "Social proof + compliance" section (currently section #10, containing `FinelyOsComplianceStrip` + the `TestimonialDossier` grid, ~line 513 onward) to immediately after the Hero section (`<HeroSection .../>`, line 447) and before `LandingPathChooserSection`. This is a **pure JSX reorder** — do not rewrite the section's internal content, just relocate the block. Consider a condensed variant (fewer testimonial cards, e.g. 3 instead of the current full set) directly under the hero, with the full strip optionally staying in its later position too if there's a reason to reinforce trust twice — but the minimum required change is: **a condensed version must appear immediately below the hero.**
- **Acceptance criteria:** Loading `/` and scrolling by roughly one viewport height shows a trust/proof signal (testimonial cards + compliance strip) without needing to pass through 8+ other sections first. No visual/layout regression to the sections that get reordered around it (path chooser, video stage, etc. still render correctly in their new relative order).
- **Effort:** S.
- **Dependencies:** None. Run before or together with B1 (same file).

### B3 — Link non-citizen doctrine + resolve overlap with C1 (out of this batch's scope)
- **Confirmed (§0.6):** `BusinessProfilePage.tsx` already has the gated portal panel (lines 41-108, `getFundingRulesForApplicantType`/`getInternationalCreditSystem`). `BusinessFundingPage.tsx` has zero reference to it.
- **File to modify:** `src/pages/business/BusinessFundingPage.tsx` — add a link/CTA to `/business/profile` (or the specific applicant-type section anchor if the page supports deep-linking to it) near wherever funding-readiness content already discusses applicant eligibility. Keep it small — one card/callout, not a new page section.
- **Explicit scope boundary (per draft's Round 3 note):** **this ticket is portal-side linking only.** The public, non-gated equivalent of this content is Phase C1's job (out of scope for this document — Phase C is not part of this Round 3 batch). Do not build a public non-citizen page under this ticket; that would create exactly the duplicate-workstream risk Round 2 flagged. If C1 is picked up by a separate effort, its non-citizen article **is** B3's public counterpart — one sentence in that future ticket should say so explicitly, but no code for it belongs here.
- **Acceptance criteria:** A partner viewing `/business/funding` can reach the non-citizen/international funding rules panel within one click. No new public route is created by this ticket.
- **Effort:** S.
- **Dependencies:** None (informational dependency on future Phase C1 only for the *public* equivalent, not for this ticket's own completion).

### B4 — Partner-facing "who's working on your case" timeline (stronger version, not just marketing copy)
- **Files to create:** A new component, e.g. `src/components/portal/CaseTeamActivityTimeline.tsx`, sourced from `src/data/growthHandoffLedgerRepo.ts` (already exists, read-only consumption — confirm its exported list/query function name before wiring, e.g. `listHandoffsForPartner`/`listHandoffsForRecord` or equivalent; if no partner-scoped query exists yet in that repo, add one narrow read function there rather than querying the raw store from the component).
- **Files to modify:** Insert the new component into `src/pages/portal/PartnerDashboardPage.tsx` (or wherever the partner's case-status view lives — check `PartnerActivityTimeline`/`PartnerCreditRestoreCommandStrip` for the existing pattern/placement convention and match it, per the "no duplicate UI layers" rule — this should feel like a natural extension of the existing activity surface, not a second competing timeline).
- **Marketing-copy half (B4's original, lighter scope):** a copy-only pass naming the psychology-science grounding and cross-agent coordination model as trust signals — no code, can be done independently of the timeline component by a content-focused pass.
- **Acceptance criteria:** A partner with at least one real agent handoff event in `growthHandoffLedgerRepo.ts` sees a chronological, human-readable timeline entry reflecting it (e.g. "Caleb qualified this lead → handed off to Alex for booking → Alex sent a booking invite") somewhere in their portal, sourced from real data (not a mocked/static example). A partner with zero handoff events sees an honest empty state, not a broken/blank panel.
- **Effort:** S/M (component + data wiring) — treat the marketing-copy half as a separate, much smaller S task if split across two people.
- **Dependencies:** None.

### B5 — FAQ coverage for Debt & Legal, Non-Citizen/International, Wealth Builder
- **Files:** Whatever data file backs the site's existing FAQ component/page (locate via the existing FAQ page's import — likely a `faqRepo.ts`/`faqCatalog.ts`-style file; confirm exact filename before starting, do not create a second FAQ data source if one already exists).
- **Acceptance criteria:** New FAQ entries render on the live FAQ page/section under the three named categories, using existing doctrine repos as source-of-truth content (not freehand legal claims) — cross-reference `debtLitigationDoctrineRepo.ts`, `internationalAndNonCitizenCreditRepo.ts`, and Wealth Builder pricing/program content for factual grounding.
- **Effort:** S.
- **Dependencies:** None.

### B6 — Canonical "next step" CTA contract (dev-process task, not user-facing)
- **File:** A short doc, e.g. `docs/CTA_CONTRACT.md`, documenting the one approved pattern for "what happens when a visitor clicks the primary CTA" (which helper function, which destinations are allowed, how funnel attribution is preserved across navigation). No application code changes required for this ticket itself — it's a reference doc other tickets (like a future D3) should follow.
- **Acceptance criteria:** Doc exists, is discoverable (linked from wherever the team keeps engineering conventions), and is *not* counted as a user-facing deliverable in any status report.
- **Effort:** S.
- **Dependencies:** None.

### B7 — Click-to-call CTA on high-intent mobile pages
- **Confirmed (§0.7):** zero `tel:` links exist anywhere in visitor-facing pages today.
- **Files to modify:** `src/App.tsx`'s route components for `DebtGuideFunnelPage` (`/free-debt-guide`) and `BusinessGuideFunnelPage` (/free-business-guide`) — confirm the actual component files behind these route elements (they are referenced, not defined, in `App.tsx` — locate their real source files via the import statements at the top of `App.tsx` before editing) — add a `tel:` CTA button alongside the existing form CTA, styled as a secondary action (per `FINELY_OS_SECONDARY_BTN`/site's public-CTA button tokens), visible primarily on mobile viewports (e.g. `sm:hidden` wrapper on a floating/sticky variant, or inline on all breakpoints if that's simpler and still visually secondary to the form).
- **Acceptance criteria:** On a mobile viewport, both `/free-debt-guide` and `/free-business-guide` show a tappable phone-call CTA in addition to the existing lead-capture form, using a real business phone number sourced from existing config (do not hardcode a number if one is already defined in tenant settings/site config — check `getActiveTenant()`'s settings object, already used elsewhere in `App.tsx`, for a phone field before hardcoding).
- **Effort:** S.
- **Dependencies:** None.

---

## 6. Phase F — Stronger Contact & Revenue Protection Infra (biggest phase — sequential internal waves required)

**Pre-work design note (do this before F1 starts, not as a caveat read after the fact):** F1 and F2 both extend `supabase/functions/platform-cron/index.ts`'s `CRON_STEPS` array and tick-payload shape. Confirmed the existing pattern to follow (from `nurture_enrollments`/`automation_rules`, migration `20260619000000_nurture_automation_persistence.sql`, and their processor `_shared/processDueNurtureEnrollments.ts`): **new table → RLS via `is_admin()`-only policy → a `_shared/processXxx.ts` pure-function processor taking `{ admin, dryRun, tenantId }` → one new line in `platform-cron/index.ts`'s tick handler calling that processor → one new entry in `CRON_STEPS`.** F1 and F2 must both follow this exact shape so the codebase doesn't grow two different server-cron patterns.

**Confirmed reconciliation requirement (§0.3, real and unaddressed today):** the existing server-side nurture engine (`processDueNurtureEnrollments.ts`) already does what F2's ported CRM-sequence engine will also do — advance a multi-step, timed, per-recipient send cadence — and does **not** currently check suppression, quiet hours, or frequency caps at all. Before F2 ships, the design must explicitly answer: are `nurture_enrollments` (existing) and the new `crm_sequences`/`crm_sequence_enrollments` (F2) going to remain two separate systems long-term (acceptable if their trigger conditions are genuinely disjoint — e.g. nurture = lead-magnet email drip, CRM sequences = CRM-record-stage-driven cadence), or should F2 fold into the existing `nurture_enrollments` table with a `kind` discriminator column instead of creating parallel infrastructure? **Recommendation: keep them separate** (they have different trigger models — nurture is funnel/guide-download driven with `leadId`, CRM sequences are CRM-record/stage driven with `recordId` and richer step types including `stage_move`) but **do** fix `processDueNurtureEnrollments.ts` to call the same suppression/quiet-hours/frequency-cap checks F2 adds, as part of F2's PR, since F2 is already touching this exact area of shared server-send infrastructure.

### F1 — Meeting reminders + no-show detection → `platform-cron` (re-rated M→L, confirmed)
- **Confirmed:** `src/data/calendarRepo.ts` is 100% localStorage (`loadJson('finely.calendar.v1', ...)`, single store for `requests`/`events`/`publicAppointmentRequests`) — zero server table exists today. `src/lib/meetingReminderAutomation.ts` (client-only, runs on calendar page load) and `src/features/growthAgents/subagents/alexNoShowRecovery.ts` (client-only, `detectLikelyNoShows()` reads `listCalendarEvents()` from the same local store) both need their logic ported.
- **New Supabase migration:** `supabase/migrations/<timestamp>_calendar_events_server.sql` — new table `calendar_events` mirroring the shape of `CalendarEvent` (`src/domain/calendar.ts`): `id text primary key`, `tenant_id text not null default 'finely_cred'`, `partner_id text not null`, `type text not null`, `status text not null` (must include `'no_show'` as a valid value, confirmed already added client-side to `CalendarEventStatus`), `title text not null`, `description text`, `start_at timestamptz not null`, `end_at timestamptz not null`, `meeting_url text`, `location text`, `timezone text`, `reminder_sent_at timestamptz`, `sms_reminder_sent_at timestamptz` (new — replaces the client's separate `SMS_SENT_KEY` local dedupe), `no_show_recovery_sent_at timestamptz` (new — replaces `RECOVERED_KEY` local dedupe), `source_request_id text`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`. RLS: `for all to authenticated using (public.is_admin()) with check (public.is_admin())` for the admin/service-role write path, plus a narrower `for select` policy allowing a partner to see their own rows (`partner_id` match via `is_partner_owner`), matching the pattern used for `agreements`.
- **New sync module:** `src/data/calendarServerSync.ts` — dual-write, following `crmServerSync.ts`'s exact pattern: `syncCalendarEventToSupabase(event)` called from every `calendarRepo.ts` write path (`upsertCalendarEvent`, `createCalendarEvent`, `setEventStatus`, `setEventMeetingNotes`), best-effort/never-throws, plus a `runCalendarServerBackfillOnce()` one-time migration function.
- **New shared processor:** `supabase/functions/_shared/processDueMeetingReminders.ts` — reads `calendar_events` where `status = 'confirmed'` and `start_at` within the reminder window and `reminder_sent_at is null` (or `sms_reminder_sent_at is null` for the SMS branch), sends via `sendServiceEmail`/`sendServiceSms` (checking `checkSuppressionServerSide` first — this data path currently has **no** suppression check client-side either, confirmed by reading `meetingReminderAutomation.ts` in full, so this is a net-new safety improvement, not just a port), then updates the corresponding timestamp column. Port the no-show detection (`detectLikelyNoShows`'s 20-minute grace-window logic from `alexNoShowRecovery.ts`) into the same or a sibling processor (`processDueNoShowRecovery.ts`), setting `status = 'no_show'` and sending the reschedule-invite email server-side.
- **File to modify:** `supabase/functions/platform-cron/index.ts` — add `meeting_reminders` to `CRON_STEPS`, call the new processor(s) in the `tick` handler, add the result to `tickPayload`.
- **Doc update:** `docs/PLATFORM_CRON.md` — move `calendar`/meeting-reminder behavior out of the "Client-only" list (it isn't currently listed there by name, but should be added to the main table once ported) and document the new table.
- **Acceptance criteria:** With zero admin browser tabs open, a confirmed calendar event starting within the reminder window (test via direct `calendar_events` row insert + manual `platform-cron` tick invocation with `dryRun:false`) triggers a real email/SMS reminder and sets `reminder_sent_at`/`sms_reminder_sent_at`. A confirmed event whose end time has passed the no-show grace window is automatically flagged `status = 'no_show'` and a reschedule invite is sent, purely from a server tick — no client page load required. Existing client-side `meetingReminderAutomation.ts` continues to work for admin-browser-open sessions without double-sending (guard via the same timestamp columns the server checks).
- **Effort:** L (confirmed — matches F2's shape, just a smaller/simpler table; do not under-budget this as M).
- **Dependencies:** A5's decision on whether meeting-reminder SMS shares the frequency cap (should land first, per file-ownership matrix). No dependency on F2, but shares the same `platform-cron/index.ts` file — must run before F2 in sequence.

### F2 — Port CRM sequence engine to `platform-cron`/`automation-runner` (confirmed L, biggest single item in the plan)
- **Confirmed:** `crmServerSync.ts` only syncs `crm_prospects`/`crm_records` (materialized read-model), never sequences/enrollments. `src/data/crmSequencesRepo.ts` (sequences + enrollments) is 100% localStorage. Zero `crm_sequences`/`crm_sequence_enrollments` tables exist in `supabase/migrations/`. Full source logic to port lives in `src/features/crm/sequences/runCrmSequenceEngine.ts` (`dueCrmSequenceSteps`, `executeCrmSequenceStep`, `sendCrmSequenceEmail` — **port the post-A4/A5 version**, per file-ownership matrix).
- **New Supabase migration:** `supabase/migrations/<timestamp>_crm_sequences_server.sql` — two tables:
  - `crm_sequences`: `id text primary key`, `tenant_id text not null default 'finely_cred'`, `name text not null`, `target text not null` (matches `ProspectTarget`), `enabled boolean not null default true`, `steps jsonb not null default '[]'` (array of `CrmSequenceStep`), `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
  - `crm_sequence_enrollments`: `id text primary key`, `tenant_id text not null default 'finely_cred'`, `sequence_id text not null references public.crm_sequences(id) on delete cascade`, `record_id text not null` (matches `crm_records.id`, not a hard FK since `crm_records` may not have every local record synced yet — confirmed `crmServerSync.ts` sync is best-effort, so a hard FK could cause silent enrollment-sync failures), `enrolled_at timestamptz not null`, `updated_at timestamptz not null default now()`, `last_completed_step_index integer not null default -1`, `completed_at timestamptz`, `paused_at timestamptz`. Index on `(tenant_id, completed_at, paused_at)` for the due-step scan, matching `nurture_enrollments_due_idx`'s pattern.
  - RLS: `is_admin()`-only policies on both tables (these are internal ops data, not partner-visible — no partner-select policy needed, unlike `calendar_events`).
- **New sync module:** `src/data/crmSequencesServerSync.ts` — dual-write for both tables, following `crmServerSync.ts`'s pattern exactly (upsert-on-write, best-effort, one-time backfill guarded by a localStorage flag).
- **New shared processor:** `supabase/functions/_shared/processDueCrmSequenceSteps.ts` — ports `dueCrmSequenceSteps`/`executeCrmSequenceStep`'s branching logic (`email`/`task`/`stage_move`) into Deno, operating against `crm_records` (already synced) for contact info, `crm_sequences`/`crm_sequence_enrollments` for cadence state, and `work_tasks` (already has a server table, confirmed via `20260622000000_work_tasks.sql`) for the `task` step type instead of the client's local `tasksRepo.ts`. **Must call, in order: `checkSuppressionServerSide`, a new server-side quiet-hours check (add `isWithinQuietHoursServerSide()` to `commsSuppressionCheck.ts` — confirmed this doesn't exist yet, per §0.4), and a new server-side frequency-cap check** (add a `comms_frequency_log`-equivalent table + `isOverFrequencyCapServerSide()`/`recordSendForFrequencyCapServerSide()` — the client's `FREQUENCY_KEY` local log has no server table today; this is new, necessary infra this ticket must add, not an oversight to defer).
- **New migration (can be the same file as the crm_sequences tables, or a sibling):** `comms_frequency_log` table: `id bigserial primary key`, `tenant_id text not null default 'finely_cred'`, `recipient_key text not null`, `sent_at timestamptz not null default now()`. Index on `(tenant_id, recipient_key, sent_at)`.
- **Reconciliation fix (bundle into this PR, per §0.3):** update `_shared/processDueNurtureEnrollments.ts` to call the same three checks (suppression, quiet-hours, frequency-cap) before its email send, using the same new server-side helpers this ticket adds.
- **File to modify:** `supabase/functions/platform-cron/index.ts` — add `crm_sequences` to `CRON_STEPS`, wire the new processor into the tick handler.
- **Acceptance criteria:** With zero admin browser tabs open, a CRM record enrolled in a sequence with a due `email` step (test via direct `crm_sequence_enrollments` row + manual tick with `dryRun:false`) sends the email server-side, respects suppression/quiet-hours/frequency-cap (test each guard individually by seeding a suppressed contact, an out-of-hours system clock, and a same-day duplicate send), and advances `last_completed_step_index`. A due `task` step creates a real `work_tasks` row. A due `stage_move` step updates the corresponding `crm_records.stage`. `processDueNurtureEnrollments.ts`'s email send is confirmed to now also respect the same three checks (previously confirmed to respect none).
- **Effort:** L (biggest single item in the batch — budget accordingly, do not compress this into the same wave as F1).
- **Dependencies:** A4, A5 must land first (same source file being ported). F1 should land first for the shared `platform-cron/index.ts` file, though F2 has no functional dependency on F1's calendar work — the ordering is purely about avoiding two agents editing the same tick handler simultaneously.

### F3 — Port `billing_dunning` and `win_back` to server cron
- **Files:** Confirmed both currently live only in `src/lib/platformCron.ts` (client-only per `docs/PLATFORM_CRON.md`'s own "Client-only cron steps" table) and read from `billingRepo.ts` (localStorage) for dunning logic and presumably a churn/reactivation repo for win-back — **locate the exact win-back source module before starting** (search for `win_back`/`winBack` across `src/lib/`; not independently re-verified in this pass beyond confirming it's listed as client-only in the docs file).
- **Approach:** Because `agreements`/`entitlements` already have real Supabase server truth (confirmed in E1a's research, §0.1-0.2), `billing_dunning` may need **less new infrastructure than F1/F2** — it can likely query `agreements` directly (`status = 'past_due'`) rather than needing an entirely new table + dual-write sync. Confirm this during implementation before assuming a new migration is required; if `billing_dunning`'s trigger logic only needs `agreements.status`/`amountCents`/timestamps (already server-side), the ticket may reduce to "new `_shared/processBillingDunning.ts` processor + `platform-cron/index.ts` wiring," no new table. Win-back likely does need a small new table if it tracks per-partner "last win-back email sent" state not currently captured anywhere server-side — confirm during implementation.
- **File to modify:** `supabase/functions/platform-cron/index.ts` (third and final sequential edit in the F1→F2→F3 chain).
- **Acceptance criteria:** A partner agreement in `past_due` status (server-truth, no client tab needed) triggers a dunning email via a server tick. A lapsed/churned partner meeting win-back criteria receives a win-back email via a server tick. Both respect suppression checks.
- **Effort:** M (likely lighter than F1/F2 given billing's existing server-truth advantage — but do not finalize this estimate without confirming the win-back data source during implementation; flag up if it turns out win-back also needs a from-scratch table, which would push it toward L).
- **Dependencies:** F1, F2 (sequential, same shared file). Functionally independent of both — ordering is file-ownership only.

### F4 — CRM read path from Supabase
- **Confirmed:** `crmServerSync.ts` (170 lines, read in full) only exports `sync*`/`backfill*` — no `pull*FromSupabase` exists, unlike `billingSupabaseSync.ts`'s `pullBillingSnapshotFromSupabase` (which this ticket should use as its template).
- **File to modify:** `src/data/crmServerSync.ts` — add `pullCrmSnapshotFromSupabase(): Promise<{ prospects: Prospect[]; records: CrmRecord[] }>` following the exact structure of `pullBillingSnapshotFromSupabase` (query both tables, map snake_case → camelCase, merge/replace into local store via a new `replaceCrmSnapshot`-style function in `crmProspectsRepo.ts`/`crmRecordsRepo.ts`).
- **Acceptance criteria:** After a CRM record is created/edited in one browser session and synced to Supabase, calling `pullCrmSnapshotFromSupabase()` in a *different* browser session (or after clearing local storage) restores that record locally. Confirms the "two-copies-of-truth" problem is resolved for at least a manual/triggered refresh (does not require real-time sync — a pull-on-demand or pull-on-load is sufficient for this ticket).
- **Effort:** M.
- **Dependencies:** None on F1/F2/F3 (different files — `crmServerSync.ts` isn't touched by F1/F2/F3). Can run in parallel with F1/F2/F3.

### F5 — Retry queue for failed sequence/nurture sends
- **Files:** New table `supabase/migrations/<timestamp>_send_retry_queue.sql` (`id`, `tenant_id`, `kind` [`nurture`/`crm_sequence`/`meeting_reminder`], `payload jsonb`, `attempts int default 0`, `last_error text`, `next_retry_at timestamptz`, `created_at`) + a new `_shared/processSendRetryQueue.ts` step wired into `platform-cron`. Failed sends in F1/F2/F3's processors and the existing `processDueNurtureEnrollments.ts` should enqueue here instead of just logging-and-dropping.
- **Acceptance criteria:** A simulated send failure (e.g. temporarily point `SENDGRID_API_KEY` at an invalid value) results in a retry-queue row instead of silent loss, and a subsequent tick with valid credentials successfully retries and clears it.
- **Effort:** M.
- **Dependencies:** Logically follows F1/F2/F3 (needs their processors to enqueue into it) — sequence after those land, but touches a different new file/table so it doesn't need to be in the same `platform-cron/index.ts` edit wave; can be its own follow-up pass by the same or a different agent once F1-F3 exist.

### F6 — Bounce/complaint webhook → `addSuppression`
- **Files:** New edge function `supabase/functions/sendgrid-webhook/index.ts` (or extend an existing generic webhook receiver if one already handles multiple providers — check `email-webhook/index.ts`, confirmed present in the functions list, before creating a new one) that verifies SendGrid's webhook signature and calls `recordSuppressionServerSide()` (already exists, `commsSuppressionCheck.ts`) with `reason: 'bounce'` or `'complaint'` on the relevant events.
- **Acceptance criteria:** A simulated SendGrid bounce/complaint webhook payload results in a new `comms_suppression` row, and a subsequent send attempt to that address is correctly blocked by both the client (`checkSuppression`) and server (`checkSuppressionServerSide`) suppression checks (confirming the shared-table design already in place works end-to-end).
- **Effort:** S/M.
- **Dependencies:** None — independent of F1-F5, can run in any wave.

---

## 7. Recommended execution wave grouping

Modeled on the prior 14-phase sprint's pattern of 3-4 parallel agents per wave, with sequential hand-offs only where the file-ownership matrix in §1 requires it.

### Wave 1 (4 parallel agents — no shared files)
- **Agent 1:** A1 + A2 + A3 + A6 + A7 (all S, all different files from each other and from everything else in this wave — batch as one cleanup PR).
- **Agent 2:** A4 → A5 (sequential within this agent, same file — must both finish before Wave 2's F2 starts).
- **Agent 3:** E1a.1 + E1a.2 + E1a.3 + E1a.4 (one build, new file + one page rewrite).
- **Agent 4:** B1 → B2 (sequential within this agent, same `App.tsx` region) + B3 + B5 + B6 + B7 (B4 can also ride in this agent if capacity allows, or be split into Wave 2 — it's file-independent of everything else).

### Wave 2 (3-4 parallel agents — starts once Wave 1's Agent 2 (A4/A5) is done; everything else in Wave 1 can finish independently in parallel with Wave 2)
- **Agent 1 (the biggest, dedicated lane):** F1 → F2 → F3, strictly sequential, one agent owning `supabase/functions/platform-cron/index.ts` for this entire lane. Do not attempt to parallelize F1/F2/F3 across agents even with careful coordination — the shared file plus the shared "reconcile with nurture engine" design decision in F2 make hand-offs mid-lane riskier than the time saved.
- **Agent 2:** N1 → N2 (sequential — N2 needs N1's new columns). Can start immediately at the top of Wave 2 without waiting on the F1/F2/F3 lane; only loosely related (both touch "server-guaranteed sends") but no file overlap.
- **Agent 3:** F4 (CRM read path) — independent of the F1/F2/F3 lane (different file), can run fully in parallel with Agent 1.
- **Agent 4:** F6 (bounce/complaint webhook) — independent of everything else in this wave; if capacity is tight, fold into Agent 3's slot after F4 finishes (sequential within one agent, not parallel, since F6 has no urgency requiring same-wave parallelism).

### Wave 3 (small, can start once Wave 2's F1-F3 lane finishes)
- **Agent 1:** F5 (retry queue) — needs F1/F2/F3's processors to exist so it has something to wire into.
- **Agent 2:** Finish B4 if not completed in Wave 1 — no dependency on Wave 2 at all, this is just capacity-driven placement, not a real sequencing requirement. Move it earlier if a Wave 1/2 agent has spare capacity.

**Net shape:** 2 waves cover essentially everything (Wave 1 all-parallel across 4 agents; Wave 2's dominant constraint is the single F1→F2→F3 lane, which is also the single largest item in the entire enhancement plan and should be treated as the critical path for this batch's total completion time). Wave 3 is small cleanup that can be absorbed into Wave 2's idle capacity rather than treated as a hard third phase.

---

## Summary of key corrections made in this Round 3 pass (relative to draft v2)

1. `AdminBillingPage.tsx` has no reusable admin-aggregate logic for E1a (it's 100% localStorage) — but no new RLS/migration is needed either, because the existing `is_admin()` bypass in `is_partner_owner()` already permits a cross-partner `agreements` query. Net effect: E1a's *shape* changes (build from scratch, not "reuse + maybe a view"), but its *effort* doesn't increase.
2. N1 is not a from-scratch build — a real, working instant welcome-email send already exists and fires today (`funnelEmail.ts`'s `sendImmediateWelcomeEmail`, called from `leadCapturePipeline.ts`). The real, still-open gap is narrower and more specific than the draft/Round 2 implied: no SMS channel, and — most importantly — Meta Lead Ads leads (server-sourced, via `meta-webhook/index.ts`) receive **zero** acknowledgment of any kind today.
3. The server-side nurture cron (`processDueNurtureEnrollments.ts`) and the server-side suppression helper (`commsSuppressionCheck.ts`) have no quiet-hours or frequency-cap enforcement at all today — this was suspected but unconfirmed in Round 2; now proven by direct code reading, and folded into F2's required scope rather than left as a caveat.
4. B2, B3, and B7's gaps are all confirmed as total/literal (zero trust-strip-near-hero, zero funding-page link, zero click-to-call anywhere in visitor-facing code) rather than partial — sharpens the acceptance criteria for each.
5. F1's effort (L, matching F2's shape) and F2's status as the single biggest item are both reconfirmed with a concrete shared-pattern template pulled directly from the existing `nurture_enrollments`/`automation_rules` migration and processor, so a build agent has a literal file to copy the shape from rather than inventing the pattern from a description.
6. A4 and A5 are now hard prerequisites for F2 (not just "nice to fix first") because F2 ports `runCrmSequenceEngine.ts`'s exact logic server-side — shipping F2 before A4/A5 land would require re-porting the fix a second time.
7. All file-ownership conflicts across this specific batch (A, N, E1a, B, F) are enumerated in one matrix (§1) rather than scattered across phase notes, and the wave grouping in §7 is built directly from that matrix rather than from effort size alone.
