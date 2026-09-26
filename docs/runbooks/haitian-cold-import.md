# Haitian cold CSV import runbook

Cold Haitian community contacts must **never** receive nurture or marketing until they opt in at `/free-kreyol-guide`.

## Admin UI (recommended)

1. Open **Admin → Leads OS → Inbound** (`/admin/leads?tab=inbound`)
2. In the **Bulk import** panel, use **Haitian cold CSV import**
3. Run **Dry run** first — note inserted / updated / deduped counts (no PII in logs)
4. Uncheck dry run and **Import cold leads**

Filter imported rows with the **Haitian cold** toolbar toggle.

## CLI (local or production VM)

```bash
# Dry-run (counts only — safe for CI / cloud agent proof)
npx tsx scripts/haitian-csv-import.ts --dry-run /path/to/finely-haitian-leads-cleaned.csv

# Merge multiple deduped lists
npx tsx scripts/haitian-csv-import.ts --dry-run \
  ./finely-haitian-leads-cleaned.csv \
  ./finely-haitian-leads-outreach-ready.csv \
  ./finely-haitian-leads-FL-ready.csv

# Apply (writes to local finely.leads.v1 + lead_ops tags; Supabase when configured)
npx tsx scripts/haitian-csv-import.ts --apply /path/to/finely-haitian-leads-cleaned.csv
```

**Never commit PII CSVs to git.** Keep files outside the repo or in a secure bucket. `.gitignore` blocks `*leads*.csv`, `*-outreach*.csv`, `finely-haitian-*.csv`, and `Documents/FinelyCredit` paths.

## CSV schema (Haitian cold import)

| Column (aliases accepted) | Required | Notes |
|---------------------------|----------|-------|
| `First name` / `first_name` | No | Combined with last name if `full_name` absent |
| `Last name` / `last_name` | No | |
| `Email` | **Yes** | Phone-only rows skipped |
| `Phone number` / `phone` | No | Used for dedupe fallback |
| `State guess` / `state` | No | Stored in `utmContent` |

Redacted template (inline): use **Haitian cold CSV import → Load sample** in admin, or:

```csv
First name,Last name,Phone number,Email,Area code,State guess
Example,Lead,5551234567,example.lead@example.com,555,FL
```

Legacy partner exports (different import): see [legacy-partner-import.md](./legacy-partner-import.md) — committed JSON is a redacted `@example.com` demo; real SQL exports go to `*.local.json` (gitignored).

## Row defaults (every import)

| Field | Value |
|-------|--------|
| `source` | `haitian_csv_import` |
| `offer` | `haitian_credit_kit` |
| `interest` / audience | `haitian_community` |
| `consentToContact` | `false` |
| `consentEmailMarketing` | `false` |
| `funnelPath` | `/free-kreyol-guide` |
| Tags | `cold`, `haitian-community`, `source:haitian_csv_import`, `temperature:cold` |

Re-run updates metadata on an existing **unconsented** email / phone match. Rows that already have `consentToContact`, `consentEmailMarketing`, or `consentSmsMarketing` are left alone and counted as `preserved` (dry-run included). A second import must not clear an opt-in.

## Supabase production

When `VITE_SUPABASE_URL` and anon/service keys are configured in the environment:

- Inserts/upserts go to `lead_captures` with `consent_to_contact = false`
- No nurture enrollments are created by the cold import path

If prod secrets are missing on a cloud VM, ship the importer + dry-run proof only; run `--apply` from a machine with production env vars.

## Cold → hot opt-in

Public funnel: **https://finelycred.com/free-kreyol-guide**

On consented submit, `submitLeadCapture` **upgrades the existing cold row** (same lead id — no duplicate), strips `cold` and `temperature:cold`, adds `hot-opt-in`, `temperature:warm`, `temperature:hot`, and `source:free_kreyol_opt_in`, and runs the pipeline (`seq_kreyol_funnel`) only because consent is now true. A later strategy-call submit with the same email updates that row again.

Operator plan (nurture copy, booking, coverage when the owner is out, CRM buckets): [cold-to-hot-conversion.md](./cold-to-hot-conversion.md).

Do not send that sequence until the owner approves after the funnel is deployed. Admin **Enroll** is hidden on rows that are still cold. Call scripts in the conversion runbook are text only. Do not load them into a dialer, voice agent, or outbound phone job until Jireh approves the scripts and the calling hours.
