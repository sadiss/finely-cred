# Finely Cred — unified master plan (execution checklist)

**Single source of truth** for launch gates, Growth S1–S12, restore QA, Video Command OS, and $0 syndication. Extend existing agents and Content Studio — no duplicate routes, agents, or lists.

**North star:** Every workspace answers where am I / what matters / what next · qualified leads at $0 ad spend · honest automation labels · `npm run launch:sprint:status` exit **0** before launch is “green.”

**Compliance (all surfaces):** Results vary · not legal advice · funding subject to underwriting

---

## Glossary (do not mix)

| Term | Meaning |
|------|---------|
| **Plan Stages 0–6** | This doc — docs → launch → growth → restore → video → syndication → ops |
| **Growth S1–S12** | Ship gates in [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md) |
| **Agent Waves 0–4** | Roster maturity in `growthAgentRegistry.ts` — finish Wave 0 + S2–S7 before Wave 4 cron |
| **MASTER Phases 0–22** | Comms/studio (mostly done); Phase 21 live render = optional keys only |

---

## Stage 0 — Docs merge

- [x] [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md) (this file)
- [x] Pointer headers on [`LAUNCH-READY-SPRINT.md`](./LAUNCH-READY-SPRINT.md), [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md), [`GROWTH_AGENT_MASTER.md`](./GROWTH_AGENT_MASTER.md)
- [x] [`GROWTH_AUTOMATION_CHARTER.md`](./GROWTH_AUTOMATION_CHARTER.md) · [`GOOGLE_LABS_VIDEO_PLAYBOOK.md`](./GOOGLE_LABS_VIDEO_PLAYBOOK.md)
- [x] S8–S12 in [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md)
- [x] Fold open todos: Results v1, daily playbook UI, infra strip on Results + Caleb, failure playbooks, week-0 baseline capture

---

## Stage 1 — Launch sprint gates green

**Exit:** `npm run launch:sprint:status` exit **0** · `npm run typecheck` pass · `npm run launch:senior:qa` green (23 paths; dev mock auth when Supabase blank)

- [x] Fix ~10 failing launch audits (Resources anchors, senior UX, tours, portraits, strips, leads tab)
- [x] Resources `#guides` `#monitoring` `#references` `#videos` + lane headers
- [x] PageShell `fc-senior-simple`, FinelyLaunchHelpStrip, onboarding shell
- [x] Tour factory MP4s on Resources; `npm run staff:portraits:check`

Detail: [`LAUNCH-READY-SPRINT.md`](./LAUNCH-READY-SPRINT.md)

---

## Stage 2 — Growth Lead Automation

**2A — S1–S7 (Wave 0 outbound truth)**

- [x] **S2** Results scoreboard 7d (booked, signups, found/saved, video signups, vs baseline)
- [x] **S3/S4** Find → CRM, Review, Hannah UTMs + video `utm_content`, capture attribution on Results
- [x] **S5** ML labels reorder queue (approve +28 / reject -55 on Review + Today’s 10)
- [ ] **S6** Worker simulation vs `GROWTH_WORKER_LIVE` honesty — owner env (see STAGE6_LAUNCH_OPS)
- [x] **S7** Esther week focus → Caleb prefill + pillar video id
- [x] Daily 15-min playbook, infra strip (Caleb; add Results if missing), failure playbooks; Hannah maturity
- [x] Merge Marketing OS Wave 1 Ruth brief — `summarizeGrowthForCoOwner` in `daily_ops`

**2B — Waves 1–4 + S8–S12**

- [x] **S8** Esther focus ↔ Caleb hunt queries; Hannah link from pillar video
- [x] **S9** Public video route in SEO catalog; Lydia pins `/resources/videos`
- [x] **S10** Pillar → Miriam/Jordan strip + Caleb suggest hunt from topics (manual approve)
- [ ] **S11** Live worker: ≤1 job/tick — requires `GROWTH_WORKER_LIVE` + deploy
- [x] **S12** Results week-over-week vs week-0 baseline snapshot

**2C — Lead ↔ video flywheel**

- [x] `VideoCommandRecord` growth fields (UTM, funnel, suggested hunt queries)
- [x] Step 5 Promote: Hannah capture-links with `videoId`; Caleb prefill (no auto-run)
- [x] Results: `videoSignups7d` + outbound metrics on same scoreboard

Detail: [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md) · [`GROWTH_AUTOMATION_CHARTER.md`](./GROWTH_AUTOMATION_CHARTER.md)

**Recommended order:** S2 → S3 → S4 → S7 → S6 → S5 → S8–S12 → 2C (can overlap Stage 4)

