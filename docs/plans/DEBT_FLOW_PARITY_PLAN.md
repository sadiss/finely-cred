# Debt Flow Parity Plan

Last updated: 2026-08-25 (Stage 5 shipped — debt workstations + bankruptcy embed)  
Status: **Stage 5 complete** — portal debt hub + inspector Debt tab expose all five centers; `/portal/bankruptcy` embeds full filing workstation. Remaining: admin case overlay P0.2–P0.3, overlay chrome P1, e2e expansion P2.

## Purpose

Ensure the **new partner/record UI** (product shell + enhanced record inspector) delivers the **same debt workflows** as the old UI: validation, repossession, bankruptcy, affidavits/litigation, foreclosure, and per-case detail — not a stripped stub.

**GLOBAL rule:** Enhanced inspector popup with full feature parity. Partners template applies; debt parity must hold in **admin inspector Debt tab** and **portal debt surfaces**.

## References

| Doc / artifact | Role |
|---|---|
| [ENHANCED_RECORD_INSPECTOR.md](./ENHANCED_RECORD_INSPECTOR.md) | Locked card→inspector rule |
| [BUILD_CHECKPOINT.md](./BUILD_CHECKPOINT.md) | Active wave status |
| `.cursor/plans/restore_partner_inspector_popup_ba0cfd88.plan.md` | Partners inspector template |
| Explore audit `9d2a4304-cc40-431a-b519-a1a6b7caf6eb` | Old vs new debt inventory (2026-08-25) |
| `e2e/partner-functional-workstations.spec.ts` | Existing debt hub e2e (partial) |

## Constraints (implementation phase)

- Workspace: `E:\Finely-Cred\Tishobe\finely-cred-main`
- **Never** `StrReplace` on `PartnerDetailPage.tsx` — patch scripts only
- Prefer **embed/reuse** `LettersCommandCenter` + `*CenterView` panels over rewrite
- No git commits unless asked
- PowerShell: `;` not `&&`

---

## Executive summary

The complaint about a “stripped stub” is **partially valid but mis-targeted**.

| Surface | Workstation parity | Gap |
|---|---|---|
| `/portal/debt` hub | **Full** — all 5 centers via `LettersCommandCenter` | Case overlay is 75vh scroll, not full page |
| Admin inspector **Debt tab** | **Full** — embeds `PartnerDetailPage` debt section | No case drill-in; no Defense Playbook |
| `/portal/bankruptcy` | **Stub** — summary scaffold only | Filing/credit tracks missing on canonical route |
| Inspector **Partner view** lens | Dashboard KPIs only | No debt tab / workstations |
| Admin debt case cards | List + court chips | Read-only — no open-case inspector |

Core letter engines (validation, affidavits, repossession, foreclosure, bankruptcy-in-debt-tab) **already exist** in shared components. Gaps are **routing, navigation, and chrome** — not missing business logic.

---

## 1. Old debt subflow inventory

### 1A. Admin partner file — Debt tab

| Layer | File | Capability |
|---|---|---|
| Tab shell | `src/pages/admin/PartnerDetailPage.tsx` (`tab === 'debt'`, ~L2056+) | Debt Removal Center hero + 5 center launchers |
| Hub tiles | Same | Validation · Affidavit & Court · Foreclosure · Repossession · Bankruptcy |
| Workstation host | `src/components/letters/LettersCommandCenter.tsx` | `debtCenterMode` + `unifiedShell` |
| Case CRUD | `PartnerDetailPage.tsx` + `src/data/debtRepo.ts` | Add summons/debt context; list cases |
| Court outcomes | `src/data/courtOutcomeRepo.ts`, `src/components/debt/PartnerCourtOutcomePanel.tsx` | Payment-plan chips on case cards |

**Five workstation views (single source of truth):**

