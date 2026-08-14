# Round 3 — Final Execution Spec: Phases K, L, H, I, J

**Status:** Round 3 finalization pass. Scope: Phase K (sprint-code fixes), Phase L (partner post-sale portal gaps), Phase H (knowledge base/trace infra), Phase I (admin consolidation), Phase J (longer-horizon). Source: `docs/planning/enhancement_plan_draft_v2.md` + the three Round 2 critiques. No application code was changed in this pass — every claim below was spot-checked directly against the current source tree before being written down.

**Method:** For every item, the specific files named in draft v2 were opened and read in full (or their exported surface was grepped) before writing the approach. Three claims were explicitly re-verified per the task brief:

1. **I1/I3's "3 unrouted admin pages" claim** — re-confirmed by grepping `App.tsx`'s full lazy-import + `<Route>` table against every filename under `src/pages/admin/*.tsx`. **Result: the 3 known orphans are still orphaned, AND one additional orphan was found** — see the I5 mechanical audit below.
2. **L1's "zero partner-facing referral UI" claim** — re-confirmed: `Grep "referral" -i` across `src/pages/portal/` returns zero matches. The backend (`referralGrowthEngine.ts`, `referralRewardsEngine.ts`, `referralGrowthRepo.ts`, `affiliateRepo.ts`) is fully built and already supports a `partnerId → affiliate → referralCode` lookup (`findAffiliateByPartnerId`), but no portal page renders any of it.
3. **K1's "media brain never references the technique repo" claim** — re-confirmed: `Grep "contentStudioMediaEngineRepo|Technique"` across `videoCreationCopilotBrain.ts` and `mediaCommandBrain.ts` returns zero matches in both files. Both files were read in full; neither imports nor calls any of the six exported getters (`getAllVideoTechniques`, `getVideoTechniquesByCategory`, `getAllImageTechniques`, `getImageTechniquesByCategory`, `getAllVoiceTechniques`, `getVoiceTechniquesByCategory`, `getAllScriptFrameworks`, `getScriptFrameworksByCategory`).

---

## Phase K — Fixes Found Only By Reading Actual Sprint Code

### K1 — Wire the media-technique library into the Content Studio copilot brain

**Effort: S/M**

**Problem (re-confirmed):** `src/data/contentStudioMediaEngineRepo.ts`'s own header comment states its intended consumer is the Content Studio copilot brain (`videoCreationCopilotBrain.ts` / `mediaCommandBrain.ts`) "so it can eventually recognize production gaps... and suggest a concrete next technique instead of a generic prompt." Neither file references it. Today the ~150-entry library (`VIDEO_PRODUCTION_TECHNIQUES`, `IMAGE_PRODUCTION_TECHNIQUES`, `VOICE_AUDIO_TECHNIQUES`, `COPYWRITING_SCRIPT_FRAMEWORKS`) is only consulted by `MediaTechniqueLibraryPanel.tsx`, a manually-browsed chip picker — a human has to remember to open it.

