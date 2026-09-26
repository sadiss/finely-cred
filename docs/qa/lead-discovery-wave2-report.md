# Lead discovery Wave 2 — counts only

Run: `2026-09-26T15:21:12.087Z` via `npm run leads:discover`.

No emails were sent. No SMS. No calls. This file has counts only: no organization names, personal names, emails, phones, street addresses, or websites.

Real contacts from this run stay in gitignored `data/lead-discovery/collected.local.json`, `cold-import.local.csv`, and `summary.local.md`.

## Before → after

| Metric | Wave 1 (PR #38) | Wave 2 |
|---|---:|---:|
| Unique organizations | 331 | **3921** |
| Rows with a public email | 65 | **304** |
| Employer postings (auto title match) | — | **0** |

Target was at least 2,000 unique organizations. Stretch was at least 3,500. This run is **3921** unique organizations after dedupe.

## Lanes

An organization can sit in more than one lane. Lane totals are not a partition of 3921.

| Lane | Records | With public email | Directory only (no email) |
|---|---:|---:|---:|
| Affiliates / referral | 2308 | 304 | 2004 |
| Credit specialist offices | 1463 | 289 | 1174 |
| Haitian / Creole-language orgs | 2027 | 24 | 2003 |
| Job postings | 0 | 0 | 0 |

Public emails are almost entirely HUD locator addresses. ProPublica does not return emails. The cold-import CSV has **304** rows, one per public email. Import forces `consentToContact` and `consentEmailMarketing` false. Dry-run of that CSV: `unique=304 inserted=304 updated=0 skipped=0 failed=0 consent=false email_sent=0`.

## Sources

| Source on the deduped record | Unique orgs |
|---|---:|
| ProPublica only | 3464 |
| HUD only | 433 |
| Both (same org matched across sources) | 24 |
| **Total** | **3921** |

Cross-source dedupe collapsed **4090** source-level records to **3921** (−169) using EIN, normalized phone, normalized email, and normalized organization + city + state.

### HUD counselor locator

| Item | Count |
|---|---:|
| Metros queried | 72 |
| Radius | 25 miles |
| Locator rows returned | 1426 |
| Rows kept (Creole `CRE`, services `FBC`/`FBW`, or a credit-counseling agency name) | 1096 |
| Unique agencies before cross-source dedupe | 560 |

The required South Florida, Northeast, and named large-market centers are in the catalog. Additional large metros (for example Phoenix, Detroit, Seattle, Baltimore, Cleveland, Austin, Minneapolis, Denver) were queried the same way so the locator was not limited to the minimum list.

### ProPublica Nonprofit Explorer

Focus states, each exhausted: FL, NY, NJ, MA, GA, TX, PA, MD, DC, IL, NC, CA, CT, RI, LA. A national pass was exhausted for every keyword as well. **2,697** unique organizations have a focus-state code. The rest are national-pass organizations in other states, territories, or a missing state code (20).

No query hit the catalog page cap (120). The longest result was `haitian` nationally: API `total_results` 1991, **80 pages**, all fetched. Source HTTP errors: **0**. Documented API caps: **none**.

Keyword counts below overlap. Summing them double-counts organizations that matched more than one search. “API reported” and “dropped” are the national query only.

| Keyword | API reported (national) | Dropped by name filter (national) | Unique orgs with this keyword |
|---|---:|---:|---:|
| haitian | 1991 | 47 | 1940 |
| haiti | 1140 | 29 | 1109 |
| caribbean | 596 | 281 | 315 |
| housing partnership | 224 | 0 | 216 |
| financial literacy | 201 | 4 | 195 |
| neighborhood housing | 184 | 3 | 154 |
| financial education | 164 | 3 | 160 |
| haitian american | 130 | 2 | 128 |
| homeownership | 88 | 1 | 87 |
| immigrant services | 82 | 1 | 81 |
| credit counseling | 81 | 3 | 78 |
| refugee services | 80 | 13 | 67 |
| consumer credit | 74 | 3 | 71 |
| credit education | 60 | 0 | 60 |
| ayiti | 43 | 1 | 42 |
| financial empowerment | 37 | 0 | 37 |
| kreyol | 25 | 16 | 9 |
| housing counseling | 20 | 0 | 20 |
| little haiti | 15 | 1 | 14 |
| financial counseling | 13 | 0 | 13 |
| creole | 988 | 977 | 11 |
| housing counselor | 9 | 0 | 9 |
| debt management | 7 | 0 | 7 |
| foreclosure prevention | 4 | 0 | 4 |
| ayisyen | 4 | 1 | 3 |

`creole` and `caribbean` are fuzzy on this API. The creole query also matches unrelated spellings plus restaurants and festivals. Those two keywords keep a whole-word match, a community or service word, and a junk exclusion. That is why 977 of 988 national `creole` hits were dropped. The 11 kept are the ones that passed the filter. This is not an API cap.

Affiliate reasons stored on local records (not repeated here) include chamber/association-style names and referral-relevant NTEE prefixes (`S`, `L`, `P20`, `P51`, `P52`, `P84`).

## States

| State | Unique orgs |
|---|---:|
| FL | 769 |
| NY | 402 |
| CA | 223 |
| MA | 190 |
| OH | 184 |
| TX | 172 |
| GA | 154 |
| PA | 154 |
| NJ | 141 |
| IL | 123 |
| MD | 104 |
| NC | 88 |
| MI | 87 |
| VA | 86 |
| CT | 71 |
| IN | 71 |
| MN | 65 |
| TN | 60 |
| MO | 52 |
| AZ | 50 |
| CO | 50 |
| WI | 46 |
| WA | 45 |
| DC | 44 |
| LA | 40 |
| OR | 35 |
| DE | 31 |
| KY | 31 |
| SC | 31 |
| UT | 28 |
| AL | 26 |
| IA | 22 |
| RI | 22 |
| KS | 20 |
| unknown | 20 |
| AR | 15 |
| ID | 13 |
| ME | 13 |
| NV | 13 |
| OK | 13 |
| SD | 13 |
| NE | 12 |
| PR | 12 |
| VI | 11 |
| NH | 10 |
| NM | 9 |
| VT | 9 |
| WV | 9 |
| HI | 7 |
| MS | 7 |
| ND | 5 |
| WY | 5 |
| AK | 4 |
| MT | 4 |

## Jobs lane

| API | Pages fetched | Title matches |
|---|---:|---:|
| Remotive — credit counselor | 1 | 0 |
| Remotive — housing counselor | 1 | 0 |
| Remotive — financial coach | 1 | 0 |
| Remotive — loan officer | 1 | 0 |
| Remotive — debt counselor | 1 | 0 |
| Remote OK | 1 | 0 |
| Arbeitnow | 5 | 0 |

The boards responded (zero source errors) and the title filter matched nothing. Indeed, LinkedIn, USAJOBS, and NMLS stay manual query packs in the catalog. Zero auto-matched postings is an empty-API result, not a fabricated list.

## Checks

| Command | Result |
|---|---|
| `npm run leads:discover` | exit 0; unique_organizations=3921; source_errors=0; api_caps=0 |
| `npm run leads:discover:check` | passed; consent flags forced false; email_sent=0 |
| `npx tsx scripts/lane-cold-import.ts --dry-run data/lead-discovery/cold-import.local.csv` | unique=304 inserted=304 failed=0 consent=false email_sent=0 |
| `npx tsc --noEmit` | exit 0 |

`--apply` was not run. Nothing was imported into a CRM. Nothing was deployed.