| Subflow | Component | Key tools |
|---|---|---|
| **Validation** | `src/components/debt/ValidationCenterView.tsx` | FDCPA catalog browser, creditor intel, validation advisor chat, FDCPA power chips, intelligent suggestions, saved vault strip, negotiation letters (cease & desist, settlement), escalations link |
| **Affidavits / Court / Litigation** | `src/components/debt/AffidavitCourtCenterView.tsx` | 5-stage pipeline (intake→answer→affidavit→discovery→hearing), docket scrape, extracted court facts, court advisor chat, litigation doc scraper, court-day kit, discovery/answer/affidavit catalog, securitization letters, court outcome panel |
| **Foreclosure** | `src/components/debt/ForeclosureCenterView.tsx` | RESPA QWR playbook, loss mitigation, dual-track, note/assignment, foreclosure advisor chat, `CollateralDefenseShell` |
| **Repossession** | `src/components/debt/RepossessionCenterView.tsx` | UCC Art. 9 playbook (wrongful repo, reinstate, claim & delivery, deficiency), repossession advisor chat |
| **Bankruptcy** | `src/components/letters/BankruptcyLetterStudioPanel.tsx` → `BankruptcyCenterView`, `BankruptcyFilingCenterView` | Ch 7/13 case mgmt, filing + credit tracks, letter drafts, comms handoff |

**Supporting shared stack:**

| Category | Files |
|---|---|
| Letter catalog (80+ entries) | `src/legal/debtLetterCatalog.ts` — validation, court, securitization, repossession, foreclosure, negotiation, reporting |
| Templates / bodies | `src/legal/debtLetterTemplates.ts`, `src/legal/debtAffidavitBodies.ts`, `src/legal/specialized/repossessionBodies.ts`, `src/legal/specialized/foreclosureBodies.ts` |
| Workflow engine | `src/lib/debtWorkflowEngine.ts`, `src/components/debt/DebtWorkflowPanel.tsx` |
| Creditor intel / proof | `src/components/debt/DebtCreditorIntelPanel.tsx`, `src/components/debt/DebtProofCaptureStrip.tsx` |
| Catalog browser | `src/components/debt/LetterCatalogBrowser.tsx`, `src/components/debt/LetterTemplateCatalogCard.tsx` |
| Easy flow / coach | `src/components/letters/DebtTrackEasyFlow.tsx`, `src/components/debt/ValidationAdvisorChat.tsx`, `src/components/debt/RepossessionAdvisorChat.tsx`, `src/components/debt/CourtAdvisorChat.tsx` |
| Escalations | `src/components/letters/LetterEscalationPanel.tsx`, `/portal/escalations` |
| Lane handoff | `src/components/debt/DebtLaneHandoffStrip.tsx`, `src/lib/debtLaneBootstrap.ts` |
| Post-judgment | `src/features/debt/PostJudgmentWorkspace.tsx` |
| Collateral | `src/components/debt/CollateralWorkstationSection.tsx`, `src/components/debt/CollateralDefenseShell.tsx` |
| Admin validation clocks | `src/features/debt/AdminValidationClocksPanel.tsx` |

**Admin classic gap:** case cards are display-only — no navigation to per-case detail workspace.

---

### 1B. Partner portal — Debt hub

| Layer | File | Capability |
|---|---|---|
| Hub page | `src/pages/portal/PartnerDebtPage.tsx` (`PartnerDebtWorkspace`) | Route `/portal/debt` |
| Tabs | Same | Overview · Validation · Litigation · Foreclosure · Repossession · Bankruptcy · Cases · Defense Playbook |
| Workstations | `LettersCommandCenter` | All 5 centers when tab active |
| Overview extras | Same | `SmartProofUploader`, case shortcuts, `DebtLaneHandoffStrip`, lane coach dock, success panel |
| Playbook | `DebtDefensePlaybookExplorer` (in `PartnerDebtPage.tsx`) | Debt-type × phase doctrine explorer |
| Entitlement | `ENTITLEMENT_KEYS.debt` via `EntitlementGate` | Gated access |

---

### 1C. Partner portal — Debt case detail

| Layer | File | Capability |
|---|---|---|
| Detail page | `src/pages/portal/PartnerDebtDetailPage.tsx` (`PartnerDebtDetailWorkspace`) | Route `/portal/debt/:id` |
| Tabs | overview · strategy · letters · legal | Per-case scenario picker |
| Per-case tools | Same + imports | `DebtWorkflowPanel` (timers), scenario-based letter catalog, validation/court advisor chats, `CollateralWorkstationSection`, `PostJudgmentWorkspace`, `PartnerCourtOutcomePanel`, `FdcpaPowerChips`, letter draft workspace, evidence picker |
| Cross-links | Buttons to hub tabs | validation / litigation / bankruptcy workstations |

