// Add this to src/App.tsx near the other lazy page imports:
const BusinessCreditPowerGuideLandingPage = lazy(() => import('./pages/BusinessCreditPowerGuideLandingPage'));

// Add this inside your <Routes> block:
<Route
  path="/business-credit-power-guide"
  element={
    <Suspense fallback={<FullPageLoader />}>
      <BusinessCreditPowerGuideLandingPage />
    </Suspense>
  }
/>
