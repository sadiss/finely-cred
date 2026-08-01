# Credit Specialist Guide — route handoff

**CTA / pricing-signup path (agreed):** `/credit-specialist/join`  
(Another agent owns that page. Guide CTAs already link there.)

## Routes

| Path | Page |
|------|------|
| `/credit-specialist-guide` | Landing (preview + chapter cards) |
| `/credit-specialist-guide/read` | In-app guide reader (`?chapter=<id\|1-based-index>`) |
| `/credit-specialist/join` | Pricing / signup (external ownership) |

## App.tsx — lazy imports (near other lead-magnet lazy lines)

```tsx
const CreditSpecialistGuideLandingPage = lazy(() => import('./pages/leadmagnet/CreditSpecialistGuideLandingPage'));
const CreditSpecialistGuideReaderPage = lazy(() => import('./pages/leadmagnet/CreditSpecialistGuideReaderPage'));
```

## App.tsx — Route entries (near `/credit-specialist-apply` / free-* guide routes)

```tsx
{/* Credit Specialist lead-magnet guide (in-app reader) */}
<Route path="/credit-specialist-guide" element={<CreditSpecialistGuideLandingPage />} />
<Route path="/credit-specialist-guide/read" element={<CreditSpecialistGuideReaderPage />} />
```

## Files

- `src/pages/leadmagnet/CreditSpecialistGuideLandingPage.tsx`
- `src/pages/leadmagnet/CreditSpecialistGuideReaderPage.tsx`
- `src/pages/leadmagnet/creditSpecialistGuideContent.ts`
- `src/pages/leadmagnet/creditSpecialistGuideLanding.css`

## Preview → reader flow

1. Landing mockup / “Open the free guide” / chapter cards → `navigate('/credit-specialist-guide/read')` or `...?chapter=<id>`.
2. Reader TOC + prev/next update `?chapter=` and scroll to top.
3. CTAs → `/credit-specialist/join`.
