# Finely Cred — Enhancement Plan (Draft v1)

**Status:** Draft — synthesized from Round 1 research (3 parallel audits). Feeds into Round 2 (critique/strengthen) and Round 3 (finalize) before execution.

**Inputs synthesized:**
- `docs/planning/round1_pages_ux_funnel_audit.md` — public site, funnels, pricing, SEO
- `docs/planning/round1_agents_content_knowledge_audit.md` — AI agent system, Ruth, public personas, RAG, differentiation
- `docs/planning/round1_delivery_efficiency_audit.md` — server reliability, CRM data architecture, compliance/deliverability, reporting, admin redundancy

**Cross-cutting theme found across all three audits independently:** Finely Cred has built genuinely deep, honest, differentiated capability (real case studies, real legal doctrine, real reasoning sub-agents, real mail integration) — but a *lot* of it is either (a) invisible to the public/cold visitors (gated behind login, or buried in a non-default tab), (b) not running when no admin has a browser tab open, or (c) not being told in marketing copy even though it's a genuine differentiator. The plan below is organized around **surfacing and hardening what already exists** before building net-new capability, since that's the highest-ROI work identified.

---

## Phase A — Zero-Risk Accuracy & Honesty Fixes (S effort, do first)

1. **A1.** Fix Hannah's "(AI)" label mismatch in `growthAgentRegistry.ts` — either wire `hannahSyndicationWatcher.ts` into a real `runAgentBrainStep()` call, or drop the `(AI)` suffix.
2. **A2.** Wire Ruth's own psychology profile into `coOwnerSystemPrompt.ts` via the existing `buildPsychologyAwareSystemPromptFragment('ruth')`.
3. **A3.** Fix the live-source label mismatch for `sms_reply_capture`/`email_reply_capture`/`webhook_meta_leads`/`webhook_google_lsa` in `sourceAdapters.ts` — either wire the real read-path or remove from `LIVE_SOURCE_IDS`.
4. **A4.** Call `isWithinQuietHours()` in `sendCrmSequenceEmail` (`runCrmSequenceEngine.ts`) before dispatching.
5. **A5.** Add per-recipient cross-channel awareness to the frequency cap (email + SMS share one "contacted recently" key).
6. **A6.** Delete the unreachable "Coming soon" fallback string in `growthAgentMaturity.ts` (dead code).

## Phase B — Surface What Already Exists Publicly (S/M effort, highest ROI)

1. **B1.** Add a top-level "Case Studies" / "Results" nav entry + dedicated `/results` page (not a buried non-default tab in `/testimonials`).
2. **B2.** Move a condensed proof/trust strip directly beneath the homepage hero (keep full `ProvenResultsStrip` further down for depth).
3. **B3.** Give the non-citizen/international credit doctrine a public-facing page or portal panel pointed at from `/business/funding` (currently zero dedicated UI surface).
4. **B4.** Marketing-copy pass (no code): name the psychology-science grounding ("OCEAN/DISC-informed AI specialists") and cross-agent coordination model ("your team of AI specialists hands off your case with full context") as trust/differentiation signals on the homepage or a new "Our Approach" page — without exposing raw persona trait data.
5. **B5.** Add FAQ coverage for Debt & Legal (summons/validation), Non-Citizen/International, and Wealth Builder categories.
6. **B6.** Document one canonical "next step" CTA contract (single helper every new public page must use).

## Phase C — Public SEO Content From Existing Doctrine (M effort, high leverage — content already exists)

1. **C1.** Publish 8–12 public, SEO-indexable articles from the debt-litigation, business-credit-tier, and non-citizen doctrine repos (new `/learn/...` routes reusing `usePublicSeoMeta`).
2. **C2.** Build a public "before/after" proof gallery page surfacing output from `BeforeAfterScoreGraphicPanel.tsx` (currently admin-only tool with no public destination).
3. **C3.** Add a compliance-forward "vs. DIY / vs. traditional credit repair" comparison page.
4. **C4.** (Stretch, L effort — sequence after C1–C3 land) Build 3–5 state-specific debt-defense landing pages for top-volume states, leveraging jurisdiction-aware remedies already modeled in `debtLitigationDoctrineRepo.ts`.

## Phase D — Pricing & Funnel Simplification (M effort)

1. **D1.** Collapse Personal Credit Restore from 6 named DFY tiers to 3–4 + a custom-quote "Elite+" tier.
2. **D2.** Collapse Debt & Legal's 8-tier ladder to 3–4 headline tiers, leaning on the existing `getDebtPackageGuidanceForBalance()` auto-recommendation instead of showing all 8 SKUs.
3. **D3.** A/B test the homepage hero CTA destination (business-credit vs. personal-credit vs. start-here) using the already-built `funnelExperimentsRepo` infra.
4. **D4.** Populate 2–3 more funnel experiments (headline/CTA tests on `/free-debt-guide` and `/free-business-guide`).
5. **D5.** Resolve the ChexSystems/Early Warning "Banking Reports" tab indirection — fold into Personal tab as an add-on chip or promote to a proper top-level category.

