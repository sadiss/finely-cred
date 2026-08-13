# Ivory wealthy public page protocol

**Gold reference:** `/resources/au-teen-credit-sheet`  
**Rule file:** `.cursor/rules/no-glass-restraint-layer.mdc`  
**CSS reference:** `src/pages/resources/auTeenCreditSheet.css`  
**Page reference:** `src/pages/resources/AuTeenCreditSheetPage.tsx`

Use this protocol when elevating public resource pages, pricing lanes, and marketing sheets — **same foundation, different layout per page**.

---

## 1. Named anti-pattern — avoid

**Glass restraint layer** (tint tent / square frame / box-in-box):

| Symptom | Cause |
|---------|--------|
| Dark rectangle around a group of cards | `data-fc-contrast-band` on **section/grid wrapper** + its own background |
| Corner “line inside a line” | Tailwind `border` + `bg-*` **and** CSS gradient/border on same node |
| Color drag at bottom of pop box | Colored **outer** `box-shadow` clipped at `border-radius` |
| Washed-out purple chat on white | Semi-transparent accent on ivory without `data-fc-contrast-band` text fix |
| Flat grey panels on white | `backdrop-filter` + low opacity (~40%) with no readable fill |

**Fix:** One fill, one border, `box-shadow: none` on glass panels unless hero/card lift is intentional.

---

## 2. Page shell

| Token | AU implementation |
|-------|-------------------|
| Shell | `PageShell surface="ivory" hideHero` |
| Page hook | `data-fc-au-teen-sheet="1"` (per-page; restore uses `data-fc-restore-sheet="1"` etc.) |
| Container | Slightly wider ivory container via `:has([data-fc-*-sheet]) .fc-container` |
| Background | Pure white → soft ivory radial washes on shell only — **not** on every panel |
| Text remap | `fc-light-readable` on route content; dark sections use `data-fc-contrast-band="1"` on **leaf panels** |

---

## 3. Glass panels (single-layer)

**Base class:** `fc-au-glass-panel` (future shared: `fc-ivory-glass-panel`)

```css
overflow: hidden;
border-width: 1px;
border-style: solid;
box-shadow: none; /* no frame glow */
```

**Accent modifiers** (pick per section, rotate on sibling tiles):

| Class | Use |
|-------|-----|
| `fc-au-dark-panel` | Matrix, ledger, large read surfaces (~72% dark glass) |
| `fc-au-pop-amber` | Checklist, warm CTA-adjacent |
| `fc-au-pop-rose` | Risk / inherit / warning |
| `fc-au-pop-violet` | Retain / secondary accent |
| `fc-au-pop-callout` | Inline phone / confirm callouts |
| `fc-au-download-band` | Slate + indigo + **emerald** heading (not brown) |
| `fc-au-handoff-step` | Timeline step tiles (no outer wrapper frame) |

**Opacity target:** ~66–74% dark glass — readable on white, still transparent.

**Do not:** Put `bg-black/25` Tailwind **and** CSS gradient on the same element.

---

## 4. Layout structure

```
Ivory page shell
├── Hero (contrast-band, own gradient — stays dark)
├── Sibling glass tiles on white (3-col stats, etc.) — NO wrapper dark section
├── Dark glass panel sections (matrix, gates) — one panel each
├── Pop accent siblings (checklist | rose | violet) — grid without outer frame
├── Light-title section (handoff) — title on ivory, steps are glass tiles
├── Page tail (download + chat + hub footer)
└── Legal footer (spaced below tail)
```

**Grid rule:** Never `data-fc-contrast-band` on `<section className="grid …">` that only groups children.

---

## 5. Typography

### Section titles (keep prominent — do not shrink in tune passes)

| Class | Spec |
|-------|------|
| `fc-au-section-title` | Playfair Display, `clamp(1.85rem, 3vw, 2.5rem)` |
| `fc-au-section-title--card` | Card h2s: `clamp(1.45rem, 2.2vw, 1.75rem)` |
| `fc-au-section-sublabel` | Uppercase kicker beside title, ~0.8rem |
| Variants | `--on-dark`, `--on-light`, `--amber`, `--rose`, `--violet`, `--emerald` |

### Body (middle ground — not tiny, not oversized)

