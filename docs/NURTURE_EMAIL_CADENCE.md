# Nurture & marketing email cadence

**Where it runs:** [`nurtureSequences.ts`](../src/domain/nurtureSequences.ts) · [`nurtureEngine.ts`](../src/lib/nurtureEngine.ts) · platform cron · **Leads OS** nurture strip.

**Compliance:** Results vary · not legal advice · funding subject to underwriting · honor `consentEmailMarketing` and desk mail pause.

---

## Timing (aligned with common B2C lead nurture)

| Window | Typical use in Finely | Sequences |
|--------|------------------------|-----------|
| **Immediate (0h)** | Welcome + guide delivery | Lead magnets, partner onboard, affiliate toolkit |
| **24h (day 1)** | First value email, not a hard pitch | Credit, debt, business, score roadmap funnels |
| **72–120h (day 3–5)** | Education + checklist | Most funnels; affiliate day 5 |
| **168h (day 7)** | Book a session CTA | Credit, business, partner opportunity |
| **336h+ (day 14–30)** | Trial ending, monthly partner education | Credit trial, partner lifecycle |

Partner **lifecycle** sequences use **weekly** pulses (day 7, 14, 21, 30) — not daily blasts to the same list.

Affiliate sequences emphasize **compliant templates** before session CTAs.

---

## What gets sent (live vs dry-run)

- **Live send** requires Admin **`commsDelivery`** on + Supabase configured.
- **`processDueNurtureSteps`** defaults to **dry-run** in platform cron until comms is live.
- **Send log:** local `finely.nurture_send_log.v1` — view rollup on **Admin → Leads OS** (launcher nurture strip).

Rollup buckets: **immediate · daily · weekly · biweekly · monthly** (derived from step `delayHours`).

---

## Owner weekly review

1. Open **Leads OS** → check **Today / 7d sent** and skipped counts.
2. Run **Run due steps** after verifying comms (or dry-run to preview).
3. Ruth **daily_ops** includes Growth snapshot; use **nurture_health** automation for sequence audit prompt.
4. Adjust copy in comms templates / `nurtureStepCopy.ts` — not duplicate sequences.

---

## Partner vs lead

| Audience | Primary sequences |
|----------|-------------------|
| Lead magnet signups | `seq_*_funnel` via `runLeadCapturePipeline` |
| Partners (portal) | `seq_partner_onboard_keepwarm`, `seq_partner_monthly_education`, birthday, opportunity |
| Affiliates | `seq_affiliate_funnel`, `seq_affiliate_residual`, partner opportunity affiliate |

All enroll through **`enrollLeadInNurtureSequence`** — do not add parallel mailers.
