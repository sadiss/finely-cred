# Marketing Desk — Grok-style Find

Owner path: `/admin/marketing-desk?tab=desk&helper=find`

## SHIPPED

- One ask box. Placeholder: `BHPH near me, tax pros South Florida`. The owner does not have to type a city before Find or Daily pack.
- Place phrases are parsed (`in Miami`, `near Tampa`, `South Florida`) and the leftover words become the search.
- Browser geolocation runs on the Find visit, then [Nominatim](https://nominatim.openstreetmap.org/reverse) reverse-geocodes it.
- Last metro stays on the existing key `finely.marketing_desk_find_geo.v1` (store version still `1`). Added fields: `source`, `lat`, `lng`, `city`, `state`, `status`, `updatedAt`, `lastAsk`.
- If location access is denied or Nominatim fails, metro chips show: Miami, Broward, Palm Beach, Orlando, Atlanta, Tampa.
- City stays collapsed under “City (optional)”.
- Empty city is valid:
  - One-tap uses `resolveMarketingHuntLocation` (named place, then stored metro, then today’s shard).
  - Daily pack uses `resolveDailyPackMetroTargets` (one city only when the ask named one; otherwise the shard, with the stored metro first).
- The same ask bar is on Caleb’s area field, Lead Intel discover, and the Lead Intel source wizard. Those screens used to require a query and a location.

## PARTIAL

- Board, Mail, Clean, and Ruth do not ask for a city or a query, so they do not grow an ask bar.
- Nominatim can refuse a browser request (no custom User-Agent, rate limits, or a blocked network). The desk then keeps the last metro or shows the chips. Find still runs.
- Overnight “Find while I sleep” still saves the effective metro onto the schedule when it is turned on. A later one-tap with an empty city uses that stored metro.

## Files

- `src/features/marketingDesk/MarketingDeskEasyAskBar.tsx`
- `src/features/marketingDesk/marketingDeskFindAsk.ts`
- `src/features/marketingDesk/marketingDeskFindGeo.ts`
- `src/features/marketingDesk/marketingDeskHunt.ts`
- `src/features/marketingDesk/usMetroShardMap.ts`
- `src/features/marketingDesk/rooms/FindPeopleRoom.tsx`
