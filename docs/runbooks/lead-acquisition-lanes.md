# Lead acquisition lanes — affiliates, specialists, jobs, Haitian orgs

Cold directory research for Finely Cred. These records are **not opted in**. The organizations do not know Finely has them.

**Do not email. Do not text. Do not enroll nurture.** A future send happens only after that organization opts in on the lane’s public page.

Real contact files stay on the machine that ran the collector. Git stores the catalog, the scripts, and a redacted `@example.com` sample.

## Lanes

| Lane | What the collector keeps | What it does not keep | Opt-in page |
|------|--------------------------|------------------------|-------------|
| `affiliates` | HUD counseling agencies, credit-counseling nonprofits, chambers/associations, and referral-relevant NTEE codes (public org identity) across the catalog metros and focus states | Member lists, personal social profiles | `/affiliate` |
| `specialists` | Counseling **offices** with HUD financial/credit services (FBC, FBW) or “credit counseling” nonprofit names | Individual loan-officer or dispute-agent resumes | `/credit-specialist` |
| `jobs` | Employer **job postings** whose titles match credit, loan, debt, housing-counselor, or financial-coach roles | Job-seeker names, emails, or resumes | `/credit-specialist` |
| `haitian_orgs` | IRS-exempt orgs matched on Haitian, Haiti, Kreyol, and filtered Creole names, plus HUD agencies that publish Haitian Creole (`CRE`) | Church member rolls, personal phones scraped off websites | `/free-kreyol-guide` |

Individual NMLS lookups, Indeed, and LinkedIn are **manual queries** in `scripts/lead_discovery/catalog.json`. The collector does not automate them.

## Sources the collector calls

All of these are public APIs meant to be queried:

| Source | What comes back | Email? |
|--------|-----------------|--------|
| [ProPublica Nonprofit Explorer](https://projects.propublica.org/nonprofits/api) | Org name, EIN, city, state, NTEE. Focus states FL, NY, NJ, MA, GA, TX, PA, MD, DC, IL, NC, CA, CT, RI, LA, plus a national pass. Pages run until the API’s `num_pages` (or the catalog page cap). Noisy keywords (creole, caribbean) keep a name filter. | No |
| [HUD housing counselor locator](https://data.hud.gov/Housing_Counselor/searchByLocation) | Agency name, city, public phone, public email, website, services, languages. 25-mile radius around the catalog metros (South Florida, Northeast Haitian corridors, and other large counseling markets). Kept when language is `CRE`, services include `FBC`/`FBW`, or the agency name is a credit-counseling office. | Often, published by HUD |
| [Remotive](https://remotive.com/remote-jobs/api), [Remote OK](https://remoteok.com/api), [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) | Job title, company, location, posting URL. Broader title filter (credit, housing, debt, financial coach, loan officer). Descriptions are ignored so “credit card” inside a software job does not match. | No |

Manual query strings (Indeed, LinkedIn, USAJOBS, NMLS Consumer Access, NCUA locator, Google) live in the same catalog. Run those in a browser. Do not bulk-export NMLS.

## Run a pull

From the repo root:

```bash
npm run leads:discover
```

That writes these **gitignored** files:

| File | Contents |
|------|----------|
| `data/lead-discovery/collected.local.json` | Full org directory plus employer postings. System of record, including rows with no email. |
| `data/lead-discovery/cold-import.local.csv` | CRM slice. Same columns as the Haitian cold importer, plus Lane, Organization, Website, Source, Source URL. **Only rows with a public email.** |
| `data/lead-discovery/last-run-counts.local.json` | Counts only. |
| `data/lead-discovery/summary.local.md` | Same counts plus output paths. Gitignored. |

Stdout prints counts and source errors. It does not print emails, phones, or organization names.

The script refuses to write if those paths are not gitignored.

Orgs with a phone or website but no email stay in the JSON for in-person or QR follow-up. They are not given a fake email.

## Import locally (still no send)

Dry-run the redacted sample (safe, tracked):

```bash
npm run leads:discover:check
npx tsx scripts/lane-cold-import.ts --dry-run data/lead-discovery/cold-import.example.csv
```

Dry-run a real pull (counts only):

```bash
npx tsx scripts/lane-cold-import.ts --dry-run data/lead-discovery/cold-import.local.csv
```

Apply on a machine you control. This writes the local lead store and, when Supabase env vars are set, `lead_captures` with `consent_to_contact = false`. It does **not** send mail and does **not** auto-enroll a nurture sequence.

```bash
npx tsx scripts/lane-cold-import.ts --apply data/lead-discovery/cold-import.local.csv
```

`--apply` refuses tracked files. `cold-import.example.csv` cannot be applied.

### Row defaults

| Field | Value |
|-------|--------|
| `source` | `directory_cold_import` |
| `consentToContact` / `consentEmailMarketing` | `false` (a Consent column in the CSV is ignored) |
| `utmMedium` | `cold_import` |
| Tags | `temperature:cold`, `no-outreach`, `consent:none`, `lane:<id>` |
| Haitian lane extra tags | `cold`, `haitian-community` so the existing Haitian cold filter can see them |
| Public website | `promoAsset` (organization site only) |
| Offer | `affiliate_application` when the row is a partner lane; `agent_application` for specialist-only or jobs-only; `haitian_credit_kit` for Haitian-org-only |

Phone-only rows are skipped, same as `haitian_csv_import`. Re-run is idempotent on email (phone fallback).

Admin → Leads OS: Haitian-tagged rows show under **Haitian cold**. Affiliate offers show as affiliate applications. Specialist and jobs offers show under the credit-specialist offer filter. Scoring keeps these rows in the cold band and clears the suggested sequence so a one-click enroll does not fire.

## CRM columns

Header (aliases accepted: `full_name`, `email`, `phone_number`, `state_guess`, `lane`, `organization`, `website`, `source`, `source_url`):

```csv
Full name,Phone number,Email,State guess,Lane,Organization,Website,Source,Source URL
Example Housing Agency,5551234567,example.agency@example.com,FL,affiliates|haitian_orgs,Example Housing Agency,https://example.org,hud_housing_counselor,https://data.hud.gov/Housing_Counselor
```

`Lane` is one or more of `affiliates`, `specialists`, `jobs`, `haitian_orgs`, separated by `|`.

## What this pipeline will not do

- Send email, SMS, or a nurture sequence from the collector or the importer
- Invent emails for organizations that did not publish one
- Scrape Indeed, LinkedIn, Facebook, NMLS bulk files, or church member lists
- Crawl each agency’s website looking for staff inboxes
- Commit `collected.local.json` or `cold-import.local.csv`

Haitian **consumer** CSV import is unchanged: [haitian-cold-import.md](./haitian-cold-import.md).
