# Credit report parsing diagnostics

This app parses **HTML exports** from supported monitoring providers into structured tradelines, payment history, scores, and key report sections.

When providers change their export layout, parsing quality can degrade. To troubleshoot quickly, the app includes a **Parsing diagnostics** panel in both the Partner Portal and Admin Partner view.

## Where to find it

- **Partner Portal**: `Partner Portal → My Credit Reports → select a parsed report → Parsing diagnostics`
- **Admin**: `Admin → Partners → select partner → Reports tab → Parsing diagnostics (admin)`

## What it shows

- **Coverage counters**: number of tradelines, scores, and how many tradelines include a 24‑month history table
- **Quality flags**:
  - `Provider not recognized`: the export doesn’t match known provider patterns
  - `Fallback detection used`: tradelines were inferred from bureau-header tables (still useful, but less confident)
- **Admin-only**: section coverage breakdown (how many rows/columns were found per section key)

## Copying diagnostics

Use **Copy** in the diagnostics panel to copy a JSON payload suitable for support/debugging. It intentionally **does not** include the full personal info payload or full tradeline contents.

## Best upload format (important)

- **Best**: HTML export from the provider portal
- **Okay**: searchable-text PDF (can be displayed and referenced, but does not parse into tradelines)
- **Not parseable**: scanned/image-only PDF (no selectable text)

