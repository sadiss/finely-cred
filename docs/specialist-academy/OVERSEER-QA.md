# Overseer QA — Specialist Academy pack

Use this checklist before merge. **PR:** [#28](https://github.com/sadiss/finely-cred/pull/28) · **Branch:** `cursor/specialist-credit-methodology-04e1`

## Content verification

| # | Requirement | Pass location |
| --- | --- | --- |
| 1 | Track F EN + HT: debt-first, validation (before summons escalation), summons literacy, restore rounds, complaints ladder, OCR/non-repetitive templates, screenshot evidence, prior-company/stage | [TRACK-F EN](./TRACK-F-credit-methodology-EN.md) F2–F11, F-Build · [TRACK-F HT](./TRACK-F-credit-methodology-HT.md) |
| 2 | BUILD: 2+ revolving, mix, installment, AU honesty, FICO factors, aspirational only | TRACK F § F-Build · [F-BUILD cards](./cards/README.md) |
| 3 | SOPs 08–15 incl. funding-readiness + Nora soft handoff (SOP-15 § D) | [sops/](./sops/README.md) |
| 4 | Teachable cards methodology + build | F01–F14 + F-BUILD-01–05 |
| 5 | WORKFLOW-MAP full chain | [WORKFLOW-MAP.md](./WORKFLOW-MAP.md) |
| 6 | MEETING-COACH video quiz | [MEETING-COACH.md](./MEETING-COACH.md) |
| 7 | README maps tracks A–G | [README.md](./README.md) · [TRACKS-A-E-OVERVIEW.md](./TRACKS-A-E-OVERVIEW.md) |
| 8 | Compliance footer on every doc | Spot-check `docs/specialist-academy/**` |
| 9 | Additive product hooks | `AdminSpecialistAcademyPage` + `UnifiedTrainingPanel` + `AcademyQuizPanel` + `trainingAcademy.ts`; Courses untouched |
| 9b | UI navigation | `/admin/specialist-academy` · Quizzes tab · `/admin/specialist-academy/quiz/:quizId` · EN\|HT query param |
| 9c | Consumer-power framing | `lessons/en|ht/00-consumer-power-system.md`, `09-debt-legal-litigation-command.md`, TRACK F § F0–F1, compliance EN 01–09 lenses |
| 9d | Lead Intel batch | `AdminLeadIntelPage` multi-metro + `requireContact`; docs `PARTNER_PROSPECTING_*` |
| 10 | PR body: file list + Sanz trainee runbook | GitHub PR description |

## File inventory (33 academy + handoff)

```
docs/DEVELOPER_MERGE_HANDOFF.md
docs/specialist-academy/README.md
docs/specialist-academy/OVERSEER-QA.md
docs/specialist-academy/TRACKS-A-E-OVERVIEW.md
docs/specialist-academy/TRACK-F-credit-methodology-EN.md
docs/specialist-academy/TRACK-F-credit-methodology-HT.md
docs/specialist-academy/WORKFLOW-MAP.md
docs/specialist-academy/MEETING-COACH.md
docs/specialist-academy/sops/SOP-08 … SOP-15 (+ sops/README.md)
docs/specialist-academy/cards/F01 … F14, F-BUILD-01 … 05, cards/README.md
```

## Sanz — trainee session tomorrow (60 min)

1. **5 min** — Admin Academy → **Quizzes** → pass methodology quiz (or review misses).
2. **5 min** — [MEETING-COACH](./MEETING-COACH.md) opening + compliance script.
3. **10 min** — Library: [Consumer power](./lessons/en/00-consumer-power-system.md) + [WORKFLOW-MAP](./WORKFLOW-MAP.md) debt → validation → summons fork.
4. **15 min** — Flash drill: [F01–F08](./cards/README.md) + one [F-BUILD](./cards/README.md).
5. **20 min** — Live scrubbed file: SOP-08 triage → SOP-09 or SOP-13 evidence → parallel BUILD talk (SOP-15 § B).
6. **5 min** — Optional: Lead Intel multi-metro batch demo (audit doc if edge batch deferred).

---

*Educational only. Not legal advice. No guaranteed deletions, scores, loan approvals, or credit card approvals. Debt may remain after restore. Nora funding is separate; no approval promised.*
