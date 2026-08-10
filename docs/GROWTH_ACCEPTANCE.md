# Growth Agents — acceptance checklist (S1–S12)

> **Execution spine:** [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md) is the single roadmap for launch, growth, and video.
> **One-page matrix:** [`PLAN_COMPLETION_STATUS.md`](./PLAN_COMPLETION_STATUS.md) (code vs owner gates).
> S1–S12 ship gates and manual scripts live here; mirror completion in the unified plan when a step passes.
> Charter for waves and honesty rules: [`GROWTH_AUTOMATION_CHARTER.md`](./GROWTH_AUTOMATION_CHARTER.md).

Ship gates for the [growth master guide](./GROWTH_AGENT_MASTER.md). Run `npm run typecheck` before merging any step. Maturity % should only rise when the step’s manual script passes.

**Compliance (all growth surfaces):** Results vary · not legal advice · funding subject to underwriting

---

## S1 — Growth Agents nav + roster + plain UX shell

| Check | Pass criteria |
|-------|----------------|
| Nav | **Growth Agents** reachable from admin Core nav in ≤2 clicks |
| Roster | `/admin/growth-agents` lists agents with wave badges and plain titles |
| Agent homes | `/admin/growth-agents/:agentId` opens without 404 for Wave 0 agents |
| Wording | Public-facing growth copy uses **partner**, not client/customer |
| Manual | Non-marketer can find **Caleb Brooks · Lead Discovery** without reading docs |

---

## S2 — Caleb L1 truth + Results Scoreboard v1

| Check | Pass criteria |
|-------|----------------|
| Scoreboard | `/admin/growth-agents/results` shows **7d** booked, signups, found/saved, replies |
| Truth | Numbers come from CRM / local stores — **not** hardcoded demo totals |
| Caleb setup | Test search + setup checklist + maturity % reflect real wiring |
| Last run | Caleb shows last Find run summary (search · saved · review · skipped) |
| Manual | Open Results → numbers match what you see on Board / CRM for the same window |

---

## S3 — Find → CRM + Review people + Today’s 10

| Check | Pass criteria |
|-------|----------------|
| Find | **Find new people** (restore lane, city from week focus) saves or stages rows |
| Serper | Missing `SERPER_API_KEY` fails loudly — **no** fake imports |
| Review | Review people queue shows skipped vs approved with honest reasons |
| Today’s 10 | Top-scored prospects list is actionable (contact CTA or board link) |
| Manual | Complete one Find cycle: ≥1 saved row **or** one approved review row |

---

## S4 — Hannah link + attribution on every touch

| Check | Pass criteria |
|-------|----------------|
| Capture links | Hannah workspace exposes copy-ready links with UTM parameters |
| Pipeline | Public funnel signups land in CRM via [`runLeadCapturePipeline`](../src/lib/leadCapturePipeline.ts) |
| Attribution | Signups visible on Results / Desk with lane or campaign tags |
| Booking | `/enlightenment-session` smoke test completes without error |
| CRM booked | After strategy-call submit, inbound lead on **Board / Leads OS** shows stage **booked** (via [`syncInboundLeadSessionBooked`](../src/lib/crmLeadSync.ts) on [`runLeadCapturePipeline`](../src/lib/leadCapturePipeline.ts)) |
| Results | **Booked calls (7d)** on `/admin/growth-agents/results` increments for that lead (same `booked` stage on `inbound_lead` records) |
| Manual | One touch uses Hannah link; signup or tag appears in CRM within the session |

### S4 smoke — enlightenment session → CRM booked

1. Optional: open `/enlightenment-session?utm_source=hannah&utm_medium=growth&utm_campaign=acceptance_s4` (or copy link from Hannah workspace).
2. Fill name, email, phone; pick a slot; submit **Request free session** (use a fresh email if testing free-slot copy).
3. Confirm success banner (local save is OK when Supabase is not configured).
4. **Admin → Leads OS / CRM Board** — find the inbound lead by email; stage must be **booked** and tags include `session:booked`.
5. **Admin → Growth Agents → Results** — **Booked calls (7d)** includes this row (refresh if the tab was already open).
6. `npm run typecheck` passes.

---

## S5 — ML v1 dual scores + labels

| Check | Pass criteria |
|-------|----------------|
| Rank | Prospect queue order changes after **good fit / wrong fit** labels |
| Scores | Fit + intent (or dual score) visible on review / today’s 10 |
| Governance | Debt/sensitive lanes respect review gates where specified |
| Manual | Label three rows; confirm queue reorder or score shift |

---

## S6 — Real nightly worker (no fake tick)

