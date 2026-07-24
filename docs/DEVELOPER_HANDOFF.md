# Finely Cred — Developer Handoff (Production Ops)

> **🚨 URGENT / DO THIS FIRST:**  
> 1. Letters entitlements → [`DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md`](../DEV_URGENT_GRANT_ACCESS_AND_LETTERS.md)  
>    Migration: `supabase/migrations/202607240001_entitlements_admin_write.sql`  
> 2. Mail letters today + Litigation → [`DEV_URGENT_MAIL_AND_LITIGATION.md`](../DEV_URGENT_MAIL_AND_LITIGATION.md)  
>    Admin path: `/admin/mail` · Partner vault batch mail · Watch **TEST MODE** banner  
> **Branch:** `preview/sitewide-ux-pack-merge` only — do not cut a new branch.

**Audience:** Engineer deploying and operating Finely Cred in production.  
**Repo:** `Tishobe/finely-cred-main`  
**Last updated:** July 2026

This document is the **strict runbook** for making AI, email, onboarding, and automation work end-to-end. Read it before touching Supabase, edge functions, or feature flags.

---

## 0. Golden rules (read first)

1. **Two email systems exist — do not confuse them**
   - **Supabase Auth emails** (confirm signup, magic link, default password reset) → plain templates in Supabase Dashboard → Authentication → Email Templates. Finely does **not** control HTML here unless you customize those templates or disable confirmations.
   - **Finely Comms emails** (welcome, invite, nurture, branded reset) → our edge functions + SMTP/SendGrid + HTML builders in `src/comms/`.

2. **Feature flags are client-side gates** (localStorage `finely.settings.v1`) until `tenant_settings` is wired. Turning a flag ON in one browser does not sync to other admins.

3. **Never deploy edge functions without `--no-verify-jwt`** — ES256 JWTs break default Supabase verification. Always use:
   ```bash
   npm run deploy:functions
   npm run deploy:functions -- --all   # full 69 functions
   ```

4. **`send-email` requires `EDGE_ADMIN_EMAILS`** — partners cannot send mail through it. Use `send-partner-welcome` for post-signup welcome, `send-invite-email` for admin invites.

5. **Welcome email ≠ account creation** — Unclaimed partners must receive an **invite signup URL** (`/signup?invite=1&partnerId=…`), not a raw `/portal/dashboard` link.

6. **Service role bypasses RLS** — use only in edge functions (`claim-profile`, cron, nurture). Never expose service role to the browser.

7. **Cron defaults to dry-run** — `platform-cron` tick must pass `"dryRun": false` or nurture/social never sends live.

---

## 1. First-time production setup (ordered)

### 1.1 Database
```bash
cd Tishobe/finely-cred-main
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
# OR run supabase/LIVE_SETUP_run_all.sql + migrations in order
```

Verify migrations:
- `20260629000002_auto_create_partner_on_signup.sql` — auto partner on auth.users insert
- `20260530000001_fix_admin_partner_select_policy.sql` — admin can read partners
- `20260629000001_fix_is_admin_security_definer.sql` — `is_admin()` works under RLS

### 1.2 Supabase secrets (Dashboard → Project Settings → Edge Functions)

**Required minimum:**
| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side RLS bypass |
| `EDGE_ADMIN_EMAILS` | Comma-separated admin emails allowed to invoke guarded functions |
| `APP_BASE_URL` or `PUBLIC_SITE_URL` | Email links, OAuth redirects (e.g. `https://app.finelycred.com`) |

