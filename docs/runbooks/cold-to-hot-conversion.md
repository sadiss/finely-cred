# Cold → hot conversion (Haitian / Kreyòl)

Operator runbook for turning **cold Haitian CSV rows** into **opted-in leads**, then into a booked strategy call, including the hours Jireh is not on the phone.

This is a plan and a map of what the product already does. It is not permission to send.

## Hard stops

| Stop | What it means in this repo |
|------|----------------------------|
| No cold blast | CSV import sets `consentToContact=false` and `consentEmailMarketing=false`. Nurture send returns `no_contact_consent` until one of those is true. |
| No outreach until Jireh approves | Do not turn on Admin `commsDelivery`, do not click **Enroll** on a cold row, do not run Phone Hub texts, and do not enable `MISSED_CALL_TEXTBACK_ENABLED` for this list until the funnel is on production and Jireh says send. |
| No PII in git | Keep CSVs off the repo. Sample row is `example.lead@example.com` only. |
| No invented phone closer | There is no AI that dials a lead and closes. Phone Hub is Twilio SMS/voice for a human operator. Haitian companions are chat, email, and portal personas. |

Import mechanics stay in [haitian-cold-import.md](./haitian-cold-import.md). Enterprise consent rules stay in [lead-acquisition-enterprise.md](./lead-acquisition-enterprise.md).

---

## 1. Funnel path: cold → warm → hot

Temperature in this product is **consent + tags**, not a feeling about the list.

| Stage | Meaning | How someone gets here | Live URL |
|-------|---------|----------------------|----------|
| **Cold** | On the CSV. No permission to email or text. | Admin import or `scripts/haitian-csv-import.ts` | None. Do not link them until you are allowed to invite. |
| **Warm / opted-in** | They asked for the kits. Same lead id. Nurture may enroll. | Submit on `/free-kreyol-guide` with the contact checkbox | `https://finelycred.com/free-kreyol-guide` |
| **Hot enough to book** | They picked a slot, or score band is hot/qualified after consent | Book on the success panel or the day-7 email link | `https://finelycred.com/enlightenment-session` |
| **Partner** | They have a portal profile and can self-book | Onboarding after the magnet | `/portal/haitian`, `/portal/calendar` |

`temperature:warm` and `temperature:hot` are both written on the opt-in. Warm is the first consented band. Hot is the admin bucket. A booked call adds `session:booked` and stage `booked`. That is hotter than the opt-in tag. Do not wait for a separate “hot” import.

### Live surfaces

| Job | URL | What the guest actually gets |
|-----|-----|------------------------------|
| Community desk | `/haitian` | English page. **Pale Kreyòl** opens chat in Kreyòl (`locale: ht`, persona `haitian_companion`). |
| Alias | `/kreyol` | Same desk. |
| Metro desks | `/haitian/miami`, `/brooklyn`, `/boston`, `/houston`, `/atlanta`, `/washington`, `/chicago`, `/philadelphia`, `/jacksonville`, `/new-jersey` | Local copy, same Pale Kreyòl chat. Not English `/credit/:city` stubs. |
| Opt-in magnet | `/free-kreyol-guide` | `KREYOL_FUNNEL` (`funnelId: kreyol_companion`, offer `haitian_credit_kit`, guide `kreyol-companion-kit`). |
| Kit subpaths | `/free-kreyol-guide/what-is-credit`, `/letter-meaning`, `/helper`, `/community-flyer` | SEO titles exist. The route is `HaitianKitStudioPage`, which **redirects guests** to `/haitian` (admin → `/admin/haitian`, partner → `/portal/haitian`). Do not put a cold QR on a kit subpath and expect a form. |
| Signed-in desk | `/portal/haitian`, `/admin/haitian` | Same companion, inside the product. |
| Strategy call | `/enlightenment-session` (`/consultation` redirects here) | Slot picker. First session free per email. Later sessions $100 when Stripe is on. |
| Partner calendar | `/portal/calendar` | After they have a partner account. Video room is on that calendar, not a public dialer. |

