# Admin navigation

Status: **SHIPPED**. No routes were removed.

## Before

Four large groups on the PageShell rail and simple mobile lanes:

1. Core
2. Comms & Content
3. Automation & AI
4. Platform

The product sidebar listed every primary tool. `/admin/marketing` stayed active for Marketing Desk, Content Studio, Playbooks, and growth tools. Collapsed rail showed a long icon stack. Overview on `/admin` did not mark active.

## After

Seven groups in `src/config/adminNavLanes.ts`. Home, Learn & train, and Marketing open by default.

| Group | What the owner sees |
| --- | --- |
| Home | Overview |
| Clients & work | Partners, CRM, cases, projects, workflow, mail, staff |
| Learn & train | Courses, training academy, specialist lounge, onboarding |
| Marketing | Marketing Desk, Marketing HQ, Social Media, playbooks, content studio |
| Money | Billing, finance, products, vendors, business-credit journey |
| Settings | Settings, access, team, appearance |
| More | Automations, Nora integration, vault, parsing lab, and the rest |

The live product sidebar uses `src/features/workspaceLightPreview/product/adminIa.ts` with the same groups plus a More nest for anything not listed. Active state for marketing is exact `/admin/marketing` or `/admin/marketing/…`. `/admin` matches Overview only.

Start here on the admin home is Command Intelligence: Courses, onboarding, Marketing Desk, partners, business credit, and playbooks. The Business OS orb repeats those doors.
