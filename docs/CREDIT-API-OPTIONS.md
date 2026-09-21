# Credit data API options (honest comparison)

**Status: SHIPPED** — research memo for Finely + Nora soft-first pulls. **Verify all pricing with vendors** before purchase.

## Principles

- **No free FICO from bureaus** for production underwriting — consumer FICO is licensed.
- **Soft pull** still has cost and permissible purpose constraints (FCRA).
- Finely should prefer **client-authorized** pulls + education, not “instant score” theater.

## Options

| Provider | Model (as researched) | Pros | Cons | Finely fit |
|----------|----------------------|------|------|------------|
| **Softpull** | ~$150 inspect + ongoing per-pull fees (owner trialed) | Familiar to owner | Cost at volume; verify current API | Known baseline |
| **iSoftpull** | ~$99/mo platform + ~$3.84/bureau/pull (verify on quote) | API-oriented, multi-bureau | Monthly minimum + per-pull; compliance setup | **Candidate** for soft-first if quote holds |
| **CRS Credit API** | Quote-only enterprise | Deep bureau relationships | Sales cycle, opaque public pricing | Nora/enterprise later |
| **Array (monitoring embed)** | SaaS embed / monitoring | Good for **monitoring UX** | Not a full DIY dispute OS | Pair with Finely portal education |
| **OSM / free prospecting** | Free tiers for list building | Cheap discovery | **Not** tri-merge credit files; don’t confuse with scores | Marketing prospecting only |
| **YouTube Data API** | Free quota | Media studio / social desk | Irrelevant to credit pulls | Already separate (Media Studio) |

## Recommended path (cheapest viable soft-first)

1. **Short term:** Continue **client-supplied reports** (PDF/HTML upload) + manual snapshots in business/personal vaults — zero marginal API cost, highest honesty.
2. **Next step:** Request formal quote from **iSoftpull** (or Softpull refresh) for: soft pull, tri-merge where licensed, webhook to Finely partner record — compare **$/pull × expected monthly volume**.
3. **Monitoring embed:** Pilot **Array** (or existing MyScoreIQ/IdentityIQ affiliate flows in Resources) for **alerts**, not for dispute automation.
4. **Do not** promise “free credit score API” in product copy.

## Implementation notes (when API lands)

- Store pulls in `reports` vault with `source: api_soft_pull`.
- Separate **Nora** tenant handoff audit trail.
- Admin setting: `creditApiProvider` + kill switch.

## MISSING

- Live API integration in codebase (**MISSING**).
- Signed vendor contract / compliance review (**PARTIAL** — owner-dependent).