### Language

Default is **English** for the site, the form, and `seq_kreyol_funnel`.

Kreyòl is opt-in inside the product:

- Guest taps **Pale Kreyòl**, or writes Kreyòl, or opens chat with `goal: haitian`.
- Companion law is two-voice: English artifact stays visible, meaning in Kreyòl, then the English words they will see again. Never default to French. Denylist is in `HAITIAN_DESK_DENYLIST` (no vodou, no “broken English”, no poverty framing).

Kreyòl email bodies exist (`tpl_haitian_*_ht`) and are **not** on the live sequence. Do not send them to the whole CSV. A later switch belongs only on people who chose Kreyòl in chat, and only after Jireh approves sends.

### Magnets (what the opt-in promises)

The form’s value stack, educational only, no score promises:

1. What is credit — one-page kit
2. What this letter says — collector lines with a Kreyòl meaning
3. For the person helping — family / specialist kit
4. Church and community flyer with QR
5. Partner portal preview (trial locks)

After submit, the success panel offers: download PDF, continue on the Haitian lane (`/haitian` with `next=/portal/haitian`), **Book session**, and **Chat** with the on-duty Haitian companion.

Required checkbox: contact about the download (`consentToContact`). Marketing email/SMS is a second checkbox. SMS consent is stored only when that box is on **and** the phone has 10+ digits. Nurture email still requires `consentToContact` or `consentEmailMarketing`.

### CRM tags

**Cold import** (`source: haitian_csv_import`):

`cold` · `temperature:cold` · `haitian-community` · `audience:haitian_community` · `source:haitian_csv_import`

Offer `haitian_credit_kit`. Funnel path `/free-kreyol-guide`. Stage `new`. Score band forced to **cold** (the word “credit” inside the offer must not mark them warm).

**Opt-in** (same id, pipeline runs):

Removed: `cold`, `temperature:cold`.

Added: `hot-opt-in` · `temperature:warm` · `temperature:hot` · `source:free_kreyol_opt_in`.

Kept: `source:haitian_csv_import` and `audience:haitian_community` so you can still see who came from the file.

Event (no email or name in the payload): `automation.triggered` with `kind: haitian_cold_to_hot`.

Stage becomes `contacted`. Source becomes `lead_magnet`. A later booking on the same email **updates this row** instead of creating a second capture. Offer then becomes `enlightenment_session`, stage `booked`, tags `session:booked` and `offer:enlightenment_session`. Origin tags stay.

**Re-import:** a row that already has contact or marketing consent is counted `preserved` and is not overwritten. Dry-run shows that count. Do not “fix” opt-ins by importing the CSV again.

Organic guests who never were on the CSV and submit `/free-kreyol-guide` land in **Haitian opted-in** as well. They will not have `source:haitian_csv_import`.

---

## 2. Nurture sequence (content only — do not send)

Live sequence: `seq_kreyol_funnel` (persona `haitian_companion`). Enrollment happens inside `runLeadCapturePipeline` only when consent is true. Platform cron **dry-runs** until `commsDelivery` is on. Leave it off until Jireh approves.

| When | Step id | Template the sequence actually uses | Intent |
|------|---------|--------------------------------------|--------|
| Immediate | `welcome` | `tpl_haitian_welcome_en` | You asked. Letters, collections, one next step. CTA: `https://finelycred.com/haitian`. Signature seed: Marie-Claire Baptiste. |
| 24h | `day1` | `tpl_haitian_kit_en` | One piece, not thirty. Stay with the person you are helping. One English step, then stop. CTA: `/haitian`. Signature seed: Samuel Augustin. |
| Day 7 | `day7` | `tpl_haitian_session_en` | Bring the English letter or bureau page. Explain in Kreyòl. One next step. CTA: `{{links.calendar}}` → `https://finelycred.com/enlightenment-session`. |

Sequence subjects in `nurtureSequences.ts`:

- “Haitian community is open”
- “One Haitian piece — not thirty”
- “Book a session — bring the letter”

