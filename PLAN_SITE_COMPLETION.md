# Finely Cred – Site Completion Plan

**Goal:** Finish the site so it is unified, compliant, secure, and delivers a great partner journey. This plan covers Compliance, Security, Admin Control/Settings, Affiliate, Communication Hub, Denefits & Payments, and all remaining pages/modules.

**Status update (2026-02-10):** The build sequence in `.cursor/plans/integrated_pending_master_plan_2026-02-10.plan.md` has been implemented and the app builds cleanly. This document is kept for reference, but many items below are now complete.

---

## 1. Current State Summary

### 1.1 What’s Built (Real Pages / Flows)

| Area | Route(s) | Status |
|------|-----------|--------|
| **Public** | `/`, `/tradelines`, `/about`, `/resources`, `/bookstore`, `/bookstore/:id` | Live |
| **Auth** | `/onboarding` (modal), `/dashboard` (MasteryOS) | Live |
| **Partner Portal** | `/portal/dashboard`, `/portal/checklist`, `/portal/reports`, `/portal/disputes`, `/portal/disputes/:id`, `/portal/tasks`, `/portal/documents`, `/portal/education`, `/portal/messages`, `/portal/billing` | Live (billing/messages are shells) |
| **Business Portal** | `/business/dashboard`, `/business/profile`, `/business/vendors`, `/business/funding`, `/business/documents` | Live (content varies) |
| **AU** | `/au/marketplace`, `/au/request`, `/au/orders` | Live |
| **Admin** | `/admin/partners`, `/admin/partners/:id`, `/admin/cases` | Live |

### 1.2 What’s Placeholder Only

- **Public:** fix-my-credit, build-my-credit, debt-summons-help, services, personal-credit, business-credit, funding-readiness, diy-academy, blog, testimonials, **affiliate**, events, contact, faq, pricing, **terms**, **privacy**, **disclaimer**
- **Auth:** login, signup, forgot-password (standalone pages; onboarding is the main flow)
- **Portal:** debt, debt/:id, build, identity-theft, escalations → currently hit generic PlaceholderPage
- **Admin:** `/admin` (dashboard), templates, products, cms, analytics, **settings**

### 1.3 Explicitly “Later Phase” in Code

- **Partner Billing:** “Payments, Denefits, and Stripe wiring come in later phases”; lists Stripe payment methods, Denefits status, receipts
- **Partner Messages:** “Live in-app messaging will be wired in a later phase”; “in-app threads, file attachments, escalation tags, response SLAs”
- **Profile & Billing:** “Phase 5 will add secure profile edits, identity verification, PII-safe handling”

---

## 2. Module-by-Module Completion Plan

### 2.1 Compliance

| Item | Current | Target |
|------|--------|--------|
| **Legal pages** | Terms, Privacy, Disclaimer → PlaceholderPage | Real pages: Terms of Service, Privacy Policy, Disclaimer (copy + layout; no backend) |
| **FCRA / Metro2 mentions** | Used in dispute copy and portal copy | Keep; add a short “Compliance” or “Legal” subsection in footer and/or Profile & Billing |
| **Partner-facing compliance** | Checklist mentions bureau responses, creditor correspondence | Add a “Compliance & consent” block on Profile & Billing: consent to communication, data use, dispute process; optional “I have read Terms/Privacy” |
| **Admin compliance** | None | Optional: Admin Settings → “Compliance” tab (links to legal pages, last updated dates, CCPA/FCRA checklist for internal use) |

**Deliverables:** Terms page, Privacy page, Disclaimer page; optional compliance subsection in Profile & Billing; optional Admin compliance tab.

---

### 2.2 Security

| Item | Current | Target |
|------|--------|--------|
| **Auth** | Supabase + dev fallback; onboarding stores draft in localStorage | Keep; add Forgot Password flow if we add dedicated login/signup pages |
| **Admin access** | `ProtectedAdminRoute` + `isAdminEmail()` | Keep; document which env/emails are admin; optional: Admin Settings → “Admin users” (list or config) |
| **PII** | Partner name, email, phone, financial draft in Partner Detail | No PII in URLs; ensure evidence/reports blobs are keyed by partnerId; add short “Security” note in Privacy |
| **Session** | Supabase session / dev auth | Optional: idle timeout warning or “Stay signed in” on onboarding |

