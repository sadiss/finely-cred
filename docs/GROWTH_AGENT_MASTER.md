# Growth Agents — master guide

> **Execution spine:** [`FINELY_UNIFIED_MASTER_PLAN.md`](./FINELY_UNIFIED_MASTER_PLAN.md) is the single roadmap for launch, growth, and video.
> This guide is the quick path map; acceptance checklists are in [`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md) (S1–S12).
> Automation waves and owner rules: [`GROWTH_AUTOMATION_CHARTER.md`](./GROWTH_AUTOMATION_CHARTER.md).

## Where to go

| Goal | Path |
|------|------|
| **Results (booked + signups)** | `/admin/growth-agents/results` |
| **Find people** | `/admin/growth-agents/lead-discovery` (Caleb Brooks) |
| **Daily workroom** | `/admin/marketing-desk` |
| **Guide links & syndication** | `/admin/growth-agents/capture-links` (Hannah Reed) |
| **This week's focus** | `/admin/growth-agents/marketing-director` (Esther Hayes) |

## Wave 0 (now)

- **Lane:** credit restore only  
- **City:** set on Caleb's page (syncs to Find)  
- **CTA:** Book a session (`/enlightenment-session`)

## Setup

1. Admin Settings → Features: `marketingDesk`, `leadIntel` on  
2. Supabase connected (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`; `npm run env:check`)  
3. Deploy edge functions `lead-intel` and `lead-intel-worker-tick`  
4. **Secrets (Supabase → Edge Functions → Secrets or deploy env):**

   | Function | Variable | Required | Notes |
   |----------|----------|----------|--------|
   | `lead-intel` | `SERPER_API_KEY` | Yes for search | Caleb **Test search** / Find; worker live ticks call this function |
   | `lead-intel-worker-tick` | `GROWTH_WORKER_LIVE` | No | Default unset/false → JSON `mode: simulation` (no counter inflation). Set `true` only when ready for **≤1** real search per tick ([`GROWTH_ACCEPTANCE.md`](./GROWTH_ACCEPTANCE.md) S6, S11) |
   | `lead-intel-worker-tick` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Auto | Injected by Supabase runtime; required when `GROWTH_WORKER_LIVE=true` |

5. Redeploy after secret changes  
6. Caleb → **Test search** → **Find new people** (manual Serper proof before enabling live worker)

## Daily 15 minutes

Use the checklist on Results or Caleb: open Results → find/review → contact → board → label fits.

## Learning (Wave ML v1)

- **Talk** / **Guide** scores on Caleb and Review people  
- **Good fit** / **Wrong fit** on exceptions — stored for ranking (target 5+ labels)

## Acceptance

See `docs/GROWTH_ACCEPTANCE.md` for ship gates S1–S12.

## Worker

Overnight `lead-intel-worker-tick` defaults to **simulation** until `GROWTH_WORKER_LIVE=true` on the function.

## Compliance

Results vary · not legal advice · funding subject to underwriting
