# Product shots (marketing)

Demo-safe captures for free-guide + career pages. **No real PII.** Prefer fresh hub captures with demo names; until then, reuse unique frames from `public/tours/` and guide art already under `public/`.

## Naming / surface map

| File | Surface | Wired |
|------|---------|-------|
| `free-guide-desktop.png` | `/free-guide` | FreeGuideProductShotStrip (devices) |
| `free-guide-tablet.png` | `/free-guide` | FreeGuideProductShotStrip (devices) |
| `free-guide-phone.png` | `/free-guide` | FreeGuideProductShotStrip (devices) |
| `guide-dispute-cover.png` | `/free-guide` | FreeGuideProductShotStrip (materials) |
| `guide-dispute-spread.png` | `/free-guide` | FreeGuideProductShotStrip (materials) |
| `guide-score-mockup.png` | `/free-guide` | FreeGuideProductShotStrip (materials) |
| `career-cs-preview.png` | `/credit-specialist` + CS hub | CareerProductShotBand + RoleHubDeepenOverview (`hubCs`) |
| `career-agency-preview.png` | `/agency-partners` | CareerProductShotBand |
| `career-au-preview.png` | `/au-sellers` + AU hub | CareerProductShotBand + RoleHubDeepenOverview (`hubAuSeller`) |
| `career-case-help-preview.png` | `/careers/case-help` | CareerProductShotBand |
| `career-real-estate-preview.png` | `/careers/real-estate` | CareerProductShotBand |
| `site-fundability.png` | Affiliate careers + Affiliate hub | CareerProductShotBand + RoleHubDeepenOverview (`hubAffiliate`) |
| `site-home.png` | free-guide fallback | FREE_GUIDE_FALLBACK_SHOTS |
| `site-personal-credit.png` | free-guide fallback | FREE_GUIDE_FALLBACK_SHOTS |
| `site-resources.png` | free-guide fallback | FREE_GUIDE_FALLBACK_SHOTS |
| `guide-agency-book.png` | Agency careers secondary | CareerProductShotBand secondary |
| `guide-tradeline-mockup.png` | AU seller secondary | CareerProductShotBand secondary |
| `analysis-elite-path.png` | Inventory only | not wired to a page yet |

Wiring SSOT: `src/config/productShots.ts`.

**Rule:** never label a CSS mock or empty slot as a live product screenshot. Missing files fall back to the honest “capture pending” frame in `MarketingProductShot` via `onError`.
