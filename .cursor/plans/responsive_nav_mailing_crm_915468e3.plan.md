---
name: Responsive_nav_mailing_crm
overview: Fix phone-view responsiveness (public nav + mobile drawer), enhance the mailing workflow (autofill, address verification, clearer statuses, retry + preview), and de-congest CRM by splitting into clear sections with KPI rows and collapsible groups—matching the project’s modern UI standards.
todos:
  - id: nav-mobile-center
    content: Fix public phone nav centering + reduce sizing in `src/App.tsx`; tighten `MobileNav` spacing/width/typography in `src/components/ui/index.tsx` with clear section cards.
    status: completed
  - id: mailing-verify-autofill-preview
    content: "Upgrade mailing: autofill To/From, add address verification op in edge function + client, add PDF preview + sectioned modal UI, and persist richer mailing statuses (pending/failed) across portal/admin letter views."
    status: completed
  - id: crm-sectioned-kpis
    content: "Enhance CRM + de-congest: KPI rows, collapsible stage sections, unified inbound leads tab, and next-action due date linked to Tasks in `AdminCrmPage` + improved `AdminLeadsPage` UI; add `listLeadOps` helper for counts/filtering."
    status: completed
isProject: false
---

# Responsive nav + mailing + CRM upgrades

## What’s broken / why it feels off on phone

- Public top nav in `[src/App.tsx](src/App.tsx)` uses desktop-sized padding and logo sizing on mobile (`px-6 ... py-4`, `text-xl`), and the mobile header layout is a simple `flex justify-between`, which can make the brand feel visually off-center.
- The mobile drawer in `[src/components/ui/index.tsx](src/components/ui/index.tsx)` `MobileNav` uses a fixed width + large padding/spacing (`w-72`, `p-6`, `space-y-6`, `px-4 py-3`, `tracking-[0.35em]`), which reads “too big” on small screens.

## Goals (per your request)

- **Phone view nav feels centered, sized correctly, and not cramped.**
- **Mailing process upgraded**: autofill + real address verification + better status/retry + in-modal PDF preview.
- **CRM upgraded and de-congested**: each major area has its own section; reduce dense tables; KPI-first + collapsible groups; page-level scrolling.

## Implementation approach

### A) Public phone nav + mobile drawer: responsive sizing + centering

- Update `[src/App.tsx](src/App.tsx)`
  - Make the public nav header a **3-column grid on mobile** (left: menu/cart, center: logo, right: primary action), so the brand is truly centered.
  - Reduce mobile padding and typography with breakpointed classes (e.g. `px-4 py-3 sm:px-6 sm:py-4`, logo `text-base sm:text-xl`).
- Update `MobileNav` in `[src/components/ui/index.tsx](src/components/ui/index.tsx)`
  - Replace fixed `w-72` with **responsive drawer width** (e.g. `w-[88vw] max-w-[320px]` + safe-area padding).
  - Tighten vertical rhythm on mobile (`p-4`, smaller section gaps, menu buttons `py-2.5`), and reduce extreme tracking (`tracking-[0.35em]` → `tracking-wider`/`tracking-[0.2em]`).
  - Make header/brand **centered** on mobile, and align menu items so they read cleanly (likely centered text or consistent left alignment with better insets—implemented consistently across sections).
  - Keep your “everything has its own section” by rendering each group as a small **section card** (subtle border + header + buttons), rather than one long list.

### B) Mailing process: autofill, verify, preview, statuses, retry

- Data available for autofill
  - Partner mailing info exists in onboarding hydration via `routes[primaryRoute].personal` in `[src/portal/getOrCreatePartnerForSession.ts](src/portal/getOrCreatePartnerForSession.ts)` and typed in `[src/domain/partners.ts](src/domain/partners.ts)`.
  - Dispute letters already carry `meta.bureau` in `[src/domain/letters.ts](src/domain/letters.ts)`, so we can prefill **To** using the bureau address source of truth.
- UI upgrades
  - Update `[src/components/letters/MailLetterModal.tsx](src/components/letters/MailLetterModal.tsx)`
    - **Autofill**:
      - Prefill **From** from partner intake (`address1/address2/city/state/postalCode`) + name.
      - Prefill **To** for dispute letters using `letter.meta.bureau` → bureau address mapping.
    - **Address verification step** (before sending):
      - Add “Verify addresses” action and show provider feedback (normalized address, deliverability flags, suggested corrections).
      - Block sending until verified (or allow override with explicit acknowledgement—configurable).
    - **PDF preview section**:
      - Add an embedded preview (iframe/object) using existing blob URL generation so the user can confirm the exact artifact being mailed.
    - **Clear sections**:
      - Render modal as distinct cards/sections: `Letter_preview`, `Recipient_address`, `Return_address`, `Verification_results`, `Send_actions`.
