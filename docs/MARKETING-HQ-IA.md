# Marketing HQ — information architecture

## Entry

| Route | What you see |
|-------|----------------|
| `/admin/marketing` | **Marketing Command Floor** — Start here strip + department grid |
| `/admin/marketing/:deptId` | **Department floor** — channel room doors with plain-English desk guides |
| `/admin/marketing/:deptId/:channelId` | **Channel room** — **Ready to use** pack cards, queue, campaigns, wired tools |
| `/admin/marketing/view/:assetId` | **Pack preview** (markdown / text / offer JSON) |

Admin dashboard tile: **Marketing HQ** → `/admin/marketing`  
**Comms Studio** (`/admin/comms`) links back to Marketing HQ.

## Beginner guide (< 30 seconds)

1. Open **`/admin/marketing`** and tap **Start here** (Social Media / Guides / Email / Partner one-sheet).

**Naming:** **Social Media Desk** = Facebook & YouTube posts from Finely packs (manual paste). **Specialist Lounge** = staff community & meetings (`/admin/specialist-lounge`) — not the marketing desk.
2. In a room, use **Ready to use** cards: **Preview** (new tab or viewer), **Copy** (clipboard), **Download** (file).
3. **Manual send only** — HQ never auto-sends. Paste into Comms Studio, ESP, or social scheduler yourself.
4. **Ready** = approved to use; **Hold** = do not publish until a Director clears it.
5. Brand lock: gold `#fbbf24`, ink `#0b1110` / `#060908`, **medallion** — no Nora logos on Finely-primary cold art.

### Owner quick paths (after pull)

- Command floor: `/admin/marketing`
- Growth email (21-day + Start Restore): `/admin/marketing/growth-acquisition/email`
- Growth Social Media (FB/YouTube captions): `/admin/marketing/growth-acquisition/social`
- Partner one-sheet: `/admin/marketing/partner-referral/content`

## Sales pack source of truth

| Content | Repo path | Served in dev/build |
|---------|-----------|---------------------|
| 21-day emails | `docs/sales-packs/finely/21-day/emails/` | Preview via viewer + raw bundle |
| SMS + captions | `docs/sales-packs/finely/21-day/sms/` | Same |
| HTML one-sheets | `docs/sales-packs/finely/html-one-sheets/` | `/marketing-packs/finely/html-one-sheets/*.html` after `npm run sync:packs` |
| Partner MD | `docs/sales-packs/finely/partner-one-sheets/` | Viewer + download |
| Brand lock | `docs/sales-packs/finely/BRAND-KIT-LOCK.md` | Brand & Creative room |
| Call outline | `docs/sales-packs/finely/scripts/inbound-intake-call-outline.md` | Growth email desk |

Run `npm run sync:packs` (also runs before `npm run dev` / `npm run build`) to mirror packs into `public/marketing-packs/finely/` for HTML preview assets.

## Hierarchy (locked)

```
Marketing Command Floor
├── Floor 1 — Growth Acquisition
│   ├── Email · Social · SMS · Paid · Content
├── Floor 2 — Partner Referral Marketing
│   ├── Email · Social · Content
├── Floor 3 — Haitian / Kreyòl Corridor
│   ├── Email · Social · SMS · Content
├── Floor 4 — Nurture & Lifecycle
│   ├── Email · SMS · Content
├── Floor 5 — Brand & Creative
│   ├── Content · Social · Email
├── Floor 6 — Performance Analytics
│   ├── Content · Paid · Email
└── Floor 7 — Direct Mail (stub)
    └── Direct Mail room — partner network later, vendor connect brief
```

**Top nav = departments (floors).**  
**Left sub-nav (when on a floor) = channel desks.**  
**Director / Specialist / VA = role tags on queue rows.**

## Live campaign object

**Start Restore — $147** appears in:

- `/admin/marketing/growth-acquisition/email`
- `/admin/marketing/growth-acquisition/social`

Package: `start_restore_147` · Public: `/start`

## Visual system

- Gold `#fbbf24`, ink `#0b1110` / `#060908`
- Medallion from `/brand/finely-cred-mark.png`
- Office metaphor — floors & rooms, not toy gamification
- High-contrast CTAs (gold on ink); avoid gray-on-gray body text

## Code map

| Path | Purpose |
|------|---------|
| `src/features/marketingHq/marketingHqModel.ts` | Departments, desks, room snapshots |
| `src/features/marketingHq/finelyPackCatalog.ts` | Ready-to-use asset index per room |
| `src/features/marketingHq/finelyPackContent.ts` | Raw pack file bundle (`import.meta.glob`) |
| `src/features/marketingHq/MarketingReadyAssetCard.tsx` | Preview / Copy / Download UI |
| `src/features/marketingHq/MarketingPackViewer.tsx` | `/admin/marketing/view/:assetId` |
| `src/features/marketingHq/MarketingStartHereStrip.tsx` | Command floor quick actions |
| `scripts/sync-marketing-packs.mjs` | Docs → `public/marketing-packs/finely` |

## Local demo URLs

1. `http://localhost:5175/admin/marketing`
2. `http://localhost:5175/admin/marketing/growth-acquisition/email`
3. `http://localhost:5175/admin/marketing/growth-acquisition/social`
4. `http://localhost:5175/admin/marketing/partner-referral/content`
5. `http://localhost:5175/admin/marketing/direct-mail/direct-mail` (stub)

Requires admin login (`ProtectedAdminRoute`).
