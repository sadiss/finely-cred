# Workflow map — Finely restore methodology

High-level sequencing for specialists. Always reconcile with the **live file** (prior letters, summons status, round stage).

## Mermaid (primary)

```mermaid
flowchart TD
  START([New or continuing client file]) --> INTAKE[SOP-14: Prior company / round stage intake]
  INTAKE --> TRIAGE{SOP-08: Debt / collection / summons risk?}

  TRIAGE -->|Yes — active collection or legal risk| DEBT[Debt-first track]
  TRIAGE -->|No — bureau-only negatives| EVIDENCE[SOP-13: Evidence on actual report accounts]

  DEBT --> VAL[SOP-09: Validation letters FIRST on collector debt]
  VAL --> SUMMONS{Summons or lawsuit served?}

  SUMMONS -->|Yes| COURT[SOP-10: Deadlines, answer literacy, affidavits awareness]
  COURT --> COUNSEL{Counsel needed?}
  COUNSEL -->|Yes| ESC[Escalate to licensed counsel — do not ignore court]
  COUNSEL -->|No / with counsel plan| GATE[Gate: stabilize debt track before heavy bureau rounds]

  SUMMONS -->|No| GATE
  GATE --> EVIDENCE

  EVIDENCE --> BUILD[Parallel: Credit BUILD education — mix, util, inquiries, AU honesty]
  BUILD --> R1
  EVIDENCE --> R1[SOP-11: Restore Round 1 — FCRA factual disputes]
  R1 --> MAIL[Certified mail + save exhibits + tasks]
  MAIL --> RESP{Results within SLA?}

  RESP -->|Resolved| READY
  RESP -->|Partial / none| R2[SOP-11: Round 2 — tightened facts + MOFV]
  R2 --> RESP2{Still unresolved?}
  RESP2 -->|No| READY
  RESP2 -->|Yes| R3[Round 3 if file supports — no template spam]
  R3 --> RESP3{Still unresolved?}
  RESP3 -->|No| READY
  RESP3 -->|Yes| COMP[SOP-12: Complaints ladder — disciplined, warranted]
  COMP --> READY

  READY[SOP-15: Funding-readiness checklist — BUILD + file hygiene]
  READY --> FUND([Optional Nora soft handoff — Track G])
  FUND --> NORA[Nora pathway separate — no loan/card approval promise]
```

## ASCII (fallback)

```
                    ┌─────────────────────┐
                    │ Intake + round stage │
                    │      (SOP-14)        │
                    └──────────┬──────────┘
                               v
                    ┌─────────────────────┐
                    │   Debt triage       │
                    │      (SOP-08)       │
                    └──────────┬──────────┘
              risk │                    │ bureau-only
                   v                    v
         ┌─────────────────┐    ┌─────────────────┐
         │ Validation FIRST │    │ Evidence pack   │
         │    (SOP-09)      │    │   (SOP-13)      │
         └────────┬─────────┘    └────────┬────────┘
                  v                       │
         ┌─────────────────┐              │
         │ Summons fork?   │              │
         │   (SOP-10)      │              │
         └────────┬─────────┘              │
           yes    │    no                  │
                  v    └──────────────────┘
         ┌─────────────────┐              v
         │ Court literacy  │    ┌─────────────────┐
         │ + counsel path  │    │ Restore rounds  │
         └────────┬────────┘    │ R1 → R2 → R3    │
                  │             │    (SOP-11)       │
                  └─────────────┤                   │
                                └────────┬──────────┘
                                         v
                              ┌─────────────────┐
                              │ Complaints fork │
                              │  (SOP-12)       │
                              └────────┬────────┘
                                         v
                              ┌─────────────────┐
                              │ SOP-15 readiness │
                              │ BUILD + restore  │
                              └────────┬────────┘
                                         v
                              ┌─────────────────┐
                              │ Nora soft handoff│
                              │ (optional)       │
                              └─────────────────┘

         Parallel during restore: BUILD coaching (mix, util, inquiries, AU)
         from evidence phase through round wait windows — not instead of debt gates.
```

## Fork rules (memorize)

| Fork | Rule |
| --- | --- |
| Debt vs restore | If collection activity or summons risk exists, **do not** blindly start Round 1 bureau templates while ignoring collector track. |
| Validation | On collector debt, validation **before** assuming bureau-only dispute will protect the client. |
| Summons | **Never** “ignore court.” Document dates; escalate to counsel when stakes exceed trainee scope. |
| Complaints | Consider **after** failed rounds (often post–Round 2), with a clean file — not revenge spam. |
| OCR | Vary structure; no cookie-cutter walls of identical paragraphs across accounts. |
| Prior company | Discover what was already mailed; **never** restart Round 1 blindly (SOP-14). |
| BUILD parallel | Coach profile strength **while** restoring; defer heavy app sprees if debt/summons active. |
| Nora | Only after **SOP-15**; no guaranteed funding, scores, or card approvals. |

---

*Educational only. Not legal advice. No guaranteed deletions, scores, loan approvals, or credit card approvals. Debt may remain after restore. BUILD is underwriting literacy, not lender policy. Nora funding is separate; no approval promised.*
