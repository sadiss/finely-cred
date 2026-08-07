# Trade Lines Advantage Landing Page — Final Code Handoff

This package contains the final approved landing page code based on the latest approved landing page image.

## What this matches

The page is coded to match the approved visual:
- Ivory luxury fintech background
- Deep emerald header and CTA styling
- Gold dividers and icons
- Approved Trade Lines Advantage e-guide mockup
- Green metric strip
- Four learning cards
- Dark emerald video section
- Professional boardroom video preview
- Starter / Boost / Max offer lane cards
- Simple 3-step strategy section
- Bottom CTA banner
- Full footer

## Files

- `src/pages/TradelineAdvantageLandingPage.tsx`
- `ROUTE_SNIPPET.tsx`
- `CURSOR_BUILD_PROMPT.md`
- `VIDEO_SCENE_PROMPT.md`
- `QA_PREMIUM_CHECKLIST.md`
- `public/images/tradeline-advantage-guide.png`
- `reference/approved-landing-page-reference.png`
- `reference/approved-tradeline-guide-mockup.png`

## Required asset

The approved guide mockup is already included here:

```txt
public/images/tradeline-advantage-guide.png
```

Add the real logo here:

```txt
public/images/finely-cred-logo.png
```

Do not recreate the logo.

## Route

```tsx
import TradelineAdvantageLandingPage from './pages/TradelineAdvantageLandingPage';

<Route path="/tradeline-advantage-guide" element={<TradelineAdvantageLandingPage />} />
```

## Video thumbnail

The code includes a CSS/SVG fallback video thumbnail that represents the approved conference-room direction.

For the final production version, use the included `VIDEO_SCENE_PROMPT.md` to generate or source a high-end conference-room thumbnail, then save it as:

```txt
public/images/tradeline-boardroom-video-thumbnail.jpg
```

Then update:

```ts
const VIDEO_THUMBNAIL_SRC = '/images/tradeline-boardroom-video-thumbnail.jpg';
```
