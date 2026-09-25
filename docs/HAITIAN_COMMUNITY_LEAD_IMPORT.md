# Haitian community cold CRM import

These contacts do **not** know Finely has their information. Treat every row as **cold**. Import is for admin CRM visibility and later funnel attribution — **not** outreach.

**Zero emails are sent by this path.** Sequences are not enrolled. Partner B2B drafts (tax / BHPH / mortgage / realtor / immigration) stay on a separate track.

Do **not** commit the source CSVs. They contain personal names, phones, and emails.

## Where they appear

Imported rows land on the same inbound CRM surfaces admins already use:

- `/admin/leads` → Inbound CRM board + Bulk import panel
- Workspace leads inbox (same `LeadBulkImportPanel`)
- `/admin/crm` inbound pipeline (`crm_lead_*` records)

Local store: `lead_captures` (`finely.leads.v1`) + lead-ops tags.  
Production: `public.lead_captures` and `public.crm_records` (tenant `finely_cred`).

Opening `/admin/leads` pulls `lead_captures` + `crm_records` from Supabase so a production write is visible in another browser.

Filter: search `haitian`, `cold`, or `haitian_csv_import`.

## Tags / metadata on every row

- `source=haitian_csv_import` (`utm_source` + tag `source:haitian_csv_import`)
- `temperature=cold`
- `audience=haitian_community`
- `list=finely-haitian-*` (from filename slugs)
- `offer=haitian_credit_kit`
- `source` column = `csv_import`
- `consent_to_contact` / marketing consents = **false**
- `funnel_path=/haitian` (attribution only — does **not** enroll `seq_kreyol_funnel`)

Re-runs are idempotent: identity is normalized email, then phone.

## Admin UI (local or production app)

1. Sign in as admin.
2. Open **Leads → Inbound CRM**.
3. Keep **CRM only — no email, no sequences** and **Haitian community cold preset** checked (defaults).
4. Paste CSV (headers: First name, Last name, Phone number, Email, Area code, State guess).
5. Import. Confirm the notice includes `0 emails sent`.

## CLI (local or production Supabase)

Dry-run (default — counts only):

```bash
node scripts/import-haitian-community-leads.mjs \
  --csv /secure/path/finely-haitian-leads-cleaned.csv \
  --csv /secure/path/finely-haitian-leads-outreach-ready.csv \
  --csv /secure/path/finely-haitian-leads-FL-ready.csv
```

Write (service role; still sends **zero** email):

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"   # or VITE_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY="…"                    # never expose to the browser
node scripts/import-haitian-community-leads.mjs --write \
  --csv /secure/path/finely-haitian-leads-cleaned.csv \
  --csv /secure/path/finely-haitian-leads-outreach-ready.csv \
  --csv /secure/path/finely-haitian-leads-FL-ready.csv
```

Local Supabase: point `SUPABASE_URL` at `http://127.0.0.1:54321` and use the local service role from `npx supabase status`.

## Funnel readiness (opt-in later)

Cold imports are **not** enrolled. When someone opts in on a Haitian / Kreyòl page, `resolveSequenceForLead()` already maps those paths/offers to `seq_kreyol_funnel`.

| Route | Role |
| --- | --- |
| `/haitian` | Live Haitian community desk |
| `/kreyol` | Alias of `/haitian` |
| `/free-kreyol-guide` | Lead-magnet kits (`KREYOL_FUNNEL`, `funnelId: kreyol_companion`) |
| `/free-kreyol-guide/what-is-credit` | Kit |
| `/free-kreyol-guide/letter-meaning` | Kit |
| `/free-kreyol-guide/helper` | Kit |
| `/free-kreyol-guide/community-flyer` | Church / community flyer |
| `seq_kreyol_funnel` | Email sequence — **only after opt-in capture**, not this import |

Matching later: same email (or phone) on a funnel submit. Import rows keep `funnel_path=/haitian` so scoring/intel can attribute the audience without sending mail.

## Safety

- `upsertLeadCaptureSilent` / CLI `--write` never call `runLeadCapturePipeline` or `sendEmail`.
- `automation-runner` cron skips `source=csv_import` and `utm_source=haitian_csv_import`.
- Phone-only rows use `phone.<digits>@imported.invalid` (non-routable).
