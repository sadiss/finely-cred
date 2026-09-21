# Extreme Intelligence OS

Status: **SHIPPED** on the admin home. **PARTIAL** where a free API needs Supabase or a key the owner has not pasted.

One Finely mark (`/brand/finely-cred-icon.svg`). Staff portraits stay in chat. There is no Anna persona. “Playbook” and “Anna” open `/admin/playbooks`. Hannah Reed remains a growth-agent link elsewhere.

## Ask bar

`routeCommand` is deterministic. It does not call a model and it does not invent FICO.

| Ask | What happens |
| --- | --- |
| find / geo | Nominatim + Overpass on the `public-data` edge, Finely user agent |
| draft / email | Local draft. Zoho only after Approve and secrets |
| caption | Local caption pack. No social post |
| course | Builder steps, then Courses |
| next / partner | Next step from the real `journeyStage` on a local file |
| soft pull / FICO | Vendor picker + consent log. `pullExecuted` is always false |
| banks | FDIC institutions + NCUA nearby |
| census / corridor | ACS 2022 population and median income. Labeled “not a credit score” |
| weather | Open-Meteo. Browser demo if the edge is down |
| youtube | YouTube Data API v3, or an honest not-wired message |

## Mail

`sendPartnerEmail` refuses unless `approved === true`. The browser flag is `VITE_ZOHO_PARTNER_EMAIL=true`. The edge function `send-partner-email` also requires `ZOHO_PARTNER_EMAIL_ENABLED` plus `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS`. From is locked to `partnersupport@finelycred.com`. It does not fall back to generic SMTP. Drafts and blocks are written to local audit and, when the service role is present, `audit_events`. A browser insert may fail RLS; the local log still stands.

## PARTIAL

- YouTube, Nominatim, Overpass, Census, FDIC, and NCUA return `not_configured` until Supabase and `public-data` are deployed. They do not show sample videos, banks, or scores.
- Soft-pull vendors are names and a checklist. No bureau API is called.
- Warm list reads `listPartnersLocal()`. An empty browser shows an empty list.
