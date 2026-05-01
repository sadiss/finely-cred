---
name: integrated-master-execution-plan
overview: Recover and extend the in-repo execution plans by adding (1) a partner Overall Score system (profile + execution readiness, route-aware) and (2) a true-3D, cinematic Partner Roadmap experience (WebGL) that replaces the current “scribble scrabble” roadmap presentation while preserving safe fallbacks.
todos:
  - id: score-model
    content: Design and document the Partner Overall Score categories, dynamic weights, and route-aware aggregation rules (personal-only, business-only, both).
    status: completed
  - id: score-implementation
    content: Add a computed scoring utility (new `src/utils/partnerOverallScore.ts`) that returns overall + breakdown + topActions using partner data plus workflow counts (reports/evidence/tasks/cases/letters).
    status: completed
  - id: score-ui
    content: Surface the score in `PartnerDashboardPage.tsx`, `PartnerChecklistPage.tsx`, and `admin/PartnerDetailPage.tsx` with premium KPI cards and a compact “Top improvements” list.
    status: completed
  - id: roadmap-3d-deps
    content: Add 3D dependencies (three + react-three-fiber + drei, optional postprocessing) and establish a fallback strategy for reduced-motion/WebGL failure.
    status: completed
  - id: roadmap-3d-component
    content: Implement `JourneyCinematicRoadmap3D` (3D spline path, nodes, animated marker, camera motion, overlays) and wire it as a third view in `JourneyRoadmap.tsx`.
    status: completed
  - id: roadmap-action-console
    content: Replace the current “Now → Next → Later” cards on the partner dashboard with an Action Console panel tied to the cinematic roadmap (desktop two-column, mobile stacked).
    status: completed
  - id: plan-doc-sync
    content: Update the existing plan/checklist docs to reference the new score system and 3D cinematic roadmap as explicit Phase items and verification steps.
    status: completed
isProject: false
---

# Integrated Master Execution Plan (Recovered + Extended)

## Context (what already exists)

- The repo already has planning artifacts that define phases and next steps:
  - `PLAN_BUILD_STATUS.md` (what was recently completed + next phases)
  - `PLAN_SITE_COMPLETION.md` (module-by-module completion + recommended build order)
  - `PLAN_FULL_SCOPE_EVERYTHING_ELSE.md` (exhaustive route/feature inventory)
  - `LAUNCH_READINESS_CHECKLIST.md` (P0 manual verification URLs)
- The current Partner Portal dashboard already contains two “roadmap-ish” constructs:
  - A **Journey Roadmap** component with `map` and `timeline` views (`src/components/journey/JourneyRoadmap.tsx`).
  - A **“Roadmap: Now → Next → Later”** section that is currently a simple 3-card grid and is likely the “scribble scrabble” you’re reacting to (`src/pages/portal/PartnerDashboardPage.tsx`).

Key insertion points:

```59:86:src/pages/portal/PartnerDashboardPage.tsx
  // Best-effort: keep journey stage in sync (local demo store).
  useEffect(() => {
    if (!partner) return;
    const nextStage =
      reports.length === 0
        ? 'report_upload'
        : evidence.length === 0
          ? 'evidence'
          : openTasks.length > 0
            ? 'letters'
            : openCases.length > 0
              ? 'analysis'
              : 'complete';
    if (partner.journeyStage !== nextStage) {
      upsertPartner({
        ...partner,
        journeyStage: nextStage as any,
        journeySignals: {
          ...(partner.journeySignals ?? {}),
          reports: reports.length,
          evidence: evidence.length,
          openTasks: openTasks.length,
          openCases: openCases.length,
        },
      });
    }
  }, [partner?.id, reports.length, evidence.length, openTasks.length, openCases.length]);
```

```115:123:src/pages/portal/PartnerDashboardPage.tsx
          <CollapsibleSection
            title="Journey roadmap"
            subtitle="Your progress — organized so you always know what to do next."
            count={`stage: ${partner.journeyStage ?? 'intake'}`}
            defaultOpen
            storageKey="portal.dashboard.journey"
          >
            <JourneyRoadmap stage={partner.journeyStage} signals={partner.journeySignals} lane={partner.lane} defaultView="map" />
          </CollapsibleSection>
```

