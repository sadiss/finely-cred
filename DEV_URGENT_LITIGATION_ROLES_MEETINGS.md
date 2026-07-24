# 🚨 URGENT — Litigation + Roles + Meetings + Meeting Emails

**Branch:** `preview/sitewide-ux-pack-merge` · **same branch only** · never create a new branch · never force-push

Also read: [`DEV_URGENT_MAIL_AND_LITIGATION.md`](./DEV_URGENT_MAIL_AND_LITIGATION.md) · [`DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md`](./DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md)

---

## Owner click paths (60 seconds)

### Litigation Easy Path
1. `/portal/debt?tab=litigation`
2. **Step 1** — drag-drop summons/docket → scrape chat explains fields → **Apply** (or auto-Apply)
3. Step 2 confirm parties / firm mailing → Step 3 **Build written answer** + affidavit
4. Vault → **Mail letter** → pick **Certified (RR)** or **First Class**

### Meeting email (admin / counsel / chat)
1. Open Communication Hub → **Meetings** tab (or partner calendar)
2. Fill To email + title (+ optional start time)
3. Tap **Schedule & email invite** (or **Instant room + email**)
4. Partner gets premium HTML email with **Join meeting** + Google Calendar link

### Grant case-help roles
1. `/admin/team` (Team Roles)
2. Invite email → role **Paralegal** / **Attorney / Counsel** / **Consultant**
3. Assign partner IDs on the membership (same pattern as Agent)
4. Public applicants: `/careers/case-help` → Admin program applications

### Mail letters today
`/admin/mail` → Pick partner → Confirm → Mail class → Mail → Email notify

---

## Deploy chain (developer can't-miss)

```powershell
cd e:\Finely-Cred\Tishobe\finely-cred-main
git checkout preview/sitewide-ux-pack-merge
git pull origin preview/sitewide-ux-pack-merge

# DB (if not already)
supabase db push
# or paste: supabase/migrations/202607240001_entitlements_admin_write.sql

# Edge functions (mailer + send-email)
npm run deploy:functions
```

### Feature flags (Admin → Settings → Features)
| Flag | Needed for |
|------|------------|
| `letterMailing` | Physical mail via LetterStream |
| `commsDelivery` | Meeting invite emails + mail success emails |
| `inviteDelivery` | Partner signup invites |
| `portalChat` / `inAppMessaging` | Hub meetings + chat |

### Env / secrets
| Key | Where | Purpose |
|-----|--------|---------|
| `MAIL_API_ID` / `MAIL_API_KEY` | Edge `mailer` | LetterStream |
| `SMTP_*` or SendGrid | Edge `send-email` | Meeting + comms HTML |
| `EDGE_ADMIN_EMAILS` | Edge | Who may invoke guarded send |
| `APP_BASE_URL` / `PUBLIC_SITE_URL` | Edge + app | Links in emails |
| `VITE_DAILY_DOMAIN` | Frontend (optional) | Daily.co rooms instead of Jitsi |
| `DAILY_API_KEY` | Edge (optional future) | Programmatic Daily room create |

**Video:** Default Jitsi (`meet.jit.si`). Set `VITE_DAILY_DOMAIN=your-subdomain.daily.co` for higher-quality Daily rooms — no code change required beyond env. Redeploy frontend after setting.

**Mail class API:** LetterStream `mailtype` = `certified` (ERR) · `firstclass` · `certnoerr`. Passed from Mail modal / batch wizard → `mailer` edge.

---

## Code map

| Area | Paths |
|------|--------|
| Docket scraper | `src/lib/ocr/litigationDocScraper.ts` · `src/components/debt/LitigationDocScraperChat.tsx` |
| Letter merge from scrape | `src/lib/debtCreditorIntel.ts` (`formatAmountClaimedForLetter`) · `LettersCommandCenter` summonsContext |
| Defense bodies | `src/legal/courtroomPackBodies.ts` · `src/legal/litigation/*` |
| Mail class | `src/lib/mailClassOptions.ts` · `MailLetterModal` · `BatchMailWizard` |
| Meeting email HTML | `src/comms/meetingInviteEmail.ts` |
| Meeting email send | `src/lib/meetingInviteEmailSend.ts` |
| Meeting email UI | `src/components/calendar/SendMeetingInvitePanel.tsx` · Hub Meetings |
| Video URLs | `src/lib/meetingUrls.ts` (Daily or Jitsi) |
| Roles | `MembershipRole` + `ENTERPRISE_ROLES` · `/admin/team` |
| Careers | `/careers/case-help` · `src/pages/CaseHelpCareersPage.tsx` |

---

## Copy/paste blurb for developer

```
URGENT — Litigation + Meeting emails + Case-help roles (same branch)

Branch: preview/sitewide-ux-pack-merge  (DO NOT create a new branch)

1) Read:
   - DEV_URGENT_LITIGATION_ROLES_MEETINGS.md  ← this file
   - DEV_URGENT_MAIL_AND_LITIGATION.md
   - docs/DEVELOPER_HANDOFF.md (banner)

2) Flags ON: letterMailing, commsDelivery
3) Secrets: MAIL_API_* on mailer; SMTP_* on send-email; EDGE_ADMIN_EMAILS
4) Optional video upgrade: VITE_DAILY_DOMAIN=xxx.daily.co then redeploy frontend
5) Deploy: npm run deploy:functions

Owner paths:
- Litigation: /portal/debt?tab=litigation → scrape → Apply → Build answer → Vault mail
- Meeting email: Hub → Meetings → Schedule & email invite
- Roles: /admin/team → Paralegal / Attorney / Consultant + assign partners
- Careers apply: /careers/case-help
- Admin mail: /admin/mail (Certified RR default for legal letters)

Reply when flags on, mailer+send-email redeployed, and a test meeting email lands.
```
