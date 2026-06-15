# Role OS 2.0

Role OS 2.0 gives every Finely lane a **command strip** (KPI tiles + primary actions) and an **end-to-end workflow panel** (linked onboarding → daily ops steps).

## Roles & hubs

| Role | Command strip | Workflow panel | Primary hub |
|------|---------------|----------------|-------------|
| Partner (client) | `PartnerCreditRestoreHud` | `client` | `/portal/dashboard` |
| Business credit | `BusinessCommandStrip` | `business` | `/business/dashboard` |
| Credit specialist | `CreditSpecialistHubCommandStrip` | `agent` | `/credit-specialist/hub` |
| Affiliate | `AffiliateCommandStrip` | `affiliate` | `/affiliate/hub` |
| AU seller | `AuSellerCommandStrip` | `au_seller` | `/au-seller/hub` |
| AU buyer | `AuBuyerCommandStrip` | `au_buyer` | `/au/marketplace` |

## Key files

| Purpose | Path |
|---------|------|
| Workflow definitions | `src/config/roleWorkflows.ts` |
| Capability matrix | `src/config/roleCapabilityMatrix.ts` |
| Progress computation | `src/lib/roleWorkflowProgress.ts` |
| Shared workflow UI | `src/components/workflow/RoleWorkflowPanel.tsx` |
| Admin role preview | `/admin/role-preview` — demo progress on workflow panel |

## Marketing chat CTAs

Public service pages wire on-duty staff portraits to `openPublicChat()` via **`MarketingStaffChatStrip`** (`src/components/marketing/MarketingStaffChatStrip.tsx`):

| Page | On-duty role |
|------|----------------|
| Personal credit | Dispute coach |
| Pricing | Solutions advisor |
| Credit specialists | Partner activation specialist |
| Affiliate | Affiliate success specialist |
| Contact / FAQ | Support specialist |
| Enlightenment session | Session coordinator |
| Homepage + tradelines | Credit / tradeline advisor |
| Resources + bookstore | Welcome concierge / education coach |
| Testimonials + events | Credit specialist / session coordinator |
| AU marketplace + request | AU tradeline advisor |
| Agency signup | Agency activation specialist |
| About + pricing service + claim | Advisor / solutions / support specialist |
| Bookstore product + AU orders | Education coach / AU order specialist |
| Checkout + legal + 404 | Tradeline advisor / support specialist |

Lead funnels use the same `openPublicChat()` path from `LeadMagnetFunnelShell`.

## Progress tracking

`computeRoleWorkflowProgress()` marks steps complete from live partner signals (reports uploaded, cases open, business roadmap flags, AU orders, agent client roster, affiliate referral toolkit, AU seller listings, etc.). The workflow panel shows a green check on finished steps and a progress label in the header.

| Role | Progress signals |
|------|------------------|
| Client | journey stage, reports, cases, letters, evidence/tasks/projects |
| Business | roadmap flags from business credit profile |
| Agent | operating model saved, partnership profile, managed client count |
| Affiliate | referral code, active status, campaigns, partner profile |
| AU seller | seller profile, non-draft listings, contract acceptance |
| AU buyer | partner profile, marketplace visit, order count |

## Admin

Open **Admin → Role preview** (`/admin/role-preview`) to inspect routes, entitlements, payouts, and the live workflow for each role tab — including AU buyer.
