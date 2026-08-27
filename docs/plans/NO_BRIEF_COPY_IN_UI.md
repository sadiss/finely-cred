# No briefing copy on the live UI

**Status:** In progress (hub + dashboard first; site-wide sweep continues)  
**Date:** 2026-08-25  
**Asked by:** owner — launcher showed chat-plan instructions (“Talk naturally · smart routing · no dropdowns”)

## Law

Hard rule: [`.cursor/rules/no-brief-copy-in-ui.mdc`](../../.cursor/rules/no-brief-copy-in-ui.mdc)

Visitors see a **name** and **what to do**. They never see the instruction we used to build the control.

## This pass (done when hub + Light paint land)

- [x] Communication Hub closed launcher: drop “One chat — AI + team” and the routing brief.
- [x] Hub header hints: short labels (AI coach / Team messages), not “smart routing”.
- [x] Hub greeting: no “no dropdowns” / “Talk naturally” spec language.
- [x] Partner dashboard section titles that were design notes (“without the clutter”, “mosaic”).
- [x] Light theme: hub + public chat stay **obsidian** (same paint as the open dark chat box), not a white card.

## Remaining sweep

Search user-visible strings (not comments) for: `no dropdowns`, `smart routing`, `without the clutter`, `mosaic`, `high-signal`, `omnichannel`, `tenant-scoped`, `neural narration`, `Talk naturally`, `One chat`.

Replace with a product name or a next step. Public pages and dashboard both count.

## Next phase after this pass

Leftover **program hubs** (Real Estate, HOS, Affiliate, Specialist, Agency, Case Help) are still old workstation bodies inside the new shell. Rebuild those as product surfaces — do not keep pale leftover embeds as the regular look.

## Hub Light theme (paired defect)

Light site theme was washing the hub header/launcher to white via `html[data-fc-theme="light"] [data-fc-comms-shell="1"]` mesh + text inversion. The hub is a dark instrument on both themes. Do not “fix contrast” by turning it into an ivory card.
