# Validation letter vault — wealthy cover reveal

**Status:** Planned (not built)  
**Surfaces:** Validation debt lane · Letter studio saved vault · Partner/admin letter vault where `LetterStudioSavedVaultStrip` appears  
**Goal:** Make the letters vault feel like a premium vault door — not another flat list panel.

---

## Problem

The current vault (`LetterStudioSavedVaultStrip`) is a standard compact catalog card with a paginated grid of `SavedLetterCard` tiles. It reads as “another section on the page,” not a distinctive destination. Partners should feel like they are opening a secure archive.

---

## Concept — “Wealthy vault door”

A decorative **cover panel** sits in front of the letter grid:

1. **Idle state:** Full-width luxury cover with gold/violet glass, lock motif, letter count badge, and short subtitle (“Your saved dispute letters”).
2. **Hover (desktop):** Cover **slides left** (~55–65% width) with ease-out, revealing the letter deck underneath on the right.
3. **Tap / focus (mobile):** First tap opens the cover; second tap on a letter card acts normally. Cover can be dismissed with an explicit “Close vault” chip or swipe-back gesture.
4. **Optional flourish:** Subtle parallax on the cover emboss + soft light sweep (respect `prefers-reduced-motion`).

Visual language aligns with validation generate hero (amber glow) and AU wealthy card (`fc-au-card--wealthy`) — embossed edge, radial highlight, not flat gray glass.

---

## UX requirements

| Question | Answer |
|----------|--------|
| Where am I? | Cover title: “Letters vault” + count chip |
| What matters now? | “N saved letters ready to mail or edit” |
| What next? | Hover/tap to reveal · or primary “Open vault” on cover |

- **No duplicate list:** Cover hides the same grid — do not add a second vault list elsewhere on the page.
- **Empty state:** Cover still shows; inner area explains “Generate a letter above — it saves here automatically.”
- **Accessibility:** Cover is a `button` or focusable region with `aria-expanded`; keyboard Enter/Space toggles reveal; focus trap not required (content stays in-page).
- **Reduced motion:** Skip slide animation; instant cross-fade or static split view.

---

## Implementation sketch

### Components

| File | Change |
|------|--------|
| `LetterStudioSavedVaultStrip.tsx` | Wrap grid in `fc-vault-reveal` shell; add cover layer + open state |
| `validationDebtLayout.css` (or new `letterVaultReveal.css`) | Cover slide, glow, responsive breakpoints |
| `SavedLetterCard.tsx` | No structural change; may add `data-vault-revealed` styling hook |

### DOM structure

```tsx
<section className="fc-vault-reveal" data-fc-vault-open={open}>
  <div className="fc-vault-reveal__stage">
    <div className="fc-vault-reveal__cover" …>
      {/* lock icon, title, count, hint */}
    </div>
    <div className="fc-vault-reveal__letters" aria-hidden={!open}>
      <FinelyOsPaginatedStack … />
    </div>
  </div>
</section>
```

### CSS (desktop hover)

```css
.fc-vault-reveal__stage {
  position: relative;
  overflow: hidden;
  min-height: 12rem;
  border-radius: 1rem;
}

.fc-vault-reveal__cover {
  position: absolute;
  inset: 0;
  z-index: 2;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  /* wealthy gradient + inset highlight */
}

@media (hover: hover) {
  .fc-vault-reveal:hover .fc-vault-reveal__cover,
  .fc-vault-reveal[data-fc-vault-open='true'] .fc-vault-reveal__cover {
    transform: translateX(-58%);
  }
}
```

### State

- `open` boolean — toggled by hover (desktop only via CSS) + click/tap (all devices).
- Persist open state for session optional (`sessionStorage` key `fc-vault-open`) — defer unless partners ask.

---

## Rollout order

1. **Validation debt page only** — feature flag or `track="validation"` prop on strip.
2. **Partner letter studio** — same component, emerald accent cover variant.
3. **Admin partner detail vault** — align cover with admin accent rotation.

---

## Related (separate plans)

- AU teen credit sheet: ongoing typewriter on section titles (marketing loop).
- Partner projects/tasks kanban overhaul.
- KPI glow popup alignment on partner overview.

---

## Acceptance criteria

- [ ] Vault cover is visually distinct from catalog cards and suggestion panel.
- [ ] Hover slide reveals letters without layout jump or double scrollbars.
- [ ] Mobile tap-to-open works; letter cards remain clickable when revealed.
- [ ] `prefers-reduced-motion` disables slide.
- [ ] Empty vault still shows cover + helpful empty copy inside stage.
- [ ] Typecheck + visual QA on validation debt lane at 375px and 1280px.