**Exit:** S1–S12 manual scripts pass where wired · Wave 0 Caleb maturity ≥80% with Serper tested

---

## Stage 3 — Restore product QA

- [x] Validation → Credit Letters handoff wired — manual smoke on portal
- [x] Coll. & charge-offs tab + restore dock (code shipped) — manual smoke
- [x] [`NEGATIVES_EXTRACTION.md`](./NEGATIVES_EXTRACTION.md) handoff + classification

**Exit:** Partner manual smoke; no P0 bugs · portal letter/dock paths covered by `npm run launch:senior:qa` (re-run after restore UX changes)

---

## Stage 4 — Video Command OS

**Canonical entry:** `/admin/content-studio?room=video` — refactor `VideoStudioPremiumShell` stepper (no new route)

- [x] `VideoCommandRecord` glue linking upload / resource / asset / tour / funnel IDs
- [x] Steps: Import → Understand → Destinations → Publish pack → Promote (Hannah + shorts)
- [x] Studio default Upload; “Voices & sounds”; workflow stepper on upload tab
- [x] Extend Hannah, Miriam, Jordan, Lydia, Esther — no new registry agents
- [x] [`GOOGLE_LABS_VIDEO_PLAYBOOK.md`](./GOOGLE_LABS_VIDEO_PLAYBOOK.md) · [`VIDEO_COMMAND_ACCEPTANCE.md`](./VIDEO_COMMAND_ACCEPTANCE.md)

**Exit:** One dry run: Google Labs MP4 → public Resources + publish pack + Hannah link + shorts copy

---

## Stage 5 — Zero-budget distribution

- [x] Miriam/Jordan pillar strip; Lydia SEO; Resources video lanes + booking CTA
- [x] **Watch how** strip → `/resources/videos` when public demos enabled (`FinelyLaunchHelpStrip`)
- [x] Results inbound `videoSignups7d` by `utm_content`
- [x] [`GROWTH_WEEKLY_RHYTHM.md`](./GROWTH_WEEKLY_RHYTHM.md)

**Exit:** Weekly rhythm locked (1 long + 2 shorts + 3 social) to Esther week focus + S8 pass

---

## Stage 6 — Production ops (owner-assisted)

- [x] [`STAGE6_LAUNCH_OPS.md`](./STAGE6_LAUNCH_OPS.md) checklist (`launch:ops`, worker live flag notes, `launch:senior:qa` block)
- [ ] Optional Phase 21 provider keys — do not block launch
- [ ] Supabase edge deploy when ready for S6 live
- [ ] Owner run: `npm run launch:senior:qa` before production (or trust `launch:preflight` rollup)

**Exit:** Go-live steps documented; no false “live” labels in UI · senior QA green or explicitly waived with human walkthrough ([`SENIOR-QA-WALKTHROUGH.md`](./SENIOR-QA-WALKTHROUGH.md))

---

## Consolidation rules (every PR)

1. New admin route for video/leads? → Reject unless `pageMap` has zero overlap.
2. Second list of same videos or prospects? → Reject; use chips on existing rows.
3. New growth agent in registry? → Reject; extend workspace + `href`.
4. Duplicate Hannah UTM builder? → Reject; `buildLaneAcquisitionUrl` + `videoId`.

**Canonical homes:** Caleb/Find (`marketingDeskHunt` + `lead-intel`) · Hannah UTMs · Esther focus · Lydia SEO · Results scoreboard · Content Studio `room=video` · `runLeadCapturePipeline`.

---

## Parallel lanes (after Stage 0)

| Lane | Stage | Focus |
|------|-------|--------|
| Launch | 1 | Resources, PageShell, tours, portraits |
| Growth-Core | 2A | Hunt, worker, jobs |
| Growth-UX | 2A | Results, playbook, S1–S7 |
| Growth-Automation | 2B | Hannah/Esther/Lydia, S8–S12 |
| Growth-Flywheel | 2C+5 | VideoCommandRecord ↔ Results |
| Restore-QA | 3 | Handoff, dock |
| Video-OS | 4–5 | Shell stepper, agents, Resources lanes |
| Docs | 0 | Charters + acceptance |

Each lane: `npm run typecheck` before handoff · no commit unless owner asks.

---

## Success definition

One plan file · green launch sprint · Growth **S1–S12** with waves **0–4** on **one Results screen** · Video Command connected to Hannah/capture flywheel · restore handoff verified · **$0** paid media unless you opt in later.

**Deferred:** In-app live generative video (Phase 21) · paid Meta/Google · duplicate KPI strips · second Lead Engine · new `/admin/video-command` route.
