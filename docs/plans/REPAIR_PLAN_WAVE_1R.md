# Finely Cred repair plan — tracked mirror (Wave 1R excerpt)

Source of truth for execution todos remains `.cursor/plans/finely_cred_repair_plan_1c05825b.plan.md` (Cursor UI). This file is the **git-tracked** reminder of the owner correction so a clean does not erase the global rule.

## Locked north-star (2026-08-25)

**GLOBAL enhanced record inspector:** Click any similar record card → enhanced new-UI inspector/popup with the same features/tabs/flow as the old detail UI. Never default-route to legacy full-page UI. Partners is the first instance; apply everywhere (CRM, cases, courses, projects, debt, disputes, …).

Full inventory + execution order: [ENHANCED_RECORD_INSPECTOR.md](./ENHANCED_RECORD_INSPECTOR.md)  
Partners template detail: `.cursor/plans/restore_partner_inspector_popup_ba0cfd88.plan.md`  
Status / next agent: [BUILD_CHECKPOINT.md](./BUILD_CHECKPOINT.md)

## What was wrong before

Wave 1 agents treated “fix detail routes” as routing `:id` into embedded legacy pages (`AdminPartnerFileProductSurface` → `PartnerDetailPage`). That restored the **old full page** and narrowed the work to partners-only. Owner: this was already meant to be the plan **for everything**.

## Wave 1R order

1. Partners (template popup)
2. CRM
3. Cases
4. Admin courses + projects
5. Portal debt + disputes (+ courses/projects)
6. Sweep remaining card→`:id` leftovers
