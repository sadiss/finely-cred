# Layout card rule (Finely Cred)

**Status: SHIPPED** — enforced in Marketing HQ, Social Media desk, and shared utilities.

## Rule

1. **No card-in-card squish** — do not place a bordered, padded panel inside another bordered panel unless the outer shell is an intentional chapter wrapper with `space-y-6+` and inner items are **sibling cards on the section background**, not nested boxes.
2. **Minimum spacing** — sibling cards: `gap-4 md:gap-6`. Card padding: `p-5` or `p-6` minimum.
3. **Gutters** — marketing and admin content: `max-w-7xl mx-auto px-4 sm:px-6`.
4. **Grids** — prefer even layouts: `grid-cols-2`, `lg:grid-cols-3`, or `lg:grid-cols-4` (2×4, 3×3). Avoid 4+3 orphan rows when possible (pad with placeholder or merge sections).
5. **Ink** — body text `text-white/75` minimum on `#0b1110`; labels `text-white/55`; never `text-white/40` on white-tinted backgrounds.

## Shared utilities

`src/styles/layoutSurfaces.ts`:

| Export | Purpose |
|--------|---------|
| `FC_PAGE_SECTION` | Page rhythm + gutters |
| `FC_CARD_GRID` | Standard card grid gaps |
| `FC_SURFACE_CARD` | Single card surface |
| `FC_SECTION_SHELL` | One hero shell per section |
| `FC_SURFACE_CARD_GOLD` | Gold-border marketing card |

Tailwind mirror (optional) in `index.css` `@layer components`: `.fc-page-section`, `.fc-card-grid`, `.fc-surface-card`.

## Offenders fixed (hour pass)

| Area | Change |
|------|--------|
| Social Media desk | Removed nested “section → mini cards → duplicate asset grid”; post days use flat grid of `MarketingReadyAssetCard` only |
| Marketing channel room | Social path: desk + banner + packs as **siblings** with `space-y-8` |
| Start Here strip | Order: Post → Guides → library; `3×2` grid |
| Department floor | Channel grid `sm:grid-cols-2 lg:grid-cols-3` |

## Marketing HQ channel rooms

- **Social Media room:** `SocialMediaDesk` only — skip duplicate `ReadyToUseSection` grid (pack cards are not rendered twice).
- **Queue / campaigns:** section headings on main background; each row is a sibling `FC_SURFACE_CARD` — not a bordered panel wrapping bordered rows.

## Still watch

- `FullPackLibrarySection` `<details>` groups — one border per group only; cards inside use `FC_CARD_GRID` (no extra `bg-black/30` wrapper per card).