**Files to create:**
- `src/features/studioCommandOs/mediaGapCheck.ts` (new) — a small, pure function module. Exports `detectMissingTechniques(plan: { intent: VideoGenerationIntent; durationSec: number; aspect: Aspect; includeCaptions: boolean; visualStyle: VideoCommandRequest['visualStyle'] }): { category: string; suggestion: string; techniqueId: string }[]`. Logic: map `intent`/`aspect`/`durationSec` to 2–3 relevant `VideoTechniqueCategory`/`ImageTechniqueCategory` values (e.g. vertical + short duration → check `caption_style` and `hook_pattern` categories are represented in the plan's `renderChecklist`/`scenes`), call `getVideoTechniquesByCategory(category)` from `contentStudioMediaEngineRepo.ts`, and if the plan has no caption/hook/thumbnail treatment already implied, return one concrete suggestion object (title + `whenToUse[0]` + `toolsThatDoThisWell[0]`) — not the whole matched array. Cap output at 1–2 suggestions so the copilot reply doesn't turn into a data dump.

**Files to modify:**
- `src/features/studioCommandOs/videoCreationCopilotBrain.ts` — in `localCopilotReply()`, after computing `preset`/`intent`, call `detectMissingTechniques({...})` and append one line to the returned `reply` string when a suggestion exists (e.g. `\n💡 Technique tip: ${suggestion.suggestion} (${suggestion.techniqueId})`). Do the same inside the AI-gateway branch of `runVideoCreationCopilotTurn()` after `parsed` is resolved — append the same tip to `parsed.reply` before returning, so both the local-fallback and AI-gateway paths behave identically (no path should skip the gap-check).
- `src/features/studioCommandOs/mediaCommandBrain.ts` — in `buildFallbackVideoPlan()`, call `detectMissingTechniques()` once after `scenes` is built and push any returned suggestions into the existing `renderChecklist` array (e.g. `"Add technique: {title} — {whenToUse}"`) so the technique surfaces inside the actual production checklist, not just the chat reply.

**File-ownership notes:** Touches 3 files in `src/features/studioCommandOs/` only (`videoCreationCopilotBrain.ts`, `mediaCommandBrain.ts`, new `mediaGapCheck.ts`), all owned by one agent. No overlap with any other phase's files. Does not touch `contentStudioMediaEngineRepo.ts` itself (read-only consumer).

**Dependencies:** None. Can ship any time.

**Acceptance criteria:**
- `detectMissingTechniques()` has unit-testable pure logic (no I/O) and returns `[]` when a plan already covers the checked categories (no forced/false-positive suggestions).
- Both `runVideoCreationCopilotTurn()`'s local-fallback and AI-gateway branches surface an identical-shaped tip when one applies.
- `buildFallbackVideoPlan()`'s `renderChecklist` includes at least one technique-derived line for a representative 28s vertical `lead_magnet_ad` request in manual testing.
- No change to `contentStudioMediaEngineRepo.ts`'s existing exports (read-only import).

---

### K2 — *(Filed under Phase A as A7 — included here as a cross-reference only, not a duplicate task)*

**Effort: S** — **Owner note: this item's actual home is `enhancement_plan_draft_v2.md` Phase A, item A7.** Do not schedule it twice. Restating the finalized scope here so Phase K's dependents (K3/K4) and Phase H's public/internal boundary work are read against a complete picture:

- Add `'internal_only'` to the tags array returned by `buildContentMediaEngineChunks()` in `src/lib/finelyKnowledgeIndex.ts` (the four media-engine chunk builders inside it), mirroring the exact pattern already used by the psychology-profile chunk builder at the line tagged with the comment *"internal agent-reasoning grounding, NOT partner-facing."*
- **Verification done in this pass:** confirmed `buildContentMediaEngineChunks()` (`finelyKnowledgeIndex.ts`) currently tags its chunks only with content-descriptive tags (`'video_production'`, `'content_studio'`, `'media_production'`, category names) — none of which appear in `INTERNAL_REFERENCE_TAGS`. This means these chunks currently pass `isPublicSafeKnowledgeChunk()` and are retrievable via `searchFinelyKnowledgePublic`. One-line fix: add `'internal_only'` to the tags array built for each of the four chunk types this function returns.
- **File:** `src/lib/finelyKnowledgeIndex.ts` only. **Effort S. No dependencies. Whoever executes Phase A should pick this up — do not re-assign to the Phase K/H wave.**

---

### K3 — Per-partner communication-preference signal (longer-horizon, pairs with G2/G4)

**Effort: M — sequence after G2 lands (Phase G, not in this document's scope, but the dependency is load-bearing)**

**Problem:** `agentPsychologyArchitectureRepo.ts` profiles the *sender's* (agent's) communication style only. Nothing infers or stores a *recipient's* (partner's/lead's) preferred communication style from real engagement data (e.g., "replies faster to short/direct messages" vs. "engages more after a reassurance-first message").

**Files to create:**
- `src/domain/partnerCommunicationSignal.ts` (new) — defines `PartnerCommunicationSignal { partnerOrRecordId: string; preferredTone: 'direct_short' | 'reassurance_first' | 'unknown'; sampleSize: number; lastComputedAt: string; confidence: 'low' | 'medium' | 'high' }` and a pure `deriveCommunicationSignal(events: AgentAuditEvent[]): PartnerCommunicationSignal` scoring function (e.g., reply-latency + reply-length correlated against which style of prior message triggered it).
- `src/data/partnerCommunicationSignalRepo.ts` (new) — thin localStorage-backed repo (`loadJson`/`saveJson`) following the existing repo pattern (see `crmProspectsRepo.ts` for the house style), keyed by CRM record id / partner id.

**Files to modify:**
- `src/features/growthAgents/agentCognitiveEngine.ts` — extend `buildPsychologyAwareSystemPromptFragment()` (or add a sibling `buildRecipientAdaptedPromptFragment()`) to optionally append one line derived from the stored signal (e.g., "This recipient tends to respond better to short, direct messages — keep sends brief.") when a signal with `confidence !== 'low'` exists for the target record.
- Call sites in `alexAppointmentAutomation.ts` and `growthAgentBrain.ts` where Ruth/Alex construct outbound copy — pass the resolved signal in.

**File-ownership notes:** New files, isolated from every other item in this document. The only shared touch point is `agentCognitiveEngine.ts`, which A2 (Phase A) also modifies for Ruth's own profile — **sequence K3 after A2, same file, not parallel**, since both add lines to the same prompt-fragment builder function.

**Dependencies:** **Hard dependency on Phase G2** (agent-action → CRM-outcome attribution) — K3 needs real reply/engagement data to derive a signal from; G2 is what makes that data queryable per-record in the first place. Do not schedule K3 before G2 has shipped and produced at least a few weeks of data.

**Acceptance criteria:**
- Signal derivation is a pure function with no side effects, unit-testable against synthetic `AgentAuditEvent[]` fixtures.
- A record with `confidence: 'low'` or `sampleSize` below a documented threshold (e.g. 3) never changes agent prompt output — silently degrade to today's behavior, never guess from thin data.
- Feature is additive only — removing `partnerCommunicationSignalRepo.ts` entirely should not break any existing agent flow (defensive `?? undefined` lookups everywhere it's read).

---

### K4 — Wire doctrine repos into growth-agent reasoning (pairs with C1)

**Effort: M — sequence after Phase C1 (public doctrine articles) ships**

**Problem:** `debtLitigationDoctrineRepo.ts`, `businessCreditDoctrineRepo.ts`, and `internationalAndNonCitizenCreditRepo.ts` are consumed today only by (a) `finelyKnowledgeIndex.ts` for chat RAG and (b) their respective gated portal pages (`PartnerDebtPage.tsx`, `BusinessProfilePage.tsx`). No growth-agent subagent (`calebReasoningSubagents.ts`, `estherStrategySubagent.ts`, `benjaminPartnershipSubagent.ts`) imports these repos to ground its own decision.

**Files to modify:**
- `src/features/growthAgents/subagents/calebReasoningSubagents.ts` — in the Qualifier's `runAgentBrainStep()` context-building step, when a lead's captured text/notes match debt-related keywords (reuse the same keyword patterns already established in `debtLitigationDoctrineRepo.ts`'s own `debtType`/`phase` fields), pull the matching doctrine entry's structured fields (`debtType`, `phase`, key deadlines) into the context object passed to the reasoning call — not as plain-English team-context text, but as a structured field the prompt explicitly references.
- `src/features/growthAgents/subagents/estherStrategySubagent.ts` — for weekly-focus reasoning, pull `businessCreditDoctrineRepo.ts`'s tier-progression data to help pick which case-study angle/tier to push that week.

**File-ownership notes:** Touches only the two named subagent files — both isolated from every other item in this document (no shared files with K1/K3/H1/H2/I*/L*/J*).

**Dependencies:** Sequence after **Phase C1** ships (the public articles give the doctrine repos' structured fields a proven, reviewed shape worth reusing in agent reasoning — building K4 first risks wiring against doctrine-field shapes that C1's compliance review, Phase C0, might still adjust).

**Acceptance criteria:**
- Caleb's Qualifier step demonstrably changes its qualification note/next-action for a synthetic lead whose notes mention debt-litigation keywords (e.g. "got served papers") vs. one that doesn't, referencing the doctrine's `phase`/`debtType` fields by name in `reasoning`.
- No new external calls added — this is prompt-context enrichment only, reusing data already bundled in the client.

---

## Phase L — Partner (Post-Sale) Portal Gaps

### L1 — Partner-facing referral panel

**Effort: S/M** (re-confirmed: backend fully built, zero UI consumer)

**Verification done in this pass:**
- `Grep -i "referral"` across all of `src/pages/portal/` → **zero matches**, confirming no referral UI exists anywhere in the partner portal today.
- The backend is fully built and partner-aware, more so than draft v2's phrasing implies: `src/lib/referralGrowthEngine.ts` exports `recordReferralLinkVisit`, `recordReferralLeadCapture`, `buildReferralGrowthSnapshot` (click/conversion tracking, keyed by `code`); `src/lib/referralRewardsEngine.ts` exports `processReferralReward` (credits an affiliate, fires reward-threshold events at $100/$250/$500 cumulative, and already sends the affiliate's linked partner a `createNotification(...)` with `href: '/affiliate'` — **note: that `href` currently points to a route that itself needs checking/building, see below**); `src/data/affiliateRepo.ts` exports `findAffiliateByPartnerId(partnerId)`, which already resolves a logged-in partner to their affiliate record (with `referralCode`) if one exists — **this is the exact lookup a partner-facing panel needs, already built.**
- `src/features/admin/AdminReferralGrowthPanel.tsx` is the admin-side reference implementation to mirror (clicks/conversions/conversion-rate KPI tiles + top-codes list) — reuse its structure and `finelyOsGlassShell`/`FINELY_OS_ENTITY_*` tokens, not its admin-only data scope.

**Files to create:**
- `src/components/partner/PartnerReferralPanel.tsx` (new) — partner-facing component. On mount, calls `findAffiliateByPartnerId(partnerId)`; if none exists, renders a compact "become an affiliate" CTA that calls `createAffiliate({ partnerId, email, fullName })` (from `affiliateRepo.ts`) to self-provision a `referralCode` (mirrors the existing auto-provision pattern in `createAffiliate`, which already generates a `FC-XXXXXXXX` code when none is supplied). If an affiliate record exists, renders: the partner's own referral link (`https://.../free-guide?ref={referralCode}` pattern, matching `AdminReferralGrowthPanel.tsx`'s `/g/{code}` test-link convention — confirm canonical public short-link path with whoever owns Phase D/marketing routes before hardcoding), a copy-to-clipboard button, and 3 compact KPI tiles (clicks, lead captures, conversion rate) sourced from a **partner-scoped** version of `buildReferralGrowthSnapshot()` (see below).
- `src/lib/referralGrowthEngine.ts` — **modify, additive only**: add `buildReferralGrowthSnapshotForCode(code: string)` (filters the existing `listReferralClicks`/`listReferralConversions` by `code` instead of aggregating across all codes) so the partner panel doesn't need write access to other affiliates' data. Do not change `buildReferralGrowthSnapshot()`'s existing signature (admin dashboard depends on it as-is).

**Files to modify:**
- `src/pages/portal/PartnerDashboardPage.tsx` — add a `PartnerReferralPanel` instance near the existing `PartnerCreditRestoreCommandStrip`/`PartnerHubLauncherGrid` region (compact luxury card, not a new full page section — follow the `no-duplicate-ui-layers` rule: this is a new card, not a competing list).
- `src/App.tsx` — optional: add a dedicated `/portal/referrals` route (`PartnerReferralsPage.tsx` wrapping the same panel full-width) only if the dashboard-embedded card proves too cramped in review; default plan is dashboard-embedded only, per the compact-luxury-UI rule against adding new top-level portal pages when an existing card region can hold it.
- Verify/fix the `href: '/affiliate'` notification link in `referralRewardsEngine.ts` — confirm this route exists and lands the partner on the new panel (or the dashboard section that contains it); if `/affiliate` doesn't resolve today, repoint it to `/portal` (dashboard) or the new `/portal/referrals` route as part of this same item, since it's a one-line same-file fix discovered while building L1.

**File-ownership notes:** Primary new files are isolated (`PartnerReferralPanel.tsx` is new). Two touch points need coordination: `PartnerDashboardPage.tsx` (also touched by L2 — see below, run L1 before L2, same file, sequential not parallel) and `referralGrowthEngine.ts` (additive function only, safe for any other agent to read from concurrently, but only one agent should be actively editing it during this item).

**Dependencies:** None — can ship independently of every other Phase L/K/H/I/J item. Pairs naturally with a referral ask at the graduation moment (see L2/E1a ladder-progression tracking) but does not require it to ship first.

**Acceptance criteria:**
- A partner with no existing affiliate record sees a working "get your referral link" CTA that provisions one on click.
- A partner with an existing affiliate record sees their real `referralCode`-scoped clicks/conversions, not the global admin aggregate.
- Copy-link button works; KPI tiles render `0` gracefully for a brand-new code (no NaN/undefined).
- `/affiliate` notification link either resolves correctly or is repointed — verified by clicking through from a test notification.

---

### L2 — Lifecycle-stage-aware upsell/cross-sell surface (lower priority, follow-on to L1)

**Effort: M**

**Problem (re-confirmed):** `PartnerDashboardPage.tsx` surfaces `PartnerCreditRestoreCommandStrip` and `PartnerFundingCommandStrip` (financing-related) but no lifecycle-aware "you've completed X, here's your natural next program" recommendation. Cross-sell exists only as one-off components, not a rules-driven surface.

**Files to create:**
- `src/domain/partnerLadderProgression.ts` (new) — pure function `recommendNextRung(partner: { activeAgreements: Agreement[]; creditScoreTrend?: number[] }): { fromTier: string; toTier: string; rationale: string } | null`, using `pricingCatalog.ts`'s existing ladder structure (Restore → Wealth Builder → Business Credit, per `enhancement_plan_draft_v2.md`'s E1a.3 framing) and a simple stabilization heuristic (e.g., score trend flat/positive over N most-recent snapshots + an active/completed Restore-tier `Agreement`).
- `src/components/partner/PartnerNextRungPanel.tsx` (new) — compact card rendering `recommendNextRung()`'s output when non-null: one sentence + one CTA button to the relevant `/pricing` tab or a "book a session" CTA (per the `communication-standard` rule: one obvious next step, not a hard sell).

