# Finely Cred – Full Scope: Everything Else

This document is the **exhaustive** list of every route, feature area, and "Phase" mention in the codebase—everything beyond the modules you originally listed (compliance, security, admin, affiliate, communication, Denefits, payments). Use it with `PLAN_SITE_COMPLETION.md` for the full picture.

**Status update (2026-02-10):** Many routes previously marked “placeholder” have since been implemented. Treat the tables below as historical context; the current canonical roadmap is `.cursor/plans/integrated_pending_master_plan_2026-02-10.plan.md`.

---

## 1. Every Route in the App (from pageMap + App)

| Route(s) | Current state |
|----------|----------------|
| **Public – real** | `/`, `/tradelines`, `/about`, `/resources`, `/bookstore`, `/bookstore/:id` |
| **Public – placeholder** | `/fix-my-credit`, `/build-my-credit`, `/debt-summons-help`, `/business-credit-solutions`, `/services`, `/personal-credit`, `/business-credit`, `/funding-readiness`, `/diy-academy`, `/blog`, `/blog/:slug`, `/testimonials`, `/affiliate`, `/events`, `/contact`, `/faq`, `/pricing`, `/terms`, `/privacy`, `/disclaimer` |
| **Auth – real** | `/onboarding`, `/dashboard` (MasteryOS) |
| **Auth – placeholder** | `/login`, `/signup`, `/forgot-password` |
| **Partner portal – real** | `/portal/dashboard`, `/portal/checklist`, `/portal/reports`, `/portal/disputes`, `/portal/disputes/:id`, `/portal/tasks`, `/portal/documents`, `/portal/education`, `/portal/messages`, `/portal/billing` |
| **Partner portal – placeholder** | `/portal/debt`, `/portal/debt/:id`, `/portal/build`, `/portal/identity-theft`, `/portal/escalations` |
| **Business portal** | All 5 routes real but Phase 4 shells (vendor catalog, funding engine, fundability matrix, doc storage) |
| **AU – real** | `/au/marketplace`, `/au/request`, `/au/orders` (Phase 4: order flow, matching) |
| **AU – placeholder** | `/au/seller/apply`, `/au/seller/dashboard`, `/au/seller/cards` |
| **Rent** | `/rent-reporting` → PlaceholderPage |
| **Admin – real** | `/admin/partners`, `/admin/partners/:id`, `/admin/cases` |
| **Admin – placeholder** | `/admin`, `/admin/settings`, `/admin/templates`, `/admin/products`, `/admin/cms`, `/admin/analytics` |

**Total: 50+ route paths** in pageMap; many still hit PlaceholderPage or “Phase” shells.

---

## 2. Feature Areas Called Out in Code (Phase / Later / TODO)

| Where | What's said | Implied work |
|-------|-------------|--------------|
| **Letter PDF** | "Phase 5/6: Sender address"; "PDF + persistence" next step | Persist letter when generating; optional full account + payment history in PDF body |
| **Report parsing** | PDF "image-only … will need OCR (next phase)" | OCR or PDF-structure parsing for non-HTML reports |
| **Partner Billing** | "Payments, Denefits, Stripe … later phases"; "Phase 5 … profile edits, identity verification, PII-safe" | Stripe + Denefits integration; profile edit form; identity verification flow |
| **Partner Messages** | "Live in-app messaging … later phase"; "threads, file attachments, escalation tags, response SLAs" | Threaded messages, attachments, escalation tag, SLA display |
| **Resources** | "CMS-driven + access-controlled in Phase 5"; "PII masking, audit depth, role-based access" | CMS for content; access control; PII masking in audit |
| **Bookstore / Product** | "Checkout and access control … Phase 5"; "pricing, checkout, delivery, entitlements (Supabase + Stripe)" | Checkout flow; Supabase storage for delivery; entitlements per partner |
| **Partner Education** | "E-books and premium resources (access control Phase 5)" | Gated content by plan or purchase |
| **Business Documents** | "Phase 5: Supabase storage, signed URLs, RBAC, audit logging per document" | Backend storage; signed URLs; roles; audit |
| **Business Profile** | "Phase 4: real intake form, persist business profile data" | Business intake form; persistence |
| **Business Vendors** | "Phase 4: vendor catalog + requirements checklist + completion tracking" | Vendor list; checklist; "what's next" automation |
| **Business Funding** | "Phase 4 build-out" (readiness engine) | Readiness score, steps, links to products |
| **AU Marketplace** | "Order flow will be wired in later"; "Phase 4: fit rules, seller contracts" | Add to cart → checkout; fit rules; seller verification |
| **AU Request** | "Phase 4+ wire intake + matching + compliance" | Intake form; matching logic; compliance checks |
| **AU Orders** | "Phase 4+ wire purchase flow, proof artifacts, posting guarantee" | Order list; proof upload; posting status |
| **Dashboard (MasteryOS)** | "Reference library … CMS + access control Phase 5" | Resource gating |
| **PageShell** | "Functionality will be wired in the next build phase" (default when no children) | Replace with real content on every page that uses it |

---

## 3. Data & Backend

