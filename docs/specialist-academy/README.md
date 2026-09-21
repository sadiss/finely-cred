# Finely Cred — Specialist Academy

Internal curriculum for specialists who run **restore** the way Finely Cred actually practices it: debt and collection risk first, validation discipline, bureau restore rounds, measured escalation, and litigation-ready files — not generic “credit repair” fluff.

## Who this is for

- New specialists onboarding to partner files
- Haitian desk trainees (sit-together, Kreyòl-first explanations; **bureau letters stay English**)
- Coaches running live video reviews with Sanz (see [MEETING-COACH.md](./MEETING-COACH.md))

## Academy tracks (full program)

| Track | Focus | Primary doc |
| --- | --- | --- |
| **A** | Onboarding, consent, portal hygiene | *(existing ops onboarding — link from your tenant SOP)* |
| **B** | Partner communication & expectations | *(existing comms playbooks)* |
| **C** | Haitian desk — Kreyòl-first, English letters | [TRACK F (HT)](./TRACK-F-credit-methodology-HT.md) + sit-together norms below |
| **D** | Evidence, reports, Credit Intel | SOP-13 + TRACK F § Evidence |
| **E** | Letters, templates, OCR-safe variation | SOP-13 + product Templates admin |
| **F** | **Credit methodology (Sanz doctrine)** | [TRACK F (EN)](./TRACK-F-credit-methodology-EN.md) |
| **G** | Nora soft handoff | TRACK F § Funding readiness; Finely ≠ lender |

### Haitian desk (quick norms)

- Explain process in **Kreyòl**; read key English phrases on letters when the client asks.
- Never promise deletion, score jumps, or Nora approval.
- Validation and bureau disputes are **sequenced** — debt/collection/summons risk gates restore when needed.

### Nora soft handoff (quick norms)

- Finely Cred restores and documents; **Nora Capital Group** (when configured) is a separate funding pathway.
- Language: “funding-readiness conversation,” not “you’re approved.”
- Wealth Paths unlock is program-dependent — see pricing / entitlements in product; do not invent guarantees.

## Track F — credit methodology (core)

1. Read [TRACK-F-credit-methodology-EN.md](./TRACK-F-credit-methodology-EN.md) end-to-end.
2. Memorize [cards](./cards/README.md) F01–F14 and **F-Build** (quiz in meetings).
3. Run cases using [SOPs](./sops/) 08–15 in order when applicable.
4. Coach **restore + BUILD in parallel** per TRACK F § F-Build (underwriting literacy — no loan/card guarantees).
5. Hang [WORKFLOW-MAP.md](./WORKFLOW-MAP.md) on your wall (digital or print).

## SOP index (F-track operations)

| SOP | Title |
| --- | --- |
| [SOP-08](./sops/SOP-08-debt-triage.md) | Debt triage — when restore must wait |
| [SOP-09](./sops/SOP-09-validation-send.md) | Validation send (FDCPA §809 framing) |
| [SOP-10](./sops/SOP-10-summons-awareness.md) | Summons awareness & counsel escalation |
| [SOP-11](./sops/SOP-11-restore-rounds.md) | Bureau restore rounds (FCRA accuracy) |
| [SOP-12](./sops/SOP-12-complaints-ladder.md) | Complaints ladder (CFPB / AG / etc.) |
| [SOP-13](./sops/SOP-13-ocr-evidence-checklist.md) | OCR-safe letters + evidence checklist |
| [SOP-14](./sops/SOP-14-prior-company-intake.md) | Prior-company / mid-round intake |
| [SOP-15](./sops/SOP-15-funding-readiness-checklist.md) | Funding-readiness (pre–Nora soft handoff) |

## Product touchpoints (where work happens)

| Area | Product surface | Domain / templates |
| --- | --- | --- |
| Debt & summons | Partner **Debt & Summons Center** | `debtLegal.ts`, `debtLetterTemplates.ts` |
| Collections on report | Collections tab + evidence | `negativePlaybooks.ts` (collection) |
| Bureau disputes | Disputes / Letters / Credit Intel timeline | Round 1 → mail → follow-up |
| Templates | Admin Templates (OCR-friendly variants) | `starterPack.ts`, `litigationAdvanced.ts` |

## Training progression (suggested)

1. **Week 1:** Tracks A + F cards F01–F06 + SOP-08/09 + shadow one debt triage.
2. **Week 2:** F07–F11 + SOP-10/11 + draft one validation packet (coach review).
3. **Week 3:** F12–F14 + SOP-12/13/14 + co-run Round 1 with evidence checklist.
4. **Ongoing:** [MEETING-COACH.md](./MEETING-COACH.md) quizzes before solo file ownership.

## Maintainer notes

- Docs-first: no change to auth, billing, or in-app lesson gates required for this pack.
- When `src/domain/trainingAcademy.ts` exists in your branch, add lesson IDs that deep-link here — do not remove existing modules.

---

*Educational only. Not legal advice. No guaranteed deletions, scores, loan approvals, or credit card approvals. Debt may remain after restore. Nora funding is separate; no approval promised.*
