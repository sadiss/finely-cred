# Personal Credit Restore — ivory wealthy rollout (Wave 1)

**Status:** Planning · ready to implement after approval  
**Protocol:** `docs/plans/ivory-wealthy-public-protocol.md`  
**Reference UI:** `/resources/au-teen-credit-sheet`

---

## Scope — two surfaces, one lane

| Priority | Route | File | Current state |
|----------|-------|------|---------------|
| **1A** | `/pricing/personal-credit-restore` | `PersonalCreditPage.tsx` | Partial ivory (`data-fc-restore-pricing` in `PricingServicePage` path); hero/spectrum/catalog; some flat white + restraint issues |
| **1B** | `/resources/personal-credit-restore-sheet` | `PersonalCreditRestoreSheetPage.tsx` | Dark default shell; dossier layout (index rail, statutes); no ivory protocol yet |

**User asked:** start with “personal credit page” — implement **1A first**, then **1B** in same sprint if time allows (shared CSS tokens).

**Do not merge layouts:** Restore keeps dossier / stamp / statute ledger identity — only apply foundation from AU protocol.

---

## Phase 1A — `/pricing/personal-credit-restore` (`PersonalCreditPage.tsx`)

### A. Shell & scope hook

- [ ] Confirm `PageShell surface="ivory"` (via pricing wrapper)
- [ ] Add `data-fc-restore-pricing="1"` consistency check on page root (already on pricing lane)
- [ ] Create `personalCreditRestoreIvory.css` (or extend `personalCreditRestoreVisual.css`) scoped to `[data-fc-restore-pricing='1']`

### B. Remove glass restraint layers

- [ ] Audit `fc-glass-ivory`, `fc-admin-solid`, hub wrappers for double borders
- [ ] Package cards: single fill via `fc-ivory-glass-panel` + emerald/amber/sky accent — not nested dark hub + white card + colored rail
- [ ] Kill global overrides that flatten luxury (`index.css` restore-pricing blocks — reconcile with new glass)

### C. Typography (match AU middle ground)

- [ ] Introduce `fc-restore-section-title` (alias of AU section title scale)
- [ ] Hub tab bodies: `fc-restore-body-text` (1rem → 1.0625rem)
- [ ] Stats row (`700+`, `45 days`, etc.): glow figures per accent like AU truth tiles
- [ ] Process step titles: Playfair subheads

### D. Color pop

- [ ] Package tier badges / spectrum — solid fills like `fc-au-tone-badge` (emerald primary lane)
- [ ] `PersonalCreditRestoreSpectrum` — readable pills, no clipped glow
- [ ] Chat strip: solid accent (emerald or violet lane — pick one primary for restore pricing)

### E. Layout rhythm

- [ ] One hero story (reduce triple headline if still present)
- [ ] Page tail: packages CTA band + staff chat + footer with `fc-restore-page-tail` spacing
- [ ] Legal footer spacing on ivory (copy AU `:has()` legal nav rules)

### F. Motion

- [ ] Hero headline: optional typewriter or fade-in on primary promise (match AU pattern)
- [ ] Section titles on Packages / Process tabs: `fc-ivory-title-reveal` scroll or load animation (2–3 max)
- [ ] Stat figures: subtle glow pulse (respect reduced motion)

### G. Keep (restore-specific)

- [ ] `PersonalCreditHeroShell` / bleed hero image band — drama below ivory command strip OK
- [ ] `PricingPackageCatalog` functionality — restyle only
- [ ] `DedicatedSheetLinkStrip` → link to `/resources/personal-credit-restore-sheet`

---

## Phase 1B — `/resources/personal-credit-restore-sheet`

### B1. Shell

- [ ] `PageShell surface="ivory" hideHero`
- [ ] `data-fc-restore-sheet="1"` + `personalCreditRestoreSheet.css`

### B2. Layout (preserve dossier)

| Section | Protocol application |
|---------|---------------------|
| File jacket hero | Dark contrast-band hero (like AU) — rose accent |
| Stamp block | Enlarge + Playfair numbers + glow on sheet count |
| Index rail (3 sheets) | **Sibling pop tiles** on white — rose/amber/emerald, no outer `bg-black/25` wrapper |
| Statute ledger | Single `fc-restore-dark-panel` glass table |
| Fit / Not-for columns | Pop rose + pop slate siblings |
| Download band | Slate + emerald (not brown) |
| Chat + footer | Solid strip + page tail |

### B3. Typography & badges

- [ ] Section titles → Playfair system
- [ ] Statute cites → tone badges or ledger chips (solid, readable)
- [ ] Body → `fc-restore-body-text`

### B4. Motion

- [ ] Hero span accent fade/typewriter
- [ ] “What is on each sheet” title reveal
- [ ] Stamp block number soft glow

---

## Shared token extraction (after 1A + 1B)

Move duplicated rules from `auTeenCreditSheet.css` + new restore CSS into:

```
src/features/os/ivoryWealthyPublic.css   (proposed)
```

| Token | Purpose |
|-------|---------|
| `fc-ivory-glass-panel` | Base panel |
| `fc-ivory-pop-{accent}` | Accent fills |
| `fc-ivory-section-title` | Playfair headers |
| `fc-ivory-body-text` | Body scale |
| `fc-ivory-tone-badge` | Status pills |
| `fc-ivory-page-tail` | Footer rhythm |
| `fc-ivory-title-reveal` | Title animation |

Rename AU classes to shared aliases gradually (AU page can `@import` shared + keep `fc-au-*` as aliases during transition).

---

## Implementation order (recommended)

1. Shared CSS skeleton (`ivoryWealthyPublic.css`) — extract from AU
2. **PersonalCreditPage** pricing lane visual pass
3. **PersonalCreditRestoreSheetPage** ivory pass
4. Title animations (both pages)
5. Typecheck + visual QA
6. Update `.cursor/rules/no-glass-restraint-layer.mdc` with restore examples

---

## Out of scope (this wave)

- Portal partner dashboard restore HUD
- Debt / validation lane (separate track)
- Facts/stats content enrichment
- Full rewrite of `PersonalCreditPage` IA (see `docs/PERSONAL_CREDIT_RESTORE_UX_PLAN.md` for deeper IA — this rollout is **visual foundation only**)

---

## Acceptance

- [ ] No glass restraint / corner line artifacts on package or sheet tiles
- [ ] Readable body and titles on ivory without squinting
- [ ] Restore lane visually cohesive with AU reference quality
- [ ] Chat strip and legal footer match AU spacing/readability
- [ ] At least 2 section titles animate subtly (with reduced-motion fallback)
- [ ] Layout identity preserved (pricing catalog vs dossier sheet)

---

## Next waves (after Wave 1)

See `docs/plans/ivory-glass-no-restraint-rollout.md` — build sheet, business credit, tradeline guide, debt page audit.