**Deliverables:** Security subsection in Privacy; optional Forgot Password; optional Admin “Admin users” or security notes in Settings.

---

### 2.3 Admin Control & Settings

| Item | Current | Target |
|------|--------|--------|
| **Admin dashboard** | `/admin` → PlaceholderPage | Real **Admin Dashboard**: summary cards (partners count, open cases, recent activity), quick links to Partners, Cases, Settings |
| **Admin Settings** | `/admin/settings` → PlaceholderPage | Real **System Settings** page: tabs or sections for Site (brand name, support email), Compliance (links to Terms/Privacy/Disclaimer), Security (admin list or notice), optionally Feature flags (e.g. “Enable Denefits”, “Enable Stripe”) |
| **Templates / CMS / Products / Analytics** | PlaceholderPage | Phase 2: Template Library (letter templates), CMS (landing content), Product & Vendor Admin, Analytics (basic charts). Can stay placeholder with “Coming soon” and one sentence each |

**Deliverables (Phase 1):** Admin Dashboard page; Admin Settings page with Site, Compliance, Security (and optional Feature flags). Phase 2: Templates, CMS, Products, Analytics as needed.

---

### 2.4 Affiliate Features

| Item | Current | Target |
|------|--------|--------|
| **Public affiliate page** | `/affiliate` → PlaceholderPage; landing has AffiliateSection with “Visit Affiliate Portal” CTA | **Affiliate Program** page: what the program is, commission structure, how to join, CTA to sign up or contact |
| **Affiliate portal** | Not in routes | Optional: `/affiliate/dashboard` (protected) for affiliates to see links, stats, payouts. If not building now, keep single public `/affiliate` page and CTA to “Contact us to join” or external form |
| **Landing CTA** | Button “Visit Affiliate Portal” | Point to `/affiliate` (or to affiliate dashboard when it exists) |

**Deliverables:** Public `/affiliate` page with program info and CTA; optionally wire landing CTA to `/affiliate`. Affiliate dashboard can be Phase 2.

---

### 2.5 Communication Hub (Partner Messages & Support)

| Item | Current | Target |
|------|--------|--------|
| **Messages page** | Email-only support + “Coming next: in-app threads…” | **Phase 1:** Keep email prominent; add “Support topics” (e.g. Disputes, Billing, Technical) and optional “Send a message” form that posts to email or a simple backend. **Phase 2:** In-app threads, attachments, escalation tags, SLAs |
| **Escalations** | `/portal/escalations` → PlaceholderPage | **Complaints & Escalations** page: short copy on how to escalate (e.g. “Use Messages & Support and tag ‘Escalation’ or email partnersupport@…”); optional simple form (reason, description) that sends email |
| **Admin view of messages** | None | Phase 2: Admin sees partner messages or a “Support inbox” |

**Deliverables (Phase 1):** Messages page with support topics + optional contact form; Escalations page with clear process and optional form. Phase 2: threads, Admin inbox.

---

### 2.6 Denefits & Payments Modules

| Item | Current | Target |
|------|--------|--------|
| **Billing page** | “Billing is not yet enabled”; lists Stripe, Denefits, receipts | **Payments & Billing** section: (1) Plan & subscription status (e.g. “Active – Builder”); (2) **Stripe:** payment method (card), next charge, invoice history (link or list); (3) **Denefits:** status (e.g. “In-house financing: Active / Not enrolled”), balance, next payment if applicable; (4) Receipts / statements download. Use feature flags from Admin Settings to show/hide Stripe vs Denefits |
| **Data model** | Partners have `financial` (income, debt, housing); no subscriptions/payments yet | Add (or document): subscription plan per partner, Stripe customer ID, Denefits enrollment/balance (or placeholders); invoices table or link to Stripe |
| **Admin** | Partner Detail has financial draft | Admin can see (read-only) “Billing: Stripe / Denefits status” and optionally “Override” or “Notes” for support |

**Deliverables (Phase 1):** Billing page with clear sections for Plan, Stripe (placeholder or wired), Denefits (placeholder or wired), Receipts; feature flags to toggle. Phase 2: full Stripe/Denefits integration and Admin billing view.

