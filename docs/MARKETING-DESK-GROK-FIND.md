# Marketing Desk — Grok-like Find

**Route:** `/admin/marketing-desk?tab=desk&helper=find`

## Product intent

Owners should **not** fill a city field before searching. One natural-language box drives partner discovery:

- “BHPH partners near me”
- “tax pros South Florida”
- “churches in Little Haiti”

## Location stack

1. **Parse place from query** — `in Miami`, `near Tampa`, `around Little Haiti`, `near me`.
2. **Browser geolocation** (with permission) → **Nominatim reverse** geocode to city/metro.
3. **`localStorage`** key `finely.marketingDesk.lastMetro` remembers last metro.
4. **Fallback chips** — Miami, Broward, Palm Beach, Orlando, Atlanta, NYC (never blocks search).
5. Optional **city override** is hidden by default.

## Search stack (no paid key)

| Step | Provider | Notes |
|------|----------|--------|
| 1 | **Overpass** | Vertical-specific OSM tags (e.g. `shop=car` for BHPH), **25 mi** radius |
| 2 | **Nominatim** | Fill gaps when Overpass returns &lt; 3 hits |
| Enrich later | Lead Intel | `/admin/lead-intel` for contacts + CRM import |

**Defaults:** vertical from keywords, radius 25 mi, partner-desk context.

## Helpers (same UX bar)

| Helper | `helper=` | Behavior |
|--------|-----------|----------|
| Find | `find` | OSM / Overpass + results grid |
| Draft | `draft` | NL → outreach snippet (manual send) |
| Qualify | `qualify` | NL → readiness checklist |

## Layout

See `docs/LAYOUT-CARD-RULE.md` — hero shell + KPI row + even results grid; no card-in-card squish under `/admin/marketing*`.

## Code map

- `src/features/marketingDesk/grokLocation.ts` — geolocation, chips, parse, Nominatim
- `src/features/marketingDesk/overpassFind.ts` — Overpass + merged results
- `src/features/marketingDesk/MarketingDeskFindPanel.tsx` — Find UI
- `src/pages/admin/MarketingDeskPage.tsx` — tab + helper routing
