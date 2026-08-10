# Plan completion status (one page)

**Spine:** [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md) · **Owner runbook:** [`STAGE6_LAUNCH_OPS.md`](./STAGE6_LAUNCH_OPS.md)

**Legend**

| Code | Owner gate |
|------|------------|
| Merged in repo; `npm run typecheck` + `npm run launch:sprint:status` exit **0** | Your env, Supabase deploy, flags, or human QA before production is “green” |

**Compliance (all surfaces):** Results vary · not legal advice · funding subject to underwriting

---

## Plan stages 0–6

| Stage | Name | Exit criteria (summary) | Code | Owner gate |
|-------|------|-------------------------|:----:|:----------:|
| **0** | Docs merge | Unified plan + charter pointers; S8–S12 in acceptance doc | [x] | — |
| **1** | Launch sprint | `launch:sprint:status` **0** · `typecheck` · launch audits green | [x] | Senior QA before prod (see below) |
| **2** | Growth automation | S1–S12 wired; Results scoreboard; Wave 0 maturity path | [x] | S6/S11 live worker smoke |
| **3** | Restore QA | Validation → letters handoff; dock tab shipped | [x] | Partner manual smoke on real data |
| **4** | Video Command OS | Studio stepper + `VideoCommandRecord` glue | [x] | One dry-run MP4 → public Resources |
| **5** | $0 distribution | Miriam/Lydia lanes; week rhythm doc | [x] | Lock weekly rhythm with Esther focus |
| **6** | Production ops | Ops doc + honesty rules; no false “live” UI | [x] | Deploy · keys · go-live QA |

---

## Growth ship gates S1–S12

| Gate | Title | Exit criteria (summary) | Code | Owner gate |
|------|-------|-------------------------|:----:|:----------:|
| **S1** | Nav + roster | Growth Agents ≤2 clicks; Wave 0 homes load | [x] | — |
| **S2** | Results 7d | Booked, signups, found/saved from real stores | [x] | — |
| **S3** | Find → CRM | Find cycle; Serper fails loud without key | [x] | Serper key for real hunt |
| **S4** | Hannah + attribution | UTM links; enlightenment → CRM **booked** | [x] | One live signup smoke |
| **S5** | ML labels | Queue reorder on good/wrong fit | [x] | Label 3 rows manual |
| **S6** | Worker honesty | Default `mode: simulation`; no phantom counters | [x] | **Test worker** JSON + live flag smoke |
| **S7** | Esther week focus | Lane + city → Caleb prefill | [x] | — |
| **S8** | Focus ↔ hunt pack | Query pack matches lane; video Hannah on Results | [x] | — |
| **S9** | Lydia SEO | Public video in SEO catalog; ≤2 audit warnings | [x] | Publish + audit one path |
| **S10** | Pillar → Miriam | Promote pack + optional hunt prefill (no auto-run) | [x] | Complete one pillar flow |
| **S11** | Live worker cron | ≤1 job/tick when live | [x] | **Deploy tick** + `GROWTH_WORKER_LIVE=true` |
| **S12** | WoW vs baseline | Week-0 snapshot + comparison on Results | [x] | Record baseline once |

Detail and manual scripts: [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md)

---

## Owner-only gates (production green)

These do **not** block merging code; they block calling production launch complete.

| Gate | What you do | Blocks |
|------|-------------|--------|
| **Supabase deploy** | `lead-intel` + `lead-intel-worker-tick` with `SERPER_API_KEY` on `lead-intel` | S6/S11 live behavior in prod |
| **S6 smoke** | Caleb/Results infra → **Test worker** → JSON `mode: simulation` when live off | False confidence in overnight counts |
| **S11 live** | Set `GROWTH_WORKER_LIVE=true` only after deploy; verify ≤1 job/tick | Paid Serper spend + cron side effects |
| **Phase 21 keys** | Optional in-app cinematic providers — **does not block launch** | In-app generative video only |
| **Senior QA** | `npm run launch:senior:qa` (23 paths; mock portal auth if no keys) | Go-live without UX regression check |
| **Restore smoke** | Portal handoff + dock on partner account | P0 restore bugs in prod |
| **Video dry run** | Google Labs MP4 → Content Studio → Resources + Hannah link | Video flywheel untested |

**Rollup commands:** `npm run launch:preflight` · `npm run launch:ops` · [`STAGE6_LAUNCH_OPS.md`](./STAGE6_LAUNCH_OPS.md) pre-push checklist

---

## Quick code gate (CI / pre-merge)

```powershell
npm run typecheck
npm run launch:sprint:status
```

Exit **0** on both = code track green. Owner gates remain open until Stage 6 checklist is done.
