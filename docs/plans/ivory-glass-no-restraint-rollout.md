# Ivory glass — no restraint layer rollout

**Reference implementation:** `/resources/au-teen-credit-sheet`  
**Full protocol doc:** `docs/plans/ivory-wealthy-public-protocol.md`  
**Wave 1 plan:** `docs/plans/personal-credit-restore-ivory-rollout.md`  
**Named anti-pattern:** **Glass restraint layer** — extra tint/tent/frame wrapping panels that already have their own fill (see `.cursor/rules/no-glass-restraint-layer.mdc`)

**Status:** AU teen sheet = gold standard · other pages = planned

---

## What “good” looks like (AU page balance)

| Layer | Treatment |
|-------|-----------|
| Page shell | Ivory white (`surface="ivory"`), no dark page chrome |
| Content panels | Single-fill dark glass (~66–74% opacity), one border, no box-shadow frame |
| Accent pop boxes | Rose / violet / amber / teal as **sibling** tiles on white — not nested in another dark wrapper |
| Chat / staff strip | Solid accent purple, white text, `data-fc-contrast-band` — no wash-out |
| Download / CTA band | Slate + emerald (not brown) — distinct from checklist amber |
| Typography | `text-base` body on matrices; serif stats on luxury card mock |
| Footer | `fc-au-page-tail` spacing; legal links with top margin + divider |
| Credit card mock | Larger showcase, Playfair tier/stats, Finely·Cred brand mark |

---

## Rollout queue (public + key portal marketing)

### Wave 1 — Resource & pricing sheets (highest traffic)

| Route | Page / file | Notes |
|-------|-------------|-------|
| `/pricing/personal-credit-restore` | Personal Credit Restore pricing | Partial ivory work exists (`data-fc-restore-pricing`); remove tent layers, pop package cards |
| `/resources/personal-credit-restore-sheet` | Restore dossier sheet | Match AU glass density + readable matrix text |
| `/resources/personal-credit-build-sheet` | 2-sheet build blueprint | Same ivory shell pattern |
| `/resources/business-credit-one-sheets` | Business credit sheets | Business accent rotation (sky/violet) |
| `/business-credit` | Business credit solutions landing | Hero + band restraint audit |

### Wave 2 — Guides & dispute education

| Route | Notes |
|-------|-------|
| `/free-tradeline-guide` | Dispute/tradeline guide funnel |
| `/resources/*` hub + remaining leaf resources | Resources index cards |
| Letter / dispute education pages (portal + public) | Align with validation letter UX language |

### Wave 3 — Debt & portal dashboards (compact luxury, same principle)

| Surface | Notes |
|---------|-------|
| Partner debt / validation track | Already improved; audit for remaining list-in-frame patterns |
| Partner dashboard hubs | KPI tiles: no duplicate strip + card frame |
| Admin partner detail (non–PartnerDetailPage.tsx patches) | Match partner view glass |

**Portal note:** Dashboards stay **compact luxury** density; apply *no restraint* rule to panel wrappers, not marketing hero scale.

---

## Per-page migration checklist

- [ ] Switch or confirm `PageShell surface="ivory"` where appropriate
- [ ] Remove wrapper-level `data-fc-contrast-band` on grids; move to leaf panels only
- [ ] Replace double Tailwind bg + CSS gradient with one `fc-*-glass-panel` + accent class
- [ ] Delete global contrast-band background overrides
- [ ] Remove clipped colored outer glows on pop boxes
- [ ] Audit chat/staff strips for solid accent + contrast-band text
- [ ] Bump matrix/list copy to `text-base` minimum
- [ ] CTA/download band: pick non-brown accent (slate/emerald, violet, or teal)
- [ ] Legal footer spacing on ivory (`margin-top`, divider, readable link color)
- [ ] Typecheck + visual QA at 375px and 1280px

---

## Shared tokens (future extract)

When 3+ pages share the same CSS, extract from `auTeenCreditSheet.css`:

- `fc-ivory-glass-panel` — base single-fill panel
- `fc-ivory-pop-{amber|rose|violet|emerald|slate}` — accent modifiers
- `fc-ivory-page-tail` — download + chat + hub footer rhythm
- `fc-ivory-legal-footer` — PublicLegalFooter spacing on ivory shells
- `fc-au-section-title` + `fc-au-section-sublabel` — Playfair section headers (AU reference)

---

## Related plans

- `docs/plans/validation-letter-vault-reveal.md` — vault door animation (validation/debt lane)
- Partner projects kanban — separate track

---

## Deferred (user said later)

- Facts / stats enrichment pass across resource pages
- Site-wide automated audit for nested `[data-fc-contrast-band]` + `bg-black/*` wrappers

---

## Acceptance (per page)

- No visible corner “line inside a line” on pop boxes
- Text readable on ivory without hunting
- One obvious primary CTA per viewport
- Legal links clearly separated from last content panel