**Email (pick SMTP or SendGrid):**
| Secret | Example |
|--------|---------|
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASS` | SendGrid API key |
| `SMTP_FROM_EMAIL` | `hello@finelycred.com` |
| `SMTP_FROM_NAME` | `Finely Cred` |

**AI (enable what you use):**
| Secret | Functions |
|--------|-----------|
| `OPENAI_API_KEY` | `ai-gateway`, `doc-intel`, `lead-intel`, `image-generate` |
| `GEMINI_API_KEY` | `ai-gateway`, `doc-intel` |
| `ANTHROPIC_API_KEY` | `ai-gateway` co-owner tasks |
| `SERPER_API_KEY` | `lead-intel` web search |

Run: `npm run secrets:check` and `npm run launch:go-live`

### 1.3 Edge functions
```bash
npm run deploy:functions          # 36 launch-critical (includes send-partner-welcome)
npm run deploy:functions -- --all # lead engine, CMO, staff OS, etc.
```

### 1.4 Frontend env (`.env.local` / hosting)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PRIVATE_BUCKET=pii
VITE_SITE_URL=https://your-domain.com
```

### 1.5 Supabase Auth settings (Dashboard)

| Setting | Recommendation |
|---------|----------------|
| **Enable email confirmations** | ON for production security; users must confirm then log in with password they chose at signup |
| **Site URL** | Match `APP_BASE_URL` |
| **Redirect URLs** | Add `https://your-domain.com/reset-password`, `/onboarding`, `/signup` |
| **Email templates** | Optional: paste Finely-branded HTML OR disable confirm emails if using invite-only flow (not recommended) |

**Why users see plain Supabase email:** Auth confirmation is separate from Finely welcome. Customize templates in Supabase Dashboard OR disable confirmations for internal pilot only.

### 1.6 Feature flags (Admin → Settings)

Enable when secrets are live:

| Flag | Must have |
|------|-----------|
| `commsDelivery` | SMTP secrets + `send-partner-welcome` deployed |
| `inviteDelivery` | SMTP + `send-invite-email` |
| `aiGateway` | Provider API keys |
| `docIntel` | `GEMINI_API_KEY` or `ai-gateway` |
| `letterMailing` | `MAIL_API_ID` + `MAIL_API_KEY` (LetterStream) |
| `automationAutopilot` | `platform-cron` scheduled with `dryRun: false` |

Localhost auto-enables flags when defaults detected (`settingsRepo.ts`).

### 1.7 Cron (nurture + social)
See `docs/PLATFORM_CRON.md`. pg_cron body **must** include:
```json
{ "action": "tick", "dryRun": false }
```

---

## 2. Partner onboarding flows (strict)

### 2.1 Three different links — never mix them

| Link | Path | Creates login? | Password step? |
|------|------|----------------|----------------|
| **Account invite** | `/signup?invite=1&partnerId=…&email=…` | Yes | Yes — Profile & account step |
| **Self-intake** | `/partner-setup?token=…` | No | No — profile only; must continue to invite signup |
| **Legacy claim** | `/claim?token=…` | No | Requires existing login |

**Admin action for new partner:** Partner Create → **Send invite** (not welcome).

### 2.2 Welcome email behavior (after this handoff)

| Partner state | Email CTA |
|---------------|-----------|
| `claimedUserId` empty | **Create your account & choose password** → full invite signup URL |
| `claimedUserId` set | **Open your portal** → `/portal/dashboard` |

**Code paths:**
- `src/lib/partnerWelcomeEmail.ts` → `send-partner-welcome` edge function
- `src/comms/signupWelcomeHtmlEmail.ts` → `buildSignupWelcomeEmail({ accountSetupUrl })`
- `src/lib/partnerInviteEmail.ts` → `send-invite-email` for admin invites

### 2.3 Signup wizard steps

| Role | Steps |
|------|-------|
| Client | role → focus → **support model** → context? → recommendation → legal → profile (password) |
| Agent | role → agentTier → recommendation → legal → profile |
| Admin invite | legal → profile only |

**Support model** (`PartnerSupportRelationshipStep`) stores `journeySignals.supportModel` on partner.

### 2.4 Post-signup claim

1. `auth.signUpWithEmail` with password (min 8 chars) — user chooses password, Finely never emails temp password
2. If email confirm ON and no session → user confirms via Supabase email, then logs in
3. `completePartnerInviteClaim` links `partnerId` to `auth.users.id` via `claim-profile` edge function
4. DB trigger `auto_create_partner_on_signup` may also claim by email match