| Class | Spec |
|-------|------|
| `fc-au-body-text` | 1rem mobile → 1.0625rem desktop, line-height ~1.62–1.65 |
| Matrix issuer rows | `text-base` |
| Lists | `fc-au-body-text` on `<li>` |

### Subheads

| Class | Spec |
|-------|------|
| `fc-au-gate-title` | Playfair ~1.1rem |
| Handoff step `h3` | Playfair ~1.05rem |

### Hero

- Main `h1`: large (4xl → 5xl), typewriter optional on accent phrase
- Kicker: small caps, tracked
- Body: `fc-au-body-text`

---

## 6. Accent color system

| Role | AU example |
|------|------------|
| Stat figure glow | `fc-au-glow-figure--amber/rose/emerald` on big numbers |
| Tone / status pills | `fc-au-tone-badge--likely/unlikely/varies` — solid fill, bold text, ~2rem tall |
| Chat strip | **Solid** violet gradient (`#4c2880 → #2a1848`), `data-fc-contrast-band`, no double shadow |
| Primary CTA | `FINELY_OS_PRIMARY_BTN` (amber/gold) |
| Secondary | `FINELY_OS_SECONDARY_BTN` |

**Tone badges:** Emerald = likely, Rose = unlikely, Violet = varies — saturated background, light text, no glow shadow clip.

---

## 7. Luxury showcase object (page-specific)

AU: gold plastic card mock

- `fc-au-card-showcase` wrapper (26–28rem)
- `fc-au-card--wealthy` + Playfair tier/stats
- `Finely·Cred` brand mark (not generic network circles)
- Specular shine animation on card (`landingSellBands.css`)

Other pages swap the object (restore = stamp block, build = ladder, etc.) but keep **same typography wealth**.

---

## 8. Footer rhythm

| Piece | Treatment |
|-------|-------------|
| `fc-au-page-tail` | `space-y-8` wraps download + chat + `FinelyOsPageFooter` |
| Legal links | Extra `margin-top`, top border, dark ink on ivory via `:has([data-fc-*-sheet]) nav[aria-label='Legal links']` |

---

## 9. Motion (reference + rollout)

| Element | AU today | Target |
|---------|----------|--------|
| Hero title | `LandingTypewriterTitle` one-pass on accent | Keep |
| Section titles | Static | **Planned:** subtle fade-up or soft glow pulse on scroll-into-view (respect `prefers-reduced-motion`) |
| Stat figures | Text-shadow glow | Optional gentle pulse on truth tile numbers |
| Card mock | Shine sweep (`fc-au-card::before`) | Keep |
| Tone badges | Static | Optional hover lift only |

**Implementation note:** Add `fc-ivory-title-reveal` animation class in shared CSS when rolling to restore page; AU page can receive in same pass.

---

## 10. Per-page migration checklist

- [ ] Ivory shell + page-scoped CSS file
- [ ] Remove glass restraint layers
- [ ] Single-fill glass panels + accent rotation
- [ ] Section title system (Playfair)
- [ ] Body text middle ground
- [ ] Status/tone pills if matrix exists
- [ ] Solid chat strip + contrast band
- [ ] Download/CTA band color (no muddy brown)
- [ ] Page tail + legal spacing
- [ ] Showcase object elevated (page-specific)
- [ ] Title motion (2–3 headings max)
- [ ] Typecheck + QA 375px / 1280px

---

## 11. Files touched on AU reference (for diff archeology)

| File | Role |
|------|------|
| `AuTeenCreditSheetPage.tsx` | Layout, classes, content structure |
| `auTeenCreditSheet.css` | All glass, type, badges, chat, footer, card |
| `MarketingStaffChatStrip.tsx` | `stripClassName` prop |
| `.cursor/rules/no-glass-restraint-layer.mdc` | Agent rule |
| `docs/plans/ivory-glass-no-restraint-rollout.md` | Rollout queue |

---

## 12. What is intentionally **not** copied layout-for-layout

- AU card gallery ≠ restore file jacket ≠ build blueprint ladder
- Section **count** and **grid** differ per kit
- Accent rotation follows page story (restore = rose/amber/emerald statute lane)

Copy the **foundation** (shell, glass, type, no-restraint, footer), not the AU HTML structure.
