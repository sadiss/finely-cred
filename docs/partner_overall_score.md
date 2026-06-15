## Partner Overall Score (0–100)

### What it measures

The **Partner Overall Score** is a 0–100 score intended to summarize:

- **Profile completeness** (shared identity + route-specific profile fields + financial basics)
- **Execution readiness** (proof of activity: reports, evidence, tasks, cases, letters)

It is **route-aware**:

- **Personal-only**: includes personal profile, excludes business profile
- **Business-only**: includes business profile, excludes personal profile
- **Personal + Business**: includes both, without double-counting shared categories

This score is computed **on demand** (client-side) and may be cached into `partner.journeySignals.profileScore` as a UI optimization only.

### Categories (base weights)

Weights are **renormalized** when a category does not apply (e.g., no business route).

- **Shared identity (10)**: `fullName`, `email`, `phone`
- **Consents (10)**: `termsAcceptedAt`, `privacyAcceptedAt`, `disclaimerAcceptedAt`, plus optional (`reportUploadConsentAt`, `eSignConsentAt`, `communicationConsentAt`)
- **Personal profile (20)** *(only if any personal route exists)*:
  - Mailing address: `address1`, `city`, `state`, `postalCode`
  - Optional: `dob` (yes/no), `ssnLast4` (yes/no)
- **Business profile (20)** *(only if business route exists)*:
  - `businessName`, `entityState`, `einLast4`, `naics`
- **Financial basics (10)**:
  - `annualIncome`, `monthlyDebtPayments`, `monthlyHousing` (presence only)
- **Execution readiness (30)**:
  - Reports uploaded (>= 1)
  - Evidence documents present (>= 1)
  - Tasks (completion ratio and open count)
  - Dispute/debt cases present (>= 1)
  - Letters generated (>= 1)

### Route applicability rules

- **personalApplies** if partner has `routes.personal_restore` or `routes.personal_build`
- **businessApplies** if partner has `routes.business_build`
- Shared identity / consents / financial / execution readiness always apply

### Scoring mechanics

Each category produces a **0–100** sub-score.

- For “field completeness” categories, scoring is:
  - `presentCount / totalRequiredCount * 100`
  - Optional fields contribute small bonus points but are never shown verbatim (PII-safe)
- For execution readiness, scoring is based on milestones:
  - `reports > 0` (milestone)
  - `evidence > 0` (milestone)
  - `letters > 0` (milestone)
  - `cases > 0` (milestone)
  - task completion ratio (smooth)

Then:

1. Compute applicable category weights.
2. Renormalize to sum to 100.
3. Overall score is the weighted sum of category scores, rounded to integer.

### Output contract

The score computation returns:

- `overall` (0–100)
- `categories[]`: `{ key, label, weightPct, score, missing[] }`
- `topActions[]`: action cards derived from missing fields and missing activity milestones

### PII safety rules

- Never display sensitive values (e.g., SSN last 4, DOB) in the UI.
- Only show **presence**: e.g., “DOB provided: yes/no”.
- For addresses, show only “missing address” guidance; do not print the full address in “missing” lists.

