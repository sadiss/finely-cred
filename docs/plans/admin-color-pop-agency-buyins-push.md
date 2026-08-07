# Partner admin color pop · Agency buy-in ladder · Dev guide · Push

## 1. Partner Overview + Profile (keep white, add solid pop)

Keep the light Platinum Workspace **white/graphite page ground**. Do **not** revert to all-dark.

Enhance both Overview and Profile with the **same color arrangement**:
- **Solid colored section cards** that pop on white (Overall, Evidence, scores, entitlements, status — deep emerald / gold / navy / sky / rose fills or thick accent borders + tinted backgrounds, not washed 5% opacity)
- **Buttons:** black + gold primaries that read clearly; risk/danger panels with solid red treatment (not faint glow you can’t see)
- Status chips and KPI tiles: saturated semantic colors
- Shared tokens in `index.css` (`--fc-admin-*`) + helpers in `finelyOsAdminSurface.ts` so Overview and Profile stay consistent
- Site-wide light-theme rollup = later plan (note only in DEVELOPER_GUIDE)

## 2. Agency buy-ins — one per capacity tier (serious capital)

Replace 2 buy-ins with **6 one-time buy-ins**, 1:1 with `agencyTiers`, floor still ≥ $1,000, top end enterprise-serious:

| Buy-in id | Maps to capacity | Price (one-time) | Story |
|---|---|---|---|
| `agency_buyin_starter` | Agency Starter | **$1,000** | Tenant live, Finely-branded, apprenticeship |
| `agency_buyin_growth` | Agency Growth | **$9,900** | Co-brand + 2 seats |
| `agency_buyin_operator` | Agency Operator | **$24,997** | Team workflows, 4 seats |
| `agency_buyin_pro` | White-Label Pro | **$99,000** | Full white-label + domain |
| `agency_buyin_scale` | Agency Scale | **$249,000** | High-volume WL + automation |
| `agency_buyin_enterprise` | Enterprise | **$499,000** | Unlimited / SLA / dedicated success |

Wire `agencyPartnersProgram.ts` copy + `recommendedAgencyBuyInIdForTier` 1:1. Agency page shows **all** buy-ins with keep-% / seats / WL level so it reads as investing in a real white-label business (agents, OS, CRM, letters, vault).

## 3. Developer guide

Update `docs/DEVELOPER_GUIDE.md` with recent work: careers sellable pages, CS join, tradelines/AU split, agency buy-in ladder, Platinum Workspace color-pop notes, key paths.

## 4. Push to GitHub

Commit product source (not `.tmp-*` / mockup junk) on current branch and `git push` to origin.
