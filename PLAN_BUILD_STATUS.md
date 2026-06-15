# Finely Cred — Build Status & Roadmap

**Active master plans (2026-06):**

| Plan | Status | File |
|------|--------|------|
| **Finely OS 400%** | `tier238_complete` — Work OS + CRM OS + Lead Growth | [`.cursor/plans/FINELY-OS-400-MASTER.plan.md`](.cursor/plans/FINELY-OS-400-MASTER.plan.md) |
| **Staff OS Full Throttle** | `complete` — roster, chat handoff, funnels, hands-free ops | [`staff_os_full_throttle_bd88ec68.plan.md`](../../.cursor/plans/staff_os_full_throttle_bd88ec68.plan.md) (Cursor plans) |

**Operator deploy (Staff OS Phase 12B):** Apply `supabase/LIVE_SETUP_run_all.sql` (includes `staff_members`), `npm run deploy:functions`, enable **Automation Autopilot** in Admin → Settings. See [`docs/STAFF_OS.md`](docs/STAFF_OS.md).

**Platform Master Plan (46-phase):** Most core phases (0–13) are implemented in code — PDF guides, voice studio, staff OS, funnels, nurture, social hub, leads OS, automations. Stale plan todos in Cursor; see [`docs/VOICE_STUDIO_API.md`](docs/VOICE_STUDIO_API.md) for voice + staff integration.

**Status update (2026-02-10):** The integrated plan in `.cursor/plans/integrated_pending_master_plan_2026-02-10.plan.md` has been implemented and `npm run build` is passing. The remaining items below are primarily **operator configuration** (e.g. adding Denefits contract URLs) rather than code work.

## Recently Completed

### 1. Multi-Tenant Security Foundation ✅

**Files created/updated:**
- `src/domain/tenants.ts` — Tenant & Membership types, roles, permissions
- `src/data/tenantsRepo.ts` — CRUD for tenants and memberships with permission helpers
- `src/domain/partners.ts` — Added `tenantId` field to Partner
- `src/data/partnersRepo.ts` — Added tenant-scoped queries (`listPartnersByTenant`, `getPartnerInTenant`)
- `src/domain/audit.ts` — Added `tenantId` to audit events
- `src/data/auditRepo.ts` — Added tenant-scoped audit queries

**Key concepts:**
- **Finely Cred primary tenant** (`tenant_finely_primary`) — your direct consumers
- **Agency tenants** — white-label partners get their own isolated workspace
- **Roles**: `platform_admin`, `tenant_owner`, `agent`, `partner`
- **Partners are scoped** — a partner belongs to exactly one tenant

---

### 2. Pricing Catalog — Single Source of Truth ✅

**File:** `src/config/pricingCatalog.ts`

**Categories:**
| Category | Packages |
|----------|----------|
| Personal Credit | Starter ($297), Restore ($1,497), Platinum ($2,497) |
| Business Credit | Foundation ($997), Builder ($1,997), Elite ($3,997) |
| Debt & Legal | Defense Kit ($197), Summons Response ($497), Full Resolution ($997) |
| Privacy & ID | Essentials ($97), Pro ($297) |
| Bundles | Clean Slate ($1,997), Total Transformation ($3,997) |
| Tradeline Promos | Starter ($497), Boost ($797), Max ($997) |
| Agency Tiers | Solo ($97/mo), Growth ($247/mo), Pro ($497/mo), Enterprise (custom) |

**Payment rails:**
- `stripe` — Standard card/bank (3-6 month plans)
- `in_house` — Denefits financing (reports to Equifax)
- `both` — Customer chooses

**Tradeline Promo packages** are `in_house` only — designed to:
1. Place authorized user tradelines
2. Report the Denefits payment as a primary installment to Equifax
3. Include bonus value (ebook, strategy guide, consultation)

---

### 3. Billing Domain Updates ✅

**File:** `src/domain/billing.ts`, `src/data/billingRepo.ts`

- Added `tenantId` to `BillingAccount`, `Agreement`, `Entitlement`
- Added `packageId` and `amountCents` to `Agreement` (replaces legacy productId/priceOptionId)
- New functions:
  - `createAgreementFromPackage()` — creates agreement from catalog package
  - `grantEntitlementsFromPackage()` — grants all entitlement keys from a package
  - `hasEntitlement()` — checks if partner has active entitlement

---

### 4. Security & Legal Foundation ✅

**Files:**
- `SECURITY.md` — High-level security overview and threat model
- `docs/SECURITY_ARCHITECTURE_SUPABASE.md` — Vault-grade architecture blueprint
- `src/App.tsx` — Production guard (requires Supabase in production)
- `src/pages/legal/TermsPage.tsx` — Strengthened legal language
- `src/pages/legal/PrivacyPage.tsx` — Data handling clarity
- `src/pages/legal/DisclaimerPage.tsx` — Educational tools disclaimer

---

### 5. Admin Settings System ✅

**Files:**
- `src/domain/settings.ts` — Settings types (Stripe, Denefits, features, webhooks)
- `src/data/settingsRepo.ts` — CRUD for all settings with persistence
- `src/pages/admin/AdminSettingsPage.tsx` — Full settings UI with tabs

**Admin Settings Features:**
- **Site tab**: Brand name, logo URL, support email, colors
- **Stripe tab**: Publishable/secret keys, webhook secret, test mode toggle
- **Denefits tab**: Merchant ID, API key, webhook URL, contract URL mappings per package
- **Features tab**: Toggle Stripe, Denefits, messaging, AU marketplace, etc.
- **Security tab**: Admin allowlist display, webhook security notes

