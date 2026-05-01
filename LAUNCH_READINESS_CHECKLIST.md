## Launch readiness checklist (Finely Cred)

### Core workflow (P0)
- **Dev server**: app loads reliably at `http://127.0.0.1:5175/` (no blank screen; errors show actionable UI).
- **Admin → Partner detail** (`/admin/partners/:id`)
  - **Disputes tab**: selecting negatives works; generating dispute PDFs succeeds; generated letters appear under “Generated letters”.
  - **Evidence attach from negatives**: “Add evidence” on a candidate opens an **Evidence Picker modal** (no tab reroute).
  - **Credit Intel → Upload evidence**: opens Evidence Picker modal (no tab reroute).
- **Partner portal**
  - **Dashboard cinematic roadmap + score** (`/portal/dashboard`)
    - Overall score shows (0–100) with Top improvements list.
    - Cinematic roadmap renders (WebGL) and Action Console is usable.
    - Reduced motion preference disables cinematic (falls back to Timeline/Map) with no console errors.
  - **Debt / Summons letters** (`/portal/debt/:id`): “Build draft” opens editor + paper preview; saving creates a PDF in Letters Vault.
  - **Letters Command Center** (`/portal/letters`): Dispute + Validation + Court flows work end-to-end; Templates tab is hidden unless entitled.
  - **Letters Vault** (`/portal/letters/vault`): saved letters list + PDF open works.
  - **Checklist score breakdown** (`/portal/checklist`): category breakdown renders; Top improvements CTAs navigate without errors.

### Template privacy / entitlements
- **Templates are gated** by `portal.templates` entitlement.
  - Partner-facing pages can show the *flow* without exposing template content unless entitled.
  - Validate on: `/portal/debt/:id` (draft template body is hidden when not entitled).

### Unified letter UX (Dispute / Validation / Court)
- **Same pattern** everywhere: pick context → build draft (or template if entitled) → edit → paper preview (black-on-white) → save to Letters Vault.

### Manual URLs to verify
- `/admin/partners/:id`
- `/portal/dashboard`
- `/portal/checklist`
- `/portal/debt/:id`
- `/portal/letters`
- `/portal/letters/vault`