**If claim fails:** Check `claim-profile` logs, email case mismatch, RLS, service role key.

### 2.5 Admin resend logic

`AdminPartnerAccessPanel`:
- **Unclaimed partner** → Resend welcome sends **invite email** (signup + password)
- **Claimed partner** → Resend welcome sends branded portal welcome

---

## 3. Email troubleshooting

### Symptom: Plain text link from Supabase
**Cause:** Supabase Auth confirmation or fallback `resetPasswordForEmail`.  
**Fix:** Customize Auth email templates OR use `send-password-reset` edge function (branded HTML via SMTP).

### Symptom: No welcome email at all
**Checklist:**
1. `commsDelivery` flag ON?
2. `send-partner-welcome` deployed?
3. SMTP secrets set? Run `comms-ping` from admin
4. `sendWelcomeEmail` not disabled in Welcome Experience Editor?
5. localStorage `finely.partnerWelcomeEmailSent::PARTNER_ID` — admin can `force: true` resend

### Symptom: Welcome email but no password step
**Cause:** CTA pointed to `/portal/dashboard` for unclaimed partner (fixed — must use invite URL).  
**Verify:** Email button href contains `/signup?invite=1`.

### Symptom: User enters name then goes home
**Cause:** `/partner-setup` intake (no password) — user clicked "Back to site".  
**Fix:** After intake, button must go to invite signup URL (fixed in `PartnerSelfIntakePage`).

---

## 4. AI gateway (strict)

**Function:** `supabase/functions/ai-gateway`  
**Client:** `src/lib/aiClient.ts` → `callAiGateway()`

**Requirements:**
1. `aiGateway` feature flag ON
2. User signed in (except public tasks: `public_chat`, `public_concierge`, `lead_intel_public`)
3. Provider key for routed model

**Task routing (abbreviated):**
- Co-owner / ops → Anthropic
- Doc extract / lead intel → Gemini
- Default chat → OpenAI

**Common errors:**
| Error | Fix |
|-------|-----|
| 401 Unauthorized | JWT expired — refresh session |
| 500 OPENAI_API_KEY missing | Set secret, redeploy |
| Flag disabled | Admin → Settings → AI Gateway |

**Test from browser console (signed in):**
```javascript
// Use app UI: Admin → AI test panels, or dispute letter AI draft in Letter Studio
```

---

## 5. Edge function auth matrix

| Function | Who can call |
|----------|--------------|
| `ai-gateway` | Any signed-in user (+ public task whitelist) |
| `send-email`, `send-sms`, `send-invite-email` | `EDGE_ADMIN_EMAILS` only |
| `send-partner-welcome` | Own email OR admin |
| `send-password-reset` | Anon + rate limit |
| `claim-profile` | Signed-in user, email must match partner |
| `mailer` | Admin allowlist |
| `platform-cron`, `automation-runner` | Service role bearer OR admin |

**RLS bypass pattern:** Edge function creates Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, performs write, returns result. Client never gets service role.

**`claim-profile` is mandatory** for partner claim writes — direct client inserts to `partners` may fail RLS.

---

## 6. RLS & Supabase rules (practical)

1. **Partners table:** Users read own row via `claimed_user_id = auth.uid()`. Admins via `is_admin()` or `admin-list-partners` edge function.

2. **PII blobs:** `VITE_SUPABASE_PRIVATE_BUCKET` — always signed URLs, never public bucket for credit reports.

3. **Do not disable RLS globally** — use service role in edge functions instead.

4. **Hardcoded admin emails** in `admin-list-partners` / `admin-import-legacy` — keep in sync with `EDGE_ADMIN_EMAILS` or refactor.

5. **Run:** `npm run rls:check` before go-live.

---

## 7. Automation & nurture

```
pg_cron → platform-cron (dryRun: false)
       → automation-runner (cron_sweep)
       → processDueNurtureEnrollments → sendServiceEmail (SMTP direct, no admin JWT)
```

