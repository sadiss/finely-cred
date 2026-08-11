# Marketing Desk

Plain-English daily desk for marketing. Route: `/admin/marketing-desk`.

## First paint
Command strip (Find Ready · Mail Ready) · KPI chips (Found · Auto-saved · Needs review · Mail moved · Booked · Junk) · Lane pace (≤3) · Mail tile · helpers · My work (≤5) · seats · How this works · Owner tools (+ Layout previews → `/admin/preview`).

## Helpers (`?helper=`)
`find` · `board` · `clean` · `ruth` · `mail`

## Find (A1–A2)
- One-tap / Daily pack / Find while I sleep · Fix setup wizard · last-run store
- Smart qualify: auto-save ≥70 · Review mid · skip junk/dupes · Review ≤8
- Cron: `runPlatformCronTick` → `runScheduledMarketingFind()` when schedule On (once/day, live only)

## Persist + Work OS (A3)
- `ensureMarketingPipelineProject()` — master project
- `persistApprovedMarketingHit` — dedupe website · email · domain
- `createMarketingTask` — `projectId` + `meta.prospectId` + Work goes to (+ Alternate RR)
- My work ≤5 for assignee; deep links prefer `/admin/*` `meta.href`, else Projects / My tasks

## Mail spine (A4)
- Ready = `commsDelivery` + Supabase (+ owner cron note)
- Checklist UI in Mail room · Pause / Resume · tiles ≤6
- Manual Approve enrolls link-first (`seq_invite_opt_in`) or cold when consent + `coldOutboundAutopilot` on; auto-save is CRM-only (`enrollMail: false`)
- unsub + trash cancel
- Stop-on-reply: webhook ingest/sync + live cron drain → pause + Hot reply to-do

## Booked (A5) + Wave B
- Board (Desk **or** Owner inbound) → Booked → `runBookedHandoff` (dedupe-safe)
- Partner seed via `convertCrmRecordToPartner` when email present; Convert task otherwise (CRM deep link)
- Find failed → My work Fix setup (create/refresh on fail; auto-complete on success)
- Stop-on-reply: reply + bounce + complaint pause; Hot reply to-do; Mail last-stop hint
- Ruth weekly tip · lane pace chips · multi-seat · morning brief (Fix setup CTA when Find failed)
- SOP: `docs/MARKETING_DESK_SOP.md`
