# Staff OS — Runbook

Hybrid **Role + Faces** model: stable `AgentPersonaId` roles drive behavior/automation; named **staff members** provide portraits, shifts, and public handoff.

## Architecture

| Layer | Source | Purpose |
|-------|--------|---------|
| Role | `src/domain/agentPersonas.ts` | `displayTitle`, prompts, tools, automation hooks |
| Member | `src/data/staffRoster.ts` | Name, avatar, shifts, department |
| Routing | `resolveStaffOnDuty(roleId)` | Intent → role → on-duty member |
| Presentation | `publicChatPersonaUi.ts` | Chat + portal UI |
| Voice | `src/lib/publicChatStaffVoice.ts` | Roster member → voice profile |

## Admin surfaces

| Route | Purpose |
|-------|---------|
| `/admin/agent-staff` | Roster grid, shift CRUD, on-duty KPIs, coverage gaps |
| `/admin/ops-autopilot` | Draft review, mail confirm, complaint, staff gap queues |
| `/admin/lead-magnets` | Funnel copy + assigned role without deploy |
| `/admin/automations` | Recipes, autopilot toggle, link to hands-free ops |

## Public + portal chat

- **Public:** `PublicChatWidget.tsx` — generic header until lane/intent handoff, then staff card animation.
- **Portal:** `HubAiCoachPanel.tsx` — roster-driven tabs, `consumeAgentHandoff()` continuity from funnels.
- **Funnels:** `LeadMagnetFunnelShell.tsx` → `saveAgentHandoff()` → open chat with same specialist.

## Hands-free automations

See [AUTOMATION_STUDIO.md](./AUTOMATION_STUDIO.md) for action matrix.

1. **Settings → Automation Autopilot** ON (`automationAutopilot` flag).
2. Enable recipes: `recipe_report_auto_draft`, `recipe_complaint_escalation`, `recipe_funnel_session_closer`.
3. Monitor `/admin/ops-autopilot` — mail and complaints always require human confirm.

## Supabase sync (Phase 12B)

Migration: `supabase/migrations/20260616000000_staff_members.sql`

```bash
supabase db push
npm run deploy:functions   # includes automation-runner
```

Boot: `main.tsx` calls `ensureStaffRosterSyncedOnce()` — local seed first, hydrate from Supabase when configured.

Admin shift saves call `syncStaffRosterToSupabase()`.

## Launch checklist

Admin dashboard **Launch checklist** includes:

- Staff OS roster count (≥30 active)
- Hands-free autopilot flag
- Staff Supabase migration reminder

Run before deploy: `npm run predeploy:check`

## Verification

```bash
npm run typecheck
npm run e2e:smoke
npm run e2e:playwright
```

Smoke asserts: 43+ roster seed, handoff UX, partner terminology, embedded letter studio tabs, automation-runner hooks.

## Extending

- **New role:** Add to `agentPersonas.ts` + `agentPersonaTools.ts` + optional `intentClassifier.ts` route.
- **New staff:** Append to `STAFF_ROSTER_SEED` in `staffRoster.ts` — no UI rewrites required.
- **New funnel:** Row in `leadMagnetFunnels.ts` + thin page + nurture sequence in `nurtureSequences.ts`.