**Files to modify:**
- `src/pages/portal/PartnerDashboardPage.tsx` — mount `PartnerNextRungPanel` conditionally (only renders when `recommendNextRung()` returns non-null — no empty-state clutter). **Sequence after L1's edit to this same file lands**, since both add a new card to the same dashboard region.

**File-ownership notes:** New domain/component files are isolated. Shared file: `PartnerDashboardPage.tsx` — must run **after** L1, same-agent-or-sequential, not parallel with L1.

**Dependencies:** Soft dependency on **E1a.3** (ladder-progression tracking as a dashboard metric) — not a hard blocker (L2's heuristic can ship independently), but E1a.3 and L2 should share the same "what counts as a graduated partner" definition rather than each inventing its own. Whoever builds E1a.3 and whoever builds L2 should read each other's tier-progression logic before finalizing either.

**Acceptance criteria:**
- Recommendation logic is a pure function, unit-testable against synthetic `Agreement[]`/score-trend fixtures.
- Never recommends a tier the partner is already active in.
- Card does not render (no empty state) when no recommendation applies — per the `no-duplicate-ui-layers` rule, this must not become a permanent empty box.

---

## Phase H — Knowledge Base & Trace Infrastructure

### H1 — Evaluate Supabase pgvector upgrade for `finelyKnowledgeIndex.ts`

**Effort: L** (confirmed L per Round 2 feasibility critique; this item is explicitly an **evaluation-and-scaffold** deliverable, not a full migration, given its scope)

**Problem:** `finelyKnowledgeIndex.ts` (687 lines, 20+ imported content-source modules) does synchronous, in-browser `scoreChunk()` keyword/heuristic matching over TypeScript-constant content compiled into the client bundle. A real embedding-based retrieval upgrade requires a new pgvector-backed Supabase table, an async RPC read path, and — critically, per the Round 2 feasibility critique — **an ongoing re-embed-and-upsert tooling process for every future content addition**, not a one-time migration.

**Deliverable for this pass (scoped down from "build it" to "make the decision buildable"):**
1. **Migration (draft, not applied):** `supabase/migrations/<next-timestamp>_knowledge_chunks_pgvector.sql` — new `knowledge_chunks` table: `id text primary key, source_tag text, tags text[], route text, content text, embedding vector(1536), updated_at timestamptz`. Requires the `pgvector` extension enabled on the project (`create extension if not exists vector;`).
2. **New file:** `scripts/export-knowledge-chunks.mjs` — a one-time/repeatable Node ETL script that imports the same content-source modules `finelyKnowledgeIndex.ts` already imports, calls its existing chunk-builder functions (`buildContentMediaEngineChunks()` and siblings), generates embeddings via the existing `ai-gateway` embedding endpoint (or OpenAI directly if the gateway doesn't proxy embeddings yet — confirm during implementation), and upserts into `knowledge_chunks`. **This script is the answer to the "ongoing tooling cost" caveat** — document in its header comment that it must be re-run after every content-repo edit until an automated CI/build-time hook replaces manual re-runs.
3. **New file:** `supabase/functions/knowledge-search/index.ts` — Edge function wrapping a pgvector cosine-similarity query (`embedding <=> query_embedding`), returning top-K chunks with the same shape `finelyKnowledgeIndex.ts`'s callers already expect (`FinelyKnowledgeChunk[]`), so `finelyPublicAnswer.ts`/`coOwnerSiteKnowledgeMap.ts` can swap their call site with a minimal diff.
4. **Modify:** `src/lib/finelyKnowledgeIndex.ts` — add a feature-flagged async path (`searchFinelyKnowledgeVector()`) alongside the existing sync `scoreChunk()` path, gated by a settings flag (follow the existing `isFeatureEnabled('aiGateway')` pattern from `settingsRepo.ts`) so this can ship dark and be toggled on after the ETL script has been run at least once against production content.

**File-ownership notes:** Isolated — new migration, new scripts, new edge function, one additive change to `finelyKnowledgeIndex.ts`. No overlap with any other phase in this document. Does overlap conceptually (but not file-wise) with K2/A7's `internal_only` tagging — the ETL script must preserve/propagate the `internal_only` tag into the new `knowledge_chunks.tags` column, or K2/A7's fix gets silently undone by the new retrieval path. **Sequence H1 after K2/A7 lands**, and add an explicit assertion in `export-knowledge-chunks.mjs` that refuses to upsert any chunk missing tags already present in its TS-side source.

**Dependencies:** Soft dependency on K2/A7 (tag-propagation correctness, see above). No hard blocker otherwise — can run in parallel with everything else in this document except that one sequencing note.

**Acceptance criteria:**
- Migration file is syntactically valid SQL, reviewed for RLS (this table needs public-readable rows filtered server-side by the edge function, not client-direct `select` — do not expose `knowledge_chunks` to anon `select` without the same public/internal filter `isPublicSafeKnowledgeChunk()` currently enforces client-side).
- ETL script runs idempotently (safe to re-run without duplicating rows — upsert on `id`).
- `internal_only`-tagged chunks are provably excluded from the new edge function's public-mode query (mirrors `isPublicSafeKnowledgeChunk()`'s existing guarantee).
- New async path is fully feature-flagged off by default; flipping the flag off must fully restore today's synchronous behavior with zero code path changes elsewhere.

---

### H2 — Structured, replayable per-agent-call audit trace

**Effort: M**

**Problem:** `agentAuditLog.ts`'s `logAgentAction()` writes `action`/`entityType`/`entityId`/`reasoning` to `auditRepo.ts` (localStorage-backed), but there's no structured cost/latency/input/output capture per actual LLM call, and no link from a specific `callAiGateway()` invocation back to the business outcome it produced.

**Files to create:**
- `src/domain/agentCallTrace.ts` (new) — `AgentCallTrace { id: string; agentId: string; taskType: string; promptTokensEst?: number; completionTokensEst?: number; latencyMs: number; costUsdEst?: number; input: string; output: string; linkedEntityType?: string; linkedEntityId?: string; outcomeAtCapture?: string; createdAt: string }`.
- `src/data/agentCallTraceRepo.ts` (new) — localStorage-first repo (house pattern), with a Supabase dual-write following `crmServerSync.ts`'s `sync*ToSupabase` pattern (new `agent_call_traces` table + migration `supabase/migrations/<next-timestamp>_agent_call_traces.sql`) so traces survive across browser sessions — this repo's whole purpose is post-hoc replay/audit, which a localStorage-only store defeats.

**Files to modify:**
- `src/lib/aiClient.ts` — wrap `callAiGateway()`'s call site (or add an optional `traceContext` argument threaded through from callers) to record `latencyMs` (measure around the call) and persist a trace via `agentCallTraceRepo.ts` when a `traceContext` is supplied. Keep this opt-in via the argument (not a hard requirement on every call site) to avoid a large, risky one-shot refactor of every `callAiGateway()` caller.
- `src/features/growthAgents/subagents/*.ts` (the ones already highest-volume per `agentAuditLog.ts` call sites — `calebReasoningSubagents.ts`, `estherStrategySubagent.ts`) — pass `traceContext` on their `callAiGateway()` calls first, as the pilot rollout; expand to remaining subagents in a follow-up pass once the pattern is proven.

**File-ownership notes:** New files isolated. `aiClient.ts` is a shared, widely-imported file — this is an **additive, optional-argument** change only; do not alter `callAiGateway()`'s existing required signature or behavior for callers that don't pass `traceContext`. Low collision risk with other phases since no other item in this document touches `aiClient.ts`.

**Dependencies:** None hard. Pairs well with G2 (attribution) and K3 (communication-preference signal) as a data source, but ships independently.

**Acceptance criteria:**
- Adding `traceContext` to a `callAiGateway()` call site is a pure addition — omitting it must produce byte-identical behavior to today for every existing caller (verify via `npm run typecheck` + a smoke-test of at least one unmodified call site).
- A captured trace round-trips through the Supabase dual-write and can be read back via a `pull*FromSupabase`-style function (follow `billingSupabaseSync.ts`'s naming convention).
- No PII/full-message-body concern beyond what `agentAuditLog.ts` already stores today (same data-sensitivity class, not a new category of stored data).

---

## Phase I — Admin Consolidation

### I1 — Growth/CMO command page cleanup (re-scoped: 2 orphans decided, 4 live pages evaluated)

**Effort: S/M** (down from draft v2's implicit M — 2 of the "6 pages" are a delete/finish decision, not a merge)

**Re-verified in this pass:** `Grep "AdminSovereignGrowthCommandPage|AdminCmoAutopilotPage|AdminLeadEngineSystemDevPage"` against `src/App.tsx` → **zero matches for all three**, confirming Round 2's finding still holds. All three files exist under `src/pages/admin/` but are never imported or routed.

The four **live** pages are confirmed distinctly labeled in `adminNavLanes.ts`:
- `/admin/growth-command` → `AdminGrowthCommandPage` — "Growth Command" ("Promote · nurture · communicate")
- `/admin/growth-agents` → `AdminGrowthAgentsPage` — "Growth Agents" ("Results · Caleb · Hannah · specialists")
- `/admin/growth-automation` → `AdminGrowthAutomationPage` — "Growth Autopilot" ("Scheduler · daily find · week sync ticks")
- `/admin/cmo` → `AdminCmoCommandPage` — "CMO Command" ("Site watch · experiments · budget allocator")

**Approach:**
1. **Decision step (no code):** for each of `AdminSovereignGrowthCommandPage.tsx` and `AdminCmoAutopilotPage.tsx`, open the file and assess completeness. If either represents finished-but-unwired work (has real component logic, not a stub), the owner should decide finish-and-route vs. delete before this item's code step begins — **flag this as a go/no-go checkpoint for whoever executes this item, not something to auto-decide.** Default recommendation if the owner has no preference: delete both — the 4 live pages already cover Growth Command/Agents/Automation/CMO distinctly, and reviving 2 more nav entries onto that lane risks recreating exactly the "six confusing peer items" the original (incorrect) draft v1 worried about.
2. If deleting: `Delete` both files, then grep the full repo one more time for any remaining reference (imports, lazy-load strings, docs) to catch stray mentions before removal is considered done.
3. Evaluate the 4 live pages for genuine merge value **only after** step 1's decision — since they're already distinctly labeled, the bar for merging should be "do two of them show literally the same data/controls," not "there are 4 of them." Quick pass: skim each page's top-level component tree for duplicate panels (e.g., does `AdminGrowthAutomationPage` render the same scheduler controls `AdminGrowthCommandPage` also renders). If no duplicate controls are found, **close this out as no-op**, matching I2's precedent below.

**Files touched (if delete path chosen):** `src/pages/admin/AdminSovereignGrowthCommandPage.tsx`, `src/pages/admin/AdminCmoAutopilotPage.tsx` (deleted). No `App.tsx`/`adminNavLanes.ts` changes needed since neither file is referenced there today.

**File-ownership notes:** Isolated to the two named files (deletion) plus a read-only skim of the 4 live pages. No shared-file conflict with I3/I4 (see below) even though all are "Phase I" — they touch entirely different files.

**Dependencies:** None.

**Acceptance criteria:** `npm run typecheck` and `npm run build` succeed after deletion (proves no live import was missed). Repo-wide grep for both deleted filenames returns zero remaining references.

---

### I2 — CRM surfaces nesting — **CLOSED, no action item**

Re-confirmed in this pass by re-reading `App.tsx`'s route table: `/admin/crm`, `/admin/crm/legacy` (redirects), `/admin/crm/sequences`, `/admin/crm/routing`, `/admin/crm/referrals`, `/admin/crm/records/:id` all remain nested under `/admin/crm/*`. **No file changes needed.** Carried forward from Round 2 as confirmed-already-correct; listed here only so Phase I's item numbering stays contiguous with draft v2.

---

### I3 — Leads-surface consolidation decision (re-scoped from "verify gating" to "cleanup + consolidation decision")

**Effort: S (orphan cleanup) + M (if the 3-page consolidation is pursued)**

**Re-verified in this pass:**
- `AdminLeadEngineSystemDevPage.tsx` — confirmed unrouted (zero matches in `App.tsx`, same check as I1).
- The three **live** leads pages and their routes: `/admin/leads` → `AdminLeadsOsPage` (also has a `/admin/leads-os` redirect alias — confirms this was already renamed once), `/admin/lead-intel` → `AdminLeadIntelPage`, `/admin/lead-acquisition` → `AdminLeadAcquisitionPage`.

**Approach:**
1. **Orphan decision (same pattern as I1):** decide delete-vs-finish for `AdminLeadEngineSystemDevPage.tsx`. Default recommendation: delete, for the same reasoning as I1 (3 live, distinctly-scoped leads pages already exist — `AdminLeadsOsPage` for CRM/pipeline/lead-distribution work per its actual imports (`CrmPipelineBoard`, `LeadIntelHub`, `LeadDistributionHub`, `LeadBulkImportPanel`), `AdminLeadIntelPage` for intel-specific views, `AdminLeadAcquisitionPage` for syndication/webhook feeds).
2. **Consolidation question:** read all 3 live pages' top-level imports (already partially done for `AdminLeadsOsPage` above — it already imports `LeadIntelHub` directly, which is also presumably what `AdminLeadIntelPage` wraps). **Flag for the executing agent to verify:** if `AdminLeadIntelPage.tsx` is a thin wrapper around the same `LeadIntelHub` component `AdminLeadsOsPage.tsx` already renders inline, that's a genuine duplicate-surface case worth collapsing (e.g., redirect `/admin/lead-intel` into a tab/anchor on `/admin/leads`, matching the `no-duplicate-ui-layers` rule's spirit). If the two render meaningfully different data/scope, leave both — do not force a merge for its own sake.

**Files touched:** `src/pages/admin/AdminLeadEngineSystemDevPage.tsx` (deleted, pending decision), potentially `src/pages/admin/AdminLeadIntelPage.tsx` + `src/App.tsx` route table + `adminNavLanes.ts` (only if step 2's consolidation is pursued).

**File-ownership notes:** If the consolidation in step 2 is pursued, this item and I1 both touch `App.tsx`'s route table and `adminNavLanes.ts` — **run I1 and I3 sequentially (one agent, one after the other) if both touch route-table cleanup in the same PR**, to avoid two agents editing the same route block simultaneously. If only the orphan-deletion half of each is done, they're file-disjoint and can run in parallel.

**Dependencies:** None hard.

**Acceptance criteria:** Same as I1 — typecheck/build clean after any deletion; zero remaining references to deleted filenames.

---

### I4 — Confirm `AdminSitewideUxCommandPage`/`AdminStudioUxCommandPage` don't duplicate controls

**Effort: S — confirmed low-risk, likely closes as no-op**

**Verification done in this pass:** Read both files' top of file. `AdminSitewideUxCommandPage.tsx` is a 3-line re-export of `SitewideUxCommandPage` (from `src/features/sitewideUxCommand/`) — scoped to sitewide layout refactor tooling. `AdminStudioUxCommandPage.tsx` wraps `StudioUxCommandDashboard` (from `src/features/studioCommandOs/`), explicitly subtitled *"Unified command layer for Media, Comms, Automation, Lead cleanup, and site-wide layout refactors."* **Note the overlap risk is real, not hypothetical:** the Studio UX Command page's own subtitle explicitly claims "site-wide layout refactors" as part of its scope — the same domain the Sitewide UX Command page owns. This needs a closer look than draft v2's "quick check" framing implies.

**Approach:** Open `StudioUxCommandDashboard.tsx` (the component `AdminStudioUxCommandPage` renders) and check whether its "site-wide layout refactors" section renders its own controls or links out to `/admin/sitewide-ux` (or equivalent route) rather than reimplementing them. If it reimplements, collapse to a single source of truth (the Sitewide page) with the Studio page linking to it instead of duplicating; if it already just links out, close this item as confirmed-no-duplication, matching I2's precedent.

**Files touched:** `src/features/studioCommandOs/StudioUxCommandDashboard.tsx` only, if a fix is needed. No `App.tsx`/route changes expected either way (both pages keep their own route — this is a controls-duplication check, not a page-consolidation).

**File-ownership notes:** Isolated to one file at most. No conflict with I1/I3/I5.

**Dependencies:** None.

**Acceptance criteria:** Written confirmation (a one-paragraph note in the PR description) of which of the two outcomes applied, plus the fix if duplication was found.

---

### I5 — Mechanical audit: orphaned admin pages (performed now, not deferred)

**This was executed as part of this planning pass, per the task brief's instruction that this is cheap and read-only.**

**Method:** Globbed every file under `src/pages/admin/*.tsx` (92 raw glob hits, de-duplicated to distinct basenames after accounting for path-separator duplication in the tool output) and grepped `src/App.tsx`'s full lazy-import block (`pages/admin/` import lines) for each basename.

**Result — 4 orphaned admin pages found, one more than the three already identified in Round 2:**

| File | Status | Notes |
|---|---|---|
| `AdminSovereignGrowthCommandPage.tsx` | Confirmed orphan (Round 2 finding, re-verified) | See I1 |
| `AdminCmoAutopilotPage.tsx` | Confirmed orphan (Round 2 finding, re-verified) | See I1 |
| `AdminLeadEngineSystemDevPage.tsx` | Confirmed orphan (Round 2 finding, re-verified) | See I3 |
| **`AdminDashboardLayoutPreview.tsx`** | **NEW — confirmed orphan, not previously identified** | Grepped `DashboardLayoutPreview` against the entire `src/` tree (not just `App.tsx`) — the **only** match is the file's own definition. It is not imported, lazy-loaded, or referenced anywhere else in the codebase, including no reference from its likely sibling `AdminDashboardIvoryPreviewPage.tsx` (which **is** routed, at a route the executing agent should locate and confirm during implementation). |

**Recommended action for `AdminDashboardLayoutPreview.tsx`:** Same delete-vs-finish decision pattern as I1/I3. Given the name strongly suggests it was an early/alternate preview of the same dashboard-layout concept `AdminDashboardIvoryPreviewPage.tsx` (which is live) already covers, default recommendation is **delete**, pending a quick content skim to confirm it isn't hiding unique unfinished logic worth salvaging first.

**Files touched:** `src/pages/admin/AdminDashboardLayoutPreview.tsx` (delete, pending the same skim-first check as the other 3 orphans).

**File-ownership notes:** Bundle this into the same PR/agent as I1 and I3's orphan-deletion work (all four orphan deletions are the same mechanical action — one agent, one pass, delete all four together after individually skimming each for salvageable logic) rather than spreading across 3 separate agents for 4 nearly-identical deletions.

**Dependencies:** None. This audit is complete; the only remaining step is the delete-or-finish decision + execution.

**Acceptance criteria:** `npm run typecheck` and `npm run build` succeed after all 4 deletions in one batch. A follow-up repo-wide grep (same method as this audit) run after execution finds zero additional orphans among the remaining ~88 admin page files.

---

## Phase J — Longer-Horizon / Stretch

*Phase J items are intentionally lighter-spec than K/L/H/I — they are stretch/evaluation items in draft v2, not committed builds. Each gets a concrete first-step + file list so a future agent can pick it up without re-deriving scope, but effort estimates below are for the "evaluation/prototype" slice only, not full production builds.*

### J1 — Evaluate Google Calendar / Outlook sync

**Effort: M (evaluation + minimal read-only prototype), L (full two-way sync)**

**First step:** Read `src/domain/calendar.ts` and `src/data/calendarSettingsRepo.ts`/`src/data/calendarSlots.ts` (already exist per the repo listing) to confirm the current calendar domain model's shape before scoping an external-provider adapter. Spike: a read-only Google Calendar OAuth + free/busy pull feeding `src/lib/suggestBookingSlots.ts`'s existing slot-suggestion logic (do not attempt two-way write sync in the first pass — that's the L-effort full version). **New file:** `src/lib/calendarProviderSync/googleCalendarAdapter.ts` (prototype only).

**File-ownership notes:** Isolated new file. Note: this is conceptually adjacent to Phase F1 (meeting reminders → `platform-cron`, out of this document's scope) — **sequence J1 after F1's `calendar_events` Supabase table exists**, since an external-provider sync needs a server-side table to reconcile against, and F1 is already building exactly that table.

**Dependencies:** Soft-sequence after Phase F1 (server-side `calendar_events` table).

---

### J2 — Short, compliant explainer/demo video for homepage + `/pricing`

**Effort: S (content/production, not engineering)** — this is a content-production task, not a code task. The only code touch is embedding the finished asset.

**First step:** Once a video asset exists (production is out of this codebase's scope), add it via the existing `src/components/landing/` hero region and a compact player component on `PricingPage.tsx`'s header. **No new domain/data model needed** — this is a static asset embed.

**Files to modify (once asset exists):** `src/components/landing/index.tsx`, `src/pages/PricingPage.tsx`. **File-ownership notes:** both files are touched by other phases too (B-phase homepage work, D-phase pricing work, out of this document's scope) — **do not schedule J2's embed in the same wave as any Phase B/D item touching the same files; sequence after.**

**Dependencies:** Blocked on off-platform video production, not on other plan items.

---

### J3 — Missed-call text-back / instant voicemail-to-SMS acknowledgment

**Effort: M** — re-justified under the Phase N (instant lead acknowledgment) speed-to-lead framing, not "voice-agent competitive parity."

**First step:** Read `src/pages/admin/AdminPhoneHubPage.tsx` and whatever telephony provider integration backs it (grep for Twilio/phone-webhook handlers under `supabase/functions/`) to find the existing missed-call event source. **New file:** `supabase/functions/_shared/missedCallTextBack.ts` — on a missed-call webhook event, send an SMS acknowledgment (reusing the same suppression/quiet-hours check pattern as `_shared/commsSuppressionCheck.ts`) within the same request, not a scheduled follow-up.

**File-ownership notes:** New shared function file; if a phone-webhook edge function already exists, this hooks into it — **coordinate directly with whoever builds Phase N's instant-lead-ack edge function, since both are "fire an immediate acknowledgment off a real-time webhook event using the shared suppression check" and should share one utility rather than two near-duplicate implementations.**

**Dependencies:** Should share code/design with **Phase N1** (instant lead acknowledgment) — read N1's final implementation before starting J3, do not build independently.

---

### J4 — Relevance/quality feedback signal on RAG retrieval

**Effort: S/M**

**First step:** Add a lightweight thumbs-up/down (or "was this helpful") capture on chat/RAG-answer surfaces (`finelyPublicAnswer.ts`'s callers, `coOwnerSiteKnowledgeMap.ts`'s callers) that logs `{ chunkIds: string[], query: string, helpful: boolean }` to a new small repo (`src/data/knowledgeFeedbackRepo.ts`, localStorage-first, same house pattern). Use this signal to down-weight/up-weight chunks in `scoreChunk()`'s heuristic (a small multiplier keyed by historical helpfulness), or — if H1's pgvector path ships — feed it into the ETL script's per-chunk metadata.

**File-ownership notes:** New repo file isolated. Touches `finelyKnowledgeIndex.ts`'s `scoreChunk()` — **coordinate with H1 if both are in flight simultaneously**, since H1 also touches this file (H1's change is additive/parallel-path though, so low actual collision risk — just worth a heads-up between the two owning agents).

**Dependencies:** Soft — more valuable after H1 ships (feedback data can inform embedding-retrieval ranking too), but can ship independently against the current keyword-based `scoreChunk()`.

---

### J5 — Cross-agent *model* learning (restored from Round 2, not just shared context)

**Effort: L — genuinely long-horizon, do not schedule into any near-term wave**

**Problem:** Today, one agent's findings (e.g., Hannah's channel-performance data) only ever reach another agent (e.g., Caleb) as human-readable shared context a person or Esther has to act on — no agent's own decision *weights* change automatically based on another agent's outcome data.

**First step (design-only, no code in this pass):** Define what a "weight" even means for the current architecture — `growthAgentBrain.ts`/`calebReasoningSubagents.ts` currently call `runAgentBrainStep()` with prompt-context, not a tunable numeric model. A real version of J5 likely means introducing a small, explicit scoring table (e.g., `channel_performance_weights` keyed by channel + agent) that Hannah's watcher writes to and Caleb's search-scan step reads from as a multiplier — closer to a shared, mutable state table than a "model" in the ML sense. **Recommend Round 3+1 (a future planning pass) scope this properly once H2's structured call-trace data (this document) and G2's attribution data (Phase G, out of scope here) have both been live long enough to know what's actually worth weighting.**

**File-ownership notes:** Not applicable — no files committed to in this pass.

**Dependencies:** Hard dependency on both G2 and H2 shipping and accumulating real data first. **Do not schedule into any execution wave before both prerequisites have live data.**

---

## Summary table

| ID | Item | Effort | Hard dependency | File-ownership conflicts within this doc |
|---|---|---|---|---|
| K1 | Wire media-technique library into copilot brain | S/M | None | None |
| K2 | *(= Phase A7, internal_only tagging)* | S | None | Sequence before H1 |
| K3 | Per-partner communication-preference signal | M | Phase G2 (external) | Same file as A2 (external) |
| K4 | Doctrine repos → agent reasoning | M | Phase C1 (external) | None |
| L1 | Partner referral panel | S/M | None | `PartnerDashboardPage.tsx` before L2 |
| L2 | Lifecycle upsell surface | M | Soft: E1a.3 (external) | `PartnerDashboardPage.tsx` after L1 |
| H1 | pgvector evaluation + scaffold | L | Soft: K2/A7 (tag propagation) | `finelyKnowledgeIndex.ts` (additive) |
| H2 | Structured agent-call trace | M | None | `aiClient.ts` (additive) |
| I1 | Growth/CMO orphan cleanup + merge eval | S/M | None | Route table, sequence with I3 |
| I2 | CRM nesting | — | CLOSED, no action | — |
| I3 | Leads orphan cleanup + consolidation eval | S/M | None | Route table, sequence with I1 |
| I4 | Sitewide/Studio UX overlap check | S | None | None |
| I5 | Mechanical orphan audit (**done in this pass**) | S (execution only) | None | Bundle deletion with I1/I3 |
| J1 | Calendar sync evaluation | M/L | Soft: Phase F1 (external) | None |
| J2 | Explainer video embed | S | Off-platform production | Shared files with Phase B/D (external) |
| J3 | Missed-call text-back | M | Share design with Phase N1 (external) | None |
| J4 | RAG feedback signal | S/M | Soft: H1 | `finelyKnowledgeIndex.ts` (additive) |
| J5 | Cross-agent model learning | L | Hard: G2 + H2 | None — design-only this pass |

**New finding to carry into Deliverable 2:** I5's mechanical audit found a **4th orphaned admin page** (`AdminDashboardLayoutPreview.tsx`) beyond the 3 already known. This should be reflected in Deliverable 2's Phase I section and in the executive summary's "corrected effort estimates" callout.
