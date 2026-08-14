# CTA Contract — the one canonical "next step" pattern

**Status:** Dev-process reference doc (Phase B6). Not a user-facing deliverable — nothing in
this file changes the UI. Its only job is to stop the codebase from growing a second, competing
way to wire up "what happens when a visitor clicks the primary CTA."

---

## The rule

**Every public/funnel page's primary "next step" CTA must resolve its destination through
`src/lib/finelyCtaIntent.ts` — never a bare, hand-written path.**

```ts
import { finelyCtaNavigate, resolveFinelyCtaPath } from '../lib/finelyCtaIntent';
```

Two ways to use it:

1. **`finelyCtaNavigate(navigate, intent, options?)`** — resolves the intent and calls
   `navigate(...)` for you. Prefer this in `onClick` handlers.
2. **`resolveFinelyCtaPath(intent, options?)`** — returns the path string without navigating.
   Use this when you need the URL itself (e.g. for a `<Link to={...}>`, for building a
   `next=` query param that chains into another CTA, or for a `personalFreeTrialPath` computed
   once and reused across a page).

### Real example (homepage hero — the reference implementation)

`src/components/landing/LandingHeroOsRefreshSection.tsx`:

```tsx
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';

// ...

<Button variant="platinum" size="md" onClick={() => finelyCtaNavigate(navigate, 'personal_intake')}>
  Get started
</Button>
```

This exact call — `finelyCtaNavigate(navigate, 'personal_intake')` — is what every "Get
started" / "Start free" primary CTA on the public site should use unless the destination is one
of the explicit exceptions in [§ What's *not* covered](#whats-not-covered-by-this-contract)
below.

## Why a registry instead of hand-written paths

`resolveFinelyCtaPath()` is the single place that:

- Knows every valid intent → destination mapping (onboarding lane, focus, role, skip-role
  flags, checkout package/rail, etc.) so two different pages never silently diverge on how they
  route the "same" next step.
- Threads **funnel attribution** through navigation automatically via `appendCtaExtras()` —
  `ref` (referral code), `next` (post-flow redirect), `email`/`name`/`phone` (pre-fill from a
  lead capture), and `leadId` all get appended as query params onto the resolved path without
  every call site re-implementing `URLSearchParams` logic by hand.
- Is enforced by a CI-style audit script (`npm run cta:bare-onboarding:audit`, backed by
  `scripts/audit-bare-onboarding.mjs`) that fails the build if a new bare
  `navigate('/onboarding')` call appears anywhere under `src/pages` or `src/components` outside
  the small allowlist (auth bootstrap / protected-route redirects). **Any new page's CTA should
  be written so this audit stays green.**

## Available intents

See `FinelyCtaIntentId` in `src/lib/finelyCtaIntent.ts` for the authoritative, up-to-date list.
As of this writing:

| Intent | Use for |
|---|---|
| `personal_free_guide` | Link to the free credit guide (`/free-guide`) |
| `personal_free_trial` | "Start free" — routes signed-out visitors through signup, authed users straight to checkout |
| `personal_intake` | Generic personal-credit-restore "Get started" |
| `personal_package` | A specific pricing package select (`packageId` required) |
| `business_intake` | Business credit "Get started" |
| `debt_intake` | Debt & Legal "Get started" |
| `funding_intake` | Funding-readiness "Get started" |
| `consultation` | "Book a session" (pass `consultationLane`) |
| `career_track` | Credit Specialist / affiliate career-path signup (`careerPath` required) |
| `lead_magnet` | Generic lead-magnet → onboarding handoff (pass `leadMagnetLane`, `focus`) |
| `affiliate_intake` / `au_seller_intake` / `au_buyer_intake` / `tradeline_intake` / `agent_intake` / `score_roadmap_intake` / `heta_intake` | Role- or program-specific signup flows |

Every intent accepts the shared attribution options (`referralCode`, `next`, `email`, `name`,
`phone`, `leadId`) — pass whatever you have; the registry silently drops what's not applicable
to a given path shape.

## Adding a new CTA to a new page

1. Identify which existing intent matches the destination. Most new pages fit an existing
   intent — check the table above before adding a new one.
2. If no intent fits, add a new case to `FinelyCtaIntentId` + `resolveFinelyCtaPath()` in
   `src/lib/finelyCtaIntent.ts` rather than hand-rolling a path in the page component. Add it to
   `FINELY_CTA_INTENT_PATHS` in `src/lib/finelyCtaAudit.ts` too, so the audit/dev tooling stays
   in sync.
3. Wire the button with `onClick={() => finelyCtaNavigate(navigate, 'your_intent', { ...options })}`.
4. Run `npm run cta:bare-onboarding:audit` before shipping — it should report zero violations.

## What's *not* covered by this contract

A few CTA destinations are legitimately outside the onboarding-intent registry and should stay
as plain `navigate('/path')` / `<Link to="/path">` calls — do not force these through
`finelyCtaIntent.ts`:

- **In-page tab/section switches** (e.g. `onClick={() => setTab('engine')}`) — not a navigation
  at all.
- **Direct links to existing, already-built pages** that aren't part of an onboarding funnel
  (e.g. `/pricing`, `/faq`, `/results`, `/business/vendors`, `/consultation?lane=...` — the
  `consultation` intent exists for the common case, but a lane-specific booking link built
  inline like `navigate('/consultation?lane=' + encodeURIComponent('Business Credit'))` is
  acceptable when it's just a query-string variant of the same destination).
- **`tel:` click-to-call links** (see B7) — these are `<a href="tel:...">` anchors, not
  React Router navigation, and are never routed through `finelyCtaIntent.ts`.
- **Admin/portal internal navigation** — this contract is scoped to **public, pre-signup**
  "next step" CTAs (marketing pages, lead-magnet funnels, pricing). Authenticated portal/admin
  pages route directly via `navigate('/portal/...')` / `navigate('/admin/...')` since there is
  no funnel-attribution concern once a partner is signed in.

## Do not

- Do not write `navigate('/onboarding?focus=...')` (or any hand-built onboarding query string)
  directly in a page or component. Always go through `resolveFinelyCtaPath` /
  `finelyCtaNavigate`, even if it means adding a one-line new intent case.
- Do not duplicate the attribution-param logic (`ref`, `next`, `email`, `name`, `phone`,
  `leadId`) inline in a page component — that logic lives once, in `appendCtaExtras()`.
- Do not treat this doc as a user-facing changelog item. It documents an existing pattern; it
  does not by itself change any page's behavior.