Client send renders the HTML seeds in `commsHaitianTemplatesSeed.ts`. The edge copy in `nurtureStepEmailCopy.ts` is a shorter plain-text fallback. Both include an unsubscribe footer.

### Copy gap to fix before the first real send

`tpl_haitian_session_en` headline says **“Your strategy call is on the calendar”** while this step fires on day 7 **whether or not they booked**. The button is “Open your calendar” and goes to the public booking page. Before enabling sends, change that headline to an invitation (“Book a session — bring the letter”) so it does not claim a booking that does not exist. Kreyòl twin `tpl_haitian_session_ht` has the same assumption. Do not “fix” it by sending.

`tpl_haitian_news_en` / `_ht` exist for a digest. They are **not** steps on `seq_kreyol_funnel`. Do not add them to the live sequence in this rollout.

### Draft sequence (approve, then wire — not enrolled now)

Use this only after the three live emails have been reviewed. Channel stays email. No SMS step until `consentSmsMarketing` is true for that person.

| Day | Voice | Draft purpose | CTA |
|-----|-------|---------------|-----|
| 0 | English (live) | Welcome. Pale Kreyòl is an invitation, not the whole email. | `/haitian` |
| 1 | English (live) | One kit. Name the letter, not a stack of PDFs. | `/haitian` |
| 3 | English draft, not in code | What “collection” means on a U.S. letter, two-voice, one sentence. No statute lecture. | `/free-kreyol-guide` success download, or `/haitian` |
| 7 | English (live, after headline fix) | Book. Bring the paper. | `/enlightenment-session?email=&name=&focus=personal` |
| 14 | English draft, not in code | If they did not book: one question, one slot, unsubscribe still in the footer. If they booked: this step should not send — cancel the enrollment when stage is `booked` (not automatic today). | Same booking URL |

Kreyòl twins to offer **only** after they used Pale Kreyòl or wrote Kreyòl:

- `tpl_haitian_welcome_ht` — “Kominote ayisyen ouvè”
- `tpl_haitian_kit_ht` — kit ready, one English step after
- `tpl_haitian_session_ht` — bring the English letter

There is no lead field yet that says “this person wants Kreyòl email.” Chat locale is not copied onto the nurture enrollment. Until that exists, English is the honest send.

If they book, scoring now suggests `seq_strategy_session` (prep emails, persona `finely_advisor`) because `offer === enlightenment_session` wins over the Haitian path. That sequence assumes the call is booked. It is English. The Haitian companion remains available in chat. Do not also leave `seq_kreyol_funnel` running the day-7 “please book” note on top of a confirmed slot — cancel the Kreyòl enrollment by hand in Leads OS when stage becomes `booked`.

Compliance line on every Haitian template: results vary · not legal advice · funding subject to underwriting. Unsubscribe: `/unsubscribe?email=`.

---

## 3. How they get on the phone

Nothing here dials them. They book, or a human uses Phone Hub later.

### Public strategy call — `/enlightenment-session`

This is the path the magnet and the day-7 email use (`KREYOL_FUNNEL.bookingPath`).

1. Guest picks a slot (`PublicSessionSlotPicker`, calendar hours / notice / cutoff).
2. Form requires name, email, slot, and contact consent. Marketing email/SMS are separate.
3. `submitLeadCapture` with `source: consultation`, `offer: enlightenment_session`. If the email matches the Haitian row, that row is updated (no second lead).
4. Free first session per email. If payment is required, Stripe Checkout via edge `public-session-checkout`, return `?paid=1`. Admin cannot Schedule until paid or waived.
5. `confirmPublicSlotBooking` creates the appointment and a calendar event, then a best-effort invite email with a join path.
6. Host is **not** auto-assigned to the Haitian desk. `resolveBookingHost` uses Admin calendar staff assignees, then round-robin, then the growth-agent fallback **Alex Rivera** (`appointment-setter`) or **Caleb Brooks** (`lead-discovery`). Put a real on-duty person in calendar settings if Jireh should not be the name on the invite. Those profiles are booking hosts, not an AI closer.