## Phase E — Revenue & Ops Visibility (M/L effort — flagged as single largest gap across audits)

1. **E1. (Top priority — Very High impact)** Build one real revenue/LTV/CAC/churn dashboard, replacing `AdminAnalyticsPage`'s 5 shallow counters.
2. **E2.** Consolidate conversion-by-channel data (currently scattered across marketing-desk/growth-agent surfaces) into that one dashboard.
3. **E3.** Surface win-back attempt/recovery counts as a KPI (automation already exists — `processWinBackTick` — just isn't visible).
4. **E4.** Fold `AdminAnalyticsPage` into `AdminPortfolioDashboardPage`/`AdminWorkloadPage` once E1 exists.

## Phase F — Server-Side Reliability (L effort — flagged HIGH/Very High impact; currently the biggest "not production-grade for 24/7 business" risk)

1. **F1. (High impact)** Move meeting reminders + no-show detection onto `platform-cron` (new `meeting_reminders` server step).
2. **F2. (Very High impact)** Port the CRM sequence engine to `platform-cron`/`automation-runner` (currently 100% client-side-only; the core follow-up mechanism for every prospect/affiliate/agent literally does not run when no admin is logged in).
3. **F3. (High impact)** Port `billing_dunning` and `win_back` to server cron next (revenue-protective, currently client-only per `docs/PLATFORM_CRON.md`).
4. **F4.** Add a CRM read path from Supabase (not just write), or explicitly document the server copy as cron-only/read-model — resolve the current implicit two-copies-of-truth state.
5. **F5.** Add a lightweight retry queue for failed sequence/nurture sends instead of log-and-drop.
6. **F6.** Wire a bounce/complaint webhook (e.g. SendGrid) → `addSuppression`, instead of manual entry.

## Phase G — Agent Intelligence Upgrades (M/L effort)

1. **G1.** Give public/partner chat personas a narrower "escalate to real reasoning" threshold so more borderline questions reach `converseWithFinelyAi` instead of a static canned reply.
2. **G2.** Build a lightweight per-agent-action → CRM-outcome attribution join (last-touch model) — closes the "can't tie agent activity to revenue" gap.
3. **G3.** Add a real A/B variant-testing primitive to at least one high-volume send path (CRM sequences or Alex's outreach), using data `growthTimingIntel.ts` already correlates.
4. **G4. (Sequence after G2)** Evaluate a lightweight predictive "expected outcome"/conversion-probability indicator on CRM records, trained from G2's attribution data.

## Phase H — Knowledge Base & Trace Infrastructure (L effort)

1. **H1.** Evaluate a Supabase pgvector upgrade for `finelyKnowledgeIndex.ts`'s `scoreChunk()` — content volume has grown substantially this sprint; keyword-only matching risks real false-negative retrieval.
2. **H2.** Add a structured, replayable per-agent-call audit trace (cost/latency/input/output linked to eventual outcome) as a distinct log from the current human-readable `agentAuditLog.ts`.

## Phase I — Admin Consolidation (M effort)

1. **I1.** Consolidate the six Growth/CMO command pages (`AdminGrowthCommandPage`, `AdminGrowthAgentsPage`, `AdminGrowthAutomationPage`, `AdminSovereignGrowthCommandPage`, `AdminCmoAutopilotPage`, `AdminCmoCommandPage`) into one hub with tabs.
2. **I2.** Confirm the 5 CRM surfaces nest under one CRM nav (not verified in Round 1 — needs a follow-up route/nav check).
3. **I3.** Confirm `AdminLeadEngineSystemDevPage` is gated/hidden from normal admin nav (sounds dev-only).
4. **I4.** Quick check that `AdminSitewideUxCommandPage`/`AdminStudioUxCommandPage` don't duplicate controls.

## Phase J — Longer-Horizon / Stretch (L effort, lower immediate priority)

1. **J1.** Evaluate Google Calendar / Outlook sync (at minimum downloadable `.ics` on booking confirmation).
2. **J2.** Add a short, compliant explainer/demo video to homepage + `/pricing` (only after which reconsider flipping `PUBLIC_DEMO_VIDEOS_ENABLED`).
3. **J3.** Consider a voice-channel agent (client-facing or internal admin copilot) — flagged as a competitive-expectation gap vs. 2026 fintech benchmarks (DisputePro AI, Kikoff's Fynn).
4. **J4.** Add a relevance/quality feedback signal on RAG retrieval (thumbs-up/down or resolution signal) to inform future tuning.

---

## Open questions for Round 2 (critique) to address

- Is the Phase ordering (A→J) actually the right sequence, or should Phase E/F (revenue dashboard + server reliability) be pulled ahead of Phase B/C (public content) given they're flagged "Very High impact"?
- Are there dependency conflicts between phases that aren't captured (e.g., does G2 attribution actually require F2's server-side CRM sequence port to be meaningful, or can it be built against the current client-side data)?
- Is anything double-counted or missing across the three source audits that a fresh critique pass would catch?
- Are the effort (S/M/L) and impact ratings realistic given the actual codebase, or optimistic?
