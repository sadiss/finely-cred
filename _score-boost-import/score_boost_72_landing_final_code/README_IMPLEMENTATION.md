# Score Boost 72-Hour Landing Page — Final Code Handoff

This package contains the final high-end React/Tailwind landing page code for the lead magnet:

**Boost Your Credit Score in 72 Hours**

## What is included

- Final React page component
- Route snippet for Cursor
- Approved e-guide mockup image
- Approved landing page reference image
- Processed logo asset
- Cursor build prompt
- Premium QA checklist
- Implementation notes
- Source/offer notes

## Files

```txt
src/pages/ScoreBoost72LandingPage.tsx
ROUTE_SNIPPET.tsx
CURSOR_BUILD_PROMPT.md
QA_PREMIUM_CHECKLIST.md
VIDEO_SCENE_PROMPT.md
SOURCE_NOTES.md
public/images/boost-credit-score-72-guide.png
public/images/finely-cred-logo.png
reference/approved-score-boost-guide-mockup.png
reference/approved-score-boost-landing-page-reference.png
```

## Route

Add this to your app routes:

```tsx
import ScoreBoost72LandingPage from './pages/ScoreBoost72LandingPage';

<Route path="/score-boost-72-guide" element={<ScoreBoost72LandingPage />} />
```

## Design direction

This code follows the approved page direction:

- Luxury ivory background
- Deep navy / emerald / gold
- Video positioned in the hero-right area
- E-guide and phone mockup placed lower, not oversized
- Phone shows the e-guide cover, not blank and not credit cards
- No blue squiggly page decorations
- Clean magazine / premium financial guide feel
- Strong conversion structure
- Responsive desktop/tablet/mobile layout

## Assets

The approved e-guide image is included at:

```txt
public/images/boost-credit-score-72-guide.png
```

The logo is included at:

```txt
public/images/finely-cred-logo.png
```

If you have a cleaner official transparent logo file, replace the included logo file with the official one using the same filename.

## Lead capture

The page uses:

```ts
submitLeadCapture()
```

Form sources:

```txt
score_boost_72_landing_hero
score_boost_72_landing_mid_cta
```

## Important compliance note

The page avoids hard guaranteed-score claims in the body copy. Keep it that way before launch.
