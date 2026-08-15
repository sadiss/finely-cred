# Developer QA role — plan & runbook

**Status:** MVP shipped (Aug 2026)  
**Audience:** Platform owner + developer doing pre-launch QA

## Goal

Give a **developer** account the ability to exercise **real product flows** (partners, letters, PDF, mail, email, SMS, view-as portal) without risking **live outbound comms** to partners or **live LetterStream charges** during testing.

This is **not** a full admin role. Developers get a **filtered admin subset** plus a dedicated hub at `/developer`.

---

## Role matrix

| Capability | Admin | Developer QA |
|------------|-------|--------------|
| Partner list & detail | ✅ | ✅ |
| View as partner (portal) | ✅ | ✅ |
| Letters — draft, PDF, mail modal | ✅ | ✅ (test mode mail) |
| Admin mail queue | ✅ | ✅ |
| Cases / dispute hub (read + test) | ✅ | ✅ |
| Growth, finance, vault, team | ✅ | ❌ |
| Live email to partner inbox | ✅ | ❌ → sandbox redirect |
| Live SMS to partner phone | ✅ | ❌ → sandbox redirect |
| Live LetterStream (production) | ✅ | ❌ blocked when `MAIL_LIVE_MODE` |

---

## Environment configuration

Keep **three allowlists** in sync for each developer:

| Layer | Variable | Example |
|-------|----------|---------|
| Client (Vite) | `VITE_DEVELOPER_EMAILS` | `dev@finelycred.com,dev+qa@finelycred.com` |
| Edge (staff auth) | `EDGE_DEVELOPER_EMAILS` | same comma list |
| Edge (sandbox) | `EDGE_SANDBOX_EMAIL` | `qa-inbox@finelycred.com` |
| Edge (sandbox SMS) | `EDGE_SANDBOX_SMS` | `+15555550100` |

Admins continue to use `EDGE_ADMIN_EMAILS` / bootstrap list in `src/auth/admin.ts`.

**Mail testing:** set on deployed `mailer` function:

- `MAIL_TEST_MODE=1` or `MAIL_DEBUG=3` for LetterStream test mode
- Do **not** set `MAIL_LIVE_MODE=1` for developer QA sessions

---

## Architecture

### Client

| File | Purpose |
|------|---------|
| `src/auth/developer.ts` | `isDeveloperEmail()` from `VITE_DEVELOPER_EMAILS` |
| `src/auth/staffIdentity.ts` | `resolveStaffTier()`, `isDeveloperQaOnly()` |
| `src/pages/developer/DeveloperQaHubPage.tsx` | QA hub — lanes + checklist |
| `src/components/developer/DeveloperSandboxBanner.tsx` | Sandbox reminder on admin routes |
| `src/hooks/useAdminOpsCaps.ts` | `isDeveloper` cap + filtered nav paths |
| `src/auth/ProtectedAdminRoute.tsx` | Allows developer allowlist + banner |
| `src/lib/postAuthRouting.ts` | Developer → `/developer` on sign-in |

### Edge

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/actorAuth.ts` | `requireStaffAllowlistedEmail()` — admin **or** developer |
| `supabase/functions/_shared/commsSandbox.ts` | Email/SMS redirect; live-mail block for developers |
| `supabase/functions/mailer/index.ts` | Staff auth, quote dedupe, human job names, dev mail gate |
| `supabase/functions/send-email/index.ts` | Sandbox redirect for developer tier |
| `supabase/functions/send-sms/index.ts` | Sandbox redirect for developer tier |

---

## QA workflows (must work end-to-end)

### 1. Partner + view-as

1. Sign in as developer → lands on `/developer`
2. Open **Partners** → pick seed partner (e.g. Yoli)
3. **View as partner** → portal opens with override banner
4. Walk: dashboard → disputes → letter studio → generate PDF

### 2. Letters & mail (triple-send fix)

**Problem:** Mail modal quote loop fired **3 LetterStream preauth jobs** (one per mail class).

**Fix (shipped):**

- Quote runs **one live preauth** for `selectedMailType` only
- Other classes return **static estimates**
- Quote idempotency key (`mailer:quote` KV namespace, 10 min TTL) prevents re-render duplicates
- `-904` page retry only when **no job materialized**

**Human-readable job names:**

- Format: `{PartnerFirst}_{Recipient}` e.g. `Yoli_TransUnion`, `Yoli_Midland`
- LetterStream rules: 8–20 chars, `[a-zA-Z0-9_-]`
- Client builds naming via `src/lib/letterStreamJobName.ts`
- Edge: `buildLetterStreamHumanJobName()` in `letterStreamClient.ts`

### 3. Email & SMS

1. Trigger send from comms studio or letter notify toggle
2. Edge redirects to `EDGE_SANDBOX_EMAIL` / `EDGE_SANDBOX_SMS`
3. Response includes `sandboxed: true` and `originalTo` for audit

### 4. Duplicate / seed partners

Developers need **seed partners** in demo DB (same as admin QA). Document seed partner IDs in `docs/DEVELOPER_HANDOFF.md` § QA seeds.

Recommended: one partner per track (consumer dispute, validation, court).

---

## Deploy checklist (developer onboarding)

```powershell
# Edge secrets (Supabase dashboard or CLI)
npx supabase secrets set EDGE_DEVELOPER_EMAILS=dev@finelycred.com
npx supabase secrets set EDGE_SANDBOX_EMAIL=qa-inbox@finelycred.com
npx supabase secrets set EDGE_SANDBOX_SMS=+15555550100
npx supabase secrets set MAIL_TEST_MODE=1

# Redeploy affected functions
npx supabase functions deploy mailer
npx supabase functions deploy send-email
npx supabase functions deploy send-sms
```

Local `.env`:

```
VITE_DEVELOPER_EMAILS=dev@finelycred.com
```

---

## Future phases (not MVP)

- [ ] Developer-scoped partner create (auto-tag `qa_seed`)
- [ ] Audit log filter: `actorTier=developer`
- [ ] UI badge on all outbound previews showing sandbox destination
- [ ] LetterStream `doauth` wire from quote → send (single charge path)
- [ ] Automated QA script: `scripts/developer-qa-smoke.mjs`
- [ ] RLS policy `developer_read_partners` (today: same as admin client-side gate)

---

## Related docs

- `docs/DEVELOPER_GUIDE.md` §9 Mail · §11 Edge secrets
- `docs/DEVELOPER_HANDOFF.md` § Physical mail
- Mail duplicate root-cause notes in launch sprint plan