```199:246:src/pages/portal/PartnerDashboardPage.tsx
          {(() => {
            const stage = partner.journeyStage ?? 'intake';
            const lane = partner.lane ?? 'other';
            const actions: Array<{ k: 'Now' | 'Next' | 'Later'; title: string; desc: string; path: string }> = [];
            // ... stage/lane-specific action selection ...
            return (
              <CollapsibleSection
                title="Roadmap: Now → Next → Later"
                subtitle="Based on your lane and stage, here’s the cleanest sequence."
                count={`lane: ${partner.lane ?? '—'} • stage: ${partner.journeyStage ?? 'intake'}`}
                defaultOpen
                storageKey="portal.dashboard.roadmap"
              >
                <div className="grid md:grid-cols-3 gap-4">
                  {actions.slice(0, 3).map((a) => (
                    <ClickableCard key={a.k} onClick={() => navigate(a.path)} className="p-5">
                      <div className="text-[10px] uppercase tracking-widest text-amber-400">{a.k}</div>
                      <div className="mt-2 text-white font-semibold">{a.title}</div>
                      <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                    </ClickableCard>
                  ))}
                </div>
              </CollapsibleSection>
            );
          })()}
```

## Workstream A — Partner Overall Score (profile + execution readiness)

### Definition (what it measures)

You selected: **Profile + execution readiness**.

- Score is **0–100**.
- It must be **route-aware**:
  - If partner has only personal route(s), score aggregates personal + shared + activity.
  - If partner has personal + business, score aggregates both (without double-counting shared pieces).
  - If partner has business-only, score aggregates business + shared + activity.

The partner model already supports multi-route intake storage:

```44:113:src/domain/partners.ts
export type PartnerRouteIntake = {
  goal?: string;
  score?: number;
  fundingTarget?: number;
  fractures?: string[];
  liabilityTier?: string;
  urgency?: string;
  personal?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    dob?: string;
    ssnLast4?: string;
  };
  business?: {
    businessName?: string;
    entityState?: string;
    einLast4?: string;
    naics?: string;
  };
};

export type Partner = {
  id: string;
  tenantId: string;
  status: PartnerStatus;
  profile: PartnerBaseProfile;
  primaryRoute?: PartnerRoute;
  lane?: PartnerLane;
  journeyStage?: PartnerJourneyStage;
  journeySignals?: Record<string, any>;
  routes: Partial<Record<PartnerRoute, PartnerRouteIntake>>;
  consents: PartnerConsents;
  financial?: PartnerFinancialProfile;
  // ...
};
```

### Scoring model (concrete, implementable)

- **Shared profile (base identity)**: name/email/phone.
- **Consents**: terms/privacy/disclaimer + optional eSign/reportUpload/communication (if present).
- **Personal profile completeness** (only if any personal route exists): address/city/state/postalCode + optional dob/ssnLast4.
- **Business profile completeness** (only if business route exists): businessName/entityState/einLast4/naics.
- **Financial profile**: annualIncome/monthlyDebtPayments/monthlyHousing.
- **Execution readiness (activity signals)**:
  - reports uploaded
  - evidence/documents present
  - tasks completed vs open
  - letters generated
  - cases opened (presence is good), but allow an optional “overdue/open-too-long” penalty later

Dynamic weighting approach (recommended so totals always equal 100):

- Start with a base weight set (example):
  - sharedIdentity 10
  - consents 10
  - personalProfile 20
  - businessProfile 20
  - financial 10
  - executionReadiness 30
- Then **zero out** missing route categories (e.g., businessProfile when no business route) and **renormalize** weights across remaining categories.

Output shape (used everywhere):

- `overall` (0–100)
- `categories` with each category score and missing fields
- `topActions` (e.g., “Add phone”, “Upload first report”, “Complete 2 open tasks”)

### Where to show it (premium + high signal)

- **Partner Portal Dashboard** (`src/pages/portal/PartnerDashboardPage.tsx`): add a KPI card in the KPI row (or a new top KPI row) for **Overall Score**, plus a compact “Top 3 improvements” list.
- **Partner Checklist** (`src/pages/portal/PartnerChecklistPage.tsx`): show score + breakdown so it’s more than a single readiness percentage.
- **Admin Partner Detail** (`src/pages/admin/PartnerDetailPage.tsx`): add an overview KPI (admin needs to see “is this partner execution-ready?” at a glance).

