# Anna Charlotin — partner playbook (Finely side)

**Status: SHIPPED** (doc + in-app template + warm CRM library case)

## Purpose

Reusable coaching runway for Anna’s apparel / design-tech concept — other partners can select **Generic business build** or **Restore only** in Admin → Partner → **Playbook** tab.

## Stages

### A) Credit restore track

- AUs already added — **log every AU** (creditor, open date, limit, statement cycle).
- Dispute rounds tied to evidence IDs in portal.
- Score snapshots: record **as reported** only; no promised outcomes.
- Education: utilization, inquiries, payment history (Track F honesty).

### B) Fundability readiness (Nora handoff)

- Personal file stability before aggressive business apps.
- Entity docs in vault when business lane is active.
- Banking / DTI narrative for underwriting conversations.
- Explicit consent note before Nora/lender introductions.

### C) Business build — concept studio

- **Design lane:** clothing, colors, logos, mockups (brand board).
- **Tech platform idea:** customers submit concepts; Anna provides tech insight, visuals, and production guidance.
- **Production:** research high-end uniform / apparel partners — no fake vendor approvals.
- **Mindset:** owner discipline + reading list (see in-app).
- **Credit path:** business portal **7-step journey** → Tier-1 net-30 when entity ready.

## CRM

- Warm prospect entry: `libraryTag: anna-charlotin-playbook` (seeded on CRM Warm tab load).
- **Not** an inbound form capture — library/partner case only.

## In-app

| Piece | Path |
|-------|------|
| Template selector + checklists | `PartnerDetailPage` → Playbook tab |
| Domain | `src/domain/partnerPlaybook.ts` |
| Persistence | `src/data/partnerPlaybookRepo.ts` |
| Business execution | `/business/dashboard` journey rail |

## Variations for other partners

Change template to **Generic — business build** and edit vertical notes in partner notes. Stages A/B/C remain; swap checklist emphasis (e.g. realtor, BHPH, church vertical).
