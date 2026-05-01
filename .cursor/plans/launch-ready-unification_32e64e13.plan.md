---
name: launch-ready-unification
overview: Make the app launch-ready by removing placeholder UX, unifying navigation + flows, and hardening the core workflows (credit report → disputes → evidence → letters → vault) while improving signup/onboarding and site-wide UI consistency.
todos:
  - id: stability-5173
    content: Harden dev server stability and ensure site always loads on 5173 with clear recovery guidance.
    status: completed
  - id: no-more-placeholders
    content: Convert placeholder routes/pages into real pages with copy+CTAs; keep only clean 404.
    status: completed
  - id: unify-letters-command-center
    content: Unify dispute/validation/court letter flows with the same draft+template+paper-preview UX; separate My Letters storage view.
    status: completed
  - id: evidence-picker-no-reroute
    content: Replace evidence reroutes with Evidence Picker modals in Admin partner flow and Partner letter flow; enable delete/categorize evidence.
    status: completed
  - id: templates-privacy-entitlements
    content: Gate template browsing by entitlements (paid DIY/course + agents/admin) while partners only see names/flows; add multiple variants per template.
    status: completed
  - id: credit-intel-parsing
    content: Fix/verify parsing for scores, personal info, payment history; ensure correct negative categorization and clean screenshot capture.
    status: completed
  - id: sitewide-ui-enhancement
    content: Apply site-wide UI spacing/typography improvements, add world map motif, metallic card/button variants, and remove Sovereign/build-stamp text.
    status: completed
  - id: tradelines-polish
    content: Fix Tradelines UI (footer collision, pagination/search, vital fields prominence) and ensure AU/admin links route correctly.
    status: completed
  - id: business-portal-actions
    content: Make business portal feel actionable (vendor recs/sequencing, readiness tools, navigation back buttons).
    status: completed
  - id: downloads-audit
    content: Audit and fix all downloads/view actions across letters/templates/resources so they always contain correct content.
    status: completed
isProject: false
---

## Scope + priorities (what we’ll do first)

- **P0 (must work for launch)**: Site reliably loads on `http://127.0.0.1:5173/`, core Partner/Admin workflows function end-to-end (upload report → parse → categorized negatives → attach evidence (no reroutes) → build/edit letter → paper preview → save to “My Letters” → download).
- **P1 (must look finished)**: Replace all remaining placeholder pages with real pages (useful content + CTAs), remove “Sovereign Supreme/build stamp” style text, unify UI spacing and component styles across routes.
- **P2 (expansion, after P0/P1)**: Business portal vendor intelligence + roadmap, richer automations, comms hub depth, Denefits analytics surfaces.

**Scope note (launch decision)**: Signup/onboarding is treated as an **enhancement**, not required to ship the current launch checklist.

## 1) Stability + “can’t see the site” hardening

- Ensure **one** dev server config and URL: use `vite` on **5173** only.
- Add a lightweight **in-app status banner** for “dev server reloaded / runtime error caught” so it never becomes a “blank mystery.”
- Add a repeatable “recovery script” workflow (kill port 5173 → restart) documented in the Admin Guide.

## 2) Navigation + route unification (reduce duplicates/reroutes)

- Make route destinations consistent (no “Admin buttons” sending you back to public homepage).
- Centralize route mapping and ensure top nav/footer/mobile nav all point to the correct in-app destinations.

## 3) Remove placeholder UX by converting placeholders into real pages

- Replace the current placeholder behavior driven by `[src/routes/pageMap.ts](C:/Users/stlou/.cursor/worktrees/Finely-Cred/mpy/src/routes/pageMap.ts)` and `PlaceholderPage` with:
  - Minimal but **real** marketing pages (sectioned copy, visuals, CTAs into onboarding/consultation/services).
  - Only a clean 404 for unknown routes.

## 4) Auth + onboarding upgrade (engaging, lane-based)