Focus prefill from the Kreyòl success panel is `focus=personal` (Personal Credit). Debt and business focuses are other funnels.

### After they are a partner — `/portal/calendar`

`PartnerCalendarPage`: book a strategy call, calendar, sessions, video room. This requires a partner profile. The success-panel lane button does **not** create that profile by itself. It opens `/haitian` with `next=/portal/haitian`. They still have to sign up.

### Chat, not a call

| Control | Where | Who answers |
|---------|-------|-------------|
| Pale Kreyòl | `/haitian`, metro pages, letter flyer | `openHaitianCompanionChat` → public chat, persona `haitian_companion`, locale `ht` |
| Success panel “Chat with …” | After `/free-kreyol-guide` submit | `resolveStaffOnDuty('haitian_companion')` which is `pickHaitianCompanionOnDuty` |
| Ask Finely | Partner **course** page (`CourseCommunityAskFinely`) | In-portal help on a lesson. Not on the public Haitian desk. Not a phone agent. |
| Default public chat | Other pages | `finely_advisor` unless the goal is haitian / debt / business |

`haitian_companion` allowed channels: **chat, email, portal**. Not voice.

### On-duty Haitian faces (chat and success panel)

Weekday order: Marie-Claire Baptiste (Community Guide), Jean-Marc Toussaint (Desk Lead), Nadège Pierre (Restore), Farah Jean-Louis (Debt, late shift), Patrick Saint-Louis (Specialist Coach, evening). Weekend first face: Samuel Augustin (Walkthrough — phone, QR, one next tap). Fallback if nobody is on shift: Jean-Marc on weekdays, Samuel on weekends. The picker does not fall through to an English sales face.

These are product staff profiles for chat assignment. A chat reply is not a booked call and is not Jireh on the phone.

### Human phone (only after approval, only with SMS consent)

Admin **Phone Hub** (`AdminPhoneHubPage`): outbound SMS via `sendSms` when `commsDelivery` is on, call log, missed-call list, voicemail notes. Twilio webhook records inbound voice/SMS. Missed-call text-back is a separate secret (`MISSED_CALL_TEXTBACK_ENABLED`) and is off unless set.

`PHONE_AGENT_ROUTES` routes interest to sales, support, debt, co-owner voicemail, affiliate, or CRM intake. **There is no Haitian companion route.** `resolvePhoneRoute` will not hand a Haitian lead to Marie-Claire.

Do not text the CSV from Phone Hub. Cold rows have no SMS consent. Opted-in rows have SMS consent only if they checked marketing **and** left a real phone.

---

## 4. When Jireh is unavailable

Use what is already built. Say what it is.

| Need | Use this | Do not claim |
|------|----------|----------------|
| Someone wants to talk now | Pale Kreyòl or the success-panel chat. On-duty companion above. | That a human picked up a phone, or that chat will close a package. |
| Someone is ready for a time | `/enlightenment-session`. Slot is confirmed in the calendar. Host comes from calendar settings. | That the Haitian companion persona joins the video call. It does not. |
| They already have a portal login | `/portal/calendar` and the video room on that event. | A second public checkout. |
| A call is missed | Phone Hub missed-call list. Text-back only if the secret is on **and** Jireh has approved SMS for opted-in numbers. | An AI callback that sells. |
| Specialist should own the partner | Haitian department staff (`department: haitian_community`) via on-duty pick. `linkLeadToPartner` exists for when a partner id is real. | Auto-assignment of Jireh’s personal cell. |

### Honest gaps

1. **No telephony closer.** No Retell/Vapi/Bland-style agent places or takes a sales call. Voice webhooks log status. A person still has to be on the call.
2. **Booking host ≠ Haitian desk.** Public sessions round-robin through calendar assignees, not `pickHaitianCompanionOnDuty`. If the calendar assignee list is empty, the invite name falls back to Alex Rivera.
3. **Kreyòl email is seeded, not sequenced.**
4. **Day-7 session template reads like a confirmation.**
5. **Booked leads are not auto-removed from `seq_kreyol_funnel`.**
6. **Ask Finely is course help**, not the public front door.
7. **Edge nurture base URL** defaults to `https://app.finelycred.com` when `APP_BASE_URL` is unset. Client Haitian templates hardcode `https://finelycred.com`. Confirm `APP_BASE_URL` before any send so links do not split across hosts.