| Area | Current | Missing / Enhancement |
|------|--------|------------------------|
| **Persistence** | Partners, cases, tasks, evidence, reports, letters, dispute reasons, partner notes, audit → all in `localJsonStore` (localStorage) | Optional: migrate to Supabase (or other backend) for multi-device, backup, scale |
| **Blobs** | IndexedDB for report HTML/PDF, evidence images, screenshots | Supabase Storage optional for cloud backup / signed URLs |
| **Letter persistence** | `lettersRepo` exists; Admin generates PDF and can link to round; "PDF + persistence" noted as next step | Save letter metadata + optional file ref when generating; show in Partner's Letters / case round |
| **Subscriptions / billing** | No tables | Plan per partner; Stripe customer/subscription; Denefits enrollment/balance |
| **Notifications** | Tasks have `dueAt`; cases have round `dueAt`; no outbound email/SMS/push | Email reminders for due tasks; optional in-app bell; optional SMS for critical deadlines |
| **Audit** | Events stored; actor email; used in Partner Detail | Phase 5: PII masking in audit view; role-based access to audit; deeper export |
| **Admin allowlist** | Hardcoded in `auth/admin.ts` | Move to Admin Settings or env so new admins can be added without code deploy |

---

## 4. UX & Product Polish

- **Error boundary** – No React Error Boundary; add so one component throw doesn't show full dev overlay.
- **404 / not found** – Catch-all shows PlaceholderPage "Page Not Found"; could be a friendlier 404 with nav.
- **Loading states** – Sparse; add skeletons or spinners where data is async (reports, partner list, etc.).
- **Empty states** – Some pages have them; unify copy and optional CTA (e.g. "Upload your first report").
- **Mobile nav** – MobileNav exists; ensure all key portal/admin links are reachable on small screens.
- **Accessibility** – No audit noted; add aria labels, focus order, keyboard nav where critical.
- **SEO / meta** – No per-route title/meta in code; add `<Helmet>` or document.title for public and key portal pages.
- **Footer links** – Footer exists on landing; add Terms, Privacy, Disclaimer, Contact, Affiliate on every public page.
- **Partner nav** – Single sidebar or card strip on Partner Dashboard linking to every portal page (reports, disputes, debt, build, identity theft, documents, tasks, messages, education, billing, escalations).
- **Business nav** – Same idea: clear nav from Business Dashboard to profile, vendors, funding, documents.
- **AU nav** – Marketplace, Request, Orders (+ Seller routes when built) in one place.
- **Admin nav** – Dashboard → Partners, Cases, Templates, Products, CMS, Analytics, Settings.

---

## 5. Integrations & Third-Party

| Integration | Current | Target |
|-------------|--------|--------|
| **Supabase** | Auth (optional); not used for data yet | Optional: partners, cases, tasks, evidence, reports, letters in Supabase; RLS for multi-tenant |
| **Stripe** | Mentioned (Billing, Bookstore) | Payment methods; subscriptions; checkout for bookstore/AU |
| **Denefits** | Mentioned (in-house financing) | Status, balance, next payment; optional enrollment flow |
| **Email** | Only auth (Supabase); support is mailto | Transactional email (task reminder, case update); optional "Send message" form that emails |
| **SMS** | None | Optional: reminders, 2FA |
| **OCR** | None | Optional: PDF report text extraction (e.g. Tesseract or cloud API) when HTML not available |

---

## 6. Seller & Rent (Full Product Lines)

| Route / area | Current | Target |
|--------------|--------|--------|
| **Seller** | `/au/seller/apply`, `/au/seller/dashboard`, `/au/seller/cards` → PlaceholderPage | Seller application form; dashboard (listings, orders); card management (which cards are in program) |
| **Rent reporting** | `/rent-reporting` → PlaceholderPage | Rent Reporting Hub: what it is, how to enroll, link to partner portal or intake |

---

## 7. Content & Marketing

| Item | Notes |
|------|--------|
| **Blog** | `/blog`, `/blog/:slug` → PlaceholderPage; blog index; post layout; CMS or markdown for posts |
| **Testimonials** | PlaceholderPage; testimonials page or section with quotes + attribution |
| **Events** | PlaceholderPage; events / webinars list + optional registration |
| **FAQ** | PlaceholderPage; accordion FAQ (disputes, billing, Denefits, technical) |
| **Pricing** | PlaceholderPage; pricing principles + CTA; no backend |
| **Contact** | PlaceholderPage; form (name, email, topic, message) → email or simple backend |
| **Fix / Build / Debt / Services / Personal / Business / Funding** | Each PlaceholderPage; themed landing sections (value prop + CTA to onboarding or contact) |
| **DIY Academy** | PlaceholderPage; education marketing page; link to Education Library or Bookstore |

---

## 8. Summary: Count of "Everything"

- **~50+ route paths** in pageMap (many still placeholder).
- **~20+ "Phase" or "later" items** in code (letter persistence, OCR, Stripe, Denefits, profile edit, messages, resources CMS, bookstore checkout, business build-out, AU order flow, seller, audit, admin settings, etc.).
- **Original plan (PLAN_SITE_COMPLETION.md Sections 1–6):** Legal (3), Admin (2), Affiliate (1), Portal (4), Communication (2), Nav unification, Payments/Denefits.
- **Plus:** Auth (login/signup/forgot); Public (contact, faq, pricing, blog, testimonials, events, themed service pages); Business (Phase 4 full build); AU (order flow, seller); Rent (hub); Bookstore (checkout, delivery); Notifications (email/push); Error boundary; SEO; accessibility; backend migration option.

So there **is** a lot more than the list you gave. This doc is the full map of every route and every deferred feature so we can prioritize by business impact and dependency.
