# Growth automation charter (owner-facing)

**Spine:** [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md) · **Ship gates:** [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md) (S1–S12)

Finely grows partners at **$0 paid ads** by combining honest outbound search with inbound links from video, SEO, and funnels — all on **one CRM** and **one Results screen**.

---

## One engine, two pipes

| Pipe | What you do | What Finely uses |
|------|-------------|------------------|
| **Outbound** | Esther sets lane + city → Caleb **Find** → review → contact | Serper via `lead-intel` edge (not email scraping) |
| **Inbound** | Hannah tracked links on video, guides, enlightenment | `runLeadCapturePipeline` → CRM tags → Results |

Both pipes must show on **Results** (`/admin/growth-agents/results`) in the same 7-day window.

---

## Three honesty rules

1. **Simulation is labeled** — overnight worker defaults to practice mode until you set `GROWTH_WORKER_LIVE=true` on the edge function.
2. **Missing Serper fails loud** — no fake “found 50 people” when `SERPER_API_KEY` is absent.
3. **Auto-approve only in score bands** — high-confidence rows can skip manual review; every auto decision is logged; exceptions stay in Review.

---

## Agent waves (what “Wave” means)

| Wave | Focus | Your expectation |
|------|--------|------------------|
| **0** | Prove hunt | Caleb Find works; S1–S7 acceptance |
| **1** | Capture | Hannah links on every touch; Esther focus drives Caleb defaults |
| **2** | SEO inbound | Lydia audits public video + funnel routes |
| **3** | Content hooks | Miriam/Jordan packs from pillar video; optional hunt suggestions you approve |
| **4** | Scheduled hunt | Cron + daily import cap — **only after S6 passes and you opt in** |

Do not turn on Wave 4 cron until the S6 manual script passes.

---

## Daily rhythm (15 minutes)

1. Open **Results** — booked, signups, found/saved, replies  
2. **Find** or review queue (Caleb)  
3. Contact or board link for top prospects  
4. Label **good fit / wrong fit** (5+ labels unlock better ranking)  
5. Copy one **Hannah** link for today’s touch  

Failure playbooks live on Caleb/Results when search, replies, or bookings are zero.

---

## Technology (reuse only)

- Discovery: `lead-intel` + Serper  
- Qualify: AI gateway fit check (optional; score-only when off)  
- Rank: ML v1 + your labels  
- Capture: existing lead capture pipeline — no duplicate forms per feature  

Optional paid enrich or ads stay **off** until you choose them in ops (Stage 6).

---

## Compliance

Results vary · not legal advice · funding subject to underwriting
