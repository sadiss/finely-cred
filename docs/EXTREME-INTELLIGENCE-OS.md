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

Partner Email Desk keeps a HOLD queue. Approving a draft on that screen does not transmit. From addresses are only `partnersupport@finelycred.com` and `sanzstlouis@finelycred.com`. Vertical templates: tax, BHPH, mortgage, realtor, immigration. Site deploy is not required. `send-partner-email` sends only when `approved === true` and `ZOHO_PARTNER_EMAIL_ENABLED` plus `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS` are set. It does not fall back to generic SMTP. The desk itself does not call that function.

## PARTIAL

- YouTube, Nominatim, Overpass, Census, FDIC, and NCUA return `not_configured` until Supabase and `public-data` are deployed. They do not show sample videos, banks, or scores.
- Soft-pull vendors are names and a checklist. No bureau API is called.
- Warm list reads `listPartnersLocal()`. An empty browser shows an empty list.
