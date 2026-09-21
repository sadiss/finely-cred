# Specialist Academy — trainee email automation

**Scope:** Logged-in **specialists/trainees** only — not partner prospecting (still HOLD).

## Templates (Comms store)

Seeded on academy load via `ensureAcademyTraineeTemplates()`:

| ID | Event |
| --- | --- |
| `academy_trainee_welcome` | First academy home visit |
| `academy_trainee_module_started` | Core module lesson opened (24h dedupe) |
| `academy_trainee_module_completed` | Mark complete |
| `academy_trainee_quiz_passed` | Quiz pass |
| `academy_trainee_quiz_retry` | Quiz below pass (12h dedupe) |
| `academy_trainee_weekly_digest` | Hub visit when weekly toggle on (7d dedupe) |
| `academy_trainee_course_complete` | Core modules + quizzes passed |
| `academy_trainee_material_pack` | Manual 1–N send or auto on course complete |

## Admin toggles

**Admin Settings → Features → Specialist Academy trainee emails**

- `traineeEmailsEnabled` — master
- `weeklyDigestEnabled` — digest on hub visit (client dedupe)

## Live send requirements

1. `commsDelivery` feature flag ON  
2. Supabase `send-email` edge + SendGrid secrets (`sendgridFromEmail`, etc.)

If disabled, messages are **dry-run logged** to Comms sends + local outbox (`finely.specialistAcademy.traineeEmailOutbox.v1`).

## Server outbox (enterprise path — interim hybrid)

| Layer | Path |
| --- | --- |
| Migration | `supabase/migrations/20260921000001_calendar_guest_academy_outbox.sql` → `academy_trainee_email_outbox` |
| Edge enqueue | `supabase/functions/academy-trainee-outbox` (allowlisted admin) |
| Client mirror | `academyTraineeOutboxServer.ts` — best-effort on each send |
| Browser queue | **Interim** — `localStorage` dedupe/outbox/retry until platform-cron drains server table |

Production should schedule cron to drain `pending` rows via existing `send-email` (not yet wired in this PR).

## Material pack

Admin **Course home → Trainee material pack** — comma/newline emails. Body built by `buildMaterialPackBody()` (module URLs, SOP ids, card note).

---

*Educational footers on all templates.*
