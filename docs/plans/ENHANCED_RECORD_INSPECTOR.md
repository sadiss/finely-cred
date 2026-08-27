# Enhanced record inspector — GLOBAL rule (locked)

Last updated: 2026-08-25 (P2 global inspectors — business disputes + growth agents)

Active detail plan: `.cursor/plans/restore_partner_inspector_popup_ba0cfd88.plan.md`  
Master playbook: `.cursor/plans/finely_cred_repair_plan_1c05825b.plan.md` (Wave **1R**)

## Owner correction

> "this should be for everything, I thought this was already in the plan. you're mixing everything up"

Do **not** treat this as partners-only. The partner-card popup is the **template for all similar record clicks** across admin and partner UI.

## Locked rule

1. Click record card → **enhanced new-UI inspector / popup / drawer**
2. Transfer **same features, tabs, and flow** from the old detail UI — enhanced, luxury-styled
3. **Never** default-route to legacy full-page DetailPage / leftover embed as the product
4. URL `:id` deep links are fine **if** they open the inspector over the list (not a silent swap to old chrome)
5. Partners = **first instance**; then CRM, cases, courses, projects, debt, disputes, and every peer

## Inventory snapshot (2026-08-25 post peer conversion)

| Surface | Status | Notes |
|---|---|---|
| Admin partners | **Done (template)** | `PartnerRecordInspector` on `AdminPrimarySignatureSurface`; leave to partners worker |
| Admin CRM | **Converted** | `/admin/crm/records/:id` → `admin:crm` + enhanced sheet (`AdminCrmRecordPage`) |
| Admin cases | **Converted** | `/admin/cases/:id` → `admin:cases` + enhanced sheet (`AdminCaseDetailPage`) |
| Admin projects | **Done** | `:id` → overlay sheet over portfolio |
| Admin courses | **Done** | course id → overlay editor over library |
| Portal debt | **Converted** | `/portal/debt/:id` → `partner:debt` + inspector overlay; close → hub |
| Portal disputes | **Converted** | `/portal/disputes/:id` → `partner:disputes` + inspector overlay; close → hub |
| Portal courses / projects | **Converted** | `:id` → list pageId + inspector overlay |
| Business disputes | **Converted** | `/business/disputes/:id` → `partner:business-disputes` + `ProductBusinessDisputeWorkspace` overlay |
| Growth agent detail | **Converted** | `/admin/growth-agents/:agentId` → `admin:growth-agents` + enhanced agent inspector overlay |
| Mail / threads / tasks | Keep | Already select→inspector in places |

## Constraints

- Workspace: `E:\Finely-Cred\Tishobe\finely-cred-main` only  
- No git commits unless asked  
- Never `StrReplace` on `PartnerDetailPage.tsx` (patch scripts only)  
- PowerShell: `;` not `&&`

## Done when

Every similar record-card click opens an enhanced new-UI inspector carrying old feature/flow parity. Legacy full pages are not the default destination.
