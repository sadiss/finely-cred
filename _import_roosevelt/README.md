# Roosevelt Corelus — local court partner import

**Court / hearing partner (Jul 27 Midland–Citi).** Not Yolie (credit restore).

## Local files

| File | Purpose |
|------|---------|
| `Roosevelts-Report.html` | SmartCredit HTML (PII — keep local; gitignored) |
| `parsed-summary.json` | Redacted parse notes (no SSN) |
| `OWNER_CLICKS.md` | Exact admin / portal clicks |

## Create in app (Supabase directory — not localStorage)

Admin Partners reads Supabase only. Ensure upserts via `admin-list-partners` (same as Create/Import).

1. Admin → **Partners** → amber card **Ensure Roosevelt court** (auto-seeds if missing)
2. Or **Import partners** → amber card → returns to directory
3. Seed id: `a8c3e7f1-4b2d-4e9a-9c1f-7d6e5b4a3928`
4. External id: `finely:roosevelt-corelus-court-v1`
5. Upload HTML on Roosevelt’s **Reports** tab to replace the pending placeholder

See `OWNER_CLICKS.md` for exact clicks.

## Hearing

- Case: Midland Funding LLC · original creditor Citibank · ~$1,094 · hearing **2026-07-27**
- Portal: view as Roosevelt → `/portal/debt?tab=litigation`