- Upgrade sign-in/sign-up UI (modern, engaging, lane-aware) using the existing multi-step onboarding in `[src/components/portal/index.tsx](C:/Users/stlou/.cursor/worktrees/Finely-Cred/mpy/src/components/portal/index.tsx)`.
- Add conditional steps depending on **what they’re signing up for** (personal vs business vs AU seller vs agent).
- Ensure captured onboarding data is **written into partner profile** and displayed dynamically in the dashboard (no “fake score box”).

## 5) Letters: unify all letter types into one consistent “Command Center” flow

Use `[src/pages/portal/PartnerLettersPage.tsx](C:/Users/stlou/.cursor/worktrees/Finely-Cred/mpy/src/pages/portal/PartnerLettersPage.tsx)` as the single pattern source.

- Make **Credit Dispute**, **Validation**, **Court/Affidavit** all follow the exact same pattern:
  - Select context/items (categorized)
  - **Build draft** or **Load template**
  - Word-like editor + always-visible paper preview (enlarge)
  - Generate/save to **My Letters**
- Ensure evidence/screenshots are visible in **paper preview** and PDF output when appropriate.
- Remove extra duplicate preview/generate buttons and keep one consistent action set.

### Evidence attach without reroutes (Admin + Partner)

- In Admin partner detail (`[src/pages/admin/PartnerDetailPage.tsx](C:/Users/stlou/.cursor/worktrees/Finely-Cred/mpy/src/pages/admin/PartnerDetailPage.tsx)`), replace any `setTab('evidence')` style reroutes with an **Evidence Picker modal**.
- Same pattern in Partner letter flow: “Add evidence” opens a modal showing screenshots/evidence filtered to that partner.

### Template privacy + entitlements

- Partners **never** see template content by default.
- Paid DIY/course tiers + agents/admin can browse templates.
- Implement via entitlement key(s) (e.g. `portal.templates`) and enforce in the Letters UI.

### Template variants (multiple language versions)

- Add “Variants” UX on templates so OCR failures can be mitigated:
  - multiple versions per template
  - tone/variant selection
  - “rewrite” helpers (deterministic variants + optional real AI integration behind a config flag)

## 6) Credit Intelligence improvements that affect evidence + letters

- Ensure parsing reliably extracts:
  - **credit scores**
  - **two-year payment history**
  - **personal info** needed for letters (name/address) but **no email** on mailed letters.
- Ensure negatives are correctly categorized (collections/charge-offs grouped per your rule; inquiries separate; repo/bk/foreclosure separate).
- Ensure screenshot capture produces clean evidence (no scroll bars or UI chrome in the captured table).

## 7) Evidence Vault UX (categorization + deletion)

- Add clear categories/tabs inside Evidence:
  - Screenshots
  - Bureau responses
  - ID/SSN/address docs
  - Contracts
- Ensure you can **delete evidence** safely and the letter flow updates accordingly.

## 8) Site-wide UI enhancement (finished, modern, not “toy”)

- Increase spacing, make key modules visually distinct.
- Add **metallic/platinum** variants for select hero cards/CTA cards.
- Add a **wide world map** visual motif (hero + selected pages) without harming readability.
- Fix Tradelines page layout issues (footer collision, card density, pagination/search, vital fields prominence).
- Remove “Sovereign Supreme”/build-stamp branding strings.

## 9) Business portal: make it usable for real delivery

- Surface actionable tools: vendor sequencing, readiness tasks, documents requirements.
- Add vendor recommendations (tier-based + business-type filters) and make it not just a long checklist.

## 10) AU sellers + Agents + Affiliates operational readiness

- Make onboarding simple but complete (contracts, payout % configuration, permissions).
- Ensure contracts can be sent via comms hub (once comms hub phase is expanded).

## 11) Downloads audit

- Validate every download button:
  - PDF generation contains content
  - screenshots are visible (no black)
  - template “view” actually shows the letter

## 12) Launch readiness checklist

- Maintain a single checklist file that’s tied to the above phases and verify manually on the URLs you’ve been using (ex: `/admin/partners/:id`, `/portal/letters`, `/portal/reports`, `/tradelines`).

