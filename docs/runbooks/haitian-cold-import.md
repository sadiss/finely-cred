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

**Never commit PII CSVs to git.** Keep files outside the repo or in a secure bucket.

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

Re-run is **idempotent** (updates metadata on existing email / phone match).

## Supabase production

When `VITE_SUPABASE_URL` and anon/service keys are configured in the environment:

- Inserts/upserts go to `lead_captures` with `consent_to_contact = false`
- No nurture enrollments are created by the cold import path

If prod secrets are missing on a cloud VM, ship the importer + dry-run proof only; run `--apply` from a machine with production env vars.

## Cold → hot opt-in

Public funnel: **https://finelycred.com/free-kreyol-guide**

On consented submit, `submitLeadCapture` runs the full pipeline and enrolls `seq_kreyol_funnel` (with Haitian template copy).