Nurture is **server-side** — does not need browser `commsDelivery` flag.  
Browser-triggered email **does** need admin JWT + flag.

---

## 8. Physical mail (LetterStream / Finely Mail)

**Secrets:** `MAIL_API_ID`, `MAIL_API_KEY`, `MAIL_PROVIDER=letterstream`  
Optional: `MAIL_TEST_MODE`, `MAIL_DEBUG` / `LETTERSTREAM_DEBUG` (UI surfaces TEST MODE when set or detectable)  
**Function:** `mailer` (`op`: `ping` | `status` | `verify` | send)  
**Flag:** `letterMailing`  
**Client:** `src/lib/mailerClient.ts` · UI: `MailLetterModal`, `BatchMailWizard`, `MailProviderStatusBanner`

| Path | Route |
|------|--------|
| **Admin mail-for-partner** | `/admin/mail` |
| Partner vault (batch + single) | `/portal/letters/vault` |
| Partner Letter Studio | `/portal/letters` (build PDFs; mail from vault) |
| Admin partner letters tab | `/admin/partners/:id?tab=letters` |

**First-timer flow:** Select letters → Confirm address → Mail → Track.

Letter PDF must exist in blob store (`pdfBlobRef`) before mail. Redeploy `mailer` after secret/testmode changes.

**Litigation Command:** `/portal/debt?tab=litigation` — debt-buyer case intelligence is pattern-based (Midland/Citi-style for all similar suits). Court partner seed is under `/admin/partners/import` only.

---

## 9. Premium credit analysis PDF

**Assets:** `public/credit-analysis/premium-spreads/*.png` (10 files — must be deployed with frontend)  
**Engine:** `premium_spreads` (default) via `resolveCreditAnalysisEngine.ts`  
**Regenerate:** Old saved PDFs are blobs — delete report and Generate PDF again.

---

## 10. UI distinction (letters vs analysis)

| Component | Theme |
|-----------|-------|
| `SavedLetterCard` / `LetterFullPreviewModal` | Dark shell `#080c12`, **fuchsia** accent |
| `CreditAnalysisDeliverableCard` | Dark shell, **indigo/violet** accent |

Letter modals use `createPortal` + `z-[8000]` / `z-[9000]` so analysis sections do not block them.

---

## 11. Deploy checklist (copy/paste)

```bash
# 1. DB
supabase db push

# 2. Secrets — verify in dashboard

# 3. Functions
npm run deploy:functions

# 4. Build & deploy frontend (include public/credit-analysis/premium-spreads/)

# 5. Admin UI
#    - Enable commsDelivery, inviteDelivery, aiGateway
#    - Set EDGE_ADMIN_EMAILS to your ops emails

# 6. Supabase Auth
#    - Site URL + redirect URLs
#    - Optional: customize confirm email template

# 7. Cron
#    - Schedule platform-cron with dryRun: false

# 8. Smoke test
npm run post-deploy:verify -- https://your-domain.com
```

### Smoke test script (manual)

1. Admin creates partner → Send invite → receive HTML invite (not plain text)
2. Open invite link → legal → profile → **set password** → land on portal dashboard
3. Welcome email arrives (second email) with branded HTML
4. Generate dispute letter → open letter modal (fuchsia, not blocked)
5. Generate credit analysis → 10-page premium PDF
6. Admin → AI gateway test / dispute AI draft works
7. `comms-ping` returns OK

---

## 12. Key file index

| Area | Files |
|------|-------|
| Onboarding wizard | `src/components/portal/index.tsx`, `src/onboarding/pipeline.ts` |
| Support model | `src/components/onboarding/PartnerSupportRelationshipStep.tsx` |
| Welcome email | `src/lib/partnerWelcomeEmail.ts`, `src/comms/signupWelcomeHtmlEmail.ts` |
| Invite email | `src/lib/partnerInviteEmail.ts`, `src/lib/partnerInviteEmailContent.ts` |
| Partner welcome edge | `supabase/functions/send-partner-welcome/index.ts` |
| AI client | `src/lib/aiClient.ts`, `supabase/functions/ai-gateway/index.ts` |
| Claim partner | `supabase/functions/claim-profile/index.ts`, `src/lib/partnerInviteBootstrap.ts` |
| Feature flags | `src/data/settingsRepo.ts`, `src/data/adminFeatureMatrix.ts` |
| Ops guide UI | `src/pages/admin/AdminSignupOpsPage.tsx`, `src/lib/signupOpsGuide.ts` |
| Production deploy | `docs/PRODUCTION_DEPLOY.md`, `docs/PLATFORM_CRON.md` |

