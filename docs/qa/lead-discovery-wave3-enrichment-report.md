# Lead enrichment Wave 3 — counts only

Run: `2026-09-26T17:34:19.374Z` via `npm run leads:enrich`.

No emails were sent. No SMS. No calls. Nothing was imported. `consentToContact` was not set. This file has counts only: no organization names, personal names, emails, phones, street addresses, or websites.

Real contacts stay in gitignored `data/lead-discovery/enriched-emails.local.csv` and `data/lead-discovery/enrichment-report.local.md`. The same two files were copied to `artifacts/`.

This run did not call ProPublica and did not add name-only organizations.

## Result

| Metric | Number |
|---|---:|
| Queue rows (website field present) | 457 |
| Attempted websites (unique hosts) | **330** |
| Attempted org rows | 374 |
| New emails found (unique addresses not in the prior set) | **389** |
| Already had email (rows preserved) | **304** |
| Still no contact after attempt | **39** |
| Orgs that gained a published email | 64 |
| New email rows (organization + new address) | 427 |
| Failures (hosts with no page retrieved) | 18 |
| Skipped, no fetchable website | 83 |
| Pages retrieved | 1710 |
| Output rows (prior + discovered) | 738 |

The 304 prior email rows are all present in the gitignored CSV with `source_page` marked as the prior wave. They are not counted again as new.

Of the **389** new addresses:

| Slice | Unique addresses |
|---|---:|
| On an organization that previously had no email | 152 |
| Only on an organization that already had an email | 237 |

64 organizations that arrived with no email now have at least one published address. 39 organizations had a fetchable website, were attempted, and still have no email. 83 queue rows had no fetchable website (placeholder, `N/A`, or a street address in the website field) and were not fetched.

## What was fetched

Public homepage, `/contact`, `/about`, and `/en-contact`, plus a short list of other contact-like links only when those pages had no address. Robots `Disallow` was honored. Published `mailto:` links, visible addresses, JSON-LD email fields, and Cloudflare-protected addresses were kept. A person's name on a page was not turned into an inbox. Template domains and truncated hostnames were dropped. Staff-directory pages were capped at 8 addresses per organization, role inboxes first. Hosts that hit the cap: **18**.

## Why some sites produced no email

| Blocker | Hosts |
|---|---:|
| Page retrieved, no published email | 58 |
| Contact form only | 51 |
| HTTP error, no page | 15 |
| Parked domain | 2 |
| Robots disallow all | 1 |
| Timeout | 1 |
| Connection failure | 1 |

51 of the hosts with no published email did expose a contact form. That is a form URL, not an address, so those organizations stay in the "still no contact" count.

Skipped website fields:

| Reason | Rows |
|---|---:|
| `N/A` | 71 |
| Placeholder host | 6 |
| Street address | 6 |

## Checks

| Command | Result |
|---|---|
| `npm run leads:enrich:check` | passed; no network; no invented staff inbox |
| `npm run leads:enrich` | exit 0; attempted_websites=330; new_emails_found=389; already_had_email=304; still_no_contact_after_attempt=39 |

`--apply` was not run. Nothing was imported into a CRM. Nothing was deployed. No message was sent.
