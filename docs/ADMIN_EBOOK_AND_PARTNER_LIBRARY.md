# Admin: Ebook conversion + Partner library

These two screens live inside Finely Cred so you do not need to download CSVs to see guide results or researched partners.

## Where to click

1. Sign in as an admin (same login as the rest of Admin OS).
2. Open **Admin → Ebook conversion** (`/admin/ebook-conversions`).
3. Open **Admin → Partner library** (`/admin/partner-library`).

Both also appear on the admin dashboard cards and on Analytics.

## Ebook conversion

Shows how many people claimed the free guides:

| Funnel | Public page | `funnel_id` |
|---|---|---|
| English restore guide | `/free-guide` | `credit_dispute` |
| Haitian / Kreyòl kits | `/free-kreyol-guide` | `kreyol_companion` |
| Other magnets | debt, business, tradeline, partner-refer, etc. | that funnel’s id |

For the last **7 / 14 / 30 days** you see:

- total captures
- % that left a phone
- UTM / referral tags (`utm_source`, campaign, `ref`)

### Live counts (optional)

If you want numbers from the real site, not just this computer:

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public keys — see `docs/SUPABASE_LEAD_CAPTURES_SETUP.md`).
2. Run the `lead_captures` table + `auth_read_lead_captures` policy in that doc.
3. Sign in as admin. The page reads `lead_captures` only — it does not write, and it does not need the service-role key.

If those env vars are missing, the page still works from this browser’s saved leads.

## Partner library

The researched MASTER list (719 partners) is loaded in the app.

Filters:

- corridor: **Haitian** or **General**
- metro
- category
- has phone + email
- outreach **HOLD** (default on — nothing has been sent)

The table is the main tool. **Export visible** is optional if you still want a spreadsheet of the current filter.

**Nothing emails partners.** Outreach stays HOLD. Credit **restore** language only — not “credit repair.”

## Brand ebook covers

Locked v3 cultural covers (gold `#fbbf24` + ink `#060908` / `#0a100e` only). Refined **Finely Cred** wordmark — no shield-F, no stacked FINELY.

- `/marketing/ebooks/restore-for-wealth-cover.png` — English Restore for Wealth (wealth stairs + gold door) for `/free-guide`
- `/marketing/ebooks/gid-kredi-kreyol-cover.png` — Kreyòl Gid Kredi (desk culture) for `/free-kreyol-guide`
- `/marketing/ebooks/see-inside-preview.png`

The same English file is also served as `/free-guide-cover.png`, `/guides/restore-for-wealth-cover.png`, `/guides/credit-dispute-letter-guide/cover.png`, and `/images/product-shots/guide-dispute-cover.png`. Official mark is the gold circle + Finely Cred wordmark in `public/brand`.

## Thank-you call SLA

After someone unlocks a guide, the success screen already says we will call **within 1 business day** (`LeadMagnetCallSlaCard`). Haitian / Kreyòl uses the Kreyòl line. Hours can be changed in Admin → Settings → Site → Lead-magnet call SLA.