---

### 1D. Partner portal — Standalone bankruptcy

| File | Capability |
|---|---|
| `src/pages/portal/PartnerBankruptcyPage.tsx` | Full `BankruptcyCenterView` + `BankruptcyFilingCenterView`, case CRUD, coach, comms handoff, filing/credit tracks |

---

### 1E. Debt-adjacent ecosystem (not inside Debt tab)

| Flow | Path |
|---|---|
| Escalations (CFPB/AG/BBB) | `src/pages/portal/PartnerEscalationsPage.tsx` |
| Credit Letters foreclosure/repo tabs | `LettersCommandCenter` credit mode |
| Public doctrine / guides | `src/pages/resources/DebtDefense*.tsx`, `src/data/debtLitigationDoctrineRepo.ts` |
| ECFR live cite | `src/features/debt/EcfrLiveCitePanel.tsx` |
| Law help by zip | `src/features/debt/LawHelpByZipHelper.tsx` |
| Litigation doc scraper | `src/components/debt/LitigationDocScraperChat.tsx` |

---

## 2. New product / inspector debt inventory

### 2A. Partner canonical routes (`ProductRoutedPage`)

| Route | Surface | What renders |
|---|---|---|
| `/portal/debt` | `PartnerDebtProductSurface` → `ProductDebtWorkspace` | **Full** `PartnerDebtWorkspace embedded` — all hub tabs + `LettersCommandCenter` |
| `/portal/debt/:id` | Same `pageId="debt"` | Hub visible; **enhanced case inspector overlay** with `PartnerDebtDetailWorkspace embedded` |
| `/portal/bankruptcy` | `PartnerBankruptcyProductSurface` | **Summary hub only** (`ProductHubScaffold`) — metrics/journey cards; no filing workstation |

Registry: `src/features/workspaceLightPreview/product/workspaceProductSurfaceRegistry.ts`  
- `partner:debt` → `FULL_WORKSTATION_SURFACES`  
- `partner:debt-detail` → `PartnerLeftoverWorkstationsSurface` (embeds full `PartnerDebtDetailWorkspace`)  
- `partner:bankruptcy` → `FULL_WORKSTATION_SURFACES` (misleading — scaffold only)

Case overlay: `src/features/workspaceLightPreview/product/components/ProductDebtWorkspace.tsx`  
Preview mirror: `/preview/workspace-light/portal/debt`

---

### 2B. Admin partner record — new UI

| Surface | File | Debt content |
|---|---|---|
| Default card click | `AdminPartnersProductSurface` → `AdminPrimarySignatureSurface` → `PartnerRecordInspector` | Admin-file lens embeds `PartnerDetailPage embedded` |
| **Debt tab** | `PartnerRecordInspector.tsx` — `?tab=debt` | Full Debt tab (5 centers + `LettersCommandCenter` + case list) |
| Partner view lens | Inspector `view=partner` | `PartnerDashboardProductSurface` — KPI/debt counts only, **no debt workstations** |
| Secondary drawer | `AdminPartnerFileProductSurface` (deprecated) | Full `PartnerDetailPage` embed |
| Legacy full page | `/admin/partners/:id` | Routes through product shell; inspector is default |

CSS: `adminPrimarySignature.css` — `.fc-wlp-partner-file-embed [data-fc-entity-detail-header]` hidden inside embed.

---

## 3. Gap matrix (ranked)

