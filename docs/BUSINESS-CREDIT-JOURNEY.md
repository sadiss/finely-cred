# Business credit journey (PR #28)

## Routes

| URL | Status | Component |
|-----|--------|-----------|
| `/business-credit` | **SHIPPED** | `BusinessCreditJourneyPage` (6-step guided UI) |
| `/services/business-credit` | **SHIPPED** | Same journey (parity) |
| `/pricing/business-credit` | **SHIPPED** | Same journey (parity) |
| `/business/dashboard` | **SHIPPED** | `BusinessCreditJourneyCoachPanel` (staff map) |
| `/business/profile`, `/business/vendors`, `/business/bureaus` | **SHIPPED** | Step CTAs deep-link to existing portal pages |

## Six steps (public + coach)

1. **Foundation** — entity, EIN, address  
2. **Business profile & industry** — NAICS, structure  
3. **Business credit file** — D&B / Experian Biz / Equifax Biz (education only)  
4. **Tradelines & net-30 vendors** — vendor path + optional packages  
5. **Personal guarantee link** — `/start` + personal restore handoff  
6. **Monitoring** — `/funding-readiness`, enlightenment session  

Progress: `localStorage` key `finely.businessCredit.journey.v1` (checklist %).

## Honesty

- No guaranteed scores, approvals, or funding.  
- No Nora branding on Finely-primary journey.  
- Packages on steps 4+ are existing `businessCreditPackages` catalog.

## PARTIAL / MISSING

| Item | Status |
|------|--------|
| Server-persisted journey per partner | **PARTIAL** — local browser only; portal roadmap still partner-scoped in `businessCreditRepo` |
| Automated bureau pulls | **MISSING** — education + manual checklist only |
