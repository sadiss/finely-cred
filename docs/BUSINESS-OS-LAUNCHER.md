# Business OS launcher

Status: **SHIPPED** for the orb, the six rooms, local drafts, and browser demos. **PARTIAL** where a company or a key still lives outside this app.

## What you click

On every `/admin` screen, and on the workspace-light admin preview, a gold medallion sits at the bottom right (above the chat bubble). One click opens a full-screen Business OS. Close returns you to the page. The sheet scrolls as one page. Labels are large. The Start here strip is Morning brief, Partner drafts, Caption pack, Finely Cred, and Free power tools.

Command Intelligence stays on the admin home. This launcher does not replace it.

## Rooms

| Tile | Status | Behavior |
| --- | --- | --- |
| Finely Cred | SHIPPED | Links to Courses, Marketing Desk, Partners, the business-credit journey, and Command Intelligence |
| Nora Capital | PARTIAL | Opens `VITE_NORA_CAPITAL_URL` or a public URL saved in this browser. Otherwise an open-Nora checklist. No Nora API key field |
| Jireh Profits | PARTIAL | Separate copper mark and copy. Status is “next build”. Site and EA doc slots start empty |
| Client businesses | SHIPPED | Name, notes, docs-folder link in local storage |
| Docs & Keys | PARTIAL | Document links plus masked key slots (last 4 only). Refs stay in local storage. Supabase storage of those refs is not wired, because browser inserts into `audit_events` can fail RLS |
| Free power tools | PARTIAL | OSM/Overpass, YouTube, Census/ACS, FDIC/NCUA, Open-Meteo, Zoho approve-before-send, nightly QA checklist |

Open-Meteo answers from the browser with no key. The other lookups use the same Command Intelligence runner: honest empty or not-wired text, no invented scores or videos.

## Automations

Morning brief, the Partner Email Desk, and the caption pack are local. The desk seeds HOLD drafts from warm partner files that already have an email and does not send them. See `docs/OWNER-MINIMAL-SETUP.md`.

## Secrets

`.env.example` lists the optional names. No secret values are committed. Pasting into Docs & Keys discards the full string after masking.
