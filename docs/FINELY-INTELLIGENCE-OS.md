# Finely Intelligence OS

> The unified AI brain behind Finely Cred — one knowledge layer, one orchestrator,
> proactive guidance on every screen, and a voice-first concierge for non-technical users.

This document is the market narrative **and** the engineering map for Launch Part E.
It explains what ships at launch, where each piece lives, and how the layers connect.

---

## Why this matters

Most platforms bolt on a chatbot. Finely Cred runs an **operating intelligence layer**:
the same brain answers a 68-year-old on the public site, coaches a partner through a
dispute, and ranks an admin's day — all from one cited knowledge base with compliance
guardrails. That is the difference between "we have AI" and "the product is intelligent."

| Enterprise capability | Finely implementation |
|---|---|
| 24/7 AI support team | 19 agent personas + on-duty staff roster + public chat |
| Contextual in-app copilot | `FinelyLaunchHelpStrip` (Ask Finely / Watch how) on every `PageShell` |
| Proactive next-best-action | `FinelyNoticedStrip` + `FinelyNowDoThisStrip` on dashboards & task pages |
| RAG over the whole manual | `finelyKnowledgeIndex` — SOPs + tours + knowledge corpus |
| Persona routing | `pickPersonaForRoute` maps each route to the right specialist |
| Training at scale | Tour manifest + `FinelyTourPlayer` + Help Center |
| Non-tech accessibility | Senior-simple tokens, plain language, "Watch how" everywhere |
| Measurable readiness | `finely_intelligence_wave57` launch gate + `npm run intel:audit` |

---

## Architecture

```
User on any page
      │
      ▼
PageShell ── FinelyLaunchHelpStrip ("Ask Finely" / "Watch how")
      │            │
      │            ▼
      │      finelyBrainOrchestrate()  ◄── pickPersonaForRoute()
      │            │
      │            ├── searchFinelyKnowledge()  ──►  finelyKnowledgeIndex
      │            │                                   ├── PLATFORM_SOP_LIBRARY (SOPs)
      │            │                                   ├── TOUR_MANIFEST (video tours)
      │            │                                   └── getKnowledgeCorpus() (KB + feature map)
      │            │
      │            └── returns { reply, personaId, citations[], tourId?, sopId? }
      │
      ├── FinelyNoticedStrip   ◄── buildPortalNoticedItems() / buildAdminNoticedItems()
      └── FinelyNowDoThisStrip ◄── resolveFinelyPageContext() → SOP steps
```

## The layers

### 1. Knowledge index (RAG) — `src/lib/finelyKnowledgeIndex.ts`

One searchable brain over every operating-manual source. Keyword + token scoring with
**route affinity** so the copilot prioritises chunks that explain the current page. No
vector DB required at launch; `scoreChunk` can be swapped for a Supabase pgvector call
later without touching callers.

- `buildFinelyKnowledgeChunks()` — memoised unified chunk list (SOPs, tours, articles)
- `searchFinelyKnowledge(query, { contextRoute, sources, limit })` — top-k cited hits
- `formatFinelyKnowledgeForPrompt(hits)` — authoritative block for AI system prompts
- `finelyKnowledgeIndexStats()` — counts per source (feeds the launch gate)

### 2. Brain orchestrator — `src/lib/finelyBrain/finelyBrainOrchestrate.ts`

The single entry point for UI AI calls. Resolves page context, picks the right persona,
retrieves cited knowledge, and returns a senior-friendly answer.

- `resolveFinelyPageContext(pathname)` — SOP + tour + persona + suggested prompts
- `pickPersonaForRoute(pathname)` — letter_ops on `/portal/letters`, dispute_coach on
  reports, affiliate_specialist on `/affiliate`, ops_copilot on admin ops, etc.
- `buildFinelyBrainPrompt(input, hits)` — system prompt with senior-mode rules, ready
  for the ai-gateway edge call
- `finelyBrainOrchestrate(input)` — client stub answering offline from the same context

The client stub keeps the experience working with **zero backend dependency**; replacing
its body with an ai-gateway call upgrades every surface at once.

### 3. Contextual copilot — `src/components/tours/FinelyLaunchHelpStrip.tsx`

Mounted globally from `PageShell`. Always-visible **Ask Finely** (plain-English Q&A) and
**Watch how** (launches `FinelyTourPlayer` for the page's tour). Senior-simple sizing.

### 4. Proactive intelligence

- **`FinelyNowDoThisStrip`** (Part D3) — one job per screen. Derives the single next step
  from the page's SOP, with one big button and a small preview of what's next.
- **`FinelyNoticedStrip`** (Part E3) — "Finely noticed…" next-best-action. Powered by
  `finelyProactiveSignals` (`buildPortalNoticedItems`, `buildAdminNoticedItems`) over cheap
  state the dashboards already have (reports, letters, cases, evidence, SLA breaches).

### 5. Help Center — `src/pages/LaunchHelpCenterPage.tsx`

`/help-center` (public) and `/admin/launch-os` (admin). Searchable SOP browser by lane,
tour previews, and — for admins — the live launch-gate panel.

---

## Launch gate & verification

- **Gate:** `finely_intelligence_wave57` in `src/lib/launchChecklistSnapshot.ts` —
  status derives from the unified index chunk count and reports SOP/tour/guide coverage.
- **Audit:** `npm run intel:audit` — verifies every intelligence surface exists and is
  wired (index, orchestrator, persona routing, help strip on PageShell, both proactive
  strips, dashboard wiring, launch gate, tour player).

---

## Roadmap (post-launch)

These are deliberately deferred — they are integrations and scale, not core intelligence:

- ai-gateway edge call behind `finelyBrainOrchestrate` (swap the client stub)
- Supabase pgvector retrieval behind `searchFinelyKnowledge`
- Multi-agent ops chains (dispute coach → letter ops → compliance → processing) with an
  approval queue (Part E4 / E8)
- Affiliate intelligence module — pitch generator, link coach, commission planner (E7)
- Voice-first concierge with STT + senior-slow TTS (E5)
