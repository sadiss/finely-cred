# Public UI audit — Batch 1 fixes (PR #28)

| URL / issue | Status | Fix |
|-------------|--------|-----|
| `/start` 404 | **SHIPPED** | Eager route; moved to top of `Routes`; `public/_redirects` SPA fallback |
| `/pricing` → home | **SHIPPED** | Eager `PricingPage`; early route registration |
| `/services` → home | **SHIPPED** | Eager `ServicesHubPage`; early route registration |
| `/contact` overlays | **SHIPPED** | `getPublicChromeProfile` — minimal chat, ticker hidden, safe bottom |
| `/about` nav + toast | **SHIPPED** | `navHighlightId` / company child active; ticker hidden on marketing pages |
| `/services/personal-credit-restore` empty hero | **SHIPPED** | Service hero strip on `PricingServicePage`; eager chunk |
| `/services/debt-legal` overlays | **SHIPPED** | Chrome profile marketingHeavy |
| `/services/agencies` contrast | **SHIPPED** | `AgencyTierCard` ink background `#0b1110` |
| `/personal-credit` hero | **PARTIAL** | Page has stats hero; consider media panel later |
| `/business-credit` | **SHIPPED** | Full `BusinessCreditJourneyPage` (not redirect-only) |
| `/consultation` nav | **SHIPPED** | `viewFromPath` FAQ before consultation; `navHighlightId` |
| `/faq` nav | **SHIPPED** | Per-path highlight in company dropdown + mobile `navActive` |
| `/` typewriter | **SHIPPED** | Phrase fade (no caret) — prior commit |
| `/` typo fund & fund | **MISSING** | Not found in repo copy (verify live CMS) |
| `/services/tradelines` | **SHIPPED** | Redirect to `/tradelines` |
| `/services/wealth-builder` footer | **SHIPPED** | Footer links on `PricingServicePage` |
| `/services/privacy-id` cards | **SHIPPED** | Both packages public in catalog; visible via DFY/DIY filter |
| Black loading | **SHIPPED** | Eager key routes + transparent `RouteChunkErrorBoundary` |
| Social Media desk | **SHIPPED** | See `docs/SOCIAL-MEDIA-DESK.md` |

Deploy: ship `dist/` + `public/.htaccess` + `_redirects`.
