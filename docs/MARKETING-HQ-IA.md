# Marketing HQ — information architecture

## Entry

| Route | What you see |
|-------|----------------|
| `/admin/marketing` | **Marketing Command Floor** — department grid |
| `/admin/marketing/:deptId` | **Department floor** — channel room doors |
| `/admin/marketing/:deptId/:channelId` | **Channel room** — queue, campaigns, assets, send/hold, desk roles |

Admin dashboard tile: **Marketing HQ** → `/admin/marketing`  
**Comms Studio** (`/admin/comms`) links back to Marketing HQ (templates execute from wired tools in each room).

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
**Director / Specialist / VA = role tags on queue & campaign rows inside a room.**

## Live campaign object

**Start Restore — $147** appears in:

- `/admin/marketing/growth-acquisition/email`
- `/admin/marketing/growth-acquisition/social`

Package: `start_restore_147` · Public: `/start`

## Visual system

- Gold `#fbbf24`, ink `#0b1110` / `#060908`
- Inter (app default), medallion/icon from `/brand/finely-cred-icon.svg`
- Office metaphor — floors & rooms, not toy gamification

## Code map

| Path | Purpose |
|------|---------|
| `src/features/marketingHq/marketingHqModel.ts` | Departments, desks, room snapshots |
| `src/domain/marketingDepartment.ts` | Legacy export alias |
| `src/features/marketingHq/MarketingHqShell.tsx` | Shell + left nav |
| `src/features/marketingHq/MarketingHqViews.tsx` | Floor / dept / room UI |
| `src/pages/admin/MarketingHqPage.tsx` | Routed page |

## Local demo URLs

1. `http://localhost:5173/admin/marketing`
2. `http://localhost:5173/admin/marketing/growth-acquisition`
3. `http://localhost:5173/admin/marketing/growth-acquisition/email` (Start Restore card)
4. `http://localhost:5173/admin/marketing/direct-mail/direct-mail` (stub)

Requires admin login (`ProtectedAdminRoute`).
