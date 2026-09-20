# Admin runbook — Partner Prospector

Outbound-quality **referral partner** batches for the South Florida / Haitian corridor. Shared engine for **Admin UI** and the site/ops **agent tool** `prospectReferralPartners`. Draft/export only. Never auto-sends email.

## How to run a ~50-partner batch

1. Open **Admin → Partner Prospector** (`/admin/partner-prospector`).
2. Leave default **SFL metros** and core verticals (tax, BHPH, realtor, mortgage, immigration). Add **community desk** if you want remittance/multiservice extras.
3. Limit **50**. Keep **Dedupe** on.
4. Optional: check **Enrich official sites** to pull public `mailto:` / `tel:` from company pages (rate-limited, robots-aware). Skip this for a fast seed-only pass.
5. Click **Run Partner Prospector**.
6. Filter by vertical / fit. Open one card at a time in the right panel.
7. **Export CSV** (Batch schema). Nothing is emailed.

Site / ops agents can call the same tool:

```json
{"tool":"prospectReferralPartners","args":{"metros":["miami","north_miami","miami_gardens","hollywood","fort_lauderdale","miramar","homestead","west_palm"],"verticals":["tax","bhph","realtor","mortgage","immigration"],"limit":50,"dedupe":true}}
```

From the Co-Owner Ops Agent, use **Prospect partners**, or ask it to emit that JSON.

### Local / CLI (no Supabase required)

```bash
npm run test:partner-prospector
npm run prospect:sample -- --limit 12
npm run dev
# then sign in as admin → /admin/partner-prospector
```

## What “strong” means

| `icp_fit` | Meaning |
|-----------|---------|
| **strong** | Real company website **and** a public phone or email, plus ICP vertical + SFL/Haitian-corridor geo. Ready for a human to draft outreach. |
| **maybe** | Vertical + geo + a real website (or a contact) but missing the other. Worth a review; enrich or skip. |
| **skip** | Competitor credit-repair/restore shop, thin row (no phone **and** no email **and** no real website), consumer PII dump, or CRM/prior-batch duplicate. |

`why_fit` is factual Door A (their clients) / Door B (them as owners). Brand is **credit restore**, not repair. Restore ≠ debt gone. No loan/funding guarantees. Live Haitian URL: `/haitian`. Do not require `/free-kreyol-guide` until PR #21 is live.

## Feature flags / env

| Gate | Default | Notes |
|------|---------|--------|
| `features.partnerProspector` | **on** (admin) | Settings → Feature Flags. Turns off UI + agent tool. |
| Scheduled GitHub Action | **off** | Set repo variable `PARTNER_PROSPECTOR_SCHEDULE_ENABLED=true` **and** secrets `SUPABASE_URL` + `PARTNER_PROSPECTOR_BEARER`. |
| `SERPER_API_KEY` (edge) | optional | Extra public search hits. Seed directory always runs without it. |
| `EDGE_ADMIN_EMAILS` | required for edge | Same allowlist as Lead Intel. |
| `SUPABASE_SERVICE_ROLE_KEY` | optional persist | Without it, batches still save in the admin browser store. |

Apply `supabase/migrations/20260920000001_partner_prospector.sql` when you want server-side `partner_prospects` / `partner_prospector_runs`.

## Compliance

- Public business data only. No invented emails/phones.
- Official sites + public search API. Respects `robots.txt` `Disallow: /`.
- Rate-limited fetches (~850ms gap).
- Dedupes normalized email / last-10 phone / domain / name+city against prior batches, local CRM prospects, inbound `lead_captures`, and `partners.profile` email/phone when readable.
- **Do not** buy lists or scrape consumer PII. Do **not** bolt this onto consumer/syndicate lead magnets.

## GitHub inventory (verified — do not assume `main` has the launch stack)

Checked `origin/main` and `origin/launch/ready-sovereign-supreme` on 2026-09-20.

| Hinted path | On current `main`? | On `launch/ready-sovereign-supreme`? | What it actually is |
|---|---|---|---|
| `.github/workflows/lead-intel-hourly.yml` | No | Yes | Hourly **dry-run** of `scripts/lead_intel/swarm_enqueue.py` — not B2B partner ICP |
| `.github/workflows/lead-syndication.yml` | No | Yes | Publishes consumer SEO / lead-magnet feeds (`npm run syndication:publish`) |
| `docs/FINELY-INTELLIGENCE-OS.md` | No | Yes | In-app copilot / RAG / tours — not outbound referral prospecting |
| `docs/plans/INTEL_AND_ROLE_GAPS.md` | No | Yes | Credit-file, court, evidence scrape, lender signals, overnight swarm |
| `docs/SUPABASE_LEAD_CAPTURES_SETUP.md` | **Yes** | Yes | Inbound Resources guide captures (`lead_captures`) |
| `scripts/lead_intel/dedupe_prospects.py` | No | Yes | **Stub** — `simulated_items` only. Not reused. |
| `scripts/lead_intel/dead_lead_revival_scan.py` | No | Yes | Same dry-run stub pattern |
| `scripts/overnight/phase1_intel_swarm.py` | No | Yes | Same dry-run stub pattern |
| `scripts/audit-intelligence-surfaces.mjs` | No | Yes | Launch-gate file existence check for copilot surfaces |
| `scripts/smoke-litigation-address-scrape.mjs` | No | Yes | Client-file litigation address extract |
| `src/data/crmProspectsRepo.ts` | **Yes** | Yes | Local CRM prospects; website match is exact URL, not domain |
| `src/data/leadsRepo.ts` / `leadOpsRepo.ts` | **Yes** | Yes | Inbound consumer leads |
| `src/data/leadDistributionRepo.ts` | No | Yes | Lead-magnet distribution / social queue |
| `src/data/leadAcquisitionManifest.json` | No | Yes | Consumer/agency magnet lanes (`audience: consumer`) |
| `src/components/creditIntel/*` | Partial (`CreditIntelTabs`) | Yes | Credit-**file** intelligence |
| `LitigationDocScraperChat` / `EvidenceScrapeIntelPanel` | No | Yes | Partner-client debt/evidence OCR, not B2B desks |

**Hypothesis: confirmed.** Existing intel (even on the launch branch) skews consumer magnets, syndication, and credit-file/litigation scrape. Partner Prospector stays a dedicated engine + `prospectReferralPartners` tool. We reuse **identity keys** from CRM prospects, inbound leads, and client `partners` — we do not import the Python stubs or syndication hub.

## CSV columns (Batch 2 schema)

`business_name, person_name, title, city, category, website, phone, email, icp_fit, why_fit, source_urls, status`