### Implementation plan (files)

- Add scoring utility:
  - New: `src/utils/partnerOverallScore.ts` (or `src/domain/partnerScore.ts` if you prefer domain placement)
  - Inputs: `partner` plus computed counts already available in portal/admin pages (reports/evidence/tasks/cases/letters)
  - No DB schema changes needed; computed on demand.
- Optionally cache the computed object into `partner.journeySignals.profileScore` in the same place journeySignals are maintained (see `PartnerDashboardPage.tsx` useEffect), but treat it as a cache (not source of truth).

## Workstream B — Drastically upgraded Partner Roadmap (true 3D + cinematic)

### Goal

Replace the current “flat” roadmap feel with a **cinematic 3D scene** that still conveys real progress and next actions.

### Architecture decision

You selected: **True 3D WebGL**.

- Implement with `three` + `@react-three/fiber` + `@react-three/drei`.
- Keep `map` and `timeline` as fallbacks; add a new `cinematic` view.

### How it maps to existing roadmap data

- Keep existing stages + lane-aware labels/hints already implemented in `JourneyRoadmap.tsx`.
- Keep existing `micro` progress logic (reports/evidence/openTasks) so the marker/camera can interpolate smoothly.

### UX design (cinematic but usable)

- `JourneyRoadmap` becomes 3-mode: **Map / Timeline / Cinematic**.
- Cinematic view:
  - 3D “route” spline (space-lane / neon rail) with 8 stops as floating nodes.
  - A moving “ship” or “cursor” traveling along the spline according to progress.
  - Animated background layers (particles, subtle fog) + postprocessing (bloom) for a premium feel.
  - Click/hover on nodes surfaces stage details in an overlay card (no nested scroll panes).
  - Optional “Auto camera” toggle; default on.
- Accessibility + safety:
  - Respect `prefers-reduced-motion` (auto-switch to Map/Timeline or disable camera motion).
  - Detect WebGL failure and fall back.
  - Keep the whole thing inside normal page scroll (canvas has a fixed height block, no internal scrolling).

### Also fix the “Now → Next → Later” roadmap

- Replace the current 3-card grid with a **two-column premium pattern** (desktop):
  - Left: 3D scene.
  - Right: focused “Action Console” panel with Now/Next/Later, each as a collapsible list of action cards.
- On mobile: stack scene first, then Action Console; keep both collapsible.

### Implementation plan (files + deps)

- Dependencies (to be added later when we exit plan-mode and implement):
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
  - Optional for cinematic glow: `@react-three/postprocessing`
- Component structure:
  - Update: `src/components/journey/JourneyRoadmap.tsx` (add `cinematic` view option and toggle button)
  - New: `src/components/journey/JourneyCinematicRoadmap3D.tsx` (Canvas + scene)
  - New: `src/components/journey/journeySceneModel.ts` (stage→positions, colors, lane copy adapter)
  - Update: `src/pages/portal/PartnerDashboardPage.tsx` (replace “Roadmap: Now → Next → Later” section with the new Action Console tied to the cinematic roadmap)

## How this integrates with the existing Phase plans

- `PLAN_BUILD_STATUS.md`:
  - Add a new next-step item under “Partner portal polish” for **Overall Score** and **Cinematic Roadmap (3D)**.
- `PLAN_SITE_COMPLETION.md`:
  - Add a “Partner Journey Unification” subsection item: **Partner Score + Roadmap Console**.
- `LAUNCH_READINESS_CHECKLIST.md`:
  - Add manual verification steps:
    - `/portal/dashboard`: score shows; cinematic roadmap renders or gracefully falls back; no console errors.
    - Reduced motion preference: roadmap falls back correctly.

## Acceptance criteria (what “done” means)

- Partner Overall Score:
  - Shows **overall + breakdown + top actions**.
  - Route-aware aggregation works for personal-only, business-only, and personal+business partners.
  - Does not expose sensitive fields directly (e.g., never display SSN last4 as “missing: ####” — only “SSN last4 provided: yes/no”).
- Cinematic Roadmap:
  - Runs smoothly on modern devices; has a safe fallback path.
  - Feels premium (depth, motion, lighting), not “toy-ish”.
  - Keeps usability: clear labels, obvious next steps, no hidden navigation.

