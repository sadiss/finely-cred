# Owner setup

One step. Courses, the Business OS orb, and the Partner Email Desk work before you do it. Drafts stay HOLD. This screen does not send mail.

1. In Zoho, open a mailbox you already have — `partnersupport@finelycred.com` or `sanzstlouis@finelycred.com` — and create an app password. Give that password to your dev for `ZOHO_SMTP_USER` and `ZOHO_SMTP_PASS`, and set `ZOHO_PARTNER_EMAIL_ENABLED=true`. Do not put the password in git. Site deploy is not required. Sends go through Zoho SMTP when `ZOHO_SMTP_*` is set.
