# Public UI sweep (PR #28)

Before → after checklist for **public** routes only (marketing chrome + landing + legal + Kreyòl funnels). Admin/portal unchanged.

## Navigation speed

| Before | After |
|--------|--------|
| URL changed while route chunks still cold; header/footer links did not consistently warm chunks | `navIntentProps()` on public header, dropdowns, mobile nav, and footer links (hover / focus / touch) |
| Limited idle prefetch (few CTAs) | `publicPrefetch.ts` registers major public routes; idle warm includes pricing, start, Kreyòl guide, resources, contact |
| Services mega-menu only navigated on click | Menu `onMouseEnter` warms `/services` + all service slugs |
| Text-only wordmark in header/footer | Gold **medallion** mark (`/brand/finely-cred-mark.png`) beside wordmark in header + footer + hero kicker |

Favicon medallion assets (committed): `/favicon.ico`, `/favicon-32x32.png`, `/apple-touch-icon.png`, `/android-chrome-192x192.png`.

## Homepage & chrome

| Before | After |
|--------|--------|
| Footer “Services” items all routed to `/services` | Each item routes to the correct service slug or `/tradelines` |
| Footer resources duplicated “Videos” / “DIY” to same page | Consolidated “Videos & guides” + **Start Restore ($147)** → `/start` |
| Footer / hero low-contrast body (`text-white/40`) | Bumped readable copy to `text-white/55` where touched |
| Neon-green primary accents on funding badge, ticker status, affiliate CTA glow | Shifted to **amber** / **sky** (no `#39ff14` primary) |
| Hero kicker used generic shield icon | Medallion mark (brand lock) |
| Services cards all sent users to generic `/services` | Personal → restore slug, Business → business slug, Debt → debt-legal slug |
| Primary tradeline card heavy emerald “neon” styling | Sky accent lane; AU stays amber |

## Copy (public pages touched)

| Before | After |
|--------|--------|
| FAQ “What is credit repair?” | “What is **credit restore**?” (+ timeline question wording) |
| Agency service subtitle “credit repair agencies” | “credit **restore** agencies” |
| Contact subtitle generic “credit” | “credit **restore**” |

## Kreyòl / Haitian funnels (regression)

| Route | Status |
|-------|--------|
| `/free-kreyol-guide`, `/free-guide` → guide | Unchanged redirects + prefetch registered |
| `/haitian`, `/kreyol` | Companion page + prefetch registered |
| `/start` | Start Restore offer page + prefetch |

## Routes audited (smoke via build + static review)

`/`, `/pricing`, `/services/*`, `/personal-credit`, `/start`, `/resources`, `/contact`, `/faq`, `/about`, `/testimonials`, `/tradelines`, `/checkout`, `/bookstore`, `/affiliate`, `/terms`, `/privacy`, `/disclaimer`, Kreyòl paths above.

## QA

- `npm run build` must pass before merge.
- Live Bluehost still benefits from full PR merge (launch `main.tsx` eager sync is documented in `docs/BLUEHOST-LAUNCH-PERF-MERGE.md`).