- API / edge function upgrades
  - Extend the existing Supabase Edge Function in `[supabase/functions/mailer/index.ts](supabase/functions/mailer/index.ts)`
    - Add an operation for **address verification** (e.g. `op: 'verify'`) that calls Lob’s US address verification API and returns normalized results.
    - In the existing send flow, optionally run verification server-side as well (defense-in-depth).
    - Return Lob `status` in addition to `providerId` (already logged).
  - Update `[src/lib/mailerClient.ts](src/lib/mailerClient.ts)`
    - Add `verifyMailAddressViaProvider()` (invokes `mailer` with `op: 'verify'`).
    - Extend `mailLetterViaProvider()` return type to include `status`.
- Persist better mailing statuses in letters
  - Update `[src/domain/letters.ts](src/domain/letters.ts)`
    - Extend `LetterStatus` to include at least: `mail_pending`, `mail_failed`, keep existing `mailed`.
    - Add optional `mailing.lastError` and `mailing.status` fields.
  - Update letter UIs to show these clearly
    - `[src/pages/portal/PartnerLettersVaultPage.tsx](src/pages/portal/PartnerLettersVaultPage.tsx)`: filters + badges + retry button when `mail_failed`.
    - `[src/pages/admin/PartnerDetailPage.tsx](src/pages/admin/PartnerDetailPage.tsx)`: mirror the same status visibility for admins.

### C) CRM: de-congest + enhance

- Update `[src/pages/admin/AdminCrmPage.tsx](src/pages/admin/AdminCrmPage.tsx)`
  - Add **KPI row** (e.g. total prospects, unassigned, contact-ready, missing email/phone, outreach sent).
  - Replace dense `min-w-[780px]` table + `overflow-x-auto` with:
    - **Stage-grouped collapsible sections** (`<details>` per stage)
    - Card grid list items (premium cards) and a focused detail panel.
  - Keep “Inbound” as a true tab (no hard navigate); render inbound leads within CRM so the experience is unified.
  - Add `nextAction` editing (label + due date) and create/update a linked Task in `[src/data/tasksRepo.ts](src/data/tasksRepo.ts)` for follow-ups.
- Update `[src/pages/admin/AdminLeadsPage.tsx](src/pages/admin/AdminLeadsPage.tsx)`
  - Add KPI row (local/remote counts, new/contacted/booked/converted, consent=no count).
  - Rework lead list into collapsible cards with clear sections: lead details, stage, notes, conversion.
- Data layer support
  - Enhance `[src/data/leadOpsRepo.ts](src/data/leadOpsRepo.ts)` with a `listLeadOps()` helper for stage counts/filtering (current API is per-lead only).

## Validation / sanity checks

- Verify mobile nav visually on narrow widths (320–390px): centered brand, comfortable tap targets, no overflow.
- Verify mailing:
  - Autofill populates from partner intake.
  - Dispute letters auto-fill bureau address.
  - Verification produces a clear accept/correct flow.
  - Failed sends show `mail_failed` and allow retry without losing edits.
- Verify CRM:
  - Page-level scrolling only; no long nested scroll panes.
  - KPI row visible at top; sections collapsible; selection/detail panel works.

## Files expected to change

- Public nav + mobile drawer
  - `[src/App.tsx](src/App.tsx)`
  - `[src/components/ui/index.tsx](src/components/ui/index.tsx)`
- Mailing
  - `[src/components/letters/MailLetterModal.tsx](src/components/letters/MailLetterModal.tsx)`
  - `[src/lib/mailerClient.ts](src/lib/mailerClient.ts)`
  - `[supabase/functions/mailer/index.ts](supabase/functions/mailer/index.ts)`
  - `[src/domain/letters.ts](src/domain/letters.ts)`
  - `[src/pages/portal/PartnerLettersVaultPage.tsx](src/pages/portal/PartnerLettersVaultPage.tsx)`
  - `[src/pages/admin/PartnerDetailPage.tsx](src/pages/admin/PartnerDetailPage.tsx)`
  - (likely) `[src/letters/disputeLetterTemplate.ts](src/letters/disputeLetterTemplate.ts)` to export bureau address mapping for UI autofill
- CRM
  - `[src/pages/admin/AdminCrmPage.tsx](src/pages/admin/AdminCrmPage.tsx)`
  - `[src/pages/admin/AdminLeadsPage.tsx](src/pages/admin/AdminLeadsPage.tsx)`
  - `[src/data/leadOpsRepo.ts](src/data/leadOpsRepo.ts)`
  - `[src/data/tasksRepo.ts](src/data/tasksRepo.ts)` (reuse only; minimal changes expected)

