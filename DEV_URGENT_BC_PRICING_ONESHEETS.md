# URGENT — Business Credit pricing, one-sheets, Lead Engine

Branch: `preview/sitewide-ux-pack-merge` (do not create a new branch)

## What shipped

### Four-tier Business Credit stickers
| Tier | Price |
|------|-------|
| Foundation | $2,997 |
| Builder | $5,997 |
| Elite | $12,997 |
| Empire | $24,997 |

Source: `src/config/pricingCatalog.ts` → `businessCreditPackages`  
Quote engine: `src/config/businessCreditQuoteEngine.ts`  
UI: `/pricing/business-credit` → work-calibrated quote + one-sheets

### One-sheets (PDF download)
`src/resources/buildBusinessCreditOneSheetPdf.ts` · panel on pricing BC page  
Overview · Foundation · Builder · Elite · Empire · Compare · Named cards

### Business Credit OS
Destination cockpit + named card tracker on `/business/dashboard`  
`src/components/business/BusinessCreditDestinationCockpit.tsx`

### One-button Lead Engine (REAL leads)
`/admin/lead-intel` → **Start Lead Engine** (top)  
Calls edge `lead-intel` (Serper) → CRM prospects tagged `lead-engine`  
Requires: Feature flag `leadIntel`, `SERPER_API_KEY` on edge, `npm run deploy:functions` if edge outdated  
Deep swarm below is **simulation cadence** — not live imports

### Stripe
Map new Stripe Price IDs to package ids when ready (`stripePriceId` on each package). Until then, checkout may use catalog amounts / in-house rail.

## Copy/paste to developer

```
URGENT — BC 4-tier pricing + one-sheets + Lead Engine

1) Pull preview/sitewide-ux-pack-merge
2) Read DEV_URGENT_BC_PRICING_ONESHEETS.md + docs/PLAN_MARKETING_AGENT_OS_50.md
3) Pricing: /pricing/business-credit (quote + PDF one-sheets)
4) Portal BC: /business/dashboard (destination + named cards)
5) Leads: /admin/lead-intel → Start Lead Engine (needs SERPER_API_KEY + leadIntel flag)
6) Wire Stripe price IDs for business_foundation|builder|elite|empire
```
