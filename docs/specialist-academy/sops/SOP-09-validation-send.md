# SOP-09 — Validation send

**Purpose:** Send timely validation requests on collector debt before assuming bureau-only disputes are sufficient.

---

## When to use

- First written communication from collector within validation window (commonly taught as **30 days** — confirm on collector letter).
- Collection tradeline on report with active collector.
- Scenario `validation_period` or `first_contact` in product.

**Not a substitute for legal counsel on served lawsuits** — see SOP-10.

---

## Steps

1. **Select letter type**
   - Product: `validation_request` / templates `debt_validation_request`, `debt_validation_1692g`.
2. **Customize (OCR-safe)**
   - Account identifiers from report (masked account # if shown).
   - Collector name and address from letter or report.
   - Vary paragraph order vs last client send (SOP-13).
3. **Legal framing (educational)**
   - Cite FDCPA §809 / 15 U.S.C. § 1692g as request for validation — not as “you will win in court.”
4. **Mail**
   - Certified mail recommended; save receipt image to Vault.
   - PDF final letter to `letters` storage path per tenant convention.
5. **Tasks**
   - Due date: follow-up if no response (template `debt_validation_followup_no_response` when appropriate).
   - Pause aggressive duplicate sends until response window passes.
6. **Bureau reporting note**
   - If collector reported without validation, dispute **reporting accuracy** in bureau track **after** validation track started — do not contradict validation letter facts.

---

## Checklist

- [ ] Correct collector entity (not original creditor unless they collect).
- [ ] Date of first collector communication documented.
- [ ] Mailing proof uploaded.
- [ ] Debt Center case updated.
- [ ] Partner informed in portal message (no deletion promise).

---

## Follow-up outcomes

| Outcome | Action |
| --- | --- |
| Validation received | Review; dispute inaccuracies via debt dispute or bureau round as playbook dictates |
| No response | Follow-up validation letter; document for file |
| Continued collection | Document; escalate per playbook — complaints only per SOP-12 timing |

---

*Educational only. Not legal advice. No guaranteed deletions, scores, loan approvals, or credit card approvals. Debt may remain after restore. Nora funding is separate; no approval promised.*
