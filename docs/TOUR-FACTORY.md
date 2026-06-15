# Tour Factory (Part C)

Automated walkthrough videos without manual screen recording.

## Pipeline

1. **Capture** — `scripts/tour-capture.mjs` uses Playwright against `http://127.0.0.1:5173` to screenshot each step in `src/config/tourManifest.ts`.
2. **Narrate** — Voice Studio (or TTS) generates MP3 per step from `narrationPlain` text.
3. **Assemble** — `ffmpeg` combines PNG + audio into MP4 per tour.
4. **Publish** — Upload to Resources or register in `src/domain/siteTourVideos.ts`; Admin Tour Studio lists status.

## Requirements

- Node 18+
- `ffmpeg` on PATH
- Playwright Chromium (`npx playwright install chromium`)
- Dev server: `npm run dev` on port **5173**

## Working today

- Step-by-step **FinelyTourPlayer** (text + captions) on all manifest tours
- **Watch how** floating button via `FinelyLaunchHelpStrip`
- Manual MP4 upload still works in Admin → Resources

## Full pipeline

```powershell
npm run dev
npm run tour:capture -- --tour=tour-home-overview
# Add step-NN.mp3 from Voice Studio into public/tours/{tourId}/
npm run tour:assemble -- --tour=tour-home-overview
```

## SmartCredit affiliate

Confirm PID in `src/config/creditMonitoringPartners.ts` with your live offer link.
