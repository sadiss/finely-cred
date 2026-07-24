# Docket sample (local only)

Copy owner docket PDFs here for local OCR testing (e.g. `DOCKET_NUMBER.pdf`).

- Do **not** commit partner PII PDFs to git.
- Portal scrape UI: `/portal/debt?tab=litigation` → Litigation doc scraper (OCR fallback for scanned PDFs).
- Code: `src/lib/ocr/litigationDocScraper.ts`, `src/components/debt/LitigationDocScraperChat.tsx`
