# Finely Voice Studio API — Finely Cred + Nora Capital Group

Shared neural narration platform. **Finely Cred (5175)** owns education content and admin; **Nora Capital Group (5173)** consumes the same API with `tenantId: nora_capital`. No duplicate TTS keys in Nora.

## Architecture

| Component | Role |
|-----------|------|
| `voice-studio` edge function | Render, catalog, asset lookup; Cartesia + ElevenLabs clone + OpenAI |
| `voice-masters` bucket | Published MP3 masters (signed URLs) |
| `voice_assets` table | Catalog index per tenant/content/voice/hash |
| `finely-partner-api` | Nora server-to-server: `voice.catalog`, `voice.asset`, `voice.render` |

## Voice profiles

| Profile | Use |
|---------|-----|
| `finely_brand_primary` | Custom clone (set `VOICE_CLONE_FINELY_PRIMARY_ID`) |
| `finely_female_warm` | Premium preset — **default public narrator on Finely** |
| `finely_male_calm` | Premium preset |
| `finely_documentary` | Chapter / deep-dive preset |
| `nora_funding_advisor` | Nora tenant preset |

## Render — `POST /functions/v1/voice-studio`

Auth: Supabase JWT, anon key, or Nora `x-finely-partner-api-key` via `finely-partner-api`.

```json
{
  "action": "render",
  "tenantId": "finely_cred",
  "contentType": "guide",
  "contentId": "primary-tradeline-insider",
  "title": "Primary Tradeline Insider",
  "voiceProfile": "finely_brand_primary",
  "script": "…clean narration text…",
  "scriptHash": "sha256…",
  "force": false
}
```

Supported `contentType` values: `guide`, `ebook`, `course_lesson`, `funding_module`. Course intro lessons use stable IDs from `data/course-voice-lessons.json` (resolved at runtime via `courseVoiceCatalog.ts`).

Response:

```json
{
  "ok": true,
  "cached": false,
  "assetId": "uuid",
  "signedUrl": "https://…",
  "provider": "cartesia",
  "pipelineVersion": "v1",
  "durationSec": 420
}
```

## Asset lookup — `action: "asset"`

Returns existing master without re-rendering when `scriptHash` matches.

## Catalog — `action: "catalog"`

List published assets for a tenant (optional `contentType`, `contentId` filters).

## Nora Capital Group (localhost:5173)

**Do not copy this markdown file.** It is documentation only.

Copy these **code files** from Finely Cred into your Nora project:

| File | Purpose |
|------|---------|
| `src/lib/voiceStudioClient.ts` | API client (required) |
| `src/resources/voiceProfiles.ts` | Voice types + labels |
| `src/resources/pronunciationLexicon.ts` | Credit term pronunciation |
| `src/components/resources/GuideAudioPlayer.tsx` | Optional — same player UI |

Then in Nora:

1. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to the **same** Supabase project as Finely.
2. Use the player with `tenantId="nora_capital"` and `presetOnly` (uses Nora preset from Finely admin).
3. Server-side only: `finely-partner-api` with `voice.render` + API key.

Example usage (small code snippet — not the whole doc):

```typescript
import { renderVoiceAsset, NORA_VOICE_TENANT } from './voiceStudioClient';

await renderVoiceAsset({
  tenantId: NORA_VOICE_TENANT,
  contentType: 'funding_module',
  contentId: 'loan-sequence-intro',
  title: 'Loan funding sequence',
  narration,
  voiceProfile: 'nora_funding_advisor',
});
```

## Supabase secrets

| Secret | Purpose |
|--------|---------|
| `CARTESIA_API_KEY` | Primary preset quality (recommended) |
| `CARTESIA_MODEL` | Default `sonic-2` |
| `ELEVENLABS_API_KEY` | Custom clone rendering |
| `VOICE_CLONE_FINELY_PRIMARY_ID` | Your brand clone voice ID |
| `VOICE_CLONE_NORA_PRIMARY_ID` | Optional Nora clone |
| `OPENAI_API_KEY` | Emergency fallback (`tts-1-hd`) |
| `VOICE_PIPELINE_VERSION` | Bump to invalidate stale masters |

Deploy: `npm run deploy:functions` (includes `voice-studio`).

Run migration: `supabase/migrations/20260612000000_voice_studio.sql`

Pre-render all guides: `npm run voice:prerender`

Validate catalog coverage (19 guides + 2 ebooks + 8 course intro lessons): `npm run voice:catalog:check`

## Partner API v2 cross-reference

White-label embed + server lead ingest: see [NORA_CAPITAL_API.md](./NORA_CAPITAL_API.md) — actions `tenant.embed_config` and `lead.capture` on `finely-partner-api`.

## Pipeline version & cache invalidation

Set `VITE_VOICE_PIPELINE_VERSION` (default `v1`) in the Finely Cred app. When bumped, local voice asset cache and edge memo cache invalidate automatically — re-run `npm run voice:prerender` after script or lexicon changes.

TTS scripts pass through `guardVoiceScript()` (educational disclaimer + guarantee sanitization) before render.

## What makes this stronger than ElevenLabs alone

- **Performance Director** — `applyPerformanceDirector()` in `voiceStudioCore.ts` strips producer markup and adds natural breath pauses before TTS
- Multi-engine routing (Cartesia presets + ElevenLabs clones)
- Credit/legal pronunciation lexicon baked in
- Versioned catalog with instant signed-URL playback
- Cross-tenant API for Nora without duplicating infrastructure
- Brand clone as default voice profile

## Production deploy

See [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md) for `npm run predeploy:check`, sitemap generation, and [PLATFORM_CRON.md](./PLATFORM_CRON.md) for scheduled ticks.

## Staff OS chat voice

Public chat **Listen** on staff replies uses Voice Studio (not browser TTS). Roster member → role → `voiceProfile` via `publicChatStaffVoice.ts`. See [STAFF_OS.md](./STAFF_OS.md).

| Surface | Client module | Content type |
|---------|---------------|--------------|
| Public chat staff reply | `playStaffReplyAudio()` | `guide` / `public-chat-staff-{memberId}-{hash}` |
| Guide / funnel audio | `GuideAudioPlayer` | `guide` |
| My Library chapters | `FinelyAudioPlayer` | `ebook` |
| Course intros | `courseVoiceCatalog` | `course_lesson` |

Production: set `VITE_VOICE_ALLOW_BROWSER_PREVIEW=false` (default) so only studio masters play outside local dev.