| Priority | Subflow | Old location | New location | Status |
|---|---|---|---|---|
| **P0** | **Standalone bankruptcy filing tools** | `PartnerBankruptcyPage.tsx` | `/portal/bankruptcy` → `PartnerBankruptcyProductSurface` (scaffold) | **MISSING** on canonical route; workaround: `/portal/debt?tab=bankruptcy` |
| **P0** | **Admin case → detail navigation** | Portal Cases tab → case click | Admin debt case grid read-only | **MISSING** in admin/inspector |
| **P1** | **Per-case detail workspace UX** | `/portal/debt/:id` full page | `ProductDebtWorkspace` 75vh overlay | **PARTIAL** — same component, constrained chrome |
| **P1** | **Defense Playbook explorer** | Portal `?tab=guides` | Not in admin debt tab | **MISSING** in admin |
| **P2** | **Partner-view lens debt workstations** | `/portal/debt` | Inspector partner lens = dashboard only | **MISSING** |
| **P2** | **Hub overview affordances** (proof uploader, handoff strip) | Portal overview tab | Admin debt tab jumps to centers + CRUD | **PARTIAL** |
| **P2** | **E2E coverage** | Manual | `partner-functional-workstations.spec.ts` | **PARTIAL** — no foreclosure/repo/bankruptcy tabs or case overlay |
| **OK** | Validation (FDCPA) | `ValidationCenterView` | Portal + admin inspector debt tab | **Parity** |
| **OK** | Affidavits / court / litigation | `AffidavitCourtCenterView` | Portal `?tab=litigation` + admin | **Parity** |
| **OK** | Repossession | `RepossessionCenterView` | Both surfaces | **Parity** |
| **OK** | Foreclosure | `ForeclosureCenterView` | Both surfaces | **Parity** |
| **OK** | Bankruptcy (in-debt-tab) | `BankruptcyLetterStudioPanel` | `/portal/debt?tab=bankruptcy` + admin | **Parity** |
| **OK** | Cease & desist / settlement / negotiation | `debtLetterCatalog.ts` NEGOTIATION via Validation | Same | **Parity** |
| **OK** | Escalations | `/portal/escalations` + validation links | Same | **Parity** |

### Partner portal vs admin differences

| Capability | Partner portal | Admin inspector Debt tab |
|---|---|---|
| 5 debt centers via `LettersCommandCenter` | Yes (hub tabs) | Yes (tile buttons + LCC) |
| Case create/list | Yes | Yes |
| Open case detail workspace | Yes (Cases tab → overlay) | **No click-through** |
| Defense Playbook tab | Yes | No |
| Overview proof upload / handoff strip | Yes | No dedicated overview |
| Lane coach per tab | Yes | Via LCC embedded coaches |
| Court outcome on case cards | In detail + hub | On admin case cards only |
| Entitlement grant (admin) | N/A | `onRequestGrantEntitlements` on LCC |
| Nav link resolution | `/portal/*` | `adminEmbeddedNavHref(partner.id, …)` when embedded |

---

## 4. Phased implementation plan

### P0 — Ship-blocking parity (do first)

| # | Task | Reuse (do not rewrite) | Touch files |
|---|---|---|---|
| P0.1 | **Embed full bankruptcy workstation** on `/portal/bankruptcy` | `PartnerBankruptcyPage` or `BankruptcyLetterStudioPanel` + `BankruptcyCenterView` + `BankruptcyFilingCenterView` | `PartnerBankruptcyProductSurface.tsx`, optionally `workspaceProductSurfaceRegistry.ts` |
| P0.2 | **Admin debt case drill-in** — click case card → enhanced inspector overlay with `PartnerDebtDetailWorkspace` | Mirror `ProductDebtWorkspace` overlay pattern | `PartnerRecordInspector.tsx` or thin wrapper; reuse `ProductDebtWorkspace` overlay CSS (`productDebtWorkspace.css`) |
| P0.3 | **Wire admin case open** from `PartnerDetailPage` debt case list (patch script — no StrReplace on file) | `PartnerDebtDetailWorkspace embedded` with `caseId` prop | Patch script targeting case card click handler in `PartnerDetailPage.tsx` |

**P0 acceptance:** Bankruptcy canonical route shows filing prep; admin inspector Debt tab opens per-case detail overlay with strategy/letters/legal tabs.

---

### P1 — UX parity + admin feature gaps

| # | Task | Reuse | Touch files |
|---|---|---|---|
| P1.1 | **Expand case overlay chrome** — taller drawer or expand-to-full for litigation pipelines | Existing `fc-wlp-debt-record-sheet` classes | `productDebtWorkspace.css`, `ProductDebtWorkspace.tsx` |
| P1.2 | **Admin Defense Playbook** — add playbook tab or deep-link chip on Debt tab | `DebtDefensePlaybookExplorer` from `PartnerDebtPage.tsx` | Inspector debt section or shared debt hub wrapper |
| P1.3 | **Deep-link parity** — `?tab=`, `?caseId=`, center paths resolve in product shell | `debtProductPaths.ts`, `debtHubHref` | `ProductDebtWorkspace.tsx`, nav helpers |
| P1.4 | **Inspector Partner view lens** — add “Open debt workstations” CTA → Debt tab or `/portal/debt` | Existing nav resolver | `PartnerRecordInspector.tsx` |

