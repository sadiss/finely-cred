# Business credit journey (PR #28)

## File map

| Area | Path | Status |
|------|------|--------|
| Canonical 7 steps | `src/domain/businessCreditJourney.ts` | **SHIPPED** |
| Portal step rail + guide | `src/components/business/BusinessJourneyShell.tsx` | **SHIPPED** |
| Journey home dashboard | `src/pages/business/BusinessDashboardPage.tsx` | **SHIPPED** |
| Ladder seeds (7 tasks) | `src/business/businessCreditLadder.ts` | **SHIPPED** |
| Ladder UI | `src/components/business/BusinessCreditLadderPanel.tsx` | **SHIPPED** |
| Micro-roadmap (10 steps) | `src/domain/businessCredit.ts`, `BusinessCreditRoadmapPanel.tsx` | **SHIPPED** (synced via `JOURNEY_TO_ROADMAP`) |
| Partner persistence | `src/data/businessCreditRepo.ts` (`journey`, `setJourneyStepDonePortal`) | **SHIPPED** |
| Anonymous progress | `src/data/businessCreditJourneyProgress.ts` | **SHIPPED** |
| Public journey | `src/pages/public/BusinessCreditJourneyPage.tsx` | **SHIPPED** |
| Coach panel | `src/components/business/BusinessCreditJourneyCoachPanel.tsx` | **SHIPPED** |

## Routes

| URL | Status | Notes |
|-----|--------|-------|
| `/business/dashboard` | **SHIPPED** | Journey home — KPI row, next action, blockers |
| `/business/profile` | **SHIPPED** | Steps 1–2 (`?journey=foundation` \| `profile_industry`) |
| `/business/bureaus` | **SHIPPED** | Step 3 |
| `/business/vendors` | **SHIPPED** | Step 4 |
| `/business/funding`, `/business/lender-logic` | **SHIPPED** | Step 5 |
| `/business/documents`, `/business/disputes`, `/business/billion-path` | **SHIPPED** | Step 6 workspace |
| `/start` (from step 7) | **SHIPPED** | Personal credit / Restore handoff |
| `/business-credit` | **SHIPPED** | Public 7-step preview |
| `/services/business-credit` | **SHIPPED** | Same component (eager route) |
| `/pricing/business-credit` | **SHIPPED** | Journey + packages |
| `/business-credit-solutions` | **SHIPPED** | Redirect → pricing journey |

## Seven-step rail (portal + public)

1. **Foundation** — entity, EIN, address  
2. **Profile & industry** — NAICS, structure, operating story  
3. **Bureau files** — D&B / Experian Biz / Equifax Biz (education; manual snapshots only)  
4. **Tier-1 vendors / net-30** — reporting-first sequence  
5. **Revolving & fleet** — lender logic when ready  
6. **Docs & funding package** — vault, disputes, Billion Path adjunct  
7. **Personal credit link** — honest PG handoff to Finely Restore (`/start`)

Progress when signed in: `BusinessCreditProfile.journey` in `finely.business_credit.v1`.  
Anonymous checklist: `finely.businessCredit.journey.v1`. Marking done in portal updates both journey and mapped roadmap ids.

## Honesty

- No guaranteed scores, approvals, or funding.  
- Bureau step documents only — no fake PAYDEX or instant file claims.  
- Step 7 explicitly routes personal restore; no Nora branding on Finely-primary journey.

## PARTIAL / MISSING

| Item | Status |
|------|--------|
| Automated bureau pulls | **MISSING** — education + manual snapshots |
| Step 7 in-portal PG wizard | **PARTIAL** — CTA to `/start`; no embedded personal dispute UI |
| Server-side journey API | **PARTIAL** — local JSON store per browser (partner-scoped) |
| Industry-specific vendor packs | **MISSING** — generic Tier-1 sequencing only |
