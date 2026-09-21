# Partner prospecting — audit (Lead Intel vs Sanz target)

**Target (Sanz):** ~45–50 **strong B2B partners** per batch across many metros, with **phone + email**, ICP fit, deduped.

## What exists today

| Surface | Location | Capability |
| --- | --- | --- |
| **Lead Intelligence Agent** | `/admin/lead-intel` | Serper search via `supabase/functions/lead-intel`, limit **1–20**/query, enrich emails/phones from public pages, robots check, score 0–100, import to CRM Prospects |
| **CRM Prospects** | `/admin/crm` | `createProspect`, `findProspectByWebsite` dedupe by website URL |
| **Templates** | `AdminLeadIntelPage` | Single-location US templates (clients, affiliates, agents, teams, AU, B2B) |
| **Feature flag** | `leadIntel` in settings | Gate |
| **Geo Scanner / Caleb Find / Partner Prospector** | — | **Not found** as separate modules in this repo snapshot |

## Gaps vs target

| Gap | Severity |
| --- | --- |
| **20 result cap** per Serper call (API + edge function) | High — need multi-query batching for ~50 |
| **Single metro per run** | High — need multi-metro loop with dedupe |
| **No hard require phone+email** filter in UI | Medium — score bumps contact but does not filter |
| **No persistent cross-batch domain dedupe** beyond CRM website match | Medium |
| **No ICP preset for “credit restore partner / agency”** beyond generic B2B template | Low |
| **Rate limit** 10/min/user on edge | Ops — batch must throttle |

## Shipped in this PR (client-side)

- **Multi-metro batch** runner on Lead Intel UI (sequential queries, merge, domain dedupe).
- **Require phone + email** toggle for selection/import.
- **Target batch size** guidance (~50).

## Continue next (see IMPLEMENTATION_SPEC)

- Edge function `batch` mode with shared dedupe cache (KV).
- Partner Prospector saved searches per metro.
- Export CSV + Caleb/Bot agent webhook handoff.

---

*Internal ops doc. Comply with CAN-SPAM/TCPA and search API terms.*