---

### 2.7 Remaining Portal Pages (Partner Journey)

| Route | Current | Target |
|-------|--------|--------|
| `/portal/debt` | PlaceholderPage | **Debt & Summons Center:** list of debt/summons “cases” (like disputes); “Add case” (creditor, amount, status); link to documents/evidence; short guidance. Can share case type with disputes or be a separate list |
| `/portal/debt/:id` | PlaceholderPage | **Debt/Summons Case detail:** one case with notes, due dates, documents, next steps |
| `/portal/build` | PlaceholderPage | **Credit Building Center:** tips, checklist (e.g. authorized user, rent reporting, secured card), links to education and products; can reuse Education content or a subset |
| `/portal/identity-theft` | PlaceholderPage | **Identity Theft Center:** steps (place fraud alert, get reports, dispute), links to FTC and bureau pages; optional “Log an incident” (date, description) stored locally or sent to support |

**Deliverables:** Real pages for debt, debt/:id, build, identity-theft with unified layout (PageShell, back to dashboard), and nav links from Partner Dashboard.

---

### 2.8 Public Pages (Unified Marketing + Legal)

| Route | Priority | Target |
|-------|----------|--------|
| `/terms` | High | Terms of Service page (copy + layout) |
| `/privacy` | High | Privacy Policy (data, cookies, security, CCPA-style) |
| `/disclaimer` | High | Disclaimer (not legal/financial advice, results vary) |
| `/affiliate` | High | Affiliate program info + CTA |
| `/contact` | Medium | Contact form + email/phone; can post to email or simple backend |
| `/faq` | Medium | FAQ accordion (credit repair, disputes, billing, Denefits) |
| `/pricing` | Medium | Pricing principles + “Apply” or “Get started” CTA |
| fix-my-credit, build-my-credit, debt-summons-help, services, personal-credit, business-credit, funding-readiness | Lower | Themed landing sections or short pages with CTAs to onboarding or contact; can share one “Services” layout |
| diy-academy, blog, testimonials, events | Lower | Placeholder with “Coming soon” or simple list (e.g. blog index) |

---

### 2.9 Admin Routes Still Placeholder

| Route | Target |
|-------|--------|
| `/admin` | Admin Dashboard (summary + links) |
| `/admin/settings` | System Settings (Site, Compliance, Security, Feature flags) |
| `/admin/templates` | “Coming soon” or simple list of letter templates |
| `/admin/products` | “Coming soon” or product/vendor list |
| `/admin/cms` | “Coming soon” |
| `/admin/analytics` | “Coming soon” or basic charts (partners, cases over time) |

---

## 3. Partner Journey Unification

- **Single entry:** Onboarding → Dashboard; Dashboard clearly offers “Partner Portal” (or “My Credit Journey”) so partners go to `/portal/dashboard`.
- **Portal nav:** Partner Dashboard sidebar or top nav: Dashboard, Checklist, Reports, Disputes, Debt, Build, Identity Theft, Documents, Tasks, Messages, Education, Billing. Same order everywhere; Escalations under Messages or as a link from Messages.
- **Overall Score (0–100):** route-aware summary of profile completeness + execution readiness, shown on Dashboard + Checklist and visible to Admin on Partner Detail.
- **Cinematic Roadmap + Action Console:** upgraded dashboard journey experience with true 3D WebGL view and a focused Now/Next/Later console (with reduced-motion/WebGL fallbacks).
- **Consistent shell:** Every portal page uses `PageShell` with badge “Partner Portal”, same back buttons (Partner Dashboard, optional MasteryOS), same footer/legal links.
- **Billing & compliance:** Profile & Billing is the place for plan, payments, Denefits, and compliance/consent; Terms/Privacy linked from footer and from Billing.

---

## 4. Suggested Build Order (Phases)

**Phase 1 – Foundation (compliance, admin, affiliate, partner journey)**

