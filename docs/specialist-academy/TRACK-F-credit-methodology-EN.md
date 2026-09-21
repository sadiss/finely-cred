# Track F — Credit methodology (English)

**Finely Cred restore practice — Sanz doctrine**

This track teaches how credit reporting works in plain language, then how Finely sequences **debt**, **validation**, **summons literacy**, **bureau restore rounds**, **complaints**, and **funding handoff**. It aligns with product scenarios in Debt & Summons Center and Credit Intel dispute timelines.

---

## F0 — Mindset: restore ≠ “credit repair TikTok”

- We teach **process discipline** and **factual accuracy** under FCRA/FACTA framing for bureau disputes, and **validation/dispute literacy** for collector debt — not shortcuts, not guaranteed deletions.
- A clean file is one a reasonable reviewer (bureau, regulator, or counsel) can follow without guessing what we did or why.
- **Debt may remain** after restore work. Scores move unpredictably. Funding is a separate conversation (Nora).

---

## F1 — How credit reporting actually works (baseline)

### Players

| Player | Role |
| --- | --- |
| **Consumer** | The person whose file is reported. |
| **Furnisher** | Lender, servicer, or collector who reports account data to bureaus. |
| **CRA (bureau)** | Equifax, Experian, TransUnion — assemble and sell consumer reports. |
| **Debt collector** | Entity collecting on alleged debt; may or may not own the debt. |

### What appears on a report

- **Tradelines** — payment history, balances, status (open, closed, charge-off, collection).
- **Collections** — may appear as tradelines and/or collection section rows (see Collections audit in product).
- **Inquiries**, **public records**, **personal info** — each has its own dispute playbook.

### What “restore” means at Finely

- **Bureau track:** Challenge **inaccurate or unverifiable** reporting using FCRA-style disputes (method of verification, factual mismatches, evidence exhibits).
- **Debt track:** Use validation and dispute letters to collectors when collection/legal risk exists — **before or as a gate** to heavy bureau campaigning.
- We do **not** instruct consumers to lie, invent fraud, or dispute accurate debts.

---

## F2 — Sanz doctrine (mandatory sequencing)

Teach and apply **exactly** this order when risk is present:

1. **Debt-first** when debt, collection, or **summons risk** exists — eradicate or challenge debt before (or as a gate to) bureau restore when needed.
2. **Validation letters FIRST** on collector debt (FDCPA §809 educational framing) so collectors are less positioned to rush litigation without validating.
3. **Summons response literacy** — calendars, affidavits awareness, never ignore court; escalate to counsel when needed.
4. **THEN credit restore rounds** on the bureau file — FCRA accuracy / factual disputes.
5. **Complaints** (CFPB, AG, etc.) **after failed rounds** when warranted — often after Round 2 — not emotional spam.
6. **Litigation-ready posture** — document every send, response, and exhibit.
7. **OCR / template sensitivity** — vary letter structure; avoid repetitive cookie-cutter blocks detectable as bulk spam.
8. **Evidence** — screenshots of the **actual account** on the report; dispute only what the file supports.
9. **Round-stage awareness** — know prior letters, prior companies, current round; never blindly restart Round 1 templates.

---

## F3 — Debt triage (when restore must wait)

See [SOP-08](./sops/SOP-08-debt-triage.md).

**Trigger signals**

- Active collection letters or calls on accounts on the report.
- Collector tradelines with recent status changes.
- Summons, complaint, or court date mentioned in intake or Documents Vault.
- Client says another company “already sent validation” — verify before duplicating.

**Outputs**

- `debt_first` | `parallel_with_caution` | `bureau_only`
- Written note in file: which accounts are collector-gated and why.

Product mapping: scenarios `first_contact`, `validation_period`, `summons_served` in `debtLegal.ts`.

---

## F4 — Validation (FDCPA §809 — educational)

See [SOP-09](./sops/SOP-09-validation-send.md).

**Purpose (plain language)**

- Within the validation window (commonly discussed as 30 days from first written communication), the consumer may **request validation** of the alleged debt.
- Until validation is provided as the law describes, collectors generally must **cease collection** (educational summary — not legal advice for a specific case).

**Finely practice**

- Send validation **in writing**, certified mail when possible.
- Log date sent, tracking, and which collector/account.
- Do not copy-paste identical validation bodies for every client account without customization (OCR SOP).

Template IDs in product include `debt_validation_request`, `debt_validation_1692g`, follow-ups when no response.

---

## F5 — Summons and court literacy

See [SOP-10](./sops/SOP-10-summons-awareness.md).

- **Deadlines are jurisdictional** — many states use roughly 20–35 days to answer; confirm on the summons.
- **Affidavits** and sworn responses may be required — product includes `summons_response_affidavit` outlines; trainee scope stops at documentation and handoff.
- **Never** tell a client to ignore court mail.
- Upload summons to Vault immediately; create tasks with due dates **before** bureau Round 1 if court clock is running.

