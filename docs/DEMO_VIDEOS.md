# Demo videos — where they live & how to generate

Use this for **training**, **sales**, and **onboarding** when the live site needs a walkthrough.

## Where videos are saved

| Type | Folder | Example URL (local) |
|------|--------|------------------------|
| **Marketing / lead magnet** | `public/media/` | `/media/free-dispute-guide-main.mp4` |
| **Site scanner demos (MP4)** | `public/tours/demos/` | `/tours/demos/scan-portal-dashboard.mp4` |
| **Scanner step screenshots** | `public/tours/site-scan/{target-id}/` | `/tours/site-scan/scan-free-guide/step-01.png` |
| **Manifest tour MP4s** | `public/tours/` | `/tours/tour-onboarding-start.mp4` |
| **Index manifest** | `public/tours/demos/index.json` | Lists all generated demos |
| **Launch presenter demo (WebM)** | `public/demos/finely-launch-demo.webm` | `/demos/finely-launch-demo.webm` |

After deploy, videos are served from your domain at the same paths (e.g. `https://finelycred.com/tours/demos/scan-free-guide.mp4`).

## Launch presenter demo (Phase 6 — Ken Burns + voice)

**Requirements:** **ffmpeg** (see below). Optional: Supabase + voice-studio for ElevenLabs narration; otherwise Windows SAPI / macOS `say` / Linux `espeak`.

```bash
npm run demo:launch:video
# force re-render:
npm run demo:launch:video -- --force
# voice modes: --voice=auto | studio | local | none
```

Output: `public/demos/finely-launch-demo.webm` + manifest JSON. Embedded on **Resources** (`/resources#presenter-demo`) as **Presenter demo** (local TTS when cinematic APIs unavailable).

**Commit the WebM:** `public/demos/finely-launch-demo.webm` is a deploy asset — check it in after re-render. Intermediate files under `public/demos/.render-work/` stay local (gitignored).

### ffmpeg — PATH or portable fallback

`scripts/generate-launch-demo-video.mjs` resolves ffmpeg in this order:

1. **`ffmpeg` on PATH** (preferred) — install once per machine:
   - **Windows:** `winget install Gyan.FFmpeg` or [ffmpeg builds](https://www.gyan.dev/ffmpeg/builds/) essentials zip
   - **macOS:** `brew install ffmpeg`
   - **Linux:** `sudo apt install ffmpeg` (or distro equivalent)
2. **Portable fallback** (no global install) — place binaries under `scripts/.tools/ffmpeg/bin/`:
   - Download the **ffmpeg essentials** build (~100MB) from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/)
   - Extract so `ffmpeg` (or `ffmpeg.exe` on Windows) lives at:
     - `scripts/.tools/ffmpeg/bin/ffmpeg` (macOS/Linux)
     - `scripts/.tools/ffmpeg/bin/ffmpeg.exe` (Windows)
   - Verify: `node scripts/generate-launch-demo-video.mjs` (or `npm run demo:launch:video`)

`scripts/.tools/` is **gitignored** — each developer sets up portable ffmpeg locally; do not commit the zip or extracted tree.

## Automated pipeline (self-sufficient)

**Requirements:** `npm run dev` on port **5173**, Playwright Chromium, **ffmpeg** on PATH (for MP4).

```bash
# Terminal 1
npm run dev

# Terminal 2 — screenshots + cursor highlights + screen recording
npm run tour:scan:video

# Or full pipeline (record + slideshow fallback MP4s)
npm run tour:demos:full
```

### What the scanner does automatically

1. Opens each route in `src/config/tourSiteScanner.ts`
2. Scrolls to the target button/control
3. Draws a **pulsing green highlight ring** + dark overlay
4. Shows an **animated cursor** pointing at the control
5. Displays a **label chip** (e.g. “Letter Studio”)
6. Captures **step PNGs** + `highlights.json`
7. With `--video`: saves **`public/tours/demos/{target-id}.mp4`**

### Admin UI

**Admin → Tour Studio** (`/admin/tour-studio`) — copy commands, preview manifest tours, see scan targets.

## Scan targets (11 routes)

Includes: `/free-guide`, `/`, `/start-here`, `/portal/dashboard`, `/portal/reports`, `/portal/disputes`, `/portal/letters`, `/portal/messages`, `/portal/training/academy`, `/resources`, `/admin/tour-studio`.

## Manifest tours (deeper product walkthroughs)

```bash
npm run tour:capture -- --all
npm run tour:voice:prerender -- --all   # optional narration
npm run tour:assemble -- --all          # ffmpeg → public/tours/{tour-id}.mp4
```

See `docs/TOUR-FACTORY.md` for the full factory.

## Free guide PDF cover

Downloaded PDFs use the **same mockup** as the website: green spine, glow backdrop, cover art, black footer overlay, **Prepared for [name]**, **Date M/D/YYYY**.

Cover art: `public/guides/credit-dispute-letter-guide/cover.png`
