# Debt Eradication Landing Page — Enterprise V2

This is the upgraded code handoff for the debt lead magnet landing page.

## What was upgraded

This V2 is designed to stay much closer to the premium mockup direction instead of turning into a flat demo page.

- Dark navy / rich gold cinematic visual system
- More layered background atmosphere, noise texture, and gold spotlighting
- Stronger hero scene with premium CTA card
- More polished CTA button with metallic gold gradient and shine effect
- Cleaner TypeScript imports so Cursor/build tools do not choke on unused locals
- Refined e-guide fallback mockup with no logo
- Video section included directly beneath the hero
- Premium discovery cards, stats strip, testimonials, and bottom CTA
- No logo in header
- No logo in footer
- No recreated logo anywhere

## Files

- `src/pages/DebtEradicationLandingPage.tsx`
- `ROUTE_SNIPPET.tsx`
- `CURSOR_BUILD_PROMPT.md`
- `QA_PREMIUM_CHECKLIST.md`
- `reference/landing-page-reference.png`

## Install location

Place the page here:

```txt
src/pages/DebtEradicationLandingPage.tsx
```

The page assumes this import path:

```ts
import { submitLeadCapture } from '../data/leadsRepo';
```

If your actual folder structure changes, adjust that import.

## Route

Use:

```tsx
import DebtEradicationLandingPage from './pages/DebtEradicationLandingPage';

<Route path="/debt-eradication-guide" element={<DebtEradicationLandingPage />} />
```

## Production e-guide image

The page includes a CSS-built guide mockup so the layout does not look empty or cheap before the final image is added.

For production, place the approved logo-free e-guide PNG here:

```txt
public/images/debt-eradication-guide.png
```

Then update:

```ts
const GUIDE_MOCKUP_SRC = '/images/debt-eradication-guide.png';
```

## Video

Place your video thumbnail here:

```txt
public/images/debt-video-thumbnail.jpg
```

Then update:

```ts
const VIDEO_THUMBNAIL_SRC = '/images/debt-video-thumbnail.jpg';
const VIDEO_EMBED_URL = 'https://your-video-url';
```

## Important for Chris / Cursor

The reference image is included for visual direction only. Do not recreate or add any wrong logo from the reference. The coded page intentionally renders no header/footer logo and no logo on the fallback guide mockup.

The stats and testimonials are conversion placeholders. Replace with verified/approved claims before publishing if required.