### Cheapest compliant path while Jireh is out

1. Leave the CSV cold in Leads OS.
2. Drive people to `https://finelycred.com/haitian` (community, church QR, metro page) and let **them** open `/free-kreyol-guide` and check the box. That is the opt-in. A QR on the flyer is the invite. The CSV is not the send list.
3. Success panel and day-7 email (when approved) point at `/enlightenment-session`. First session is free. The calendar holds the time without Jireh clicking each row.
4. Chat covers Kreyòl questions the same day, with the on-duty companion.
5. SMS and Phone Hub wait until there is `consentSmsMarketing` on that row and a written yes from Jireh. That is the later step, not this rollout.

---

## 5. What Admin CRM should show

**Admin → Leads OS** (`/admin/leads`).

Launcher counts:

- **Haitian cold** — still no consent.
- **Haitian opted-in** — consented Haitian captures, including CSV rows that upgraded.

Inbound toolbar (they toggle, they do not stack):

- **Haitian cold (n)** — pipeline cards for cold rows only.
- **Haitian opted-in (n)** — pipeline cards for opted-in rows.

Lead scoring rail on each card:

- `CRM cold` or `CRM opted-in`
- Score band `cold` on unconsented CSV rows, even when a phone is present
- Suggested action on cold rows: do not email; wait for `/free-kreyol-guide`
- **Enroll** is hidden on cold rows (“Opt-in required before nurture”)

| Question | Cold | Opted-in | Booked |
|----------|------|----------|--------|
| Filter | Haitian cold | Haitian opted-in | Stage column `booked`, tag `session:booked` |
| Consent | Both false | `consentToContact` true; email marketing only if they checked it | Same, plus the session form |
| Tags you should see | `cold`, `temperature:cold`, `source:haitian_csv_import` | `hot-opt-in`, `temperature:hot`, `temperature:warm`, `source:free_kreyol_opt_in`. Not `cold`. | Those, plus `session:booked` |
| Stage | `new` | `contacted` | `booked` |
| Score band | `cold` | warm / hot / qualified from consent, phone, Haitian signal | strategy-session suggestion |
| Persona suggestion | `haitian_companion` | `haitian_companion` | `finely_advisor` once offer is the session |
| Sequence if someone enrolls | Do not enroll | `seq_kreyol_funnel` | `seq_strategy_session` |
| Nurture send | Skipped (`no_contact_consent`) | Only if `commsDelivery` is on and Jireh approved | Prep sequence, same send gate |

Full CRM workspace: `/admin/crm?pipeline=inbound`. Prospect tags on the matching email are stripped of `cold` / `temperature:cold` and given the hot set when the lead opts in. The lead record (`crm_lead_…`) is what the inbound board reads. `listCrmRecords` will not re-stamp `temperature:cold` onto a consented row.

### Daily check (still no sending)

1. Launcher: cold count should fall only when people opt in, not when you re-import.
2. Import report: `preserved` means opted-in rows were left alone.
3. Open one opted-in card. Confirm `hot-opt-in`, no `temperature:cold`, stage `contacted`.
4. If they booked, the same email is still one lead, stage `booked`.
5. Nurture strip: do not **Run due steps** against live comms until the headline fix and Jireh’s yes.

### Proof without a blast

- Dry-run the importer (`--dry-run`). Expect `preserved` on any consented email already in the file.
- Submit `/free-kreyol-guide` with a non-production example address that you imported as cold. Same lead id. Admin bucket flips from cold to opted-in.
- Book `/enlightenment-session` with that same email. Still one lead. Stage `booked`.
- Confirm no enrollment send left the building (`commsDelivery` off, or nurture log dry-run).
