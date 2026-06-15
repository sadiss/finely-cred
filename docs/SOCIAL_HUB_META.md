# Social Hub — Meta Integration (Phase 3)

Meta-first scheduling, unified inbox, and Lead Ads ingestion for Finely Cred admin.

## Architecture

| Layer | Component |
|-------|-----------|
| Admin UI | `/admin/social-hub` — `AdminSocialHubPage.tsx` |
| Local state | `src/data/socialHubRepo.ts` — queued posts + inbox (dev/offline) |
| OAuth | Edge function `meta-oauth` — code exchange + page tokens |
| Webhooks | Edge function `meta-webhook` — verify, DMs, Lead Ads → CRM |
| Database | `meta_connections`, `meta_inbox_messages`, `lead_captures` |

## OAuth flow

1. Admin enters **Meta App ID** in Settings (client-side only; secrets stay on Supabase).
2. **Connect Meta account** redirects to Facebook OAuth with scopes:
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `leads_retrieval`
3. Callback lands on `/admin/social-hub?tab=settings&code=…`
4. Client invokes `meta-oauth` with `{ code, redirectUri }`.
5. Edge function exchanges code, lists pages + IG business accounts, upserts `meta_connections`.

### Supabase secrets

```
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=   # webhook GET challenge
```

Also required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

## Webhook setup

1. In Meta App → Webhooks, subscribe **Page** object to:
   - `messages`, `messaging_postbacks`, `leadgen`
2. Callback URL: `https://<project>.supabase.co/functions/v1/meta-webhook`
3. Verify token must match `META_VERIFY_TOKEN`.
4. App secret used for `X-Hub-Signature-256` validation on POST.

### Ingest behavior

- **Lead Ads** (`leadgen` change) → upsert `lead_captures` with `referral_source: meta_lead_form`, UTM tags.
- **Messenger** (`messaging` entry) → upsert `meta_inbox_messages`.

Automations can react to new leads via existing `lead_scored` / funnel rules once leads sync to CRM.

## Local dev

Without Meta credentials:

- **Queue post** — persists to `socialHubRepo` (local JSON).
- **Simulate lead** — adds a sample inbox thread (Settings tab).
- OAuth and webhooks require deployed edge functions + secrets.

Run migration:

```bash
supabase db push
# or apply supabase/migrations/20260615000000_meta_connections.sql
```

Deploy functions:

```bash
npm run deploy:functions
# includes meta-oauth, meta-webhook
```

## Composer → Media Studio

Composer links to `/admin/media-studio` for asset handoff. Live publish via Graph API is a production follow-up (page token in `meta_connections`).

## Related docs

- [VOICE_STUDIO_API.md](./VOICE_STUDIO_API.md)
- [NORA_CAPITAL_API.md](./NORA_CAPITAL_API.md)
- [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)
