# Finely Cred — Enhancement Plan (Draft v2)

**Status:** Draft v2 — revised after Round 2 critique (3 parallel critiques: feasibility/sequencing, business impact/ROI, completeness/gaps). Feeds into Round 3 (finalize into execution-ready plan with file-ownership assignments) before execution.

**What changed from v1:** Reframed Phase F as "Stronger Contact & Revenue Protection" (not "server reliability" — it's the single highest-leverage item in the whole plan per 2026 speed-to-lead research). Added a net-new top-priority item (instant lead acknowledgment) that no Round 1 audit proposed. Split E1 into revenue (no dependency, do early) vs. CAC (needs new spend-tracking). Corrected a factual error (non-citizen doctrine UI already exists at `/business/profile` — it needs linking + a public equivalent, not a rebuild). Added a compliance-review gate before publishing legal doctrine content. Added Phase K (net-new gaps found only by reading actual sprint code) and closed out two items already confirmed done. Fixed under-scoped effort ratings.

---

## Revised priority order (business-impact-first, not effort-first)

1. **Phase A** — Zero-risk accuracy fixes (ship whenever, no strategic weight)
2. **Phase N — Instant Lead Acknowledgment** (NEW, highest "stronger contact" leverage, not in v1 at all)
3. **Phase E1a** — Revenue/MRR dashboard from already-server-truth billing data (no Phase F dependency)
4. **Phase B** — Surface what already exists publicly
5. **Phase F** — Stronger Contact & Revenue Protection infra (meeting reminders + CRM sequences as one combined infra wave, then billing dunning/win-back)
6. **Phase C0** — Compliance/legal review gate (must precede C1)
7. **Phase C** — Public SEO content from existing doctrine
8. **Phase G2** — Agent-action → CRM-outcome attribution (build now against client data; note it undercounts until Phase F lands)
9. **Phase D** — Pricing & funnel simplification
10. **Phase K** — Fixes found only by reading actual sprint code (small, cheap, high-integrity value)
11. **Phase L** — Partner (post-sale) portal gaps
12. Remaining G, H, I, J — longer-horizon / lower-priority items

---

## Phase A — Zero-Risk Accuracy & Honesty Fixes (S effort each; ship as one cleanup batch, no strategic weight)

- **A1.** Fix Hannah's "(AI)" label mismatch (`growthAgentRegistry.ts`) — drop the "(AI)" suffix (cheapest correct fix) unless Phase G's broader sub-agent work wires it into real reasoning anyway. *Note: cosmetic/correctness-only — Hannah's watcher still won't run unattended until Phase F lands; don't report this as "fixed the reliability gap."*
- **A2.** Wire Ruth's own psychology profile into `coOwnerSystemPrompt.ts` via `buildPsychologyAwareSystemPromptFragment('ruth')` (already used by growth agents — 1-line addition).
- **A3.** Fix live-source label mismatch for `sms_reply_capture`/`email_reply_capture`/`webhook_meta_leads`/`webhook_google_lsa` in `sourceAdapters.ts` — remove from `LIVE_SOURCE_IDS` until real read-paths exist.
- **A4.** Call `isWithinQuietHours()` in `sendCrmSequenceEmail` (`runCrmSequenceEngine.ts`) before dispatching. *Note: once Phase F2 ports this server-side, verify the server path (`_shared/commsSuppressionCheck.ts`) enforces the same rule — don't let this client-side fix get silently superseded by a server path with weaker guards.*
- **A5. (re-rated S→M)** Add cross-channel frequency-cap awareness — requires an identity-resolution helper (email↔phone↔CRM record), updating `runCrmSequenceEngine.ts` + `alexAppointmentAutomation.ts`, and an explicit decision on whether `meetingReminderAutomation.ts`'s SMS reminders should even share the same cap (they're time-bound to a specific event, arguably shouldn't). *If scope needs to shrink, narrow to "email-only, still keyed by email" which genuinely is S.*
- **A6.** Delete/soften the unreachable "Coming soon" fallback in `growthAgentMaturity.ts` — recommend a `console.warn` fallback (not silent) rather than full deletion, so a future 10th agent added without a maturity branch fails loudly.
- **A7 (was "K2").** Add `'internal_only'` tag to the four media-engine chunk builders in `finelyKnowledgeIndex.ts` (`buildContentMediaEngineChunks`), mirroring the psychology-profile pattern exactly — a genuine boundary-consistency bug found in Round 2, zero ambiguity, S effort.

## Phase N — Instant Lead Acknowledgment (NEW — not in v1; identified as the single highest "stronger contact" gap)

- **N1.** Build an instant SMS/email acknowledgment step triggered directly off lead-capture (form submit / webhook), independent of and prior to any scheduled CRM sequence cadence step — sends within seconds/minutes of capture, not on the next cron tick. Grounded in 2026 research: 5-min vs. 30-min response = ~21× qualification odds; 78% of buyers buy from the first responder; sub-5-min vs. 24hr+ response = 32% vs. 12% close rate. *Effort: S/M — likely a new Supabase edge function triggered off the existing lead-capture path, using the same suppression/quiet-hours checks as everything else.*
- **N2.** Add **time-to-first-touch** and **raw reply/response rate** as tracked KPIs (feed into Phase E1a's dashboard — these don't exist as tracked metrics anywhere today).

## Phase E1a — Revenue/MRR Dashboard (M effort — corrected: does NOT depend on Phase F/CRM fixes)

- **E1a.1.** Build an admin-scoped aggregate read path over `Agreement` data (billing already has real Stripe-webhook-backed server truth via `supabase/functions/stripe-webhook/index.ts` — the missing piece is a new admin aggregate query/view, not new data infrastructure). Replace `AdminAnalyticsPage`'s 5 shallow counters with real MRR/one-time-revenue/revenue-by-tier.
- **E1a.2.** Explicitly split the dashboard into **three distinct views** rather than one blended "LTV/CAC/churn" metric: (a) one-time DFY/DIY program revenue, (b) recurring membership MRR (only `personal_core` is a true subscription SKU today), (c) Agency revenue-share pipeline (currently gets almost no attention despite being a $1K–$499K buy-in ladder with 30–68% revenue-share — a fundamentally different, higher-margin business line).
- **E1a.3.** Add **ladder-progression tracking** as a first-class dashboard metric: % of partners who graduate from one pricing rung to the next (Restore → Wealth Builder → Business Credit) — a partner who progresses is worth 10-100× their first purchase; this is more important to this business's actual LTV than generic SaaS churn framing.
- **E1a.4.** Check whether `AdminBillingPage.tsx` already has partial rollup logic worth reusing before building from scratch.
- **E1b (deferred, S effort but genuinely new).** CAC requires a new ad-spend/marketing-cost input mechanism (nothing tracks actual spend today — `cmoBudgetAllocator.ts` is allocation-planning, not actual-spend tracking). Build a simple manual spend-input UI before attempting a real CAC number; don't fake it from allocation-plan data.
- **E1c (deferred).** Add a compliance-risk-exposure view as a companion to the revenue dashboard (aging disputes past reinvestigation windows, letters missing required disclosures, complaint/bounce trend by channel) — same instinct as the revenue dashboard, different axis (risk vs. revenue).

## Phase B — Surface What Already Exists Publicly (S/M effort)

- **B1.** Add a top-level "Case Studies"/"Results" nav entry + dedicated `/results` page. *(Real, but ranked below B2 — helps discovery for a smaller subset of visitors than moving the existing strip up the homepage does.)*
- **B2. (promoted — genuinely highest-ROI item in this phase)** Move a condensed proof/trust strip directly beneath the homepage hero. Backed by 2026 CRO data: trust-signal placement above the fold is the primary driver of the 3.9%-median vs. 11.5%-top-decile landing-page conversion gap in this exact vertical.
- **B3. (CORRECTED — was factually wrong in v1)** The non-citizen/international credit doctrine **already has a gated UI panel** at `/business/profile` (`BusinessProfilePage.tsx`, confirmed in code — the v1 claim of "zero dedicated UI surface" was wrong). Real remaining gap: (a) link to it from `/business/funding`, (b) decide whether B3's public equivalent should be a standalone page or folded into Phase C1's non-citizen article set (**resolve this overlap explicitly in Round 3** — don't let B3 and C1 become two independent workstreams targeting the same repo). This audience is also one of the least contested in credit-repair marketing — disproportionately differentiated relative to its build cost; rank above B5/B6.
- **B4.** Marketing-copy pass (no code): name the psychology-science grounding and cross-agent coordination model as trust signals. *Stronger version, not just copy:* build a partner-facing "who's working on your case and what just happened" timeline inside the portal, sourced directly from the real, auditable `growthHandoffLedgerRepo.ts` data — a claim backed by a visible artifact beats the same claim as a homepage sentence.
- **B5.** Add FAQ coverage for Debt & Legal, Non-Citizen/International, and Wealth Builder categories.
- **B6.** Document one canonical "next step" CTA contract. *(Reclassify as a dev-process task, not a UX phase item — do it, but don't count it as user-facing impact.)*
- **B7 (NEW — dropped from Round 1 synthesis, now restored).** Add a click-to-call CTA option alongside form CTAs on high-intent mobile pages — externally-sourced finding that this converts materially better than a form for anxious, ready-to-act credit-distress visitors, and it never made it into the v1 draft.

## Phase F — Stronger Contact & Revenue Protection Infra (L effort — REFRAMED from "server reliability"; highest-impact phase in the plan per Round 2 business-impact critique)

*Sequencing note (feasibility critique): F1 and F2 need the identical new-infrastructure shape (new Supabase table → dual-write sync repo → server-side cron step → suppression/quiet-hours-aware sender) and both touch `platform-cron/index.ts`. Run as sequential waves within this phase, not parallel agents, to avoid conflicting migrations. Before implementation starts, explicitly reconcile with the *existing* server-side `automation_rules`/`automation-runner` nurture system so Phase F doesn't create a second, independent "should I email this person today" system running alongside it.*

- **F1 (re-rated M→L to match real scope).** Move meeting reminders + no-show detection onto `platform-cron`. Requires a **new** `calendar_events` Supabase table + migration (confirmed zero server table exists today — `calendarRepo.ts` is 100% localStorage) + a `calendarServerSync.ts` dual-write module + a new cron step. Build this as the first, smaller proof of the F1/F2 pattern (single table, well-understood no-show logic).
- **F2 (confirmed L — the single largest item in the whole plan).** Port the CRM sequence engine to `platform-cron`/`automation-runner`. Needs 2 new tables (`crm_sequences`, `crm_sequence_enrollments`) + migration, a sync module, and porting the wait/email/task/stage_move branching logic to Deno server-side (not just calling existing browser TS). This is the single highest-impact item in the entire plan — every prospect/affiliate/agent follow-up sequence currently stops dead the moment no admin has a browser tab open, directly undermining "stronger contact."
- **F3.** Port `billing_dunning` and `win_back` to server cron next (after F1+F2 land) — directly revenue-protective, currently client-only per `docs/PLATFORM_CRON.md`.
- **F4.** Add a CRM read path from Supabase (not just write), following `billingSupabaseSync.ts`'s existing `pullBillingSnapshotFromSupabase` pattern as a template — resolves the current implicit two-copies-of-truth state.
- **F5.** Add a lightweight retry queue for failed sequence/nurture sends instead of log-and-drop.
- **F6.** Wire a bounce/complaint webhook (e.g. SendGrid) → `addSuppression`.

## Phase C0 — Compliance/Legal Review Gate (NEW — must precede C1; found missing in Round 2 completeness critique)

- **C0.1.** Before publishing any doctrine-derived public article (Phase C1) or state-specific landing page (Phase C4), run a legal/compliance review pass — reuse the existing `SocialDisclosureReviewPanel.tsx`/`socialDisclosureLayer.ts` pre-publish gate pattern already used for social content, applied here to legal/lending doctrine content instead.
- **C0.2.** Establish a recurring re-verification cadence (e.g. semiannual) given the source repos' own disclaimers note that statutes and state rules change over time — this is evergreen indexed content, not a point-in-time portal interaction a human specialist can correct in real time.
- **C0.3.** Flag Phase C4 (state-specific landing pages) as needing the **highest** scrutiny of any item in the plan — it's the most state-law-dependent content in the whole plan and currently would have carried no more review than a simple FAQ addition.

## Phase C — Public SEO Content From Existing Doctrine (M effort — gated by C0)

- **C1.** Publish 8–12 public, SEO-indexable articles under `/resources/...` (**not** `/learn/...` — match the site's established convention, confirmed live pattern at `/resources/personal-credit-restore-sheet` etc.) from the debt-litigation, business-credit-tier, and non-citizen doctrine repos, reusing `usePublicSeoMeta` — sitemap wiring is automatic (`npm run build` already regenerates it from `publicSeoCatalog.ts`). *Resolve the B3 overlap here explicitly — the non-citizen article(s) in this set ARE B3's public equivalent, not a separate build.*
- **C2.** Build a public "before/after" proof gallery page surfacing output from `BeforeAfterScoreGraphicPanel.tsx`. *(Sequence after B2/D3/C1 — real but lower marginal lift than those, since score-delta proof already exists in text form in every case study.)*
- **C3.** Add a compliance-forward "vs. DIY / vs. traditional credit repair" comparison page.
- **C4. (stretch, L effort, highest compliance scrutiny per C0.3)** Build 3–5 state-specific debt-defense landing pages for top-volume states.
- **C5 (NEW — the strongest "unique approaches / superb knowledge" item found in Round 2, stronger than C1/B4 alone).** Build an interactive, public-facing "which program fits your situation" outcome wizard — debt balance → recommended tier (already partially modeled in `getDebtPackageGuidanceForBalance()`), starting score band → realistic outcome range pulled from the real distribution in `caseStudiesRepo.ts` (not a black-box prediction). This turns existing knowledge from *readable* into *usable*, and is an honestly-grounded competitive answer to external benchmarks like DisputePro AI's "score simulator." *Sequence with C0's compliance gate applied — an outcome range drawn from real historical data still needs the same "results vary, individual circumstances differ" framing as everything else.*

## Phase G — Agent Intelligence Upgrades

- **G1.** Give public/partner chat personas a narrower "escalate to real reasoning" threshold — this is a genuine "stronger contact" item (more real conversations, fewer canned dead-ends), not just an intelligence upgrade.
- **G2. (build now — does not need to wait for Phase F, per feasibility critique)** Build a lightweight per-agent-action → CRM-outcome attribution join (last-touch), using `agentAuditLog.ts` data that already writes `entityType: 'crm_record'` on every send. *Caveat to track honestly: `auditRepo.ts` is 100% localStorage, so G2's output will undercount actions from other browsers/sessions until Phase F lands — report it as "as complete as the client-side history is," not as ground truth, until then.* **Scope G2 and E2 (channel-level conversion consolidation) as one shared attribution data model with two views** (channel-level for the E-dashboard, agent-action-level for G2), not two independently-built systems that could diverge.
- **G2b (NEW).** Extend the attribution model's own decision-quality loop: add an agent-side "why didn't this convert" post-mortem that revisits a specific `no_action`/`skip` decision against what actually happened to that lead later (distinct from G2's forward-attribution — this is a backward-looking check on the Qualifier's own call quality).
- **G3.** Add a real A/B variant-testing primitive to at least one high-volume send path (CRM sequences or Alex's outreach).
- **G4. (clarify scope in Round 3 — two possible versions found)** Either (a) an internal-only CRM-record conversion-probability signal (narrower, sequence after G2), or (b) the more differentiated, partner-facing version the original external benchmark (DisputePro AI) actually referenced — a pre-mail outcome simulator a partner could see before mailing a dispute. Decide explicitly which one this is; they are not the same feature and have very different build/compliance profiles (b) needs C0's compliance gate too.

## Phase D — Pricing & Funnel Simplification (M effort)

*File-ownership note: D1, D2, D5 all touch the same `getPackagesForTab()` region of `PricingPage.tsx` plus `pricingCatalog.ts` category arrays — must be ONE agent working sequentially, not three parallel agents, per feasibility critique.*

- **D1.** Collapse Personal Credit Restore from 6 named DFY tiers to 3–4 + a custom-quote tier.
- **D2.** Collapse Debt & Legal's 8-tier ladder to 3–4 headline tiers, leaning on the existing `getDebtPackageGuidanceForBalance()` auto-recommendation.
- **D3. (re-rated S→S/M)** A/B test the homepage hero CTA destination — needs a new `ctaDestinations` field on the experiment domain type (doesn't exist yet) plus cross-page conversion-recording via `sessionStorage`, not just "use the already-built infra" as originally phrased.
- **D4.** Populate 2–3 more funnel experiments (headline/CTA tests on `/free-debt-guide` and `/free-business-guide`).
- **D5.** Resolve the ChexSystems/Early Warning "Banking Reports" tab indirection.

## Phase K — Fixes Found Only By Reading Actual Sprint Code (Round 2 completeness pass; small, high-integrity value)

- **K1.** Wire a lightweight gap-check into `videoCreationCopilotBrain.ts`/`mediaCommandBrain.ts` so the Content Studio copilot actually consults `contentStudioMediaEngineRepo.ts` (built for exactly this purpose per its own header comment, but currently never referenced by either brain file) and surfaces one concrete missing technique instead of the library sitting as pure manually-browsed reference.
- **K2.** *(moved to Phase A7 above — the `internal_only` tagging fix.)*
- **K3. (longer-horizon, pairs with G2/G4)** Once G2's attribution data exists, consider deriving a lightweight per-partner communication-preference signal (responds better to short/direct vs. reassurance-first messages) from real reply/engagement patterns, and feed it into Alex's/Ruth's prompt construction — the current psychology architecture only profiles the sender's style, never adapts to the recipient's.
- **K4. (pairs with C1)** Once C1's public articles exist, have Caleb's Qualifier and Esther's weekly-focus reasoning explicitly reference the relevant doctrine repo's structured fields (debt type/phase, business tier, applicant type) as part of their `runAgentBrainStep()` context — currently the doctrine repos ground chat/portal content but never a growth agent's own decision.

## Phase L — Partner (Post-Sale) Portal Gaps (NEW — no Round 1 audit examined the partner portal directly)

- **L1. (S/M effort, fully-built backend exists — just needs a UI surface)** Build a partner-facing referral panel reusing the already-built `referralGrowthEngine.ts`/`referralRewardsEngine.ts` backend (confirmed zero partner-facing UI exists today despite the full backend, admin dashboard, and rewards engine already being built) — likely on `PartnerDashboardPage.tsx` or a new `/portal/referrals` route. Pairs naturally with a referral ask at the graduation moment (see missing-item: referral/reactivation mechanic tied to proven success — 44+ real case studies exist and industry retention/cross-sell benchmarks strongly favor asking at the highest-trust moment).
- **L2. (lower priority, follow-on to L1)** Add a lifecycle-stage-aware upsell/cross-sell surface to the partner dashboard (e.g., a Personal Restore graduate being offered Wealth Builder or Business Credit once their score stabilizes) — currently only exists as one-off components, not a lifecycle-aware recommendation.

## Phase H — Knowledge Base & Trace Infrastructure (L effort)

- **H1.** Evaluate a Supabase pgvector upgrade for `finelyKnowledgeIndex.ts`'s `scoreChunk()`. *Added maintenance-cost caveat from feasibility critique: this requires an ongoing re-embed-and-upsert tooling process for every future content addition, not just a one-time migration — resource accordingly.*
- **H2.** Add a structured, replayable per-agent-call audit trace (cost/latency/input/output linked to outcome).

## Phase I — Admin Consolidation (M effort → re-scoped smaller, see corrections)

- **I1. (re-scoped)** `AdminSovereignGrowthCommandPage.tsx` and `AdminCmoAutopilotPage.tsx` are confirmed **unrouted, unreachable dead files** — not live nav clutter. First decide delete-vs-finish for these two; then evaluate whether the remaining four live, distinctly-labeled pages (`AdminGrowthCommandPage`, `AdminGrowthAgentsPage`, `AdminGrowthAutomationPage`, `AdminCmoCommandPage`) genuinely need merging (they may not — they're already distinctly labeled in `adminNavLanes.ts`, not six identically-vague entries as originally assumed).
- **I2. (CLOSED — confirmed already correct, not an action item)** All 5 CRM surfaces are already nested under `/admin/crm/*`.
- **I3. (re-scoped from "verify gating" to "cleanup decision")** `AdminLeadEngineSystemDevPage.tsx` is confirmed unrouted/unreachable, like the two Phase I1 files — nothing to gate, it's already a delete-or-finish decision. Also restore the broader "four separate leads pages" consolidation question (`AdminLeadsOsPage`, `AdminLeadAcquisitionPage`, `AdminLeadIntelPage`) that was dropped during v1 synthesis.
- **I4.** Quick check that `AdminSitewideUxCommandPage`/`AdminStudioUxCommandPage` don't duplicate controls.
- **I5 (NEW).** One-time mechanical audit: grep every `src/pages/admin/*.tsx` filename against `App.tsx`'s import list to find other orphaned/unrouted admin pages beyond the 3 already found in this pass.

## Phase J — Longer-Horizon / Stretch

- **J1.** Evaluate Google Calendar / Outlook sync.
- **J2.** Add a short, compliant explainer/demo video to homepage + `/pricing`.
- **J3. (re-justified)** A much smaller version of "voice agent" — automated missed-call text-back / instant voicemail-to-SMS acknowledgment — justified under the **speed-to-lead / Phase N framing**, not "competitive parity with fintech voice agents" as originally framed. A full negotiation voice agent remains lower priority.
- **J4.** Add a relevance/quality feedback signal on RAG retrieval.
- **J5 (NEW, restored from Round 2).** Cross-agent *model* learning (not just shared context) — e.g., Hannah's channel-performance findings automatically down-weighting Caleb's search-scan allocation toward a channel already flagged weak, rather than just surfacing it as a brief a human/Esther has to act on.

---

## Notes for Round 3 (finalize)

1. Assign explicit file ownership per phase item (mirroring the zero-conflict discipline from the prior 14-phase sprint) so Round 3's output can go straight into parallel-agent execution waves.
2. Resolve the B3/C1 overlap explicitly (one sentence is enough — "B3's public surface IS one of C1's articles").
3. Decide G4's scope (internal signal vs. partner-facing simulator) explicitly before execution.
4. Confirm Phase F's internal sequencing (F1 as smaller first proof of pattern, F2 as the big lift, F3 after) and add the "reconcile with existing automation-runner nurture system" design note as a literal pre-F2 task, not just a caveat.
5. Produce a final consolidated phase list with IDs matching the Cursor plan-file convention used in the prior sprint (`docs/planning` inputs feed a `.cursor/plans/*.plan.md` output).
