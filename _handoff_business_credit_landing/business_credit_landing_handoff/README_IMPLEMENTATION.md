# Business Credit Power Guide Landing Page Handoff

## Files included

1. `BusinessCreditPowerGuideLandingPage.tsx`
   - Drop into: `src/pages/BusinessCreditPowerGuideLandingPage.tsx`
   - Standalone React + Tailwind page.
   - No logo in header/footer.
   - No e-book/e-guide mockup hardcoded.
   - Includes a premium mockup placeholder on the right side of the Tools section.

2. `ROUTE_SNIPPET.tsx`
   - Copy the lazy import and route into `src/App.tsx`.

## Mockup placement

The component has this line near the top:

```ts
const EGUIDE_MOCKUP_SRC = '';
```

When the final e-guide mockup image is ready, upload it to something like:

```txt
public/images/business-credit-power-guide.png
```

Then update the constant:

```ts
const EGUIDE_MOCKUP_SRC = '/images/business-credit-power-guide.png';
```

The placeholder will automatically swap into the real image.

## Lead capture

The form already uses your existing repo function:

```ts
submitLeadCapture()
```

It submits with:

```txt
source: business_credit_power_guide_landing
offer: business_credit_power_guide
interest: Business Credit Power Guide
```

Your freelancer only needs to confirm Supabase/CRM delivery is configured correctly.

## Design notes

- Dark premium background.
- Neon green conversion accents.
- Gold border accents.
- No logo included.
- No book mockup included.
- Mockup area intentionally reserved for later insertion.
- Uses `lucide-react`, already present in your repo.
- Uses Tailwind classes only. No extra CSS file required.
