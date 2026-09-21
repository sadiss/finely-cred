# Platform cron (trainee nurture + digests)

Production should schedule Supabase edge **`platform-cron`** (stub: add function when deploying).

## Client-side today

- Academy/lounge emails dispatch immediately via `dispatchAcademyTraineeNurture` → `send-email` when `commsDelivery` + trainee toggle ON.
- Dry-run / failures enqueue `finely.nurture.retryQueue.v1` (browser localStorage).

## Intended cron jobs

| Job | Handler |
| --- | --- |
| `nurture_retry` | `processNurtureRetryQueue()` (call from edge with service role + server store in phase 2) |
| `weekly_lounge_digest` | Top wins + open Ask-the-Desk (future) |
| `stale_ask_desk_nudge` | Coach email when question &gt; 24h unanswered |

## Env

- Same as `send-email`: SendGrid secrets on Supabase
- `EDGE_ADMIN_EMAILS` for admin-only test invokes

## Note

**This repo snapshot** does not include a deployed `platform-cron` function yet — wire on deploy without changing academy UI hooks.