---

### P2 — Polish + regression gates

| # | Task | Reuse | Touch files |
|---|---|---|---|
| P2.1 | **Admin overview band** — optional proof upload + handoff strip on Debt tab | `SmartProofUploader`, `DebtLaneHandoffStrip` | Debt tab wrapper (not duplicate LCC) |
| P2.2 | **E2E expansion** — foreclosure, repossession, bankruptcy tabs; case overlay open/close | Existing preview path pattern | `e2e/partner-functional-workstations.spec.ts`, new `e2e/debt-flow-parity.spec.ts` |
| P2.3 | **Accent rotation audit** on debt inspector chrome | `workspaceAccentArrangement`, `finelyOsCatalogCard` | Inspector overlay + debt tab tiles |
| P2.4 | **Update stale docs** — `ENHANCED_RECORD_INSPECTOR.md` debt overlay note | — | `ENHANCED_RECORD_INSPECTOR.md` |

---

## 5. Reuse strategy (embed — never reimplement)

```
PartnerDebtProductSurface
  └─ ProductDebtWorkspace
       ├─ PartnerDebtWorkspace embedded          ← hub (LettersCommandCenter + tabs)
       └─ overlay: PartnerDebtDetailWorkspace    ← per-case detail

PartnerRecordInspector (admin-file lens)
  └─ PartnerDetailPage embedded
       └─ tab=debt → same 5 centers + LCC        ← already wired
       └─ [P0] case overlay → PartnerDebtDetailWorkspace

PartnerBankruptcyProductSurface [P0]
  └─ embed PartnerBankruptcyPage (or LCC bankruptcy panel)  ← replace scaffold

LettersCommandCenter (debtCenterMode)
  ├─ ValidationCenterView
  ├─ AffidavitCourtCenterView
  ├─ ForeclosureCenterView
  ├─ RepossessionCenterView
  └─ BankruptcyLetterStudioPanel
```

**Avoid:**

- Rebuilding validation/affidavit/repo/bankruptcy UI in `ProductHubScaffold` components
- Using `PartnerBankruptcyProductSurface` summary as canonical bankruptcy workstation
- Treating partner-view lens as debt replacement
- Duplicate letter catalogs outside `debtLetterCatalog.ts`

---

## 6. Acceptance criteria

### Admin inspector — Debt tab

- [ ] Open partner card → Debt tab (`?tab=debt`) shows 5 center tiles + active `LettersCommandCenter` workstation
- [ ] Validation center: FDCPA catalog, creditor intel, advisor chat, power chips visible and interactive
- [ ] Affidavit & Court center: 5-stage pipeline, affidavit catalog, court advisor, docket tools visible
- [ ] Foreclosure center: RESPA QWR playbook, loss mitigation, foreclosure advisor visible
- [ ] Repossession center: UCC Art. 9 playbook, repossession advisor visible
- [ ] Bankruptcy center: Ch 7/13 tracks, letter studio, filing center visible
- [ ] Case list: create case works; **click case opens enhanced inspector overlay** (P0)
- [ ] Overlay: overview/strategy/letters/legal tabs; `DebtWorkflowPanel`, collateral, post-judgment sections render
- [ ] Close overlay returns to Debt tab list (not legacy full page)
- [ ] No duplicate entity headers (embed chrome hidden per `adminPrimarySignature.css`)

### Partner portal — Debt hub

- [ ] `/portal/debt` — all hub tabs render (Overview, Validation, Litigation, Foreclosure, Repossession, Bankruptcy, Cases, Defense Playbook)
- [ ] Each workstation tab loads correct `*CenterView` via `LettersCommandCenter`
- [ ] Cases tab → click case opens enhanced debt inspector overlay (not silent legacy page)
- [ ] Overlay close returns to hub list URL
- [ ] Entitlement gate shows grant CTA when debt not entitled