1. **Legal:** Terms, Privacy, Disclaimer pages (copy can be placeholder; structure real).
2. **Admin:** Admin Dashboard (`/admin`), Admin Settings (`/admin/settings`) with Site, Compliance, Security, optional Feature flags.
3. **Affiliate:** Public Affiliate page (`/affiliate`); wire landing “Visit Affiliate Portal” to `/affiliate`.
4. **Portal missing routes:** Debt Center (`/portal/debt`, `/portal/debt/:id`), Build (`/portal/build`), Identity Theft (`/portal/identity-theft`), Escalations (`/portal/escalations`) as real pages with unified nav.
5. **Communication:** Messages page – add support topics + optional contact form; Escalations page – process + optional form.
6. **Partner nav:** Ensure Partner Dashboard links to all portal pages in one place (sidebar or cards).

**Phase 2 – Payments, Denefits, deeper features**

7. **Billing:** Plan status, Stripe section (placeholder or wired), Denefits section (placeholder or wired), Receipts; controlled by feature flags from Admin Settings.
8. **Profile & Billing:** Secure profile edit (name, phone), optional identity-verification note; compliance/consent block with links to Terms/Privacy.
9. **Admin:** Templates list or editor; optional Analytics (partners/cases); optional Support inbox.

**Phase 3 – Polish and growth**

10. **Public:** Contact, FAQ, Pricing; then fix-my-credit, build-my-credit, etc., as themed pages or “Coming soon”.
11. **Auth:** Standalone Login/Signup/Forgot Password if we want a separate login page.
12. **Affiliate dashboard:** If desired, `/affiliate/dashboard` for links and stats.

---

## 5. What to Build Next (Immediate “Go” List)

To make the site feel complete and unified without waiting on Stripe/Denefits APIs:

1. **Terms, Privacy, Disclaimer** – Three pages, shared layout, footer links.
2. **Admin Dashboard** – `/admin` with summary and links to Partners, Cases, Settings.
3. **Admin Settings** – `/admin/settings` with Site, Compliance, Security (and optional Feature flags).
4. **Affiliate page** – `/affiliate` with program description and CTA.
5. **Portal: Debt, Build, Identity Theft, Escalations** – Four real pages with PageShell and nav from Partner Dashboard.
6. **Messages** – Support topics + optional “Send message” form.
7. **Escalations** – Clear process + optional form.
8. **Partner Dashboard nav** – One clear list of all portal links (and Billing) so the partner journey is obvious.

After that, we can add Billing/Denefits/Stripe sections (with flags), profile edits, and any Phase 2/3 items.

---

## 6. File / Route Checklist (for implementation)

- [x] `src/pages/legal/TermsPage.tsx` → route `/terms`
- [x] `src/pages/legal/PrivacyPage.tsx` → `/privacy`
- [x] `src/pages/legal/DisclaimerPage.tsx` → `/disclaimer`
- [x] `src/pages/admin/AdminDashboardPage.tsx` → `/admin`
- [x] `src/pages/admin/AdminSettingsPage.tsx` → `/admin/settings`
- [x] `src/pages/AffiliatePage.tsx` → `/affiliate`
- [x] `src/pages/portal/PartnerDebtPage.tsx` → `/portal/debt`
- [x] `src/pages/portal/PartnerDebtDetailPage.tsx` → `/portal/debt/:id`
- [x] `src/pages/portal/PartnerBuildPage.tsx` → `/portal/build`
- [x] `src/pages/portal/PartnerIdentityTheftPage.tsx` → `/portal/identity-theft`
- [x] `src/pages/portal/PartnerEscalationsPage.tsx` → `/portal/escalations`
- [x] Update `PartnerMessagesPage.tsx` – topics + form
- [x] Update `PartnerDashboardPage.tsx` (or portal layout) – full nav to all portal pages
- [x] Update `App.tsx` – register all new routes; remove from placeholder list where applicable
- [x] Footer – add links to Terms, Privacy, Disclaimer, Contact, Affiliate
- [x] Landing AffiliateSection – button links to `/affiliate`

**For the full scope of everything else (50+ routes, 20+ Phase/later items, data, UX, integrations, seller, rent, content):** see **`PLAN_FULL_SCOPE_EVERYTHING_ELSE.md`**.

This plan is the single reference for what “finished” and “unified” mean. We can start building in the order of Section 5 and then Phase 2/3 as needed.
