# SOP-08 — Debt triage

**Purpose:** Decide whether bureau restore runs alone, waits behind debt work, or runs in parallel with strict gates.

**Owner:** Specialist (review by lead if summons flagged)

---

## Inputs

- Latest tri-merge or bureau report in Vault
- Intake notes (calls, collector mail, summons)
- Debt & Summons Center cases (if any)
- Prior-company history (SOP-14)

---

## Steps

1. **Inventory collector exposure**
   - List collection tradelines and Collections section rows.
   - Note original creditor vs collector name, balance, status date.
2. **Check legal risk flags**
   - Summons, complaint, garnishment threat, or court date → **stop** and run SOP-10.
   - Recent validation sent? Note date and response status.
3. **Classify file**

| Classification | Criteria | Next SOP |
| --- | --- | --- |
| `debt_first` | Active collection on reported account OR summons risk OR validation window open on fresh contact | SOP-09 (+ SOP-10 if court) |
| `parallel_with_caution` | Stabilized collector track (validation sent, no court clock) AND bureau negatives need rounds | SOP-09 then SOP-11 with account-level gates |
| `bureau_only` | No collector activity; no court issues; negatives are furnishers/tradelines only | SOP-13 → SOP-11 |

4. **Document in file**
   - One sentence: classification + accounts gated.
   - Tasks: validation due dates, court dates, or “cleared for Round 1” with date.

5. **Partner communication**
   - Plain language: what runs first and why (no legal guarantees).

---

## Quality gates

- [ ] No Round 1 batch mailed while unanswered summons clock runs (unless counsel directs otherwise).
- [ ] Collection accounts on report linked to Debt Center case when partner manages debt track.
- [ ] Haitian desk: triage explained in Kreyòl; letters English.

---

## Product references

- `DebtScenario` types: `first_contact`, `validation_period`, `summons_served`, `post_validation`
- Partner portal: **Debt & Summons Center**

---

*Educational only. Not legal advice. No guaranteed deletions, scores, loan approvals, or credit card approvals. Debt may remain after restore. Nora funding is separate; no approval promised.*
