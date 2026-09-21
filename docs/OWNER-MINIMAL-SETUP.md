# Owner setup

Three steps. The Business OS orb, Command Intelligence, courses, and free-tool demos work before any of them.

1. **Zoho, when you want mail to leave.** In the Zoho admin for `partnersupport@finelycred.com`, create an app password. Give it to your dev for the server secrets `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS`, and `ZOHO_PARTNER_EMAIL_ENABLED=true`, plus `VITE_ZOHO_PARTNER_EMAIL=true` on the app. Do not put the password in git or in the Docs & Keys box as the real secret. That box stores the last 4 characters only.
2. **Approve before send.** On a partner email, leave the box unchecked to save a draft. Check it only when that one message should go. The desk does not send overnight or from the morning brief.
3. **Ask your dev to merge** this branch and deploy the `public-data` and `send-partner-email` functions. YouTube (`YOUTUBE_API_KEY`) and the Nora site (`VITE_NORA_CAPITAL_URL`) can wait. Until then, YouTube says it is not wired, and Nora shows the open checklist.