| Check | Pass criteria |
|-------|----------------|
| UI | [`GrowthAgentInfraStrip`](../src/features/growthAgents/GrowthAgentInfraStrip.tsx) on Caleb + Results — **Test worker** button |
| Client | [`runGrowthWorkerTickTest`](../src/features/growthAgents/growthWorkerTick.ts) invokes `lead-intel-worker-tick` and persists last probe locally |
| Default | `lead-intel-worker-tick` returns `mode: simulation` and **does not** inflate counters |
| Live flag | `GROWTH_WORKER_LIVE=true` attempts one minimal `lead-intel` search per tick |
| Honesty | Overnight / swarm UI labels practice vs live (no implied Serper imports in simulation) |
| Results | When live succeeds, overnight activity appears on Results or job row — not phantom +3 ticks |
| Manual | Caleb or Results → **Find infrastructure** → **Test worker** → JSON shows `mode: simulation` and `processed: 0` when `GROWTH_WORKER_LIVE` is off; with live on + Serper, ≥0 real results logged |

---

## S7 — Esther week focus + lane lock

| Check | Pass criteria |
|-------|----------------|
| Focus | `/admin/growth-agents/marketing-director` sets **one** active lane + city |
| Sync | Caleb Find defaults match Esther’s week (lane + city) |
| Lock | Wave 0 UI shows **credit restore** only where lane lock applies |
| Manual | Change week focus → Caleb Find prefill updates on refresh |

---

## Global QA (every step)

- [ ] `npm run typecheck` passes
- [ ] Feature flags: `marketingDesk`, `leadIntel` documented in setup
- [ ] Daily 15-minute playbook completable once on Results or Caleb
- [ ] Failure playbooks reachable when search/replies/bookings are zero

---

## S8 — Esther focus + hunt query pack + video attribution

| Check | Pass criteria |
|-------|----------------|
| Focus sync | Change Esther week focus → Caleb Find **query pack** matches lane (`buildHuntQueries` for that lane) |
| City | Caleb `location` prefill updates on refresh after focus change |
| Video link | One **Hannah** link from the latest **public** video appears on Results within the **7d** window |
| Manual | Set focus → refresh Caleb → run Test search → confirm query language matches lane; copy video Hannah link → Results shows attributable touch |

---

## S9 — Lydia SEO + public video route

| Check | Pass criteria |
|-------|----------------|
| Catalog | Public video route has an entry in [`publicSeoCatalog`](../src/data/publicSeoCatalog.ts) (or linked resource video id) |
| Audit | Lydia workspace SEO audit for that path shows **≤2** warnings |
| No paid | Lydia Wave 2 does not surface Meta/Google spend controls |
| Manual | Publish one resource video public → open Lydia → run audit on path → ≤2 warnings |

---

## S10 — Pillar video → Miriam pack + optional hunt

| Check | Pass criteria |
|-------|----------------|
| Publish | One **pillar** video reaches Promote step (or equivalent Video Command lifecycle) |
| Miriam | Shorts + social copy pack generated with **Hannah** link included |
| Hunt | Optional **approved** hunt job: query derived from `keyTopics[0]` + Esther **city** — no auto-run without owner click |
| Manual | Complete pillar flow → Miriam pack copied → optional Caleb prefill with suggested query (not silent enqueue) |

---

## S11 — Live worker cron (strict)

| Check | Pass criteria |
|-------|----------------|
| UI | Same **Test worker** on [`GrowthAgentInfraStrip`](../src/features/growthAgents/GrowthAgentInfraStrip.tsx) — compact sidebar shows last probe via [`getLastGrowthWorkerProbe`](../src/features/growthAgents/growthWorkerTick.ts) |
| Flag | `GROWTH_WORKER_LIVE=true` on `lead-intel-worker-tick` |
| Cap | One cron tick processes **≤1** job |
| Activity | Writes a **real** activity / job row when Serper succeeds |
| Honesty | Does **not** increment phantom overnight or “swarm +N” counters |
| Manual | **Test worker** on Caleb/Results infra strip with live on → JSON `mode: live` (or job-empty message) + sidebar line on Caleb; verify ≤1 job and logged outcome — no phantom overnight counters |

---

## S12 — Results week-over-week vs baseline

| Check | Pass criteria |
|-------|----------------|
| Baseline | **Week-0** snapshot stored (local store until warehouse exists) |
| Compare | Results scoreboard shows week-over-week vs baseline for core metrics (booked, signups, found/saved) |
| Manual | Record baseline → advance one week of activity → Results comparison reflects delta honestly |

---

See also: [`GROWTH_AGENT_MASTER.md`](./GROWTH_AGENT_MASTER.md) · [`GROWTH_AUTOMATION_CHARTER.md`](./GROWTH_AUTOMATION_CHARTER.md)
