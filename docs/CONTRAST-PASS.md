# Contrast pass

Status: **SHIPPED** for shared tokens and the surfaces listed below. **PARTIAL** where a screen paints its own color outside those selectors.

## Rules

| Before | After |
| --- | --- |
| Body copy at `text-white/30`–`/55` on `#0b1110` / `#060908` | Near-white ink `#f5f5f4` or muted `#d6d3d1` |
| `text-amber-100` / `text-amber-200` on gold, cream, or white | Ink `#14120b` |
| Pale card with white text, or dark card with gray body | Light card = ink. Dark card = frost. |
| `white/10` hairline as the only separation | Card fill `#182420` (dark) or cream `#faf6ee` (light) with a visible border |
| Inputs that inherit the wrong color | Dark field `#121a17` + `#f5f5f4`, or light field + ink. Placeholders `#c8c6c2` on dark. |
| Gold button with light text | Gold fill + ink `#14120b` (`.fc-button-brand-surface`, `.fc-pill-active`, `.fc-chip-active`) |

Tokens live on `:root` and flip under `html[data-fc-theme="light"]`: `--fc-ink`, `--fc-muted`, `--fc-cream`, `--fc-ink-on-light`, `--fc-gold`, `--fc-card-dark`, `--fc-card-border`. Tailwind `text-fc-ink` and `text-fc-muted` read those variables. Enforcement is `src/styles/fcContrastPass.css`, imported after luxury glass in `src/main.tsx` and `ProductPageLayout.tsx`.

Dark islands keep frost: admin rail, `[data-bed="dark"]`, stage hero, premium charts, ink panels, contrast bands, landing dark depth, and admin `.fc-accent-card` shells that the light theme paints dark on purpose.

## SHIPPED

- Shared: `src/styles/fcContrastPass.css`, `tailwind.config.js` `fc.ink|cream|muted|on-light|gold`, `EmptyState`, admin nav toggle labels, marketing hub shells (`.fc-contrast-card`).
- Admin home Command Intelligence and Business OS launcher (their own gold/ink sheets).
- Courses, Marketing Desk, Marketing HQ, and Social Media inherit `.fc-contrast-card` and the light-theme ink rules.
- Public marketing on the dark shell inherits the washed-text lift and the light-card ink rule.
- Toasts already use `#1a2b26` + white. Gold CTAs already used ink; the pass locks that with `!important`.

## PARTIAL

- `src/features/os/finelyOsLuxuryGlassInk.css` still forces white on dark admin accent cards. That is intentional. A follow-up should not invert those cards to dark-on-dark.
- One-off inline colors and CSS modules that do not use `text-white/*`, `text-amber-200`, `.fc-card`, or `.fc-contrast-card` are not rewritten line by line. Overseer should spot-check a course lesson, Marketing Desk, and the public home if a panel still looks washed.
- Tables with custom `rgba()` text outside the selectors above.
