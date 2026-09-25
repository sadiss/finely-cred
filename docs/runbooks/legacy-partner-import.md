# Legacy partner import — PII-safe exports

Admin **Partner Import** can load a bundled JSON export for preview and migration. The committed file is a **redacted demo fixture** only.

## Committed (safe for public repo)

| File | Purpose |
|------|---------|
| `data/legacy-migration/legacy-partners-export-v1.json` | 3 `@example.com` partners — Admin “Load bundled export” demo |
| `data/legacy-migration/legacy-partners-audit.example.csv` | CSV schema reference (redacted rows) |

## Local only (gitignored — never commit)

| File | How to generate |
|------|-----------------|
| `legacy-partners-export-v1.local.json` | `node scripts/audit-legacy-sql.mjs [path-to-finelyno_finelycred.sql]` |
| `legacy-partners-audit.csv` | Same script |
| `legacy-partners-audit-summary.json` | Same script |

Keep the SQL dump and generated exports **outside the repo** or in a secure owner path (e.g. `~/Documents/FinelyCredit/` — also gitignored via `**/Documents/FinelyCredit/**`).

## Admin UI workflow

1. **Demo / QA:** Admin → Partner Import → **Load bundled export** (uses committed `@example.com` fixture)
2. **Real migration:** Run `audit-legacy-sql.mjs` locally, then paste or upload `legacy-partners-export-v1.local.json` in the import UI — do not add that file to git

## Residual git history

Prior commits may still contain the full 13-partner export JSON. This runbook does not purge history — owner must approve `git filter-repo` / BFG separately.