**Key benefit**: You can configure API keys, webhooks, and Denefits contract URLs directly from the admin panel — no code changes needed.

---

### 6. Checkout Flow Update ✅

**File:** `src/pages/portal/PartnerCheckoutPage.tsx`

- Uses new pricing catalog instead of legacy billing products
- Pulls Denefits contract URLs from admin settings
- Supports URL params (e.g., `/portal/checkout?package=personal_restore&rail=in_house`)
- Shows appropriate payment rails based on feature flags
- Denefits embed flow with credit-building messaging

---

## Next Steps (Priority Order)

### Partner Portal polish (NEW)

- **Partner Overall Score (0–100)**: route-aware (personal-only, business-only, both), computed breakdown + top improvements.
  - Shows on: `/portal/dashboard`, `/portal/checklist`, `/admin/partners/:id` (overview)
- **Cinematic 3D Roadmap + Action Console**: true WebGL view with safe fallbacks (reduced motion / WebGL unavailable).
  - Replaces the old “Now → Next → Later” cards with a premium two-column console on the partner dashboard.

### Phase 1: Pricing UI & Checkout (Next)

1. **Public Pricing Page** (`/pricing`)
   - Display all categories with tabs/sections
   - Show both Stripe and "Get Financed" (Denefits) options
   - Badge highlights (Most Popular, Best Value, etc.)

2. **Personal Credit Landing** (`/personal-credit`)
   - Premium "platinum-style" presentation
   - Feature comparison table
   - CTA to checkout

3. **Partner Checkout Flow**
   - Wire `pricingCatalog` into `PartnerCheckoutPage`
   - Show package details from catalog
   - Stripe checkout integration
   - Denefits embed integration (contract URLs)

4. **Homepage Promotion**
   - Add "In-House Financing" section
   - Highlight: "Build credit while you pay"
   - Link to tradeline promo packages

### Phase 2: Agency & White-Label

1. **Agency Signup Flow**
   - Tier selection page
   - Team seat management
   - Custom branding setup

2. **Agency Dashboard**
   - Client file management (tenant-scoped)
   - Agent assignment
   - Billing overview

3. **White-Label Portal**
   - Custom domain support
   - Logo/color customization
   - Branded client experience

### Phase 3: Admin Enhancements

1. **Global Task Creator**
   - Admin can create tasks for any partner
   - Batch task assignment

2. **Calendar Events**
   - Admin can create standalone events (webinars, office hours)
   - Public events page (`/events`)

3. **Permission Management**
   - Role assignment UI
   - Agent-to-client assignment

### Phase 4: Credit Intelligence Expansion

1. **Wealth Paths Skeleton**
   - Lane-based progress tracking
   - Milestone unlocks

2. **UCC/Legal Resources**
   - UCC Article 3 guide
   - "Strawman" myth-busting educational content

3. **Enhanced Report Analysis**
   - Deeper scoring insights
   - Automated dispute suggestions

---

## Admin Settings (NEW)

All integration configuration is now done through the Admin Settings page:

**Navigate to:** `/admin/settings`

### Tabs Available:
1. **Site** — Brand name, logo, support email, colors
2. **Stripe** — API keys, webhook secret, test/live mode
3. **Denefits** — Merchant ID, API key, webhook URL, contract URL mappings
4. **Features** — Enable/disable modules (Stripe, Denefits, messaging, etc.)
5. **Security** — Admin access list, webhook security notes

### Denefits Contract URL Mapping

Instead of editing code, you can now map Denefits contract URLs directly in the admin panel:

1. Go to `/admin/settings` → **Denefits** tab
2. Scroll to "Contract URLs by Package"
3. Click "Add Contract URL" next to each package
4. Paste the Denefits embed URL
5. Click Save

The checkout flow automatically pulls the correct URL for each package.

**Packages needing Denefits contracts:**
- [ ] `tradeline_starter` — $497
- [ ] `tradeline_boost` — $797
- [ ] `tradeline_max` — $997
- [ ] `personal_starter` — $297 (if offering financing)
- [ ] `personal_restore` — $1,497
- [ ] `personal_platinum` — $2,497
- [ ] `business_foundation` — $997
- [ ] `business_builder` — $1,997
- [ ] `business_elite` — $3,997
- [ ] `debt_summons_response` — $497
- [ ] `debt_full_resolution` — $997
- [ ] `bundle_personal_debt` — $1,997
- [ ] `bundle_total_transformation` — $3,997

---

## Architecture Notes

### Tenant Model
```
Tenant (workspace)
├── Memberships (user ↔ tenant ↔ role)
├── Partners/Clients (belong to tenant)
├── Cases, Tasks, Evidence, etc. (all tenant-scoped)
└── Billing (agreements, entitlements)
```

### Data Flow (Future with Supabase)
1. User logs in → Supabase Auth
2. App fetches memberships → determines tenant context
3. All queries include `tenant_id` filter (RLS enforced)
4. Documents stored in `vault` bucket with tenant/partner path
5. Downloads use signed URLs (short TTL)

### Security Layers
1. **Auth** — Supabase Auth with MFA for admins
2. **Authorization** — Membership roles + RLS
3. **Data isolation** — Every row has `tenant_id`
4. **Document security** — Private buckets, signed URLs
5. **Audit** — All sensitive actions logged
