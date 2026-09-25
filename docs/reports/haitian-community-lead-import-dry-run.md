# Haitian community lead import — sanitized dry-run

**Generated from the three attached CSVs. No names, emails, or phones are recorded here.**

**Emails sent: 0.** Sequences enrolled: 0. Mode: dry-run (this cloud environment has no Supabase service-role credentials, so no production insert was performed).

| File | Raw rows | List slug |
| --- | ---: | --- |
| finely-haitian-leads-cleaned | 940 | `finely-haitian-leads-cleaned` |
| finely-haitian-leads-outreach-ready | 867 | `finely-haitian-leads-outreach-ready` |
| finely-haitian-leads-FL-ready | 337 | `finely-haitian-leads-fl-ready` |

**Unique contacts after email-then-phone dedupe: 899**

- With email: 892
- Phone-only: 7
- Present on cleaned list: 899
- Also on outreach-ready: 838
- Also on FL-ready: 323

State guess counts (unique set): FL 325 · `?` 141 · NY 98 · MA 71 · (blank) 54 · NJ 48 · PA 27 · IN 26 · other states 157.

## Next step for live insert

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="…"
node scripts/import-haitian-community-leads.mjs --write \
  --csv /secure/path/finely-haitian-leads-cleaned.csv \
  --csv /secure/path/finely-haitian-leads-outreach-ready.csv \
  --csv /secure/path/finely-haitian-leads-FL-ready.csv
```

Then open `/admin/leads` (Inbound CRM) and search `haitian_csv_import` or `cold`.