---

## 13. Pending invite claim (email confirmation flow)

When Supabase requires email confirmation, signup completes without a session. The invite `partnerId` is stored in `localStorage` (`finely.pendingInvitePartnerId.v1`).

On first login, `retryPendingInviteClaim()` runs from:
- `getOrCreatePartnerForSession`
- `SovereignPortal.handleLogin`

This links the admin-created partner row after confirmation.

---

## 14. Lead magnet funnels (public pages)

All premium funnel landings share one capture + success flow:

| Route | Config | Landing component |
|-------|--------|-------------------|
| `/free-guide` | `CREDIT_FUNNEL` | `LeadMagnetFunnelShell` (reference implementation) |
| `/free-debt-guide` | `DEBT_FUNNEL` | `DebtEradicationLandingPage` |
| `/free-business-guide` | `BUSINESS_FUNNEL` | `BusinessCreditPowerGuideLandingPage` |
| `/free-tradeline-guide` | `TRADELINE_FUNNEL` | `TradelineAdvantageLandingPage` |
| `/free-score-roadmap` | `SCORE_ROADMAP_FUNNEL` | `CreditScoreRoadmapLandingPage` |
| `/free-agency-guide` | `AGENCY_FUNNEL` | `AgencyGuideLandingPage` |

**Capture:** `PremiumLeadMagnetCaptureForm` → `submitLeadMagnetCapture` (consent checkbox required; marketing/SMS optional).

**Post-submit:** `LeadMagnetGuidedSuccessPanel` — PDF download, portal preview (`/onboarding?lane=…`), booking, chat, free toolkit.

**Configs:** `src/domain/leadMagnetFunnels.ts` — keep `valueStack`, `onboardingLane`, and `guideId` aligned with portal lanes.

**Mockup assets:** `public/images/lead-magnets/`

---

## 15. Sensitive action codes & partner deletion

**Admin UI:** `/admin/access` → **Sensitive action codes** (resettable; stored in `finely.settings.v1` → `security.sensitiveActionCodes`).

| Code key | Used for |
|----------|----------|
| `partnerDelete` | Permanent partner file deletion when reports/letters/journey exist |
| `hosAccessGrant` | Master HOS access grants (see also Heta settings tab) |
| `bulkReportPurge` | Destructive bulk report operations |

**Policy:** `src/lib/partnerDeletionPolicy.ts` — lead-only files with no artifacts may delete after confirm only; files with reports/letters/claimed accounts require the deletion code via `SensitiveActionCodeGate`.

**HOS invite keys:** `src/components/heta/HosAccessCodesAdminPanel.tsx` — separate per-invite codes; link from Access Center.

---

## 16. Known gaps / future work

- `assignedAgentId` on partners — assign via **Partner detail → Credit specialist assignment** panel (Overview/Profile tab)
- Feature flags not persisted to Supabase `tenant_settings` — multi-admin desync
- Welcome sent flag is localStorage — should be server-side on partner row
- Supabase confirm email still separate from Finely HTML unless dashboard templates customized

---

## 17. Support contacts for escalations

When edge function returns 500, check Supabase Dashboard → Edge Functions → Logs for namespace (`send-partner-welcome`, `ai-gateway`, `claim-profile`).

When RLS blocks writes, **do not** weaken policies — use the correct edge function with service role.

**This document is authoritative for go-live.** If code and this doc disagree, fix code then update this doc in the same PR.
