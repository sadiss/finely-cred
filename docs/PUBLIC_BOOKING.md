# Public Booking & Commerce (Phase 31)

Public enlightenment sessions, paid repeat bookings, and marketing compliance.

## Enlightenment session flow

Route: `/enlightenment-session` (legacy `/consultation` redirects here)

1. Visitor picks a slot via `PublicSessionSlotPicker` (respects `calendarSettingsRepo` hours, notice, cutoff).
2. **One free session per email** — tracked in `calendarRepo` public appointment requests.
3. **Additional sessions** — `$100` (`ADDITIONAL_ENLIGHTENMENT_SESSION_CENTS = 10000`).

### Paid checkout (Stripe)

When `paymentRequired` and **`stripeEnabled`** feature flag is on:

1. Request saved locally via `createPublicAppointmentRequest` (`paymentStatus: pending`).
2. Client calls edge **`public-session-checkout`** (`action: create`) → Stripe Checkout.
3. Success return: `/enlightenment-session?paid=1&requestId=…&session_id=…`
4. Client verifies via **`public-session-checkout`** (`action: verify`) then `markPublicSessionPaid()`.
5. Stripe webhook logs `public_session_paid` for ops (KV lookup by request id).

Deploy: `npm run deploy:functions` (includes `public-session-checkout`).

Secrets: `STRIPE_SECRET_KEY`, `APP_BASE_URL`.

Admin → Calendar shows payment badge; **Schedule** disabled until `paid` or admin **Waive payment**.

## Marketing unsubscribe (Phase 12)

Route: `/unsubscribe?email=…`

- Clears `consentEmailMarketing` / `consentSmsMarketing` on matching local leads.
- Nurture + welcome emails append footer via `commsUnsubscribeFooter.ts`.
- Comms Studio merge tag: `{{links.unsubscribe}}` from `buildMessageContext`.

## Lead magnet conversion (Phase 11)

- Exit-intent modal on funnel landing (`FunnelExitIntentModal`).
- Configurable trust count: Admin → Settings → Site → **Funnel trust count**.
- Mobile sticky CTA on landing + form steps.

## Related docs

- `PRODUCTION_DEPLOY.md` — flags and deploy pipeline
- `AUTOMATION_STUDIO.md` — nurture cron + comms delivery