### Partner portal — Bankruptcy canonical route (P0)

- [ ] `/portal/bankruptcy` shows full filing workstation (not summary scaffold only)
- [ ] Ch 7/13 case CRUD, filing + credit tracks, letter drafts functional
- [ ] Parity with `/portal/debt?tab=bankruptcy` content

### Regression — must not break

- [ ] Cease & desist / settlement letters reachable from Validation center
- [ ] Escalations link from validation center resolves to `/portal/escalations`
- [ ] Saved letter vault strips show saved counts on center tiles
- [ ] `npm run typecheck` passes after changes

---

## 7. Click-test script

### Admin (inspector Debt tab)

```text
1. /admin/partners → click any partner card
2. Debt tab (or ?tab=debt)
3. Click Validation tile → FDCPA catalog + advisor chat load
4. Click Affidavit & Court tile → pipeline stages + affidavit catalog load
5. Click Foreclosure tile → RESPA QWR section loads
6. Click Repossession tile → UCC playbook loads
7. Click Bankruptcy tile → Ch 7/13 studio loads
8. [P0] Click a debt case card → enhanced overlay opens with case tabs
9. In overlay: Strategy tab → scenario letters; Legal tab → collateral/post-judgment
10. Close overlay → back on Debt tab case list
```

### Partner portal

```text
1. /portal/debt — hub loads with accent-colored tabs
2. ?tab=validation — ValidationCenterView + cease & desist in catalog
3. ?tab=litigation — AffidavitCourtCenterView pipeline
4. ?tab=foreclosure — ForeclosureCenterView
5. ?tab=repossession — RepossessionCenterView
6. ?tab=bankruptcy — BankruptcyLetterStudioPanel
7. ?tab=guides — Defense Playbook explorer
8. Cases tab → click case → overlay “Enhanced debt inspector”
9. Close → URL returns to /portal/debt (no legacy full page)
10. [P0] /portal/bankruptcy — full filing workstation (not scaffold summary)
```

### Preview mirror (CI-friendly)

```text
/preview/workspace-light/portal/debt
/preview/workspace-light/portal/debt?tab=repossession
/preview/workspace-light/portal/debt/debt-demo-1  (or ?caseId=)
```

### Old vs new comparison paths

| Goal | Old (legacy) | New (product shell) |
|---|---|---|
| Validation | `/portal/debt?tab=validation` | Same |
| Litigation / affidavits | `/portal/debt?tab=litigation` | Same |
| Repossession | `/portal/debt?tab=repossession` | Same |
| Foreclosure | `/portal/debt?tab=foreclosure` | Same |
| Bankruptcy in debt | `/portal/debt?tab=bankruptcy` | Same |
| Standalone bankruptcy | Legacy `PartnerBankruptcyPage` content | `/portal/bankruptcy` **P0 fix** |
| Admin debt centers | `/admin/partners/{id}?tab=debt` | Inspector Debt tab |
| Case detail | `/portal/debt/{caseId}` full page | Overlay on hub **P1 chrome** |
| Admin case detail | None (read-only) | Overlay **P0** |

---

## 8. Why the stub complaint happens

Likely triggers for “debt is a stub” feedback:

1. User opened **`/portal/bankruptcy`** expecting filing prep → saw journey/summary scaffold
2. User used **admin inspector Partner view lens** → no Debt tab
3. User opened a **case** → 75vh overlay feels cramped vs old full-page detail
4. User compared **admin case list** (no drill-in) to portal Cases tab
5. Stale docs implied portal debt had no inspector overlay (fixed in Wave 1R but docs lag)

**Core workstation stack is wired** in partner debt hub and admin inspector Debt tab. Gaps are route-specific (bankruptcy page), admin case navigation, and UX framing.

---

## 9. Next agent spawn point

1. Implement **P0.1** — `PartnerBankruptcyProductSurface` embed pattern (copy `PartnerDebtProductSurface` approach)
2. Implement **P0.2–P0.3** — admin case overlay in inspector (reuse `ProductDebtWorkspace` overlay)
3. Run click-test §7 + `npm run typecheck`
4. Expand e2e per P2.2

Do **not** edit `PartnerDetailPage.tsx` via StrReplace — use patch script per repo rule.
