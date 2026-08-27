# Sell-ready full sweep (public + dashboard)

Standing execution plan. Lanes A–E complete. Stay on the current git branch.

## Goal

Make Finely Cred sell-ready across **public site**, **partner dashboard**, and **admin**. Functionality first: missing buttons, incomplete workflows, dead routes, signup/create/invite/grant-access. Then copy, grammar, public-inappropriate text, and menu reachability.

## Hard constraints

- Do not re-embed `PartnerDetailPage`.
- Do not regress debt desks or the letters writing desk.
- Partner terminology on public/portal. No mythology names in UI. No brief/build notes in UI.
- Luxury tokens only. No amber/gold/brown card fills.
- No duplicate lists of the same partners.
- Same git branch always.

## Lanes

### A — Partner operations (known lost controls)

Restore on **partners overview** (before opening a file) and on **every partner-file tab**:

- Create partner
- Send invite
- Grant access
- Import partners / Mail letters (reachable, not buried)

Wire to existing `PartnerCreatePanel` and `AdminPartnerAccessPanel`.

### B — Signup and activation

Walk public signup → invite claim → `/portal/dashboard`. Fix dead `next=` / `/portal/partner` leftovers. Create-partner + optional invite must complete.

### C — Public site

Home, funnels, pricing, careers, programs, legal, chat. Hunt:

- Grammar / leftover briefing copy
- `client` / `customer` / mythology names
- Buttons that go to the wrong place or 404
- Admin chrome leaked onto public
- Things a visitor should not see (internal ops, WIP notes)

### D — Dashboards, workflows, menus

Admin command center, work queue, CRM, mail, cases. Partner nav + admin nav: every live room reachable; leftover items must not dump old pages when a product surface exists.

### E — Verify

`npm run typecheck`. Walk invite, create, grant access, signup, and key public CTAs.
