import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/kbFeatureMapSync'
import './lib/errorReportingBridge'
import { ensureBillingCommsTemplates } from './data/commsBillingTemplatesSeed'
import { ensureDigestCommsTemplates } from './data/commsDigestTemplatesSeed'
import { ensureNurtureCommsTemplatesOnce } from './data/commsNurtureSeed'
import { ensureProfessionalCommsTemplatesOnce } from './data/commsProfessionalTemplateSeed'
import { ensureFunnelSessionCommsTemplates } from './data/commsFunnelSessionSeed'
import { ensureCoreAutomationRecipesOnce } from './lib/automationRecipeSeeder'
import { ensureStaffRosterSyncedOnce } from './data/staffSupabaseSync'
import { ensureSocialHubSyncedOnce } from './data/socialHubSupabaseSync'
import { ensureCommsSyncedOnce } from './data/commsSupabaseSync'
import { syncEmailWebhooksFromSupabase } from './data/commsWebhookRepo'
import { ensureOpsPersistenceSyncedOnce } from './data/automationSupabaseSync'
import './lib/platformNotificationBridge'
import './lib/pushNotificationBridge'
import './lib/webhookHub'
import './lib/automationEventBridge'
import './lib/partnerLifecycleEngine'
import { registerPwaServiceWorker } from './lib/pwaRegister'
import { inPreviewFrame } from './lib/inPreviewFrame'
import { ensureDefaultEmailDomainsOnce, refreshDefaultEmailSignatureBranding } from './data/emailDomainsRepo'
import { ensurePremiumCreditAnalysisTemplateOnce } from './data/creditAnalysisPremiumTemplateSeed'

function showBootError(message: string) {
  try {
    document.documentElement.classList.add('fc-boot-failed')
    const msg = document.getElementById('fc-boot-error-msg')
    if (msg) msg.textContent = message
  } catch {
    /* ignore */
  }
}

if (!inPreviewFrame()) {
  registerPwaServiceWorker()
  ensureBillingCommsTemplates()
  ensureDigestCommsTemplates()
  ensureNurtureCommsTemplatesOnce()
  ensureProfessionalCommsTemplatesOnce()
  ensureFunnelSessionCommsTemplates()
  ensureDefaultEmailDomainsOnce()
  refreshDefaultEmailSignatureBranding()
  ensurePremiumCreditAnalysisTemplateOnce()
  ensureCoreAutomationRecipesOnce()
  void ensureStaffRosterSyncedOnce()
  void ensureSocialHubSyncedOnce()
  void ensureCommsSyncedOnce()
  void syncEmailWebhooksFromSupabase()
  void ensureOpsPersistenceSyncedOnce()
}

const mountEl = document.getElementById('app')

try {
  if (!mountEl) {
    throw new Error('Mount element #app not found')
  }
  ReactDOM.createRoot(mountEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  document.documentElement.classList.add('fc-app-ready')
  const bootLoader = document.getElementById('fc-boot-loader')
  if (bootLoader) bootLoader.remove()
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : String(e)
  showBootError(message)
  console.error('[Finely Cred boot error]', e)
}
