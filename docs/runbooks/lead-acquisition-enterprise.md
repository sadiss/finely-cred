# Lead acquisition — enterprise runbook (compliant)

Finely Cred grows through **owned opt-in funnels** and **B2B partner referrals** — never by scraping personal emails or cold-blasting imported lists.

## Principles

| Rule | Why |
|------|-----|
| **No cold email/SMS** | TCPA, CAN-SPAM, and CROA risk; brand trust |
| **Consent before nurture** | `consentToContact` or `consentEmailMarketing` must be true before `seq_kreyol_funnel` or any marketing sequence |
| **Cold CSV stays cold** | Haitian imports use `haitian_csv_import` with both consent flags `false` — see [haitian-cold-import.md](./haitian-cold-import.md) |
| **No PII in git** | Lead CSVs live outside the repo (secure bucket or owner machine only) |
| **Partner-first language** | No score guarantees, no income promises — results vary |

## Haitian / Kreyòl owned funnels (cold → hot)

These are the **only** paths that should convert cold Haitian community contacts to warm leads:

| Surface | URL | Purpose |
|---------|-----|---------|
| Community desk | `/haitian` · `/kreyol` | Public education + Pale Kreyòl chat |
| Metro desks | `/haitian/miami`, `/haitian/brooklyn`, … | Geo-targeted community copy |
| Lead magnet | `/free-kreyol-guide` | Consented kit download → `seq_kreyol_funnel` |
| Kit studio (auth) | `/free-kreyol-guide/:kitId` | Partner/admin kit tools — guests redirect to funnel |

### Expansion tactics (opt-in only)

1. **Meta lead ads** — Run ads to `/free-kreyol-guide` or `/haitian`; use Meta’s native lead form with explicit consent checkbox; map to `kreyol_companion` funnel (not CSV import).
2. **Community QR codes** — Print church/flyer QR → `/haitian` or `/free-kreyol-guide`; track `utm_source=community_qr` + metro slug.
3. **Partner co-marketing** — Immigration nonprofits, Haitian radio, tax prep offices display QR/flyer; they do **not** hand over member email lists.
4. **Cold CSV follow-up (manual, one-to-one)** — If calling/texting imported rows, no automated nurture until the person opts in on the funnel. Import path: Admin → Leads OS → Haitian cold CSV import (dry-run first).

### Ops checklist — Haitian campaign launch

- [ ] Dry-run Haitian CSV import; confirm `consentToContact=false` on all rows
- [ ] Verify `/free-kreyol-guide` renders `KreyolGuideFunnelPage` (guest) and kit subpaths auth-gate
- [ ] Test opt-in: submit form → same lead id upgraded (no duplicate) → `seq_kreyol_funnel` enrolled
- [ ] Confirm admin **Haitian cold** filter shows imported rows
- [ ] Sitemap includes `/haitian`, metros, `/free-kreyol-guide`
- [ ] **Do not** run bulk import through generic Leads OS CSV without explicit `consentToContact=true` column

## B2B / partner channels (existing draft tracks)

These fit Finely Cred’s partner email sequences (`cold_prospect`, `invite_opt_in`, `offer_pack`) — **organizational** outreach only, with opt-in links, not personal scraping.

### Credit repair & funding adjacency

| Channel | How to engage | Compliance notes |
|---------|---------------|------------------|
| **BHPH / auto dealers** | Dealer portal referral (declined buyers → credit path → return when ready). Models: [OriumAI dealers](https://oriumai.com/dealers), [Better Credit Partners](https://partners.bettercreditpartners.com/) | Customer pays for repair; dealer does not auto-enroll without consent |
| **Mortgage brokers / LOs** | Referral partner programs; co-branded one-sheets → `/resources/business-credit-one-sheets` | RESPA: disclose referral compensation in mortgage context |
| **Real estate agents** | Partner program signup; clients who need credit before closing | No outcome guarantees in promo copy |
| **Tax preparers / CPAs** | Seasonal postcard/QR to free guides; business credit lane for LLC clients | Professional ethics; no client list resale |
| **Financial advisors / coaches** | Affiliate toolkit funnel (`/free-affiliate-guide`) | Fiduciary disclosure where applicable |

### Immigration & community orgs (Haitian reach)

| Channel | How to engage | Compliance notes |
|---------|---------------|------------------|
| **501(c)(3) immigration legal aid** | Sponsor educational workshop; QR to `/haitian` — org promotes, Finely does not receive member PII | No legal advice positioning; educational only |
| **Haitian churches / community centers** | `community-flyer` kit with QR; bulletin board, not email list purchase | Respect org data policies |
| **Haitian Creole media** | Radio/podcast sponsorship with vanity URL `/kreyol?utm_source=radio` | Track UTM; funnel opt-in only |
| **ESL / citizenship programs** | Flyer in classroom; credit literacy as adjacent topic | School district approval |

### Aggregator / marketplace (consented leads)

| Channel | Notes |
|---------|-------|
| [CoolCredit partner network](https://www.coolcredit.com/partner/) | Consented consumer profiles actively seeking help — alternative to buying cold lists |

## Sources & references

- Haitian cold import: [haitian-cold-import.md](./haitian-cold-import.md)
- CFPB — [Credit repair: How to help yourself](https://www.consumerfinance.gov/ask-cfpb/what-is-credit-repair-en-335/)
- FTC — [Credit Repair Organizations Act](https://www.ftc.gov/legal-library/browse/statutes/credit-repair-organizations-act)
- FTC — [CAN-SPAM compliance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- FCC — [TCPA rules](https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts)

## PII / git hygiene

- **Never commit** lead CSVs, outreach lists, or `Documents/FinelyCredit` exports — see `.gitignore`
- Haitian Documents CSVs were **never** added to this repository (confirmed in git history audit)
- Tracked partner audit CSV removed; use `legacy-partners-audit.example.csv` for schema reference
- **Residual risk:** git history may still contain deleted blobs (`legacy-partners-audit.csv`, `docs/warm-prospects/library-seed.csv`) until an owner-approved `git filter-repo` / BFG purge — this PR does **not** rewrite history
- `legacy-partners-export-v1.json` is now a redacted `@example.com` demo fixture; real exports → `legacy-partners-export-v1.local.json` (gitignored) — see [legacy-partner-import.md](./legacy-partner-import.md)

## What we do **not** do

- Scrape personal emails from social media, directories, or church member lists into CRM
- Run `bulkImportLeads()` on cold Haitian CSVs (use `bulkImportHaitianColdLeads` only)
- Set `consentToContact=true` by default on import (blank = false)
- Send `seq_kreyol_funnel` or welcome emails without opt-in
- Commit lead CSV files to the repository

## Owner handoff (when Jireh returns)

1. **Merge** PR #34 (or sibling enterprise QA PR) into `launch/ready-sovereign-supreme`
2. **Bluehost deploy** — unpark hosting; deploy latest build (Sep 11 live build is stale)
3. **Production import** — run `npx tsx scripts/haitian-csv-import.ts --dry-run` then `--apply` from machine with prod Supabase env vars
4. **Smoke test** — guest `/free-kreyol-guide` opt-in, admin Haitian cold filter, one nurture dry-run in Comms Studio
5. **Campaign** — unpaid community posts and QR codes to owned funnels (no paid ads in the zero-dollar plan); monitor opt-in rate in Leads OS. Weekly owner checklist: [organic-seo-zero-budget.md](./organic-seo-zero-budget.md)