---

## F6 — Bureau restore rounds (FCRA accuracy)

See [SOP-11](./sops/SOP-11-restore-rounds.md).

### Round philosophy

| Round | Focus |
| --- | --- |
| **Round 1** | Factual disputes tied to report screenshots; request investigation; method of verification where appropriate. |
| **Round 2** | Bureau/furnisher responses reviewed; tighten contradictions; follow-up with exhibits. |
| **Round 3+** | Only when file supports; escalate narrative discipline — still no template spam. |

Credit Intel timeline (product): evidence → Round 1 → export/mail → track responses → Round 2/3 → complaints when appropriate.

### Negative-type awareness

Use playbooks (`negativePlaybooks.ts`): collections, charge-offs, repos, student loans, etc. Each has different **factual** angles — do not use one generic paragraph for all.

---

## F7 — Complaints ladder

See [SOP-12](./sops/SOP-12-complaints-ladder.md).

- **When:** Unresolved after disciplined rounds; pattern of non-response or clearly unsupported reporting — not “because client is angry.”
- **Channels:** CFPB, state AG, BBB where appropriate — one coherent narrative per issue.
- **Not:** Mass duplicate complaints, contradictory stories, or threats framed as complaints.

---

## F8 — Litigation-ready documentation

Minimum file artifacts:

- Report version used (date pulled, provider).
- Per-account evidence screenshots (correct bureau section).
- PDFs of letters sent + mailing proof.
- Dated notes on calls (if any) — no coaching to harass collectors.
- Task board reflects **next action** and **round stage**.

If counsel later joins, they should not need to reconstruct timeline from chat logs alone.

---

## F9 — OCR and template discipline

See [SOP-13](./sops/SOP-13-ocr-evidence-checklist.md).

- Admin Templates supports **OCR-friendly variants** — use variation intentionally.
- Rotate opening paragraphs, section order, and exhibit references.
- Avoid “wall of same letter” across 12 accounts — bureaus and OCR systems flag patterns.
- Factual core stays consistent; **structure** varies.

---

## F10 — Evidence standards

- Screenshot the **specific tradeline or collection card** on the report — not a cropped score-only image.
- Match `creditorName` / account label to dispute candidate (Collections audit notes on matching).
- For collections: accept `collections` and `collections_tradeline` evidence keys in Letters flow.
- Dispute **only** fields you can point to on the exhibit (dates, balances, status, ownership).

---

## F11 — Round-stage & prior-company intake

See [SOP-14](./sops/SOP-14-prior-company-intake.md).

**Ask every new file**

- What round are they in (0, 1, 2, 3)?
- What letters already went out (dates, bureaus, collectors)?
- Any summons or validation already sent?
- Did a prior company use cookie-cutter templates? (Plan variation + avoid duplicate sends.)

**Rule:** If Round 2 was already mailed by a prior vendor, Finely does **not** reset to Round 1 boilerplate without analyst review.

---

## F12 — Haitian desk overlay

- Explain F2–F11 in **Kreyòl** during sit-together sessions.
- Letters to bureaus and collectors remain **English** unless a specific template is bilingual by design.
- Emphasize **timelines** (validation window, court dates) — these are calendar facts, not opinions.

Full Kreyòl meaning layer: [TRACK-F-credit-methodology-HT.md](./TRACK-F-credit-methodology-HT.md).

---

## F13 — Nora / funding-readiness soft handoff

- Finely Cred is **not** the lender. Nora Capital Group integration (when enabled) is a **separate** pathway.
- Script: “Restore documents your file; funding partners review eligibility on their criteria.”
- No promised approvals, rates, or timelines for Nora.
- Wealth Paths / program entitlements come from **signed agreement** — verify in portal before discussing unlocks.

---

## F14 — Specialist quiz bank (self-check)

1. Client has fresh collection letter and EQ tradeline — what runs first?
2. Why validation before aggressive bureau deletion language on the same collector account?
3. Client was served summons yesterday — what do you do before Round 1 disputes?
4. When is CFPB appropriate?
5. What evidence do you attach for a collection row dispute?
6. Client’s prior company sent Round 1 twice — what’s your intake action?

Answers align with cards [F01–F14](./cards/README.md).

---

## Related SOPs and cards

- SOPs: [08](./sops/SOP-08-debt-triage.md)–[14](./sops/SOP-14-prior-company-intake.md)
- Cards: [cards/README.md](./cards/README.md)
- Workflow: [WORKFLOW-MAP.md](./WORKFLOW-MAP.md)
- Live coaching: [MEETING-COACH.md](./MEETING-COACH.md)

---

*Educational only. Not legal advice. No guaranteed deletions, scores, or loan approvals. Debt may remain after restore. Nora funding is separate; no approval promised.*
