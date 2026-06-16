#!/usr/bin/env node
/**
 * Phase 43 — Critical path smoke (no browser).
 * Verifies funnel → CRM → task wiring modules exist and export expected symbols.
 * Usage: npm run e2e:smoke
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Light OS surfaces — legacy border stacks or Part CW/CY glass + catalog cards. */
function hasLightOsChrome(src) {
  return (
    src.includes('border-white/[0.08]') ||
    src.includes('fc-light-glass-panel') ||
    src.includes('fc-light-chrome-panel') ||
    src.includes('fc-light-chrome-strip') ||
    src.includes('finelyOsCatalogCard') ||
    src.includes('FINELY_OS_GLASS_INNER') ||
    src.includes('FINELY_OS_ENTITY_PANEL_INNER') ||
    src.includes('FINELY_OS_ENTITY_PANEL')
  );
}

function hasLightOsPanel(src) {
  return hasLightOsChrome(src) && !src.includes('border-white/10');
}

const criticalFiles = [
  'src/lib/leadCapturePipeline.ts',
  'src/lib/crmLeadSync.ts',
  'src/lib/nurtureEngine.ts',
  'src/lib/funnelEmail.ts',
  'src/lib/reportParsePipeline.ts',
  'src/lib/reportParseCache.ts',
  'src/lib/webhookHub.ts',
  'src/lib/platformNotificationBridge.ts',
  'src/lib/automationEventMatcher.ts',
  'src/lib/workAiTaskBuilder.ts',
  'src/domain/workResults.ts',
  'src/lib/workTaskOverdueEngine.ts',
  'src/lib/agentHandoffBridge.ts',
  'src/lib/agentPersonaTools.ts',
  'src/lib/audioProgressRepo.ts',
  'src/lib/serverAutomationClient.ts',
  'src/features/automation/automationRecipeLibrary.ts',
  'src/lib/workTaskComplete.ts',
  'src/features/work/components/TaskCompleteModal.tsx',
  'src/lib/nurtureStepCopy.ts',
  'src/data/commsNurtureSeed.ts',
  'src/domain/nurtureSequences.ts',
  'src/features/work/workspace/TaskCreateWizard.tsx',
  'src/resources/downloadGuidePdf.ts',
  'src/resources/buildScoreRoadmapPdf.ts',
  'src/resources/scoreRoadmapContent.ts',
  'src/components/resources/GuideAudioPlayer.tsx',
  'src/components/chat/HubAiCoachPanel.tsx',
  'src/components/chat/publicChatPersonaUi.ts',
  'src/data/staffRoster.ts',
  'src/data/automationOpsQueue.ts',
  'src/lib/disputeLetterAutomation.ts',
  'src/creditReports/disputeFactualReasons.ts',
  'src/pages/admin/AdminHandsFreeOpsPage.tsx',
  'src/pages/leadmagnet/ScoreRoadmapFunnelPage.tsx',
  'src/pages/leadmagnet/AgencyGuideFunnelPage.tsx',
  'src/pages/leadmagnet/SpecialistApplyFunnelPage.tsx',
  'src/pages/leadmagnet/AffiliateToolkitFunnelPage.tsx',
  'src/components/leadmagnet/LeadMagnetFunnelShell.tsx',
  'src/components/leadmagnet/FunnelUpgradeStack.tsx',
  'src/data/socialHubRepo.ts',
  'src/lib/socialHubCommsBridge.ts',
  'src/lib/crmLifecycleBridge.ts',
  'src/lib/crmDealScoring.ts',
  'src/lib/partnerLifecycleEngine.ts',
  'src/lib/commerceStripeBridge.ts',
  'src/lib/disputeReasonAi.ts',
  'src/lib/creditIntelProjectSync.ts',
  'src/lib/evidenceFieldExtract.ts',
  'src/lib/evidenceGates.ts',
  'src/lib/notificationDigestEngine.ts',
  'src/lib/notificationDigestCron.ts',
  'src/lib/notificationDigestComms.ts',
  'src/data/commsDigestTemplatesSeed.ts',
  'src/lib/automationRecipeSeeder.ts',
  'src/lib/humanAutomationBehavior.ts',
  'src/features/automation/humanAutomationCatalog.ts',
  'src/features/unified/FinelyUnifiedHubLayout.tsx',
  'src/features/reasons/ReasonsCommandHub.tsx',
  'src/pages/FundabilityReadinessPage.tsx',
  'src/components/landing/LandingUnifiedJourneySection.tsx',
  'src/components/landing/LandingFundabilityTrustSection.tsx',
  'src/components/landing/LandingHeroOsRefreshSection.tsx',
  'src/lib/drainServerAutomationQueue.ts',
  'src/data/serverAutomationQueueRepo.ts',
  'src/features/inbox/OpsPlatformCronHealthPanel.tsx',
  'supabase/migrations/20260621000000_server_automation_queue.sql',
  'supabase/migrations/20260622000000_work_tasks.sql',
  'src/features/admin/AdminLaunchChecklistPanel.tsx',
  'src/pages/NotificationsCenterPage.tsx',
  'src/lib/bookstoreCommerce.ts',
  'src/lib/documentVaultGates.ts',
  'src/components/documents/DocumentIdScanPanel.tsx',
  'src/pages/admin/AdminFunnelExperimentsPage.tsx',
  'src/lib/referralGrowthEngine.ts',
  'src/lib/affiliatePayoutEngine.ts',
  'src/lib/revenueIntelCohorts.ts',
  'src/lib/noraPartnerApiClient.ts',
  'src/components/partner/PartnerCreditLanesPanel.tsx',
  'src/features/admin/AdminAffiliateOpsPanel.tsx',
  'src/features/admin/AdminReferralGrowthPanel.tsx',
  'src/lib/platformUnifiedKpi.ts',
  'src/features/comms/AdminMetaInboxWidget.tsx',
  'src/pages/admin/AdminSupportInboxPage.tsx',
  'src/lib/leadsBulkImport.ts',
  'src/features/leadsOs/LeadBulkImportPanel.tsx',
  'src/components/audio/FinelyAudioPlayer.tsx',
  'src/pages/admin/AdminSocialHubPage.tsx',
  'supabase/functions/meta-oauth/index.ts',
  'supabase/functions/meta-publish-post/index.ts',
  'supabase/functions/meta-webhook/index.ts',
  'supabase/functions/finely-partner-api/index.ts',
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/robots.txt',
  'public/sitemap.xml',
  'scripts/generate-public-sitemap.mjs',
  'scripts/validate-voice-prerender-catalog.mjs',
  'scripts/rebuild-live-setup.mjs',
  'scripts/validate-local-env.mjs',
  'scripts/ci-predeploy-check.mjs',
  'scripts/audit-portal-unified-hub.mjs',
  'scripts/audit-public-marketing-hub.mjs',
  'scripts/audit-business-hub.mjs',
  'src/lib/partnerDigestCron.ts',
  'src/lib/serverPlatformCronClient.ts',
  'supabase/functions/platform-cron/index.ts',
  'supabase/migrations/20260617000000_social_scheduled_posts.sql',
  'supabase/migrations/20260618000000_platform_cron_heartbeats.sql',
  'supabase/migrations/20260619000000_nurture_automation_persistence.sql',
  'supabase/migrations/20260620000000_automation_rule_runs_cron_schedule.sql',
  'src/data/nurtureSupabaseSync.ts',
  'src/data/automationSupabaseSync.ts',
  'src/data/platformCronScheduleRepo.ts',
  'supabase/functions/_shared/processDueNurtureEnrollments.ts',
  'supabase/functions/_shared/processAutomationRulesFromDb.ts',
  'supabase/functions/_shared/processServerAutomationQueue.ts',
  'src/data/workTasksSupabaseSync.ts',
  'supabase/functions/_shared/commsSendEmail.ts',
  'supabase/functions/_shared/nurtureStepEmailCopy.ts',
  'supabase/functions/_shared/nurtureSequencesCatalog.ts',
];

let failed = 0;

console.log('Finely Cred — E2E critical path smoke\n');

for (const rel of criticalFiles) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const pipelineSrc = fs.readFileSync(path.join(root, 'src/lib/leadCapturePipeline.ts'), 'utf8');
const pipelineChecks = [
  ['emitLeadCreated', 'platform event emission'],
  ['syncLeadToCrmProspect', 'CRM sync'],
  ['enrollLeadInNurtureSequence', 'nurture enrollment'],
  ['sendImmediateWelcomeEmail', 'welcome email'],
  ['recordSecurityAudit', 'security audit'],
  ['lead_scored', 'lead scoring emit'],
];
for (const [sym, label] of pipelineChecks) {
  const ok = pipelineSrc.includes(sym);
  console.log(`${ok ? '✓' : '✗'} leadCapturePipeline: ${label} (${sym})`);
  if (!ok) failed += 1;
}

const matcherSrc = fs.readFileSync(path.join(root, 'src/lib/automationEventMatcher.ts'), 'utf8');
const matcherOk = matcherSrc.includes('platformEventMatchesTrigger') && matcherSrc.includes('task_overdue') && matcherSrc.includes('course_lesson_agent_run') && matcherSrc.includes('task_result_recorded') && matcherSrc.includes('crm_stage_changed') && matcherSrc.includes('funnel_session_booked');
console.log(`${matcherOk ? '✓' : '✗'} automationEventMatcher: task + CRM + course + funnel session triggers`);
if (!matcherOk) failed += 1;

const partnerApi = fs.readFileSync(path.join(root, 'supabase/functions/finely-partner-api/index.ts'), 'utf8');
for (const action of ['lead.capture', 'tenant.embed_config', 'voice.render']) {
  const ok = partnerApi.includes(action);
  console.log(`${ok ? '✓' : '✗'} finely-partner-api: ${action}`);
  if (!ok) failed += 1;
}

const metaOauth = fs.readFileSync(path.join(root, 'supabase/functions/meta-oauth/index.ts'), 'utf8');
const metaOauthOk = metaOauth.includes('oauth/access_token') && metaOauth.includes('meta_connections');
console.log(`${metaOauthOk ? '✓' : '✗'} meta-oauth: token exchange + meta_connections upsert`);
if (!metaOauthOk) failed += 1;

const metaPublish = fs.readFileSync(path.join(root, 'supabase/functions/meta-publish-post/index.ts'), 'utf8');
const metaGraph = fs.readFileSync(path.join(root, 'supabase/functions/_shared/metaGraphPublish.ts'), 'utf8');
const metaPublishOk =
  metaPublish.includes('publishMetaSocialPost') &&
  metaGraph.includes('publishInstagramMedia') &&
  metaGraph.includes('publishFacebookPageFeed');
console.log(`${metaPublishOk ? '✓' : '✗'} meta-publish-post: Facebook feed + Instagram media container`);
if (!metaPublishOk) failed += 1;

const metaWebhook = fs.readFileSync(path.join(root, 'supabase/functions/meta-webhook/index.ts'), 'utf8');
const metaWebhookOk = metaWebhook.includes('leadgen') && metaWebhook.includes('lead_captures');
console.log(`${metaWebhookOk ? '✓' : '✗'} meta-webhook: leadgen → lead_captures`);
if (!metaWebhookOk) failed += 1;

const socialHub = fs.readFileSync(path.join(root, 'src/data/socialHubRepo.ts'), 'utf8');
const socialHubOk = socialHub.includes('queueSocialPost') && socialHub.includes('syncMetaInboxFromSupabase');
console.log(`${socialHubOk ? '✓' : '✗'} socialHubRepo: queue + inbox sync`);
if (!socialHubOk) failed += 1;

const socialComms = fs.readFileSync(path.join(root, 'src/lib/socialHubCommsBridge.ts'), 'utf8');
const socialCommsOk = socialComms.includes('listMetaInboxThreadSummaries') && socialComms.includes('replyMetaInboxThread');
console.log(`${socialCommsOk ? '✓' : '✗'} socialHubCommsBridge: omnichannel Meta threads`);
if (!socialCommsOk) failed += 1;

const supportInbox = fs.readFileSync(path.join(root, 'src/pages/admin/AdminSupportInboxPage.tsx'), 'utf8');
const supportInboxOk = supportInbox.includes('listMetaInboxThreadSummaries') && supportInbox.includes("sourceFilter");
console.log(`${supportInboxOk ? '✓' : '✗'} AdminSupportInboxPage: portal + Meta omnichannel`);
if (!supportInboxOk) failed += 1;

const tasksRepo = fs.readFileSync(path.join(root, 'src/data/tasksRepo.ts'), 'utf8');
const checklistToggleOk = tasksRepo.includes('toggleTaskChecklistItem');
console.log(`${checklistToggleOk ? '✓' : '✗'} tasksRepo: checklist item toggle`);
if (!checklistToggleOk) failed += 1;

const crmLifecycle = fs.readFileSync(path.join(root, 'src/lib/crmLifecycleBridge.ts'), 'utf8');
const crmLifecycleOk = crmLifecycle.includes('emitCrmStageChanged') && crmLifecycle.includes('emitPartnerStageChanged');
console.log(`${crmLifecycleOk ? '✓' : '✗'} crmLifecycleBridge: stage change events`);
if (!crmLifecycleOk) failed += 1;

const dealScore = fs.readFileSync(path.join(root, 'src/lib/crmDealScoring.ts'), 'utf8');
const dealScoreOk = dealScore.includes('scoreCrmRecord') && dealScore.includes('winProbability');
console.log(`${dealScoreOk ? '✓' : '✗'} crmDealScoring: win probability`);
if (!dealScoreOk) failed += 1;

const partnerLife = fs.readFileSync(path.join(root, 'src/lib/partnerLifecycleEngine.ts'), 'utf8');
const partnerLifeOk = partnerLife.includes('syncPartnerJourneyStage') && partnerLife.includes('inferPartnerJourneyStage');
console.log(`${partnerLifeOk ? '✓' : '✗'} partnerLifecycleEngine: journey sync`);
if (!partnerLifeOk) failed += 1;

const commerceBridge = fs.readFileSync(path.join(root, 'src/lib/commerceStripeBridge.ts'), 'utf8');
const commerceOk = commerceBridge.includes('finalizeStripeCheckout') && fs.readFileSync(path.join(root, 'src/lib/commerceHub.ts'), 'utf8').includes('completePackagePurchase');
console.log(`${commerceOk ? '✓' : '✗'} commerceStripeBridge: Stripe verify + local fallback`);
if (!commerceOk) failed += 1;

const disputeAi = fs.readFileSync(path.join(root, 'src/lib/disputeReasonAi.ts'), 'utf8');
const disputeAiOk = disputeAi.includes('buildDisputeReasonsWithAi');
console.log(`${disputeAiOk ? '✓' : '✗'} disputeReasonAi: AI reason ranking`);
if (!disputeAiOk) failed += 1;

const unifiedKpi = fs.readFileSync(path.join(root, 'src/lib/platformUnifiedKpi.ts'), 'utf8');
const unifiedKpiOk = unifiedKpi.includes('buildPlatformUnifiedKpi') && fs.readFileSync(path.join(root, 'src/lib/opsHealthDashboard.ts'), 'utf8').includes('unified');
console.log(`${unifiedKpiOk ? '✓' : '✗'} platformUnifiedKpi: CRM + nurture + Work OS rollup`);
if (!unifiedKpiOk) failed += 1;

const creditIntelSync = fs.readFileSync(path.join(root, 'src/lib/creditIntelProjectSync.ts'), 'utf8');
const creditIntelSyncOk = creditIntelSync.includes('syncCreditIntelToProjectOutcomes');
console.log(`${creditIntelSyncOk ? '✓' : '✗'} creditIntelProjectSync: score → project outcomes`);
if (!creditIntelSyncOk) failed += 1;

const evidenceGates = fs.readFileSync(path.join(root, 'src/lib/evidenceGates.ts'), 'utf8');
const evidenceGatesOk = evidenceGates.includes('checkMailLetterTaskEvidenceGate') && evidenceGates.includes('checkDisputeLetterEvidenceGate');
console.log(`${evidenceGatesOk ? '✓' : '✗'} evidenceGates: letter + mail task gates`);
if (!evidenceGatesOk) failed += 1;

const notifBridge = fs.readFileSync(path.join(root, 'src/lib/platformNotificationBridge.ts'), 'utf8');
const notifBridgeOk = notifBridge.includes('chat.message_received') && notifBridge.includes('meta_lead');
console.log(`${notifBridgeOk ? '✓' : '✗'} platformNotificationBridge: Meta + CRM alerts`);
if (!notifBridgeOk) failed += 1;

const notifPage = fs.readFileSync(path.join(root, 'src/pages/NotificationsCenterPage.tsx'), 'utf8');
const notifPageOk = notifPage.includes('NotificationsCenterPage') && fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('/admin/notifications');
console.log(`${notifPageOk ? '✓' : '✗'} NotificationsCenterPage: admin + portal routes`);
if (!notifPageOk) failed += 1;

const bookstoreCommerce = fs.readFileSync(path.join(root, 'src/lib/bookstoreCommerce.ts'), 'utf8');
const bookstoreOk = bookstoreCommerce.includes('completeBundlePurchase') === false && bookstoreCommerce.includes('BOOKSTORE_BUNDLES') && fs.readFileSync(path.join(root, 'src/lib/commerceHub.ts'), 'utf8').includes('completeBundlePurchase');
console.log(`${bookstoreOk ? '✓' : '✗'} bookstoreCommerce: bundles + purchase`);
if (!bookstoreOk) failed += 1;

const docVault = fs.readFileSync(path.join(root, 'src/lib/documentVaultGates.ts'), 'utf8');
const docVaultOk = docVault.includes('checkIdentityDocumentGate') && fs.readFileSync(path.join(root, 'src/lib/partnerOnboardingEngine.ts'), 'utf8').includes('bootstrapPartnerOnboardingJourney');
console.log(`${docVaultOk ? '✓' : '✗'} documentVaultGates: ID gate + onboarding bootstrap`);
if (!docVaultOk) failed += 1;

const funnelAb = fs.readFileSync(path.join(root, 'src/pages/admin/AdminFunnelExperimentsPage.tsx'), 'utf8');
const funnelAbOk = funnelAb.includes('AdminFunnelExperimentsPage') && fs.readFileSync(path.join(root, 'src/data/funnelExperimentsRepo.ts'), 'utf8').includes('assignFunnelVariant');
console.log(`${funnelAbOk ? '✓' : '✗'} AdminFunnelExperimentsPage: A/B lab`);
if (!funnelAbOk) failed += 1;

const compliance = fs.readFileSync(path.join(root, 'src/lib/complianceEngine.ts'), 'utf8');
const complianceOk = compliance.includes('guardLetterOutput') && fs.readFileSync(path.join(root, 'src/lib/disputeReasonAi.ts'), 'utf8').includes('guardLetterOutput');
console.log(`${complianceOk ? '✓' : '✗'} complianceEngine: letter guard + dispute AI`);
if (!complianceOk) failed += 1;

const referralGrowth = fs.readFileSync(path.join(root, 'src/lib/referralGrowthEngine.ts'), 'utf8');
const referralOk = referralGrowth.includes('recordReferralLinkVisit') && referralGrowth.includes('buildReferralGrowthSnapshot');
console.log(`${referralOk ? '✓' : '✗'} referralGrowthEngine: QR clicks + conversions`);
if (!referralOk) failed += 1;

const affiliatePay = fs.readFileSync(path.join(root, 'src/lib/affiliatePayoutEngine.ts'), 'utf8');
const affiliatePayOk = affiliatePay.includes('buildAffiliatePayoutRollup') && affiliatePay.includes('recordAffiliatePayout');
console.log(`${affiliatePayOk ? '✓' : '✗'} affiliatePayoutEngine: payout rollup`);
if (!affiliatePayOk) failed += 1;

const cohorts = fs.readFileSync(path.join(root, 'src/lib/revenueIntelCohorts.ts'), 'utf8');
const cohortsOk = cohorts.includes('buildRevenueCohortMetrics') && fs.readFileSync(path.join(root, 'src/lib/revenueAnalytics.ts'), 'utf8').includes('cohorts');
console.log(`${cohortsOk ? '✓' : '✗'} revenueIntelCohorts: LTV + funnel conversion`);
if (!cohortsOk) failed += 1;

const creditLanes = fs.readFileSync(path.join(root, 'src/components/partner/PartnerCreditLanesPanel.tsx'), 'utf8');
const creditLanesOk = creditLanes.includes('PartnerCreditLanesPanel') && fs.readFileSync(path.join(root, 'src/lib/tradelineMarketplaceHub.ts'), 'utf8').includes('getTradelineOsSnapshot');
console.log(`${creditLanesOk ? '✓' : '✗'} PartnerCreditLanesPanel: debt/funding/tradeline lanes`);
if (!creditLanesOk) failed += 1;

const noraApi = fs.readFileSync(path.join(root, 'src/lib/noraPartnerApiClient.ts'), 'utf8');
const noraApiOk = noraApi.includes('callNoraPartnerApi') && noraApi.includes('noraCaptureLead');
console.log(`${noraApiOk ? '✓' : '✗'} noraPartnerApiClient: partner API v2 client`);
if (!noraApiOk) failed += 1;

const calendarBook = fs.readFileSync(path.join(root, 'src/lib/calendarBookingEngine.ts'), 'utf8');
const calendarOk = calendarBook.includes('calendar_reminder') && calendarBook.includes('onConsultationScheduled');
console.log(`${calendarOk ? '✓' : '✗'} calendarBookingEngine: prep + join tasks`);
if (!calendarOk) failed += 1;

const kbRouter = fs.readFileSync(path.join(root, 'src/lib/knowledgeBaseRouter.ts'), 'utf8');
const kbRouterOk =
  kbRouter.includes('routeKnowledgeForPath') &&
  kbRouter.includes('free-tradeline-guide') &&
  kbRouter.includes('enlightenment-session');
console.log(`${kbRouterOk ? '✓' : '✗'} knowledgeBaseRouter: funnel + session context help`);
if (!kbRouterOk) failed += 1;

const contextHelp = fs.readFileSync(path.join(root, 'src/components/guide/FinelyContextHelpButton.tsx'), 'utf8');
const contextHelpOk = contextHelp.includes('FinelyContextHelpButton') && fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('FinelyContextHelpButton');
console.log(`${contextHelpOk ? '✓' : '✗'} FinelyContextHelpButton: wired in PageShell`);
if (!contextHelpOk) failed += 1;

const ownersLive = fs.readFileSync(path.join(root, 'src/lib/ownersGuideLiveSync.ts'), 'utf8');
const ownersLiveOk = ownersLive.includes('mergeOwnersGuideSections') && fs.readFileSync(path.join(root, 'src/components/guide/FinelyOwnersGuidePanel.tsx'), 'utf8').includes('ownersGuideLiveSync');
console.log(`${ownersLiveOk ? '✓' : '✗'} ownersGuideLiveSync: live patches merged`);
if (!ownersLiveOk) failed += 1;

const integrationHub = fs.readFileSync(path.join(root, 'src/pages/admin/AdminIntegrationHubPage.tsx'), 'utf8');
const integrationOk = integrationHub.includes('AdminIntegrationHubPage') && fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('/admin/integrations');
console.log(`${integrationOk ? '✓' : '✗'} AdminIntegrationHubPage: webhooks + API keys route`);
if (!integrationOk) failed += 1;

const pushBridge = fs.readFileSync(path.join(root, 'src/lib/pushNotificationBridge.ts'), 'utf8');
const pushOk = pushBridge.includes('wirePushNotificationBridge') && fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8').includes('pushNotificationBridge');
console.log(`${pushOk ? '✓' : '✗'} pushNotificationBridge: browser push wired`);
if (!pushOk) failed += 1;

const pdfGuard = fs.readFileSync(path.join(root, 'src/lib/complianceEngine.ts'), 'utf8');
const pdfGuardOk = pdfGuard.includes('guardPdfBodyText') && fs.readFileSync(path.join(root, 'src/resources/buildFreeGuidePdf.ts'), 'utf8').includes('guardPdfBodyText');
console.log(`${pdfGuardOk ? '✓' : '✗'} complianceEngine: PDF body guard`);
if (!pdfGuardOk) failed += 1;

const seoMeta = fs.readFileSync(path.join(root, 'src/hooks/usePublicSeoMeta.ts'), 'utf8');
const seoCatalog = fs.readFileSync(path.join(root, 'src/data/publicSeoCatalog.ts'), 'utf8');
const funnelShell = fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8');
const appSeo = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const seoOk =
  seoMeta.includes('usePublicSeoMeta') &&
  seoCatalog.includes('PUBLIC_SEO_PATHS') &&
  seoCatalog.includes('/faq') &&
  seoCatalog.includes('/testimonials') &&
  seoCatalog.includes('/events') &&
  seoCatalog.includes('/claim') &&
  funnelShell.includes('usePublicSeoMeta') &&
  appSeo.includes('usePublicSeoMeta') &&
  fs.readFileSync(path.join(root, 'src/pages/FaqPage.tsx'), 'utf8').includes('usePublicSeoMeta') &&
  fs.readFileSync(path.join(root, 'src/pages/ContactPage.tsx'), 'utf8').includes('usePublicSeoMeta') &&
  fs.readFileSync(path.join(root, 'src/pages/legal/TermsPage.tsx'), 'utf8').includes('usePublicSeoMeta') &&
  fs.readFileSync(path.join(root, 'src/pages/ClaimPartnerProfilePage.tsx'), 'utf8').includes('usePublicSeoMeta');
console.log(`${seoOk ? '✓' : '✗'} usePublicSeoMeta: full public marketing + legal JSON-LD`);
if (!seoOk) failed += 1;

const partnerRulePath = path.join(root, '.cursor/rules/partner-terminology.mdc');
const partnerRuleOk = fs.existsSync(partnerRulePath) && fs.readFileSync(partnerRulePath, 'utf8').includes('alwaysApply: true');
const partnerCopyOk =
  partnerRuleOk &&
  seoCatalog.includes('Partner success stories') &&
  !seoCatalog.includes('Client testimonials') &&
  funnelShell.includes('partners ·') &&
  appSeo.includes('What is a Finely partner?');
console.log(`${partnerCopyOk ? '✓' : '✗'} partner terminology: rules + public SEO + funnel trust lines`);
if (!partnerCopyOk) failed += 1;

const sitemapOk =
  fs.existsSync(path.join(root, 'public/sitemap.xml')) &&
  fs.existsSync(path.join(root, 'public/robots.txt')) &&
  fs.readFileSync(path.join(root, 'scripts/generate-public-sitemap.mjs'), 'utf8').includes('publicSeoCatalog');
console.log(`${sitemapOk ? '✓' : '✗'} public sitemap: robots.txt + generator`);
if (!sitemapOk) failed += 1;

const perfPanel = fs.readFileSync(path.join(root, 'src/features/admin/AdminPerformancePanel.tsx'), 'utf8');
const perfOk = perfPanel.includes('getEdgeCacheStats') && fs.readFileSync(path.join(root, 'src/lib/edgeAssetCache.ts'), 'utf8').includes('setCachedVoiceUrl');
console.log(`${perfOk ? '✓' : '✗'} AdminPerformancePanel: edge cache + PWA`);
if (!perfOk) failed += 1;

const billingSub = fs.readFileSync(path.join(root, 'src/lib/billingSubscriptionEngine.ts'), 'utf8');
const billingSubOk = billingSub.includes('buildBillingSubscriptionSnapshot') && billingSub.includes('processWinBackTick');
console.log(`${billingSubOk ? '✓' : '✗'} billingSubscriptionEngine: trial + dunning + win-back`);
if (!billingSubOk) failed += 1;

const kbSync = fs.readFileSync(path.join(root, 'src/lib/kbFeatureMapSync.ts'), 'utf8');
const kbSyncOk = kbSync.includes('getKnowledgeCorpus') && fs.readFileSync(path.join(root, 'src/data/platformFeatureMap.ts'), 'utf8').includes('PLATFORM_FEATURE_MAP');
console.log(`${kbSyncOk ? '✓' : '✗'} kbFeatureMapSync: dynamic KB from feature map`);
if (!kbSyncOk) failed += 1;

const voicePipe = fs.readFileSync(path.join(root, 'src/lib/voicePipelineVersion.ts'), 'utf8');
const voicePipeOk = voicePipe.includes('VOICE_PIPELINE_VERSION') && fs.readFileSync(path.join(root, 'src/lib/voiceStudioClient.ts'), 'utf8').includes('guardVoiceScript');
console.log(`${voicePipeOk ? '✓' : '✗'} voicePipelineVersion: compliance + cache invalidation`);
if (!voicePipeOk) failed += 1;

const deployPanel = fs.readFileSync(path.join(root, 'src/features/admin/AdminDeployStatusPanel.tsx'), 'utf8');
const deployOk = deployPanel.includes('AdminDeployStatusPanel') && fs.readFileSync(path.join(root, 'src/lib/deployEnvironment.ts'), 'utf8').includes('getDeployEnvironment');
console.log(`${deployOk ? '✓' : '✗'} AdminDeployStatusPanel: env + flags + cron`);
if (!deployOk) failed += 1;

const serverCron = fs.readFileSync(path.join(root, 'src/lib/serverPlatformCronClient.ts'), 'utf8');
const serverCronFn = fs.readFileSync(path.join(root, 'supabase/functions/platform-cron/index.ts'), 'utf8');
const serverCronOk =
  serverCron.includes('pingServerPlatformCron') &&
  serverCron.includes('socialDuePosts') &&
  serverCron.includes('loadSocialFromDb') &&
  serverCron.includes('runAutomationSweep') &&
  serverCronFn.includes("'platform-cron'") &&
  serverCronFn.includes('social_autopilot') &&
  serverCronFn.includes('social_publish') &&
  serverCronFn.includes('automation_sweep') &&
  serverCronFn.includes('loadDuePostsFromDb') &&
  serverCronFn.includes('social_scheduled_posts') &&
  serverCronFn.includes('invokeAutomationCronSweep') &&
  deployPanel.includes('Publish due (server)') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminAutomationsPage.tsx'), 'utf8').includes('runServerAutomationCronSweep') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminAutomationsPage.tsx'), 'utf8').includes('pingServerPlatformCron') &&
  fs.readFileSync(path.join(root, 'scripts/deploy-supabase-functions.mjs'), 'utf8').includes('platform-cron');
console.log(`${serverCronOk ? '✓' : '✗'} platform-cron: DB social + automation sweep`);
if (!serverCronOk) failed += 1;

const socialSupabaseSyncOk =
  fs.existsSync(path.join(root, 'supabase/migrations/20260617000000_social_scheduled_posts.sql')) &&
  fs.readFileSync(path.join(root, 'src/data/socialHubSupabaseSync.ts'), 'utf8').includes('ensureSocialHubSyncedOnce') &&
  fs.readFileSync(path.join(root, 'src/data/socialHubSupabaseSync.ts'), 'utf8').includes('social_scheduled_posts') &&
  fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8').includes('ensureSocialHubSyncedOnce');
console.log(`${socialSupabaseSyncOk ? '✓' : '✗'} Social Hub: Supabase post queue + boot sync (structure)`);
if (!socialSupabaseSyncOk) failed += 1;

const commandStrip = fs.readFileSync(path.join(root, 'src/features/os/FinelyOsPublicCommandStrip.tsx'), 'utf8');
const commandStripOk = commandStrip.includes('FUNNEL_TILES') && commandStrip.includes('/free-debt-guide');
console.log(`${commandStripOk ? '✓' : '✗'} FinelyOsPublicCommandStrip: debt/business/tradeline funnels`);
if (!commandStripOk) failed += 1;

const voiceHealth = fs.readFileSync(path.join(root, 'src/lib/voiceRenderHealth.ts'), 'utf8');
const voiceHealthOk = voiceHealth.includes('recordVoiceRenderAttempt') && fs.readFileSync(path.join(root, 'src/features/admin/AdminVoiceOpsPanel.tsx'), 'utf8').includes('AdminVoiceOpsPanel');
console.log(`${voiceHealthOk ? '✓' : '✗'} voiceRenderHealth: ops panel + render logging`);
if (!voiceHealthOk) failed += 1;

const mobileWork = fs.readFileSync(path.join(root, 'src/components/portal/PartnerMobileWorkBar.tsx'), 'utf8');
const mobileWorkOk = mobileWork.includes('PartnerMobileWorkBar') && fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('PartnerMobileWorkBar');
console.log(`${mobileWorkOk ? '✓' : '✗'} PartnerMobileWorkBar: mobile Work OS timers`);
if (!mobileWorkOk) failed += 1;

const billingAuto = fs.readFileSync(path.join(root, 'src/lib/automationEventMatcher.ts'), 'utf8');
const billingAutoOk = billingAuto.includes('win_back') && billingAuto.includes('billing_past_due') && fs.readFileSync(path.join(root, 'src/features/automation/automationRecipeLibrary.ts'), 'utf8').includes('recipe_trial_win_back');
console.log(`${billingAutoOk ? '✓' : '✗'} automation: billing dunning + win-back triggers`);
if (!billingAutoOk) failed += 1;

const billingComms = fs.readFileSync(path.join(root, 'src/data/commsBillingTemplatesSeed.ts'), 'utf8');
const billingCommsOk = billingComms.includes('billing_past_due') && billingComms.includes('trial_win_back');
console.log(`${billingCommsOk ? '✓' : '✗'} commsBillingTemplatesSeed: dunning + win-back email bodies`);
if (!billingCommsOk) failed += 1;

const eventComms = fs.readFileSync(path.join(root, 'src/lib/automationEventComms.ts'), 'utf8');
const eventCommsOk = eventComms.includes('runEventScopedCommsActions') && fs.readFileSync(path.join(root, 'src/lib/automationEventBridge.ts'), 'utf8').includes('automationEventComms');
console.log(`${eventCommsOk ? '✓' : '✗'} automationEventComms: event-scoped billing emails`);
if (!eventCommsOk) failed += 1;

const digest = fs.readFileSync(path.join(root, 'src/lib/notificationDigestEngine.ts'), 'utf8');
const digestCron = fs.readFileSync(path.join(root, 'src/lib/notificationDigestCron.ts'), 'utf8');
const digestComms = fs.readFileSync(path.join(root, 'src/lib/notificationDigestComms.ts'), 'utf8');
const platformCron = fs.readFileSync(path.join(root, 'src/lib/platformCron.ts'), 'utf8');
const digestOk =
  digest.includes('buildNotificationDigest') &&
  digestCron.includes('processNotificationDigestTick') &&
  digestComms.includes('sendPartnerDigestEmails') &&
  digestComms.includes('partner_daily_digest') &&
  platformCron.includes('partnerDigest') &&
  fs.readFileSync(path.join(root, 'src/lib/partnerDigestCron.ts'), 'utf8').includes('processPartnerDigestTick') &&
  fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8').includes('ensureDigestCommsTemplates');
console.log(`${digestOk ? '✓' : '✗'} notificationDigest: admin + partner email digests`);
if (!digestOk) failed += 1;

const recipeSeeder = fs.readFileSync(path.join(root, 'src/lib/automationRecipeSeeder.ts'), 'utf8');
const recipeSeederOk =
  recipeSeeder.includes('ensureCoreAutomationRecipesOnce') &&
  recipeSeeder.includes('recipe_funnel_nurture') &&
  recipeSeeder.includes('recipe_meta_lead_notify') &&
  fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8').includes('ensureCoreAutomationRecipesOnce');
console.log(`${recipeSeederOk ? '✓' : '✗'} automationRecipeSeeder: core event + billing recipes on boot`);
if (!recipeSeederOk) failed += 1;

const launchPanel = fs.readFileSync(path.join(root, 'src/features/admin/AdminLaunchChecklistPanel.tsx'), 'utf8');
const launchOk =
  launchPanel.includes('AdminLaunchChecklistPanel') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminMonitoringPage.tsx'), 'utf8').includes('AdminLaunchChecklistPanel') &&
  fs.readFileSync(path.join(root, 'scripts/productionLaunchOrchestrator.mjs'), 'utf8').includes('migrations:check');
console.log(`${launchOk ? '✓' : '✗'} launch checklist: admin panel + predeploy migrations`);
if (!launchOk) failed += 1;

const partnerSync = fs.readFileSync(path.join(root, 'src/data/partnersSupabaseSync.ts'), 'utf8');
const partnerSyncOk =
  partnerSync.includes('syncClaimedPartnerRecord') &&
  partnerSync.includes('upsertPartnerToSupabase') &&
  fs.readFileSync(path.join(root, 'src/portal/getOrCreatePartnerForSession.ts'), 'utf8').includes('syncClaimedPartnerRecord') &&
  fs.readFileSync(path.join(root, 'src/pages/ClaimPartnerProfilePage.tsx'), 'utf8').includes('syncClaimedPartnerRecord');
console.log(`${partnerSyncOk ? '✓' : '✗'} partnersSupabaseSync: claimed partner RLS sync wired`);
if (!partnerSyncOk) failed += 1;

const launchSnapshot = fs.readFileSync(path.join(root, 'src/lib/launchChecklistSnapshot.ts'), 'utf8');
const launchSnapshotOk =
  launchSnapshot.includes('server_cron') &&
  launchSnapshot.includes('predeploy') &&
  launchSnapshot.includes('marketing_compliance') &&
  launchSnapshot.includes('funnel_conversion') &&
  launchSnapshot.includes('staff_roster') &&
  launchSnapshot.includes('hands_free_ops') &&
  launchSnapshot.includes('role_os') &&
  launchSnapshot.includes('marketing_staff_chat');
console.log(`${launchSnapshotOk ? '✓' : '✗'} launchChecklistSnapshot: server cron + predeploy + Staff OS gates`);
if (!launchSnapshotOk) failed += 1;

const funnelConv = fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8');
const funnelConvOk =
  funnelConv.includes('FunnelExitIntentModal') &&
  funnelConv.includes('funnelTrustClientCount') &&
  funnelConv.includes('FunnelInlineSessionBook') &&
  funnelConv.includes('downloadScoreRoadmapPdf') &&
  funnelConv.includes('PublicInquiryBudgetCalculator') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/FunnelExitIntentModal.tsx'), 'utf8').includes('FunnelExitIntentModal') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/FunnelInlineSessionBook.tsx'), 'utf8').includes('createPublicAppointmentRequest') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/FunnelInlineSessionBook.tsx'), 'utf8').includes('funnel_session_booked');
  fs.readFileSync(path.join(root, 'src/resources/buildScoreRoadmapPdf.ts'), 'utf8').includes('drawGuideContentPages');
console.log(`${funnelConvOk ? '✓' : '✗'} leadMagnetFunnel: exit intent + inline booking + score roadmap + inquiry calc`);
if (!funnelConvOk) failed += 1;

const marketingUnsub = fs.readFileSync(path.join(root, 'src/lib/marketingUnsubscribe.ts'), 'utf8');
const marketingUnsubOk =
  marketingUnsub.includes('unsubscribeMarketingByEmail') &&
  fs.readFileSync(path.join(root, 'src/pages/UnsubscribePage.tsx'), 'utf8').includes('UnsubscribePage');
console.log(`${marketingUnsubOk ? '✓' : '✗'} marketingUnsubscribe: /unsubscribe route`);
if (!marketingUnsubOk) failed += 1;

const pubSessionPay = fs.readFileSync(path.join(root, 'src/lib/publicSessionCheckoutClient.ts'), 'utf8');
const pubSessionPayOk =
  pubSessionPay.includes('verifyPublicSessionCheckout') &&
  fs.readFileSync(path.join(root, 'supabase/functions/public-session-checkout/index.ts'), 'utf8').includes("action === 'verify'") &&
  fs.existsSync(path.join(root, 'supabase/functions/public-session-checkout/index.ts')) &&
  fs.readFileSync(path.join(root, 'src/pages/EnlightenmentSessionPage.tsx'), 'utf8').includes('verifyPublicSessionCheckout');
console.log(`${pubSessionPayOk ? '✓' : '✗'} publicSessionCheckout: paid enlightenment Stripe`);
if (!pubSessionPayOk) failed += 1;

const mainBoot = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
const mainBootOk =
  mainBoot.includes('ensureNurtureCommsTemplatesOnce') &&
  mainBoot.includes('ensureBillingCommsTemplates') &&
  mainBoot.includes('ensureDigestCommsTemplates') &&
  mainBoot.includes('ensureFunnelSessionCommsTemplates') &&
  mainBoot.includes('ensureStaffRosterSyncedOnce') &&
  fs.readFileSync(path.join(root, 'src/data/staffSupabaseSync.ts'), 'utf8').includes('syncStaffRosterToSupabase');
console.log(`${mainBootOk ? '✓' : '✗'} main.tsx: comms + automation + staff sync on boot`);
if (!mainBootOk) failed += 1;

const complaintAuto =
  fs.readFileSync(path.join(root, 'src/lib/intentClassifier.ts'), 'utf8').includes("'complaint'") &&
  fs.readFileSync(path.join(root, 'src/lib/automationEventMatcher.ts'), 'utf8').includes('complaint_detected') &&
  fs.readFileSync(path.join(root, 'src/features/automation/automationRecipeLibrary.ts'), 'utf8').includes('recipe_complaint_compliance');
console.log(`${complaintAuto ? '✓' : '✗'} complaint_detected: intent + recipe + matcher`);
if (!complaintAuto) failed += 1;

const staffRosterAdmin = fs.readFileSync(path.join(root, 'src/pages/admin/AdminAgentStaffPage.tsx'), 'utf8');
const staffRosterAdminOk = staffRosterAdmin.includes('updateStaffMemberShifts') && staffRosterAdmin.includes('ShiftDayPicker');
console.log(`${staffRosterAdminOk ? '✓' : '✗'} AdminAgentStaffPage: roster shift CRUD`);
if (!staffRosterAdminOk) failed += 1;

const commsUnsub = fs.readFileSync(path.join(root, 'src/lib/commsUnsubscribeFooter.ts'), 'utf8');
const commsUnsubOk =
  commsUnsub.includes('buildMarketingEmailFooter') &&
  fs.readFileSync(path.join(root, 'src/lib/nurtureStepCopy.ts'), 'utf8').includes('commsUnsubscribeFooter') &&
  fs.readFileSync(path.join(root, 'src/lib/funnelEmail.ts'), 'utf8').includes('funnelPublicLinks');
console.log(`${commsUnsubOk ? '✓' : '✗'} commsUnsubscribeFooter: nurture + welcome opt-out + funnel links`);
if (!commsUnsubOk) failed += 1;

const publicChatOk =
  fs.readFileSync(path.join(root, 'src/lib/publicChatEvents.ts'), 'utf8').includes('OPEN_PUBLIC_CHAT_EVENT') &&
  fs.readFileSync(path.join(root, 'src/components/chat/PublicChatWidget.tsx'), 'utf8').includes('OPEN_PUBLIC_CHAT_EVENT') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8').includes('openPublicChat') &&
  fs.readFileSync(path.join(root, 'src/components/chat/publicChatPersonaUi.ts'), 'utf8').includes('getPublicChatPersonaPresentation') &&
  fs.readFileSync(path.join(root, 'src/lib/publicChatStaffVoice.ts'), 'utf8').includes('playStaffReplyAudio');
console.log(`${publicChatOk ? '✓' : '✗'} publicChatEvents: funnel success opens persona chat + staff UI`);
if (!publicChatOk) failed += 1;

const funnelSessionAuto =
  fs.readFileSync(path.join(root, 'src/features/automation/automationRecipeLibrary.ts'), 'utf8').includes('recipe_funnel_session_closer') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/FunnelInlineSessionBook.tsx'), 'utf8').includes("kind: 'funnel_session_booked'") &&
  fs.readFileSync(path.join(root, 'src/lib/automationRecipeSeeder.ts'), 'utf8').includes('recipe_funnel_session_closer');
console.log(`${funnelSessionAuto ? '✓' : '✗'} funnel_session_booked: inline book → automation recipe`);
if (!funnelSessionAuto) failed += 1;

const courseVoiceCatalog =
  fs.readFileSync(path.join(root, 'src/lib/courseVoiceCatalog.ts'), 'utf8').includes('resolveCourseLessonVoiceContentId') &&
  fs.readFileSync(path.join(root, 'src/lib/courseVoiceNarrate.ts'), 'utf8').includes("contentType: 'course_lesson'") &&
  fs.readFileSync(path.join(root, 'src/components/courses/CourseLessonAudioPlayer.tsx'), 'utf8').includes('contentType="course_lesson"') &&
  fs.readFileSync(path.join(root, 'src/resources/voiceProfiles.ts'), 'utf8').includes("'course_lesson'");
console.log(`${courseVoiceCatalog ? '✓' : '✗'} courseVoiceCatalog: stable intro IDs + course_lesson type`);
if (!courseVoiceCatalog) failed += 1;

const funnelSessionEmail =
  fs.readFileSync(path.join(root, 'src/lib/funnelSessionEmail.ts'), 'utf8').includes('sendFunnelSessionConfirmationFromEvent') &&
  fs.readFileSync(path.join(root, 'src/lib/automationEventBridge.ts'), 'utf8').includes('sendFunnelSessionConfirmationFromEvent') &&
  fs.readFileSync(path.join(root, 'src/data/commsFunnelSessionSeed.ts'), 'utf8').includes('funnel_session_confirmation');
console.log(`${funnelSessionEmail ? '✓' : '✗'} funnelSessionEmail: booked → confirmation email spine`);
if (!funnelSessionEmail) failed += 1;

const adminCalPay = fs.readFileSync(path.join(root, 'src/pages/admin/AdminCalendarPage.tsx'), 'utf8');
const adminCalPayOk = adminCalPay.includes('paymentStatus') && adminCalPay.includes('waivePublicSessionPayment');
console.log(`${adminCalPayOk ? '✓' : '✗'} AdminCalendarPage: public session payment gates`);
if (!adminCalPayOk) failed += 1;

const stripeWebhookPubOk = fs.readFileSync(path.join(root, 'supabase/functions/stripe-webhook/index.ts'), 'utf8').includes('public_session_paid');
console.log(`${stripeWebhookPubOk ? '✓' : '✗'} stripe-webhook: public session payment log`);
if (!stripeWebhookPubOk) failed += 1;

const legalFooter = fs.readFileSync(path.join(root, 'src/components/legal/PublicLegalFooter.tsx'), 'utf8');
const legalFooterOk =
  legalFooter.includes('PublicLegalFooter') &&
  legalFooter.includes('/unsubscribe') &&
  fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('PublicLegalFooter') &&
  fs.readFileSync(path.join(root, 'src/components/landing/index.tsx'), 'utf8').includes("onNavigate('unsubscribe')");
console.log(`${legalFooterOk ? '✓' : '✗'} PublicLegalFooter: PageShell + landing footer`);
if (!legalFooterOk) failed += 1;

const seoUnsubOk = seoCatalog.includes('/unsubscribe') && seoCatalog.includes('sitemap: false');
console.log(`${seoUnsubOk ? '✓' : '✗'} publicSeoCatalog: unsubscribe tracked, excluded from sitemap`);
if (!seoUnsubOk) failed += 1;

const voiceCatalogCheck = spawnSync('npm', ['run', 'voice:catalog:check'], { cwd: root, shell: true, stdio: 'pipe', encoding: 'utf8' });
const voiceCatalogOk = voiceCatalogCheck.status === 0;
console.log(`${voiceCatalogOk ? '✓' : '✗'} voice-prerender-catalog: all guides + ebooks indexed`);
if (!voiceCatalogOk) {
  if (voiceCatalogCheck.stdout) console.log(voiceCatalogCheck.stdout.trim());
  failed += 1;
}

const hubPersonaOk =
  fs.readFileSync(path.join(root, 'src/components/chat/HubAiCoachPanel.tsx'), 'utf8').includes('listPortalStaffForLane') &&
  fs.readFileSync(path.join(root, 'src/components/chat/HubAiCoachPanel.tsx'), 'utf8').includes('resolveStaffOnDuty');
console.log(`${hubPersonaOk ? '✓' : '✗'} HubAiCoachPanel: roster-driven staff tabs + handoff`);
if (!hubPersonaOk) failed += 1;

const laneBootstrapOk =
  fs.readFileSync(path.join(root, 'src/lib/funnelLaneBootstrap.ts'), 'utf8').includes('bootstrapLaneProjectForPartner') &&
  fs.readFileSync(path.join(root, 'src/portal/getOrCreatePartnerForSession.ts'), 'utf8').includes('bootstrapLaneProjectForPartner') &&
  fs.readFileSync(path.join(root, 'src/lib/debtLaneBootstrap.ts'), 'utf8').includes('onDebtLaneBootstrap');
console.log(`${laneBootstrapOk ? '✓' : '✗'} funnelLaneBootstrap: debt/business lane projects on partner signup`);
if (!laneBootstrapOk) failed += 1;

const sessionPrefillOk =
  fs.readFileSync(path.join(root, 'src/pages/EnlightenmentSessionPage.tsx'), 'utf8').includes("searchParams.get('email')") &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8').includes('bookingUrl');
console.log(`${sessionPrefillOk ? '✓' : '✗'} enlightenment session: funnel URL prefill + booking link params`);
if (!sessionPrefillOk) failed += 1;

const bookstoreRichOk =
  fs.readFileSync(path.join(root, 'src/data/bookstoreRichContent.ts'), 'utf8').includes('Part VI') &&
  fs.readFileSync(path.join(root, 'src/lib/bookstoreVoiceNarrate.ts'), 'utf8').includes('narrateBookstoreProduct');
console.log(`${bookstoreRichOk ? '✓' : '✗'} bookstoreRichContent: expanded ebooks + narration bridge`);
if (!bookstoreRichOk) failed += 1;

const errorOps = fs.readFileSync(path.join(root, 'src/lib/errorReportingBridge.ts'), 'utf8');
const errorOpsOk = errorOps.includes('wireErrorReportingBridge') && fs.readFileSync(path.join(root, 'src/features/admin/AdminErrorOpsPanel.tsx'), 'utf8').includes('AdminErrorOpsPanel');
console.log(`${errorOpsOk ? '✓' : '✗'} errorReportingBridge: client error ops panel`);
if (!errorOpsOk) failed += 1;

const bulkImport = fs.readFileSync(path.join(root, 'src/lib/leadsBulkImport.ts'), 'utf8');
const bulkOk = bulkImport.includes('parseLeadsCsv') && bulkImport.includes('bulkImportLeads');
console.log(`${bulkOk ? '✓' : '✗'} leadsBulkImport: CSV parse + pipeline import`);
if (!bulkOk) failed += 1;

const scoring = fs.readFileSync(path.join(root, 'src/lib/leadScoring.ts'), 'utf8');
const scoringOk = scoring.includes('Meta Lead Ad');
console.log(`${scoringOk ? '✓' : '✗'} leadScoring: Meta lead signal`);
if (!scoringOk) failed += 1;

const handoff = fs.readFileSync(path.join(root, 'src/lib/agentHandoffBridge.ts'), 'utf8');
const handoffOk = handoff.includes('saveAgentHandoff') && handoff.includes('consumeAgentHandoff') && handoff.includes('peekAgentHandoff');
console.log(`${handoffOk ? '✓' : '✗'} agentHandoffBridge: public → portal handoff + peek`);
if (!handoffOk) failed += 1;

const audioProgress = fs.readFileSync(path.join(root, 'src/lib/audioProgressRepo.ts'), 'utf8');
const audioProgressOk = audioProgress.includes('saveAudioProgress') && audioProgress.includes('getAudioProgress');
console.log(`${audioProgressOk ? '✓' : '✗'} audioProgressRepo: listen progress memory`);
if (!audioProgressOk) failed += 1;

const recipeLib = fs.readFileSync(path.join(root, 'src/features/automation/automationRecipeLibrary.ts'), 'utf8');
const recipeOk =
  recipeLib.includes('AUTOMATION_EVENT_RECIPES') &&
  recipeLib.includes('recipe_meta_lead_notify') &&
  recipeLib.includes('recipe_billing_dunning') &&
  recipeLib.includes('recipe_trial_win_back') &&
  recipeLib.includes('recipe_report_upload_auto_draft');
console.log(`${recipeOk ? '✓' : '✗'} automationRecipeLibrary: billing + event + auto-draft recipes`);
if (!recipeOk) failed += 1;

const staffRoster = fs.readFileSync(path.join(root, 'src/data/staffRoster.ts'), 'utf8');
const staffSeedCount = (staffRoster.match(/\bm\('staff-/g) || []).length;
const staffOk =
  staffRoster.includes('STAFF_ROSTER_SEED') &&
  staffRoster.includes('resolveStaffOnDuty') &&
  staffRoster.includes('listPortalStaffForLane') &&
  staffSeedCount >= 36;
console.log(`${staffOk ? '✓' : '✗'} staffRoster: ${staffSeedCount} seed members + on-duty + portal lane filter`);
if (!staffOk) failed += 1;

const factualReasons = fs.readFileSync(path.join(root, 'src/creditReports/disputeFactualReasons.ts'), 'utf8');
const factualOk = factualReasons.includes('isProceduralDisputeReason') && factualReasons.includes('buildFactualNegativeSummary');
console.log(`${factualOk ? '✓' : '✗'} disputeFactualReasons: procedural filter + factual summary`);
if (!factualOk) failed += 1;

const reportsRepo = fs.readFileSync(path.join(root, 'src/data/reportsRepo.ts'), 'utf8');
const reportEventOk = reportsRepo.includes('report_uploaded');
console.log(`${reportEventOk ? '✓' : '✗'} reportsRepo: report_uploaded platform event`);
if (!reportEventOk) failed += 1;

const funnelConfig = fs.readFileSync(path.join(root, 'src/domain/leadMagnetFunnels.ts'), 'utf8');
const funnelOk =
  funnelConfig.includes('AFFILIATE_FUNNEL') &&
  funnelConfig.includes('AGENCY_FUNNEL') &&
  funnelConfig.includes('SPECIALIST_APPLY_FUNNEL') &&
  funnelConfig.includes('SCORE_ROADMAP_FUNNEL');
console.log(`${funnelOk ? '✓' : '✗'} leadMagnetFunnels: 8 funnel configs`);
if (!funnelOk) failed += 1;

const funnelRepo = fs.readFileSync(path.join(root, 'src/data/leadMagnetFunnelsRepo.ts'), 'utf8');
const funnelRepoOk = funnelRepo.includes('resolveLeadMagnetConfig') && funnelRepo.includes('saveFunnelOverride');
console.log(`${funnelRepoOk ? '✓' : '✗'} leadMagnetFunnelsRepo: admin overrides without deploy`);
if (!funnelRepoOk) failed += 1;

const freeGuidePage = fs.readFileSync(path.join(root, 'src/pages/leadmagnet/FreeGuideFunnelPage.tsx'), 'utf8');
const freeGuideOk = freeGuidePage.includes('LeadMagnetFunnelShell') && freeGuidePage.includes('variant="premium"');
console.log(`${freeGuideOk ? '✓' : '✗'} FreeGuideFunnelPage: unified premium shell wrapper`);
if (!freeGuideOk) failed += 1;

const adminFunnelEditor = fs.readFileSync(path.join(root, 'src/pages/admin/AdminLeadMagnetFunnelsPage.tsx'), 'utf8');
const adminFunnelOk = adminFunnelEditor.includes('saveFunnelOverride') && adminFunnelEditor.includes('LEAD_MAGNET_FUNNELS');
console.log(`${adminFunnelOk ? '✓' : '✗'} AdminLeadMagnetFunnelsPage: funnel editor`);
if (!adminFunnelOk) failed += 1;

const agentPersonas = fs.readFileSync(path.join(root, 'src/domain/agentPersonas.ts'), 'utf8');
const expandedRolesOk =
  agentPersonas.includes('processing_agent') &&
  agentPersonas.includes('evidence_specialist') &&
  agentPersonas.includes('crm_intake_specialist') &&
  agentPersonas.includes('underwriting_analyst');
console.log(`${expandedRolesOk ? '✓' : '✗'} agentPersonas: expanded Staff OS role IDs`);
if (!expandedRolesOk) failed += 1;

const staffCoverageOk = staffRoster.includes('listRoleCoverageGaps') && staffRoster.includes('listStaffOnDutyNow');
console.log(`${staffCoverageOk ? '✓' : '✗'} staffRoster: on-duty KPI helpers`);
if (!staffCoverageOk) failed += 1;

const staffVoice = fs.readFileSync(path.join(root, 'src/lib/publicChatStaffVoice.ts'), 'utf8');
const staffVoiceOk = staffVoice.includes('staffMemberId') && staffVoice.includes('getStaffMemberById');
console.log(`${staffVoiceOk ? '✓' : '✗'} publicChatStaffVoice: roster member voice mapping`);
if (!staffVoiceOk) failed += 1;

const letterStudio = fs.readFileSync(path.join(root, 'src/components/letters/LettersCommandCenter.tsx'), 'utf8');
const letterStudioEmbeddedOk =
  letterStudio.includes('layout === \'embedded\'') && letterStudio.includes('setWorkspaceBureau(b)');
console.log(`${letterStudioEmbeddedOk ? '✓' : '✗'} LettersCommandCenter: embedded bureau focus tabs`);
if (!letterStudioEmbeddedOk) failed += 1;

const appRoutes = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const routeConsolidationOk =
  appRoutes.includes('BlogCanonicalRedirect') &&
  appRoutes.includes("params.set('from', 'blog')") &&
  appRoutes.includes('ConsultationCanonicalRedirect') &&
  appRoutes.includes('/admin/inbox') &&
  appRoutes.includes('/enlightenment-session');
console.log(`${routeConsolidationOk ? '✓' : '✗'} App.tsx: blog + consultation canonical redirects`);
if (!routeConsolidationOk) failed += 1;

const resourcesPage = fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8');
const resourcesBlogOk =
  resourcesPage.includes('findFreeGuideBySlugOrIdEffective') &&
  resourcesPage.includes("searchParams.get('from') === 'blog'") &&
  resourcesPage.includes('FinelyOsPaginatedStack');
console.log(`${resourcesBlogOk ? '✓' : '✗'} ResourcesPage: blog slug landing + paginated guides`);
if (!resourcesBlogOk) failed += 1;

const portalNav = fs.readFileSync(path.join(root, 'src/components/portal/PartnerPortalNav.tsx'), 'utf8');
const portalLettersNavOk =
  portalNav.includes('Dispute letters') &&
  portalNav.includes('/portal/letters') &&
  portalNav.includes('LETTER_FLOW_LINKS') &&
  portalNav.includes('isNavLocked');
console.log(`${portalLettersNavOk ? '✓' : '✗'} PartnerPortalNav: dispute letters + sub-tabs + entitlement lock`);
if (!portalLettersNavOk) failed += 1;

const lettersVault = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLettersVaultPage.tsx'), 'utf8');
const disputesPage = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDisputesPage.tsx'), 'utf8');
const creditIntelTabs = fs.readFileSync(path.join(root, 'src/components/creditIntel/CreditIntelTabs.tsx'), 'utf8');
const longListOk =
  lettersVault.includes('FinelyOsPaginatedStack') &&
  !lettersVault.includes('LETTERS_LIMIT') &&
  disputesPage.includes('FinelyOsPaginatedStack') &&
  !disputesPage.includes('limitByBureau') &&
  creditIntelTabs.includes('INTEL_CATALOG_PAGE_SIZE') &&
  !creditIntelTabs.includes('9999');
console.log(`${longListOk ? '✓' : '✗'} Long-list catalog: vault + disputes + credit intel paginated`);
if (!longListOk) failed += 1;

const envExampleOk = fs.existsSync(path.join(root, '.env.example')) && fs.existsSync(path.join(root, 'README.md'));
const claimProfileOk = fs.existsSync(path.join(root, 'supabase/functions/claim-profile/index.ts'));
const ciWorkflowOk = fs.existsSync(path.join(root, '.github/workflows/ci.yml'));
const launchInfraOk = envExampleOk && claimProfileOk && ciWorkflowOk;
console.log(`${launchInfraOk ? '✓' : '✗'} Launch infra: .env.example + README + claim-profile + CI workflow`);
if (!launchInfraOk) failed += 1;

const portalTasksRedirectOk = appRoutes.includes("path=\"/portal/tasks\"") && appRoutes.includes('/portal/my-tasks');
console.log(`${portalTasksRedirectOk ? '✓' : '✗'} App.tsx: /portal/tasks canonical redirect`);
if (!portalTasksRedirectOk) failed += 1;

const sovereignOnboard = fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8');
const onboardCheckoutOk = sovereignOnboard.includes('personal_build_starter') && sovereignOnboard.includes('railQs');
console.log(`${onboardCheckoutOk ? '✓' : '✗'} SovereignPortal: build goal → checkout package + rail`);
if (!onboardCheckoutOk) failed += 1;

const ownersGuide = fs.readFileSync(path.join(root, 'src/components/guide/FinelyOwnersGuidePanel.tsx'), 'utf8');
const ownersGuideNavOk = ownersGuide.includes('Guide sections') && ownersGuide.includes('sticky top-0');
console.log(`${ownersGuideNavOk ? '✓' : '✗'} FinelyOwnersGuidePanel: sticky section nav`);
if (!ownersGuideNavOk) failed += 1;

const intentCls = fs.readFileSync(path.join(root, 'src/lib/intentClassifier.ts'), 'utf8');
const intentProcessingOk = intentCls.includes('processing_agent') && intentCls.includes("'processing'");
console.log(`${intentProcessingOk ? '✓' : '✗'} intentClassifier: report upload → processing agent`);
if (!intentProcessingOk) failed += 1;

const eventBridge = fs.readFileSync(path.join(root, 'src/lib/automationEventBridge.ts'), 'utf8');
const eventBridgeOk =
  eventBridge.includes('dispatchAutomationRunner') &&
  eventBridge.includes('automationEventOps') &&
  fs.readFileSync(path.join(root, 'src/lib/automationEventOps.ts'), 'utf8').includes('runEventScopedOpsActions');
console.log(`${eventBridgeOk ? '✓' : '✗'} automationEventBridge: live ops + server dispatch`);
if (!eventBridgeOk) failed += 1;

const deployFns = fs.readFileSync(path.join(root, 'scripts/deploy-supabase-functions.mjs'), 'utf8');
const deployAutoOk = deployFns.includes("'automation-runner'");
console.log(`${deployAutoOk ? '✓' : '✗'} deploy:functions includes automation-runner`);
if (!deployAutoOk) failed += 1;

const workComplete = fs.readFileSync(path.join(root, 'src/lib/workTaskComplete.ts'), 'utf8');
const workCompleteOk = workComplete.includes('completeTaskWithResult') && workComplete.includes('needsResultToComplete');
console.log(`${workCompleteOk ? '✓' : '✗'} workTaskComplete: result gate + project KPI sync`);
if (!workCompleteOk) failed += 1;

const courseAgent = fs.readFileSync(path.join(root, 'src/lib/courseLessonAgent.ts'), 'utf8');
const courseAgentOk = courseAgent.includes('runCourseLessonAgent') && courseAgent.includes('course_lesson_agent_run');
console.log(`${courseAgentOk ? '✓' : '✗'} courseLessonAgent: narrate + checklist tasks`);
if (!courseAgentOk) failed += 1;

const nurtureEngine = fs.readFileSync(path.join(root, 'src/lib/nurtureEngine.ts'), 'utf8');
const nurturePersistOk = nurtureEngine.includes('finely.nurtureEnrollments.v1') && nurtureEngine.includes('saveStore');
console.log(`${nurturePersistOk ? '✓' : '✗'} nurtureEngine: persisted enrollments`);
if (!nurturePersistOk) failed += 1;

const nurtureSeq = fs.readFileSync(path.join(root, 'src/domain/nurtureSequences.ts'), 'utf8');
const nurtureOk =
  nurtureSeq.includes('seq_meta_lead') &&
  nurtureSeq.includes('seq_tradeline_funnel') &&
  nurtureSeq.includes('seq_score_roadmap_funnel') &&
  nurtureSeq.includes('seq_affiliate_funnel');
console.log(`${nurtureOk ? '✓' : '✗'} nurtureSequences: 8 funnel sequences`);
if (!nurtureOk) failed += 1;

const nurtureCopy = fs.readFileSync(path.join(root, 'src/lib/nurtureStepCopy.ts'), 'utf8');
const nurtureCopyOk = nurtureCopy.includes('buildNurtureStepEmail') && nurtureCopy.includes('lead_magnet_welcome_meta');
console.log(`${nurtureCopyOk ? '✓' : '✗'} nurtureStepCopy: funnel email bodies`);
if (!nurtureCopyOk) failed += 1;

const autoRunner = fs.readFileSync(path.join(root, 'supabase/functions/automation-runner/index.ts'), 'utf8');
const autoRunnerOk =
  autoRunner.includes('list_hooks') &&
  autoRunner.includes('hook_meta_lead') &&
  autoRunner.includes('cron_sweep') &&
  autoRunner.includes('lead_captures');
console.log(`${autoRunnerOk ? '✓' : '✗'} automation-runner: server hooks + cron_sweep lead scan`);
if (!autoRunnerOk) failed += 1;

const staffOsDoc = fs.existsSync(path.join(root, 'docs/STAFF_OS.md'));
const staffOsDocOk = staffOsDoc && fs.readFileSync(path.join(root, 'docs/STAFF_OS.md'), 'utf8').includes('ops-autopilot');
console.log(`${staffOsDocOk ? '✓' : '✗'} docs/STAFF_OS.md: Staff OS runbook`);
if (!staffOsDocOk) failed += 1;

const staffPortraitMorgan = path.join(root, 'public/staff-portraits/staff-morgan-hale.jpg');
const staffPortraitOk =
  fs.existsSync(staffPortraitMorgan) &&
  fs.readFileSync(path.join(root, 'src/data/staffPortraitCatalog.ts'), 'utf8').includes('STAFF_PORTRAIT_CATALOG') &&
  fs.readFileSync(path.join(root, 'src/lib/staffPortrait.ts'), 'utf8').includes('staff-portrait-photo');
console.log(`${staffPortraitOk ? '✓' : '✗'} Staff portraits: real photo JPGs + touch-up pipeline`);
if (!staffPortraitOk) failed += 1;

const parsedViewer = fs.readFileSync(path.join(root, 'src/components/reports/ParsedReportViewer.tsx'), 'utf8');
const parseQualityOk = parsedViewer.includes('parseQualityNote') && parsedViewer.includes('FINELY_OS_NOTICE_WARN');
console.log(`${parseQualityOk ? '✓' : '✗'} ParsedReportViewer: partial parse quality banner`);
if (!parseQualityOk) failed += 1;

const personalCredit = fs.readFileSync(path.join(root, 'src/pages/PersonalCreditPage.tsx'), 'utf8');
const personalCreditStaffOk = personalCredit.includes('StaffPortraitImg') && personalCredit.includes('resolveStaffOnDuty');
console.log(`${personalCreditStaffOk ? '✓' : '✗'} PersonalCreditPage: on-duty specialist portrait strip`);
if (!personalCreditStaffOk) failed += 1;

const pricingService = fs.readFileSync(path.join(root, 'src/pages/PricingServicePage.tsx'), 'utf8');
const pricingSeoOk = pricingService.includes('usePublicSeoMeta');
console.log(`${pricingSeoOk ? '✓' : '✗'} PricingServicePage: public SEO meta`);
if (!pricingSeoOk) failed += 1;

const welcomeEditor = fs.readFileSync(path.join(root, 'src/components/comms/WelcomeExperienceEditor.tsx'), 'utf8');
const welcomeSanitizeOk = welcomeEditor.includes('sanitizeHtmlForPreview');
console.log(`${welcomeSanitizeOk ? '✓' : '✗'} WelcomeExperienceEditor: sanitized HTML preview`);
if (!welcomeSanitizeOk) failed += 1;

const roleWorkflowPanel = fs.readFileSync(path.join(root, 'src/components/workflow/RoleWorkflowPanel.tsx'), 'utf8');
const roleWorkflowOk =
  roleWorkflowPanel.includes('Role OS 2.0') &&
  roleWorkflowPanel.includes('finelyOsGlassShell') &&
  fs.readFileSync(path.join(root, 'src/config/roleWorkflows.ts'), 'utf8').includes("business:");
console.log(`${roleWorkflowOk ? '✓' : '✗'} Role OS 2.0: workflow panel + business journey`);
if (!roleWorkflowOk) failed += 1;

const rolePreview = fs.readFileSync(path.join(root, 'src/pages/admin/AdminRolePreviewPage.tsx'), 'utf8');
const rolePreviewOk = rolePreview.includes('RoleWorkflowPanel') && rolePreview.includes('au_buyer');
console.log(`${rolePreviewOk ? '✓' : '✗'} AdminRolePreviewPage: workflow panel + AU buyer tab`);
if (!rolePreviewOk) failed += 1;

const auMarketplace = fs.readFileSync(path.join(root, 'src/pages/au/AuMarketplacePage.tsx'), 'utf8');
const auBuyerOsOk = auMarketplace.includes('AuBuyerCommandStrip') && auMarketplace.includes('au_buyer');
console.log(`${auBuyerOsOk ? '✓' : '✗'} AuMarketplacePage: buyer command strip + workflow`);
if (!auBuyerOsOk) failed += 1;

const roleProgress = fs.readFileSync(path.join(root, 'src/lib/roleWorkflowProgress.ts'), 'utf8');
const roleProgressOk =
  roleProgress.includes('computeRoleWorkflowProgress') &&
  roleProgress.includes('demoRoleWorkflowProgress') &&
  roleProgress.includes("roleId === 'agent'") &&
  roleProgress.includes("roleId === 'affiliate'") &&
  roleProgress.includes("roleId === 'au_seller'") &&
  fs.readFileSync(path.join(root, 'src/pages/agent/AgentHubPage.tsx'), 'utf8').includes('completedSteps={agentWorkflowProgress}') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminRolePreviewPage.tsx'), 'utf8').includes('workflowDemoProgress') &&
  fs.readFileSync(path.join(root, 'src/components/workflow/RoleWorkflowPanel.tsx'), 'utf8').includes('completedSteps');
console.log(`${roleProgressOk ? '✓' : '✗'} Role OS: workflow progress + step completion UI`);
if (!roleProgressOk) failed += 1;

const personalCreditChat = fs.readFileSync(path.join(root, 'src/pages/PersonalCreditPage.tsx'), 'utf8');
const marketingStrip = fs.readFileSync(path.join(root, 'src/components/marketing/MarketingStaffChatStrip.tsx'), 'utf8');
const marketingChatOk =
  marketingStrip.includes('MarketingStaffChatStrip') &&
  marketingStrip.includes('openPublicChat') &&
  personalCreditChat.includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/BookstorePage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/AgentsPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/AffiliatePage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/ContactPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/FaqPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/agency/AgencySignupPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('goal="not_sure"') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingServicePage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/ClaimPartnerProfilePage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/legal/TermsPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/TestimonialsPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/EventsPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/EnlightenmentSessionPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/NotFoundPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/au/AuMarketplacePage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/legal/DisclaimerPage.tsx'), 'utf8').includes('MarketingStaffChatStrip') &&
  fs.readFileSync(path.join(root, 'src/pages/legal/PrivacyPage.tsx'), 'utf8').includes('MarketingStaffChatStrip');
console.log(`${marketingChatOk ? '✓' : '✗'} Marketing pages: on-duty staff chat CTAs`);
if (!marketingChatOk) failed += 1;

const aboutOsOk =
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('About Finely Cred') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('MarketingStaffChatStrip');
console.log(`${aboutOsOk ? '✓' : '✗'} About route: catalog cards + staff chat strip`);
if (!aboutOsOk) failed += 1;

const adminSocialOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8');
const adminSocialOsOk =
  adminSocialOs.includes('finelyOsListItem') &&
  (adminSocialOs.includes('FINELY_OS_GLASS_INNER') || adminSocialOs.includes('finelyOsCatalogCard'));
console.log(`${adminSocialOsOk ? '✓' : '✗'} AdminSocialHubPage: SOP + inbox light OS`);
if (!adminSocialOsOk) failed += 1;

const adminMonitoringOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminMonitoringPage.tsx'), 'utf8');
const adminMonitoringOsOk = hasLightOsChrome(adminMonitoringOs);
console.log(`${adminMonitoringOsOk ? '✓' : '✗'} AdminMonitoringPage: event stream light OS borders`);
if (!adminMonitoringOsOk) failed += 1;

const adminLeadsOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminLeadsOsPage.tsx'), 'utf8');
const adminLeadsOsOk = adminLeadsOs.includes('finelyOsInlineListItem');
console.log(`${adminLeadsOsOk ? '✓' : '✗'} AdminLeadsOsPage: social tab list light OS`);
if (!adminLeadsOsOk) failed += 1;

const adminSettingsOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminSettingsPage.tsx'), 'utf8');
const adminSettingsOsOk = adminSettingsOs.includes('border-white/[0.08]');
console.log(`${adminSettingsOsOk ? '✓' : '✗'} AdminSettingsPage: feature matrix light OS borders`);
if (!adminSettingsOsOk) failed += 1;

const adminSupportInboxOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminSupportInboxPage.tsx'), 'utf8');
const adminSupportInboxOsOk =
  adminSupportInboxOs.includes('FINELY_OS_VIEW_TABS') && hasLightOsChrome(adminSupportInboxOs);
console.log(`${adminSupportInboxOsOk ? '✓' : '✗'} AdminSupportInboxPage: source tabs + message media light OS`);
if (!adminSupportInboxOsOk) failed += 1;

const adminIntegrationOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminIntegrationHubPage.tsx'), 'utf8');
const adminIntegrationOsOk = adminIntegrationOs.includes('finelyOsInlineListItem');
console.log(`${adminIntegrationOsOk ? '✓' : '✗'} AdminIntegrationHubPage: inbound + API key list light OS`);
if (!adminIntegrationOsOk) failed += 1;

const adminHandsFreeOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminHandsFreeOpsPage.tsx'), 'utf8');
const adminHandsFreeOsOk = adminHandsFreeOs.includes('finelyOsInlineListItem') && adminHandsFreeOs.includes('finelyOsViewTab');
console.log(`${adminHandsFreeOsOk ? '✓' : '✗'} AdminHandsFreeOpsPage: autopilot queue light OS`);
if (!adminHandsFreeOsOk) failed += 1;

const adminFunnelOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminFunnelExperimentsPage.tsx'), 'utf8');
const adminFunnelOsOk = adminFunnelOs.includes('finelyOsListItem');
console.log(`${adminFunnelOsOk ? '✓' : '✗'} AdminFunnelExperimentsPage: experiment picker light OS`);
if (!adminFunnelOsOk) failed += 1;

const resourcesOs = fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8');
const resourcesOsOk = resourcesOs.includes('border-white/[0.08]') && resourcesOs.includes('FinelyOsPageFooter');
console.log(`${resourcesOsOk ? '✓' : '✗'} ResourcesPage: modal light OS + footer`);
if (!resourcesOsOk) failed += 1;

const adminStaffOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminAgentStaffPage.tsx'), 'utf8');
const adminStaffOsOk =
  adminStaffOs.includes('finelyOsInlineListItem') &&
  adminStaffOs.includes('FINELY_OS_ENTITY_CHIP') &&
  adminStaffOs.includes('finelyOsViewTab') &&
  adminStaffOs.includes('FinelyOsOverviewStatTile');
console.log(`${adminStaffOsOk ? '✓' : '✗'} AdminAgentStaffPage: roster light OS tokens`);
if (!adminStaffOsOk) failed += 1;

const adminVoiceOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminVoiceStudioPage.tsx'), 'utf8');
const adminVoiceOsOk =
  adminVoiceOs.includes('FINELY_OS_ENTITY_PANEL_INNER') || adminVoiceOs.includes('finelyOsCatalogCard');
console.log(`${adminVoiceOsOk ? '✓' : '✗'} AdminVoiceStudioPage: clone + Nora panels light OS`);
if (!adminVoiceOsOk) failed += 1;

const adminMediaOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminMediaStudioPage.tsx'), 'utf8');
const adminMediaOsOk = adminMediaOs.includes('border-white/[0.08]') && !adminMediaOs.includes('border-white/10');
console.log(`${adminMediaOsOk ? '✓' : '✗'} AdminMediaStudioPage: preview image light OS borders`);
if (!adminMediaOsOk) failed += 1;

const adminProductsOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminProductsPage.tsx'), 'utf8');
const adminProductsOsOk = adminProductsOs.includes('border-white/[0.08]');
console.log(`${adminProductsOsOk ? '✓' : '✗'} AdminProductsPage: catalog table light OS borders`);
if (!adminProductsOsOk) failed += 1;

const pricingOs = fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8');
const pricingOsOk =
  pricingOs.includes('finelyOsCatalogCard') && !pricingOs.includes('border border-white/10 bg-white/[0.04]');
console.log(`${pricingOsOk ? '✓' : '✗'} PricingPage: expandable panels light OS`);
if (!pricingOsOk) failed += 1;

const resourcesChipOs = fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8');
const resourcesChipOsOk = resourcesChipOs.includes('FINELY_OS_ENTITY_CHIP') && resourcesChipOs.includes('FINELY_OS_SECONDARY_BTN');
console.log(`${resourcesChipOsOk ? '✓' : '✗'} ResourcesPage: tool chips + preview button light OS`);
if (!resourcesChipOsOk) failed += 1;

const portalSelectOs = fs.readFileSync(path.join(root, 'src/pages/portal/PortalPartnerSelectPage.tsx'), 'utf8');
const portalSelectOsOk =
  portalSelectOs.includes('finelyOsInlineListItem') || portalSelectOs.includes('finelyOsCatalogCard');
console.log(`${portalSelectOsOk ? '✓' : '✗'} PortalPartnerSelectPage: partner list light OS`);
if (!portalSelectOsOk) failed += 1;

const portalDashboardOs = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDashboardPage.tsx'), 'utf8');
const portalDashboardOsOk = portalDashboardOs.includes('headerClassName="border-white/[0.08]"');
console.log(`${portalDashboardOsOk ? '✓' : '✗'} PartnerDashboardPage: collapsible section header borders`);
if (!portalDashboardOsOk) failed += 1;

const videoMeetingOs = fs.readFileSync(path.join(root, 'src/pages/portal/VideoMeetingRoomPage.tsx'), 'utf8');
const videoMeetingOsOk = videoMeetingOs.includes('border-white/[0.08]') && videoMeetingOs.includes('FINELY_OS_SECONDARY_BTN');
console.log(`${videoMeetingOsOk ? '✓' : '✗'} VideoMeetingRoomPage: header chrome light OS`);
if (!videoMeetingOsOk) failed += 1;

const partnerDebtOs = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDebtDetailPage.tsx'), 'utf8');
const partnerDebtOsOk =
  partnerDebtOs.includes('border-white/[0.08]') &&
  partnerDebtOs.includes('FINELY_OS_ENTITY_INPUT') &&
  !partnerDebtOs.includes('border-white/10');
console.log(`${partnerDebtOsOk ? '✓' : '✗'} PartnerDebtDetailPage: letter draft modal light OS`);
if (!partnerDebtOsOk) failed += 1;

const partnerReportsOs = fs.readFileSync(path.join(root, 'src/pages/portal/PartnerReportsPage.tsx'), 'utf8');
const partnerReportsOsOk = partnerReportsOs.includes('border-white/[0.08]');
console.log(`${partnerReportsOsOk ? '✓' : '✗'} PartnerReportsPage: template studio modal light OS`);
if (!partnerReportsOsOk) failed += 1;

const adminTemplatesOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminTemplatesPage.tsx'), 'utf8');
const adminTemplatesOsOk =
  (adminTemplatesOs.includes('FINELY_OS_ENTITY_PANEL_INNER') || adminTemplatesOs.includes('finelyOsCatalogCard')) &&
  hasLightOsPanel(adminTemplatesOs);
console.log(`${adminTemplatesOsOk ? '✓' : '✗'} AdminTemplatesPage: inline editor modal light OS`);
if (!adminTemplatesOsOk) failed += 1;

const hubCoachOs = fs.readFileSync(path.join(root, 'src/components/chat/HubAiCoachPanel.tsx'), 'utf8');
const hubCoachOsOk =
  hubCoachOs.includes('FINELY_OS_ENTITY_CHIP') &&
  hubCoachOs.includes('border-white/[0.08]') &&
  hubCoachOs.includes('StaffPortraitImg');
console.log(`${hubCoachOsOk ? '✓' : '✗'} HubAiCoachPanel: staff tabs + portrait chat light OS`);
if (!hubCoachOsOk) failed += 1;

const funnelShellOs = fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8');
const funnelShellOsOk =
  funnelShellOs.includes('FINELY_OS_ENTITY_INPUT') &&
  funnelShellOs.includes('finelyOsInlineListItem') &&
  funnelShellOs.includes('FINELY_OS_ENTITY_PANEL') &&
  funnelShellOs.includes('border-white/[0.08]');
console.log(`${funnelShellOsOk ? '✓' : '✗'} LeadMagnetFunnelShell: unlock + success/download light OS`);
if (!funnelShellOsOk) failed += 1;

const publicChatOs = fs.readFileSync(path.join(root, 'src/components/chat/PublicChatWidget.tsx'), 'utf8');
const publicChatOsOk =
  publicChatOs.includes('FINELY_OS_ENTITY_INPUT') &&
  publicChatOs.includes('FINELY_OS_ENTITY_CHIP') &&
  publicChatOs.includes('finelyOsInlineListItem') &&
  publicChatOs.includes('border-white/[0.08]') &&
  !publicChatOs.includes('border-white/10');
console.log(`${publicChatOsOk ? '✓' : '✗'} PublicChatWidget: lane picker + lead form light OS`);
if (!publicChatOsOk) failed += 1;

const funnelUpgradeOs = fs.readFileSync(path.join(root, 'src/components/leadmagnet/FunnelUpgradeStack.tsx'), 'utf8');
const funnelUpgradeOsOk =
  funnelUpgradeOs.includes('finelyOsInlineListItem') &&
  funnelUpgradeOs.includes('FINELY_OS_ENTITY_VALUE') &&
  funnelUpgradeOs.includes('border-white/[0.08]');
console.log(`${funnelUpgradeOsOk ? '✓' : '✗'} FunnelUpgradeStack: cross-sell links light OS`);
if (!funnelUpgradeOsOk) failed += 1;

const welcomeEditorOs = fs.readFileSync(path.join(root, 'src/components/comms/WelcomeExperienceEditor.tsx'), 'utf8');
const welcomeEditorOsOk =
  welcomeEditorOs.includes('finelyOsViewTab') &&
  (welcomeEditorOs.includes('FINELY_OS_ENTITY_PANEL_INNER') || welcomeEditorOs.includes('finelyOsCatalogCard'));
console.log(`${welcomeEditorOsOk ? '✓' : '✗'} WelcomeExperienceEditor: mode tabs + panel light OS`);
if (!welcomeEditorOsOk) failed += 1;

const parsedReportOs = fs.readFileSync(path.join(root, 'src/components/reports/ParsedReportViewer.tsx'), 'utf8');
const parsedReportOsOk = parsedReportOs.includes('border-white/[0.08]') && !parsedReportOs.includes('border-white/10');
console.log(`${parsedReportOsOk ? '✓' : '✗'} ParsedReportViewer: bureau table light OS borders`);
if (!parsedReportOsOk) failed += 1;

const appNavOs = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const appNavOsOk =
  appNavOs.includes('finelyOsInlineListItem') &&
  !appNavOs.includes('border-white/10') &&
  appNavOs.includes('border-white/[0.08]');
console.log(`${appNavOsOk ? '✓' : '✗'} App.tsx: public nav dropdown + landing catalog light OS`);
if (!appNavOsOk) failed += 1;

const mobileNavOs = fs.readFileSync(path.join(root, 'src/components/ui/index.tsx'), 'utf8');
const mobileNavOsOk = mobileNavOs.includes('border-white/[0.08]') && mobileNavOs.includes('function MobileNav');
console.log(`${mobileNavOsOk ? '✓' : '✗'} MobileNav: drawer section light OS borders`);
if (!mobileNavOsOk) failed += 1;

const uiButtonGhostOs =
  mobileNavOs.includes('ghost:') &&
  (mobileNavOs.includes('border border-white/[0.08]') || mobileNavOs.includes('fc-light-glass-panel'));
console.log(`${uiButtonGhostOs ? '✓' : '✗'} ui Button: ghost variant light OS border`);
if (!uiButtonGhostOs) failed += 1;

const personalCreditOs = fs.readFileSync(path.join(root, 'src/pages/PersonalCreditPage.tsx'), 'utf8');
const personalCreditOsOk = personalCreditOs.includes('finelyOsCatalogCard') && !personalCreditOs.includes('border border-white/10 p-6 space-y-4');
console.log(`${personalCreditOsOk ? '✓' : '✗'} PersonalCreditPage: catalog card light OS`);
if (!personalCreditOsOk) failed += 1;

const notFoundSeo = fs.readFileSync(path.join(root, 'src/pages/NotFoundPage.tsx'), 'utf8');
const notFoundSeoOk = notFoundSeo.includes('noindex, nofollow');
console.log(`${notFoundSeoOk ? '✓' : '✗'} NotFoundPage: robots noindex`);
if (!notFoundSeoOk) failed += 1;

const roleOsLaunchOk = launchSnapshot.includes('au_seller') && launchSnapshot.includes('au_buyer');
console.log(`${roleOsLaunchOk ? '✓' : '✗'} Launch checklist: all Role OS lanes`);
if (!roleOsLaunchOk) failed += 1;

const roleOsDocOk = fs.existsSync(path.join(root, 'docs/ROLE_OS.md'));
console.log(`${roleOsDocOk ? '✓' : '✗'} docs/ROLE_OS.md: Role OS runbook`);
if (!roleOsDocOk) failed += 1;

const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/index.tsx'), 'utf8');
const portalIndexOs = fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8');
const portalIndexOsOk =
  portalIndexOs.includes('border-white/[0.08]') &&
  !portalIndexOs.includes('border-white/10');
console.log(`${portalIndexOsOk ? '✓' : '✗'} portal/index: onboarding + lane cards light OS borders`);
if (!portalIndexOsOk) failed += 1;

const dashboardOsOk =
  dashboard.includes('border-white/[0.08]') &&
  !dashboard.includes('border-white/10');
console.log(`${dashboardOsOk ? '✓' : '✗'} dashboard/index: workspace section light OS borders`);
if (!dashboardOsOk) failed += 1;

const pageShellOs = fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8');
const pageShellOsOk = pageShellOs.includes('border-white/[0.08]') && !pageShellOs.includes('border-white/10');
console.log(`${pageShellOsOk ? '✓' : '✗'} PageShell: chrome divider light OS borders`);
if (!pageShellOsOk) failed += 1;

const hubTeamChatOs = fs.readFileSync(path.join(root, 'src/components/chat/HubTeamChatPanel.tsx'), 'utf8');
const hubTeamChatOsOk = hubTeamChatOs.includes('border-white/[0.08]') && !hubTeamChatOs.includes('border-white/10');
console.log(`${hubTeamChatOsOk ? '✓' : '✗'} HubTeamChatPanel: thread + composer light OS borders`);
if (!hubTeamChatOsOk) failed += 1;

const meetingBookingOs = fs.readFileSync(path.join(root, 'src/components/calendar/MeetingBookingPanel.tsx'), 'utf8');
const meetingBookingOsOk = meetingBookingOs.includes('border-white/[0.08]') && !meetingBookingOs.includes('border-white/10');
console.log(`${meetingBookingOsOk ? '✓' : '✗'} MeetingBookingPanel: slot grid light OS borders`);
if (!meetingBookingOsOk) failed += 1;

const workKanbanOs = fs.readFileSync(path.join(root, 'src/components/workboard/WorkKanbanBoard.tsx'), 'utf8');
const workKanbanOsOk = workKanbanOs.includes('border-white/[0.08]') && !workKanbanOs.includes('border-white/10');
console.log(`${workKanbanOsOk ? '✓' : '✗'} WorkKanbanBoard: column + card light OS borders`);
if (!workKanbanOsOk) failed += 1;

const lettersCmdOs = fs.readFileSync(path.join(root, 'src/components/letters/LettersCommandCenter.tsx'), 'utf8');
const lettersCmdOsOk = lettersCmdOs.includes('border-white/[0.08]') && !lettersCmdOs.includes('border-white/10');
console.log(`${lettersCmdOsOk ? '✓' : '✗'} LettersCommandCenter: bureau studio light OS borders`);
if (!lettersCmdOsOk) failed += 1;

const mailLetterOs = fs.readFileSync(path.join(root, 'src/components/letters/MailLetterModal.tsx'), 'utf8');
const mailLetterOsOk = mailLetterOs.includes('border-white/[0.08]') && !mailLetterOs.includes('border-white/10');
console.log(`${mailLetterOsOk ? '✓' : '✗'} MailLetterModal: mail workflow light OS borders`);
if (!mailLetterOsOk) failed += 1;

const journeyMapOs = fs.readFileSync(path.join(root, 'src/components/journey/JourneyMapView.tsx'), 'utf8');
const journeyMapOsOk = journeyMapOs.includes('border-white/[0.08]') && !journeyMapOs.includes('border-white/10');
console.log(`${journeyMapOsOk ? '✓' : '✗'} JourneyMapView: milestone cards light OS borders`);
if (!journeyMapOsOk) failed += 1;

const automationStudioOs = fs.readFileSync(path.join(root, 'src/features/automation/AutomationStudioShell.tsx'), 'utf8');
const automationStudioOsOk = automationStudioOs.includes('border-white/[0.08]') && !automationStudioOs.includes('border-white/10');
console.log(`${automationStudioOsOk ? '✓' : '✗'} AutomationStudioShell: flow canvas light OS borders`);
if (!automationStudioOsOk) failed += 1;

const lessonBlockOs = fs.readFileSync(path.join(root, 'src/components/courses/LessonBlockEditor.tsx'), 'utf8');
const lessonBlockOsOk = lessonBlockOs.includes('border-white/[0.08]') && !lessonBlockOs.includes('border-white/10');
console.log(`${lessonBlockOsOk ? '✓' : '✗'} LessonBlockEditor: course block chrome light OS borders`);
if (!lessonBlockOsOk) failed += 1;

const templateVaultOs = fs.readFileSync(path.join(root, 'src/components/templates/TemplatesVaultPanel.tsx'), 'utf8');
const templateVaultOsOk = templateVaultOs.includes('border-white/[0.08]') && !templateVaultOs.includes('border-white/10');
console.log(`${templateVaultOsOk ? '✓' : '✗'} TemplatesVaultPanel: vault browser light OS borders`);
if (!templateVaultOsOk) failed += 1;

const osTokens = fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8');
const osTokensOk = osTokens.includes('border-white/[0.08]') && !osTokens.includes('border-white/10');
console.log(`${osTokensOk ? '✓' : '✗'} finelyOsLightUi: canonical entity border tokens`);
if (!osTokensOk) failed += 1;

const crmPipelineOs = fs.readFileSync(path.join(root, 'src/features/crm/components/CrmPipelineBoard.tsx'), 'utf8');
const crmPipelineOsOk = crmPipelineOs.includes('border-white/[0.08]') && !crmPipelineOs.includes('border-white/10');
console.log(`${crmPipelineOsOk ? '✓' : '✗'} CrmPipelineBoard: pipeline column light OS borders`);
if (!crmPipelineOsOk) failed += 1;

const adminDeployOs = fs.readFileSync(path.join(root, 'src/features/admin/AdminDeployStatusPanel.tsx'), 'utf8');
const adminDeployOsOk = hasLightOsPanel(adminDeployOs);
console.log(`${adminDeployOsOk ? '✓' : '✗'} AdminDeployStatusPanel: ops panel light OS borders`);
if (!adminDeployOsOk) failed += 1;

const uiEmptyOs = fs.readFileSync(path.join(root, 'src/components/ui/EmptyState.tsx'), 'utf8');
const uiEmptyOsOk = hasLightOsPanel(uiEmptyOs);
console.log(`${uiEmptyOsOk ? '✓' : '✗'} ui EmptyState: shell light OS borders`);
if (!uiEmptyOsOk) failed += 1;

const portalStepsOs = fs.readFileSync(path.join(root, 'src/components/PortalSteps.jsx'), 'utf8');
const portalStepsOsOk = portalStepsOs.includes('border-white/[0.08]') && !portalStepsOs.includes('border-white/10');
console.log(`${portalStepsOsOk ? '✓' : '✗'} PortalSteps.jsx: onboarding step light OS borders`);
if (!portalStepsOsOk) failed += 1;

const ringResidueOk =
  !osTokens.includes('ring-white/10') &&
  !fs.readFileSync(path.join(root, 'src/features/crm/components/CrmPipelineBoard.tsx'), 'utf8').includes('ring-white/10') &&
  osTokens.includes('ring-white/[0.08]');
console.log(`${ringResidueOk ? '✓' : '✗'} Light OS: ring inset tokens → [0.08]`);
if (!ringResidueOk) failed += 1;

const launchChromeOk = launchSnapshot.includes('light_os_chrome');
console.log(`${launchChromeOk ? '✓' : '✗'} Launch checklist: light OS chrome gate`);
if (!launchChromeOk) failed += 1;

const workPalette = fs.readFileSync(path.join(root, 'src/features/work/components/WorkCommandPalette.tsx'), 'utf8');
const pageShell = fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8');
const workOsDepthOk =
  workPalette.includes('PortalCommandPaletteHost') &&
  workPalette.includes('PORTAL_NAV_COMMANDS') &&
  pageShell.includes('PortalCommandPaletteHost') &&
  fs.readFileSync(path.join(root, 'src/features/work/components/WorkAICopilotPanel.tsx'), 'utf8').includes('runWorkCopilot') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminWorkflowQueuePage.tsx'), 'utf8').includes('WorkWeeklyDigestPanel');
console.log(`${workOsDepthOk ? '✓' : '✗'} Work OS: portal palette + AI copilot + weekly digest`);
if (!workOsDepthOk) failed += 1;

const crmOsDepthOk =
  fs.readFileSync(path.join(root, 'src/features/crm/sequences/CrmSequenceBuilder.tsx'), 'utf8').includes('CrmSequenceBuilder') &&
  fs.readFileSync(path.join(root, 'src/features/crm/intelligence/buildCallTimeOptimizer.ts'), 'utf8').includes('buildCallTimeOptimizer') &&
  fs.readFileSync(path.join(root, 'src/features/ai/crmCopilot/runCrmCopilot.ts'), 'utf8').includes('churnRisk') &&
  launchSnapshot.includes('crm_os_depth');
console.log(`${crmOsDepthOk ? '✓' : '✗'} CRM OS: sequences + call-time optimizer + churn copilot`);
if (!crmOsDepthOk) failed += 1;

const socialAutopilotOk =
  fs.readFileSync(path.join(root, 'src/lib/socialAutopilotEngine.ts'), 'utf8').includes('loadSocialAutopilotConfig') &&
  fs.readFileSync(path.join(root, 'src/lib/socialAutopilotEngine.ts'), 'utf8').includes('reviewSocialCaptionCompliance') &&
  fs.readFileSync(path.join(root, 'src/lib/socialAutopilotEngine.ts'), 'utf8').includes('publishDueSocialPosts') &&
  fs.readFileSync(path.join(root, 'src/lib/socialAutopilotEngine.ts'), 'utf8').includes('updateSocialPostStatus');
console.log(`${socialAutopilotOk ? '✓' : '✗'} Social autopilot: SOP queue + compliance + publish due`);
if (!socialAutopilotOk) failed += 1;

const briefingDepthOk =
  fs.readFileSync(path.join(root, 'src/features/ai/briefing/buildDailyBriefing.ts'), 'utf8').includes("kind: 'automation'") &&
  fs.readFileSync(path.join(root, 'src/features/ai/briefing/buildDailyBriefing.ts'), 'utf8').includes("kind: 'social'") &&
  fs.readFileSync(path.join(root, 'src/features/ai/briefing/buildDailyBriefing.ts'), 'utf8').includes("kind: 'support'") &&
  fs.readFileSync(path.join(root, 'src/features/inbox/OpsBriefingPanel.tsx'), 'utf8').includes('finelyOsInlineListItem') &&
  launchSnapshot.includes('ops_briefing_depth');
console.log(`${briefingDepthOk ? '✓' : '✗'} Ops briefing: automation + social + support ranking`);
if (!briefingDepthOk) failed += 1;

const serviceBundleOk =
  fs.readFileSync(path.join(root, 'src/features/work/playbooks/servicePlaybookBundles.ts'), 'utf8').includes('describeServiceBundle') &&
  fs.readFileSync(path.join(root, 'src/features/work/templates/ProjectTemplateGallery.tsx'), 'utf8').includes('Service bundle preview');
console.log(`${serviceBundleOk ? '✓' : '✗'} Service bundles: catalog preview before provision`);
if (!serviceBundleOk) failed += 1;

const metaSocialPublishOk =
  fs.readFileSync(path.join(root, 'src/lib/metaSocialPublish.ts'), 'utf8').includes('publishSocialPostLive') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8').includes('publishSocialPostLive') &&
  fs.readFileSync(path.join(root, 'src/domain/metaIntegration.ts'), 'utf8').includes('defaultIgImageUrl') &&
  launchSnapshot.includes('meta_ig_publish');
console.log(`${metaSocialPublishOk ? '✓' : '✗'} Meta live publish: FB + IG + default image URL`);
if (!metaSocialPublishOk) failed += 1;

const crmBundlePanelOk =
  fs.readFileSync(path.join(root, 'src/features/crm/components/CrmServiceBundlePanel.tsx'), 'utf8').includes('CrmServiceBundlePanel') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminCrmRecordPage.tsx'), 'utf8').includes('CrmServiceBundlePanel');
console.log(`${crmBundlePanelOk ? '✓' : '✗'} CRM record: service bundle preview on convert`);
if (!crmBundlePanelOk) failed += 1;

const socialPublishUiOk =
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8').includes('Publish due now') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8').includes('Compliance review queue') &&
  fs.readFileSync(path.join(root, 'src/data/socialHubRepo.ts'), 'utf8').includes('updateSocialPostStatus') &&
  launchSnapshot.includes('social_publish_depth');
console.log(`${socialPublishUiOk ? '✓' : '✗'} Social Hub: publish due + compliance review queue`);
if (!socialPublishUiOk) failed += 1;

const socialPersistenceLaunchOk = launchSnapshot.includes('social_supabase_persistence');
console.log(`${socialPersistenceLaunchOk ? '✓' : '✗'} Launch checklist: social Supabase persistence gate`);
if (!socialPersistenceLaunchOk) failed += 1;

const serverAutomationCronOk =
  launchSnapshot.includes('server_automation_cron') &&
  fs.existsSync(path.join(root, 'docs/PLATFORM_CRON.md')) &&
  fs.readFileSync(path.join(root, 'src/data/platformCronHeartbeatRepo.ts'), 'utf8').includes('fetchLatestPlatformCronHeartbeat');
console.log(`${serverAutomationCronOk ? '✓' : '✗'} Launch checklist: server automation cron + heartbeat repo`);
if (!serverAutomationCronOk) failed += 1;

const serverNurturePersistenceOk =
  launchSnapshot.includes('server_nurture_persistence') &&
  fs.existsSync(path.join(root, 'src/data/nurtureSupabaseSync.ts')) &&
  fs.existsSync(path.join(root, 'supabase/functions/_shared/processDueNurtureEnrollments.ts')) &&
  fs.readFileSync(path.join(root, 'supabase/functions/automation-runner/index.ts'), 'utf8').includes('processDueNurtureEnrollments') &&
  fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8').includes('ensureOpsPersistenceSyncedOnce');
console.log(`${serverNurturePersistenceOk ? '✓' : '✗'} Launch checklist: server nurture persistence + boot sync`);
if (!serverNurturePersistenceOk) failed += 1;

const serverNurtureEmailOk =
  launchSnapshot.includes('server_nurture_email') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/commsSendEmail.ts'), 'utf8').includes('sendServiceEmail') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/nurtureStepEmailCopy.ts'), 'utf8').includes('buildNurtureStepEmail') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/processDueNurtureEnrollments.ts'), 'utf8').includes('emailsSent');
console.log(`${serverNurtureEmailOk ? '✓' : '✗'} Launch checklist: server nurture email via SendGrid`);
if (!serverNurtureEmailOk) failed += 1;

const serverAutomationRulesDbOk =
  launchSnapshot.includes('server_automation_rules_db') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/processAutomationRulesFromDb.ts'), 'utf8').includes('processAutomationRulesFromDb') &&
  fs.readFileSync(path.join(root, 'src/data/platformCronScheduleRepo.ts'), 'utf8').includes('fetchPlatformCronSchedule');
console.log(`${serverAutomationRulesDbOk ? '✓' : '✗'} Launch checklist: server automation rules DB + pg_cron schedule`);
if (!serverAutomationRulesDbOk) failed += 1;

const unifiedUxOk =
  launchSnapshot.includes('unified_ux_hub') &&
  fs.readFileSync(path.join(root, 'src/features/unified/FinelyUnifiedHubLayout.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('/fundability-readiness') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('LandingUnifiedJourneySection');
console.log(`${unifiedUxOk ? '✓' : '✗'} Launch checklist: unified UX hub + fundability route + landing journey`);
if (!unifiedUxOk) failed += 1;

const humanAutomationOk =
  launchSnapshot.includes('human_automation_catalog') &&
  fs.readFileSync(path.join(root, 'src/features/automation/humanAutomationCatalog.ts'), 'utf8').includes('HUMAN_AUTOMATION_RECIPES') &&
  fs.readFileSync(path.join(root, 'src/automation/agentRunner.ts'), 'utf8').includes('withHumanCadence');
console.log(`${humanAutomationOk ? '✓' : '✗'} Launch checklist: human automation catalog + runner cadence`);
if (!humanAutomationOk) failed += 1;

const reasonsHubOk =
  launchSnapshot.includes('reasons_command_hub') &&
  fs.readFileSync(path.join(root, 'src/features/reasons/ReasonsCommandHub.tsx'), 'utf8').includes('ReasonsCommandHub');
console.log(`${reasonsHubOk ? '✓' : '✗'} Launch checklist: Reasons command hub`);
if (!reasonsHubOk) failed += 1;

const serverQueueOk =
  launchSnapshot.includes('server_automation_queue') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/processAutomationRulesFromDb.ts'), 'utf8').includes('server_automation_queue') &&
  fs.readFileSync(path.join(root, 'src/lib/drainServerAutomationQueue.ts'), 'utf8').includes('drainServerAutomationQueue');
console.log(`${serverQueueOk ? '✓' : '✗'} Launch checklist: server automation queue + client drain`);
if (!serverQueueOk) failed += 1;

const serverTaskExecutionOk =
  launchSnapshot.includes('server_task_execution') &&
  fs.readFileSync(path.join(root, 'supabase/functions/_shared/processServerAutomationQueue.ts'), 'utf8').includes('processServerAutomationQueue') &&
  fs.readFileSync(path.join(root, 'supabase/functions/automation-runner/index.ts'), 'utf8').includes('processServerAutomationQueue') &&
  fs.readFileSync(path.join(root, 'src/data/workTasksSupabaseSync.ts'), 'utf8').includes('syncWorkTasksFromSupabase');
console.log(`${serverTaskExecutionOk ? '✓' : '✗'} Launch checklist: server-side create_task → work_tasks + client merge`);
if (!serverTaskExecutionOk) failed += 1;

const opsCronHealthOk =
  launchSnapshot.includes('ops_cron_health') &&
  fs.readFileSync(path.join(root, 'src/features/inbox/OpsPlatformCronHealthPanel.tsx'), 'utf8').includes('OpsPlatformCronHealthPanel') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminWorkflowQueuePage.tsx'), 'utf8').includes('OpsPlatformCronHealthPanel');
console.log(`${opsCronHealthOk ? '✓' : '✗'} Launch checklist: Ops Inbox cron health panel`);
if (!opsCronHealthOk) failed += 1;

const sitewideHub2Ok =
  launchSnapshot.includes('sitewide_hub_wave2') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('LandingFundabilityTrustSection');
console.log(`${sitewideHub2Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 2 + landing trust`);
if (!sitewideHub2Ok) failed += 1;

const reasonsLetterOk =
  launchSnapshot.includes('reasons_os_letter_studio') &&
  fs.readFileSync(path.join(root, 'src/components/letters/DisputeReasonsLibraryPanel.tsx'), 'utf8').includes('commandHub') &&
  fs.readFileSync(path.join(root, 'src/components/letters/LettersCommandCenter.tsx'), 'utf8').includes('setReasonsLibraryOpen(true)');
console.log(`${reasonsLetterOk ? '✓' : '✗'} Launch checklist: Reasons OS in Letter Studio`);
if (!reasonsLetterOk) failed += 1;

const sitewideHub3Ok =
  launchSnapshot.includes('sitewide_hub_wave3') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDashboardPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingServicePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub3Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 3 + partner + pricing service`);
if (!sitewideHub3Ok) failed += 1;

const landingHeroRefreshOk =
  launchSnapshot.includes('landing_hero_os_refresh') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('LandingHeroOsRefreshSection');
console.log(`${landingHeroRefreshOk ? '✓' : '✗'} Launch checklist: landing hero OS refresh band`);
if (!landingHeroRefreshOk) failed += 1;

const humanSeedExpandedOk =
  launchSnapshot.includes('human_automation_seed_full') &&
  fs.readFileSync(path.join(root, 'src/lib/automationRecipeSeeder.ts'), 'utf8').includes('HUMAN_AUTOMATION_RECIPES.map') &&
  fs.readFileSync(path.join(root, 'src/features/automation/humanAutomationCatalog.ts'), 'utf8').includes('HUMAN_AUTOMATION_RECIPE_COUNT');
console.log(`${humanSeedExpandedOk ? '✓' : '✗'} Launch checklist: human automation full catalog auto-seed`);
if (!humanSeedExpandedOk) failed += 1;

const sitewideHub4Ok =
  launchSnapshot.includes('sitewide_hub_wave4') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDisputesPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerChecklistPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerReportsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerProjectsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub4Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 4 — portal disputes/checklist/reports/projects`);
if (!sitewideHub4Ok) failed += 1;

const heroFundabilityOk =
  launchSnapshot.includes('hero_fundability_cta') &&
  fs.readFileSync(path.join(root, 'src/components/landing/index.tsx'), 'utf8').includes("navigate('/fundability-readiness')");
console.log(`${heroFundabilityOk ? '✓' : '✗'} Launch checklist: hero fundability CTA`);
if (!heroFundabilityOk) failed += 1;

const sitewideHub5Ok =
  launchSnapshot.includes('sitewide_hub_wave5') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDocumentsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBuildPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDebtPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLettersVaultPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub5Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 5 — documents/build/debt/letters vault`);
if (!sitewideHub5Ok) failed += 1;

const sitewideHub6Ok =
  launchSnapshot.includes('sitewide_hub_wave6') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerTemplateLibraryPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerCalendarPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerIdentityTheftPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerMessagesPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminWorkflowQueuePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub6Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 6 — templates/calendar/identity/messages/admin ops`);
if (!sitewideHub6Ok) failed += 1;

const sitewideHub7Ok =
  launchSnapshot.includes('sitewide_hub_wave7') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLibraryPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerEducationPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerEscalationsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerMyTasksPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerCoursesPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub7Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 7 — library/education/escalations/my-tasks/courses`);
if (!sitewideHub7Ok) failed += 1;

const sitewideHub8Ok =
  launchSnapshot.includes('sitewide_hub_wave8') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBillingPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerTradelineMarketplacePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerWealthPathsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerAnalysisVaultPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBarterPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub8Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 8 — billing/tradeline/wealth/analysis/barter`);
if (!sitewideHub8Ok) failed += 1;

const sitewideHub9Ok =
  launchSnapshot.includes('sitewide_hub_wave9') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerCheckoutPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBookPurchasePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBundlePurchasePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerProjectWorkspacePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerCoursePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDisputeDetailPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub9Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 9 — checkout/purchase/workspace/course/dispute-detail`);
if (!sitewideHub9Ok) failed += 1;

const sitewideHub10Ok =
  launchSnapshot.includes('sitewide_hub_wave10') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDebtDetailPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${sitewideHub10Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 10 — debt detail hub`);
if (!sitewideHub10Ok) failed += 1;

const sitewideHub11Ok =
  launchSnapshot.includes('sitewide_hub_wave11') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLettersPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/components/letters/LettersCommandCenter.tsx'), 'utf8').includes('unifiedShell');
console.log(`${sitewideHub11Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 11 — Letter Studio hub`);
if (!sitewideHub11Ok) failed += 1;

const liveSetupOk =
  launchSnapshot.includes('live_setup_sync') &&
  fs.existsSync(path.join(root, 'scripts/rebuild-live-setup.mjs')) &&
  fs.readFileSync(path.join(root, 'supabase/LIVE_SETUP_run_all.sql'), 'utf8').includes('20260622000000_work_tasks') &&
  fs.readFileSync(path.join(root, 'supabase/LIVE_SETUP_run_all.sql'), 'utf8').includes('20260621000000_server_automation_queue');
console.log(`${liveSetupOk ? '✓' : '✗'} Launch checklist: LIVE_SETUP synced with all migrations`);
if (!liveSetupOk) failed += 1;

const localDevOk =
  launchSnapshot.includes('local_dev_bootstrap') &&
  fs.existsSync(path.join(root, 'docs/LOCAL_DEV.md')) &&
  fs.readFileSync(path.join(root, 'scripts/validate-local-env.mjs'), 'utf8').includes('Local dev env validation');
console.log(`${localDevOk ? '✓' : '✗'} Launch checklist: local dev bootstrap (LOCAL_DEV.md + env:check)`);
if (!localDevOk) failed += 1;

const ciPredeployOk =
  launchSnapshot.includes('ci_predeploy_gate') &&
  fs.existsSync(path.join(root, 'scripts/ci-predeploy-check.mjs')) &&
  fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8').includes('npm run ci:check');
console.log(`${ciPredeployOk ? '✓' : '✗'} Launch checklist: CI pre-deploy gate (ci:check + GitHub Actions)`);
if (!ciPredeployOk) failed += 1;

const hubCompleteOk =
  launchSnapshot.includes('sitewide_hub_complete') &&
  fs.existsSync(path.join(root, 'scripts/audit-portal-unified-hub.mjs'));
console.log(`${hubCompleteOk ? '✓' : '✗'} Launch checklist: sitewide hub complete (hub:audit script)`);
if (!hubCompleteOk) failed += 1;

const planCompleteOk =
  launchSnapshot.includes('finely_os_400_complete') &&
  fs.existsSync(path.join(root, 'docs/FINELY-OS-400-COMPLETE.md')) &&
  fs.existsSync(path.join(root, '.github/workflows/deploy-manual.yml'));
console.log(`${planCompleteOk ? '✓' : '✗'} Launch checklist: Finely OS 400% plan closure`);
if (!planCompleteOk) failed += 1;

const hubWave12Ok =
  launchSnapshot.includes('sitewide_hub_wave12') &&
  fs.readFileSync(path.join(root, 'src/pages/BookstorePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/au/AuMarketplacePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/au/AuOrdersPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.existsSync(path.join(root, 'scripts/audit-public-marketing-hub.mjs'));
console.log(`${hubWave12Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 12 — bookstore + AU buyer`);
if (!hubWave12Ok) failed += 1;

const deployRunnerOk =
  launchSnapshot.includes('production_deploy_runner') &&
  fs.existsSync(path.join(root, 'scripts/production-deploy-runner.mjs'));
console.log(`${deployRunnerOk ? '✓' : '✗'} Launch checklist: production deploy runner (deploy:plan)`);
if (!deployRunnerOk) failed += 1;

const hubWave13Ok =
  launchSnapshot.includes('sitewide_hub_wave13') &&
  fs.readFileSync(path.join(root, 'src/pages/business/BusinessFundingPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/EnlightenmentSessionPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.existsSync(path.join(root, 'scripts/audit-business-hub.mjs'));
console.log(`${hubWave13Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 13 — business + enlightenment`);
if (!hubWave13Ok) failed += 1;

const catalogUxOk =
  launchSnapshot.includes('catalog_ux_no_long_lists') &&
  fs.existsSync(path.join(root, 'scripts/audit-no-long-list-ui.mjs')) &&
  fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8').includes('PricingPackageCatalog') &&
  fs.readFileSync(path.join(root, 'src/pages/PersonalCreditPage.tsx'), 'utf8').includes('PricingPackageCatalog');
console.log(`${catalogUxOk ? '✓' : '✗'} Launch checklist: catalog UX — no long package lists (catalog:audit)`);
if (!catalogUxOk) failed += 1;

const hubWave14Ok =
  launchSnapshot.includes('sitewide_hub_wave14') &&
  fs.existsSync(path.join(root, 'scripts/audit-role-hub.mjs')) &&
  fs.readFileSync(path.join(root, 'src/pages/EventsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/agent/AgentHubPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${hubWave14Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 14 — public + role hubs`);
if (!hubWave14Ok) failed += 1;

const hubWave15Ok =
  launchSnapshot.includes('sitewide_hub_wave15') &&
  fs.readFileSync(path.join(root, 'src/pages/FaqPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/legal/TermsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/business/BusinessBillionPathPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBillingPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8').includes('FinelyUnifiedHubLayout');
console.log(`${hubWave15Ok ? '✓' : '✗'} Launch checklist: sitewide hub wave 15 — public wave 15 + business detail + portal catalog`);
if (!hubWave15Ok) failed += 1;

const themeNavWave16Ok =
  launchSnapshot.includes('sitewide_theme_nav_wave16') &&
  fs.existsSync(path.join(root, 'scripts/audit-site-theme.mjs')) &&
  fs.readFileSync(path.join(root, 'src/features/os/FinelySiteThemeProvider.tsx'), 'utf8').includes('FinelySiteThemeContext') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('html[data-fc-theme="light"]') &&
  fs.readFileSync(path.join(root, 'src/features/os/FinelySiteWayfinder.tsx'), 'utf8').includes('SITE_WAYFINDER_LANES');
console.log(`${themeNavWave16Ok ? '✓' : '✗'} Launch checklist: sitewide theme + wayfinder wave 16`);
if (!themeNavWave16Ok) failed += 1;

const themePortalWave17Ok =
  launchSnapshot.includes('sitewide_theme_portal_wave17') &&
  fs.existsSync(path.join(root, 'src/config/portalNavLanes.ts')) &&
  fs.existsSync(path.join(root, 'src/features/os/FinelyPortalSimpleNav.tsx')) &&
  fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('data-fc-app-surface') &&
  fs.readFileSync(path.join(root, 'src/components/portal/PartnerPortalNav.tsx'), 'utf8').includes('FinelyPortalSimpleNav');
console.log(`${themePortalWave17Ok ? '✓' : '✗'} Launch checklist: sitewide theme + portal simple nav wave 17`);
if (!themePortalWave17Ok) failed += 1;

const themeAdminWave18Ok =
  launchSnapshot.includes('sitewide_theme_admin_wave18') &&
  fs.existsSync(path.join(root, 'src/config/adminNavLanes.ts')) &&
  fs.existsSync(path.join(root, 'src/features/os/FinelyAdminSimpleNav.tsx')) &&
  fs.existsSync(path.join(root, 'scripts/audit-admin-hub.mjs')) &&
  fs.readFileSync(path.join(root, 'src/components/admin/AdminNav.tsx'), 'utf8').includes('FinelyAdminSimpleNav') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminDashboardPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8').includes('data-fc-onboarding-shell');
console.log(`${themeAdminWave18Ok ? '✓' : '✗'} Launch checklist: sitewide theme + admin nav wave 18`);
if (!themeAdminWave18Ok) failed += 1;

const partnerDetailWave19Ok =
  launchSnapshot.includes('sitewide_partner_detail_wave19') &&
  fs.existsSync(path.join(root, 'src/config/partnerDetailTabLanes.ts')) &&
  fs.existsSync(path.join(root, 'src/features/os/FinelyEntityTabLaneNav.tsx')) &&
  fs.readFileSync(path.join(root, 'src/pages/admin/PartnerDetailPage.tsx'), 'utf8').includes('useTabLanes') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminLeadsOsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminCrmWorkspacePage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/components/layout/EntityDetailShell.tsx'), 'utf8').includes('FinelyEntityTabLaneNav');
console.log(`${partnerDetailWave19Ok ? '✓' : '✗'} Launch checklist: partner detail + CRM/leads hub wave 19`);
if (!partnerDetailWave19Ok) failed += 1;

const adminOpsWave20Ok =
  launchSnapshot.includes('sitewide_admin_ops_wave20') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminPlaybooksPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminCommsStudioPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminAutomationsPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminPortfolioDashboardPage.tsx'), 'utf8').includes('FinelyUnifiedHubLayout') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminCommsStudioPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${adminOpsWave20Ok ? '✓' : '✗'} Launch checklist: admin ops hub wave 20`);
if (!adminOpsWave20Ok) failed += 1;

const lightVividWave21Ok =
  launchSnapshot.includes('sitewide_light_vivid_wave21') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Light theme vivid accent pop') &&
  fs.readFileSync(path.join(root, 'src/components/dashboard/LenderLogicEngine.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/components/workboard/WorkListView.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBarterPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${lightVividWave21Ok ? '✓' : '✗'} Launch checklist: light vivid + catalog wave 21`);
if (!lightVividWave21Ok) failed += 1;

const portalCatalogWave22Ok =
  launchSnapshot.includes('sitewide_portal_catalog_wave22') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDashboardPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PortalPartnerSelectPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/components/workboard/WorkKanbanBoard.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/features/leadIntel/LeadIntelHub.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/features/admin/AdminPlatformEventsFeed.tsx'), 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${portalCatalogWave22Ok ? '✓' : '✗'} Launch checklist: portal catalog wave 22`);
if (!portalCatalogWave22Ok) failed += 1;

const lightGlassWave23Ok =
  launchSnapshot.includes('sitewide_light_glass_wave23') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Light theme frosted glass system') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-glass-bg') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('backdrop-filter: blur(var(--fc-glass-blur))');
console.log(`${lightGlassWave23Ok ? '✓' : '✗'} Launch checklist: light frosted glass wave 23`);
if (!lightGlassWave23Ok) failed += 1;

const lightPremiumWave24Ok =
  launchSnapshot.includes('sitewide_light_premium_wave24') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Light theme premium UX layer') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-light-heading') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-light-scrim');
console.log(`${lightPremiumWave24Ok ? '✓' : '✗'} Launch checklist: light premium UX wave 24`);
if (!lightPremiumWave24Ok) failed += 1;

const lightSolidWave25Ok =
  launchSnapshot.includes('sitewide_light_solid_wave25') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-accent-card') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-flashy-icon-solid') &&
  fs.existsSync(path.join(root, 'src/features/os/FinelyPublicNavResourcesMenu.tsx'));
console.log(`${lightSolidWave25Ok ? '✓' : '✗'} Launch checklist: light solid accent wave 25`);
if (!lightSolidWave25Ok) failed += 1;

const obsidianMetalWave26Ok =
  launchSnapshot.includes('sitewide_obsidian_metal_wave26') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-metal-black-icon-box') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('rgba(245,245,245,0.93)');
console.log(`${obsidianMetalWave26Ok ? '✓' : '✗'} Launch checklist: obsidian metallic wave 26 (theme-split)`);
if (!obsidianMetalWave26Ok) failed += 1;

const lightAppealWave27Ok =
  launchSnapshot.includes('sitewide_light_appeal_wave27') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-light-contrast-band') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-light-pop-card') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('finelyOsLightContrastBand');
console.log(`${lightAppealWave27Ok ? '✓' : '✗'} Launch checklist: light appeal + contrast wave 27`);
if (!lightAppealWave27Ok) failed += 1;

const cleanShellWave28Ok =
  launchSnapshot.includes('sitewide_clean_shell_wave28') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-shell-gradient') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CA') &&
  !fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('rgba(16, 185, 129, 0.48)');
console.log(`${cleanShellWave28Ok ? '✓' : '✗'} Launch checklist: clean neutral shell wave 28`);
if (!cleanShellWave28Ok) failed += 1;

const lightPopWave29Ok =
  launchSnapshot.includes('sitewide_light_pop_wave29') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CB') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-hub-kpi') &&
  fs.readFileSync(path.join(root, 'src/features/unified/FinelyUnifiedHubLayout.tsx'), 'utf8').includes('fc-unified-hub-shell');
console.log(`${lightPopWave29Ok ? '✓' : '✗'} Launch checklist: light pop 100% wave 29`);
if (!lightPopWave29Ok) failed += 1;

const lightLuxuryWave30Ok =
  launchSnapshot.includes('sitewide_light_luxury_wave30') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CC') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-light-luxury-mesh') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-luxury-glass') &&
  fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('fc-pageshell-aurora-glow-violet');
console.log(`${lightLuxuryWave30Ok ? '✓' : '✗'} Launch checklist: light luxury mesh wave 30`);
if (!lightLuxuryWave30Ok) failed += 1;

const lightPopSurfacesWave31Ok =
  launchSnapshot.includes('sitewide_light_pop_surfaces_wave31') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CD') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-pop-surface') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('finelyOsLightMeshSection');
console.log(`${lightPopSurfacesWave31Ok ? '✓' : '✗'} Launch checklist: light pop surfaces wave 31`);
if (!lightPopSurfacesWave31Ok) failed += 1;

const lightReadableWave32Ok =
  launchSnapshot.includes('sitewide_light_readable_wave32') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CE') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-light-readable') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('fc-light-readable');
console.log(`${lightReadableWave32Ok ? '✓' : '✗'} Launch checklist: light readable copy wave 32`);
if (!lightReadableWave32Ok) failed += 1;

const lightRolloutWave33Ok =
  launchSnapshot.includes('sitewide_light_rollout_wave33') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CF') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-affiliate-band') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('finelyOsLightMeshSection') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('finelyOsLandingPlatinumSection');
console.log(`${lightRolloutWave33Ok ? '✓' : '✗'} Launch checklist: light public rollout wave 33`);
if (!lightRolloutWave33Ok) failed += 1;

const lightMarketingWave34Ok =
  launchSnapshot.includes('sitewide_light_marketing_wave34') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CG') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-testimonial-dossier') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('finelyOsLeadMagnetPanel') &&
  fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('finelyOsLandingPlatinumSection');
console.log(`${lightMarketingWave34Ok ? '✓' : '✗'} Launch checklist: light marketing closures wave 34`);
if (!lightMarketingWave34Ok) failed += 1;

const lightRoutesWave35Ok =
  launchSnapshot.includes('sitewide_light_routes_wave35') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CH') &&
  fs.readFileSync(path.join(root, 'src/pages/FundabilityReadinessPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/components/leadmagnet/LeadMagnetFunnelShell.tsx'), 'utf8').includes('finelyOsLeadMagnetPanel') &&
  fs.readFileSync(path.join(root, 'src/pages/BookstorePage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightRoutesWave35Ok ? '✓' : '✗'} Launch checklist: light public routes wave 35`);
if (!lightRoutesWave35Ok) failed += 1;

const lightHubsWave36Ok =
  launchSnapshot.includes('sitewide_light_hubs_wave36') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CI') &&
  fs.readFileSync(path.join(root, 'src/pages/AgentsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8').includes('finelyOsLeadMagnetPanel') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDashboardPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightHubsWave36Ok ? '✓' : '✗'} Launch checklist: light public hubs wave 36`);
if (!lightHubsWave36Ok) failed += 1;

const lightMarketingWave37Ok =
  launchSnapshot.includes('sitewide_light_marketing_wave37') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CJ') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/EnlightenmentSessionPage.tsx'), 'utf8').includes('finelyOsLeadMagnetPanel') &&
  fs.readFileSync(path.join(root, 'src/pages/AffiliatePage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightMarketingWave37Ok ? '✓' : '✗'} Launch checklist: light marketing pages wave 37`);
if (!lightMarketingWave37Ok) failed += 1;

const lightHarmonyWave38Ok =
  launchSnapshot.includes('sitewide_light_harmony_wave38') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CK') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('fc-surface-harmony') &&
  fs.readFileSync(path.join(root, 'src/pages/agent/AgentHubPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/au/AuOrdersPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${lightHarmonyWave38Ok ? '✓' : '✗'} Launch checklist: light surface harmony wave 38`);
if (!lightHarmonyWave38Ok) failed += 1;

const lightBusinessWave39Ok =
  launchSnapshot.includes('sitewide_light_business_wave39') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CL') &&
  fs.readFileSync(path.join(root, 'src/pages/business/BusinessFundingPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLibraryPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/PersonalCreditPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightBusinessWave39Ok ? '✓' : '✗'} Launch checklist: light business + portal wave 39`);
if (!lightBusinessWave39Ok) failed += 1;

const lightCompletionWave40Ok =
  launchSnapshot.includes('sitewide_light_completion_wave40') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CM') &&
  fs.readFileSync(path.join(root, 'src/pages/business/BusinessVendorsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/NotificationsCenterPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminProductsPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightCompletionWave40Ok ? '✓' : '✗'} Launch checklist: light business completion wave 40`);
if (!lightCompletionWave40Ok) failed += 1;

const lightAdminWave41Ok =
  launchSnapshot.includes('sitewide_light_admin_wave41') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CN') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminFunnelExperimentsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminMonitoringPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminTenantsPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightAdminWave41Ok ? '✓' : '✗'} Launch checklist: light admin catalog wave 41`);
if (!lightAdminWave41Ok) failed += 1;

const lightAdminWorkspacesWave42Ok =
  launchSnapshot.includes('sitewide_light_admin_workspaces_wave42') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CO') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminResourcesPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminBillingPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSupportInboxPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightAdminWorkspacesWave42Ok ? '✓' : '✗'} Launch checklist: light admin workspaces wave 42`);
if (!lightAdminWorkspacesWave42Ok) failed += 1;

const lightAdminStudiosWave43Ok =
  launchSnapshot.includes('sitewide_light_admin_studios_wave43') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CP') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminCommsStudioPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSettingsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminTemplatesPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightAdminStudiosWave43Ok ? '✓' : '✗'} Launch checklist: light admin studios wave 43`);
if (!lightAdminStudiosWave43Ok) failed += 1;

const lightPortalHubsWave44Ok =
  launchSnapshot.includes('sitewide_light_portal_hubs_wave44') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CQ') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDashboardPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerReportsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerBillingPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightPortalHubsWave44Ok ? '✓' : '✗'} Launch checklist: light portal hubs wave 44`);
if (!lightPortalHubsWave44Ok) failed += 1;

const lightPortalLanesWave45Ok =
  launchSnapshot.includes('sitewide_light_portal_lanes_wave45') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CR') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDebtPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerDisputesPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/portal/PartnerLettersVaultPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightPortalLanesWave45Ok ? '✓' : '✗'} Launch checklist: light portal lanes wave 45`);
if (!lightPortalLanesWave45Ok) failed += 1;

const lightPublicAccountWave46Ok =
  launchSnapshot.includes('sitewide_light_public_account_wave46') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CS') &&
  fs.readFileSync(path.join(root, 'src/pages/PricingPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/account/AccountSettingsPage.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/PartnerDetailPage.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightPublicAccountWave46Ok ? '✓' : '✗'} Launch checklist: light public + account wave 46`);
if (!lightPublicAccountWave46Ok) failed += 1;

const lightComponentsWave47Ok =
  launchSnapshot.includes('sitewide_light_components_wave47') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CT') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('fc-accent-card fc-luxury-glass') &&
  fs.readFileSync(path.join(root, 'src/features/os/FinelyOsGlassPanel.tsx'), 'utf8').includes('finelyOsCatalogCard') &&
  fs.readFileSync(path.join(root, 'src/components/dashboard/LenderLogicEngine.tsx'), 'utf8').includes('finelyOsCatalogCard');
console.log(`${lightComponentsWave47Ok ? '✓' : '✗'} Launch checklist: light components wave 47`);
if (!lightComponentsWave47Ok) failed += 1;

const lightBlackSilverWave48Ok =
  launchSnapshot.includes('sitewide_light_black_silver_wave48') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('fc-light-black-scope') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-light-black-card-bg') &&
  fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('fc-light-black-scope') &&
  fs.readFileSync(path.join(root, 'src/features/unified/FinelyUnifiedHubLayout.tsx'), 'utf8').includes('fc-light-black-scope');
console.log(`${lightBlackSilverWave48Ok ? '✓' : '✗'} Launch checklist: light black/silver cards wave 48`);
if (!lightBlackSilverWave48Ok) failed += 1;

const lightChromeWave49Ok =
  launchSnapshot.includes('sitewide_light_chrome_wave49') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CV') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('--fc-light-chrome-bg') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('fc-light-chrome-strip');
console.log(`${lightChromeWave49Ok ? '✓' : '✗'} Launch checklist: light chrome wave 49`);
if (!lightChromeWave49Ok) failed += 1;

const lightStudiosWave50Ok =
  launchSnapshot.includes('sitewide_light_studios_wave50') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CW') &&
  fs.readFileSync(path.join(root, 'src/components/chat/FinelyCommunicationHub.tsx'), 'utf8').includes('data-fc-comms-shell="1"');
console.log(`${lightStudiosWave50Ok ? '✓' : '✗'} Launch checklist: light studios wave 50`);
if (!lightStudiosWave50Ok) failed += 1;

const lightHarmonyWave51Ok =
  launchSnapshot.includes('sitewide_light_harmony_wave51') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CX') &&
  fs.readFileSync(path.join(root, 'src/features/os/finelyOsLightUi.ts'), 'utf8').includes('FINELY_OS_LIGHT_TOOLTIP');
console.log(`${lightHarmonyWave51Ok ? '✓' : '✗'} Launch checklist: CK harmony wave 51`);
if (!lightHarmonyWave51Ok) failed += 1;

const lightResidueWave52Ok =
  launchSnapshot.includes('sitewide_light_residue_wave52') &&
  fs.readFileSync(path.join(root, 'src/index.css'), 'utf8').includes('Part CY') &&
  fs.readFileSync(path.join(root, 'src/components/landing/index.tsx'), 'utf8').includes('hover:brightness');
console.log(`${lightResidueWave52Ok ? '✓' : '✗'} Launch checklist: light residue wave 52`);
if (!lightResidueWave52Ok) failed += 1;

const socialOsWave53Ok =
  launchSnapshot.includes('social_os_sop_wave53') &&
  fs.readFileSync(path.join(root, 'src/domain/socialContentSop.ts'), 'utf8').includes('sop-business-vendor-ladder') &&
  fs.readFileSync(path.join(root, 'src/features/social/SocialWorkflowWeekStrip.tsx'), 'utf8').includes('listSocialWeeklyWorkflow') &&
  fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8').includes('FinelyOsPaginatedStack');
console.log(`${socialOsWave53Ok ? '✓' : '✗'} Launch checklist: Social OS SOP wave 53`);
if (!socialOsWave53Ok) failed += 1;

const adminUxOk =
  dashboard.includes("navigate('/admin/crm')") &&
  dashboard.includes('Admin command center') &&
  dashboard.includes("navigate('/admin/workflow')");
console.log(`${adminUxOk ? '✓' : '✗'} Dashboard: admin command strip + leads KPI → CRM`);
if (!adminUxOk) failed += 1;

const socialHubPage = fs.readFileSync(path.join(root, 'src/pages/admin/AdminSocialHubPage.tsx'), 'utf8');
const metaRepoOk =
  socialHubPage.includes('loadMetaIntegrationConfig') &&
  socialHubPage.includes('saveMetaIntegrationConfig') &&
  socialHubPage.includes('isMetaIntegrationLive');
console.log(`${metaRepoOk ? '✓' : '✗'} AdminSocialHubPage: shared metaIntegrationRepo + demo banner`);
if (!metaRepoOk) failed += 1;

const monitoring = fs.readFileSync(path.join(root, 'src/pages/admin/AdminMonitoringPage.tsx'), 'utf8');
const monitoringEmptyOk = monitoring.includes('FinelyOsEmptyState') && monitoring.includes('No edge events yet');
console.log(`${monitoringEmptyOk ? '✓' : '✗'} AdminMonitoringPage: empty-state CTA for event stream`);
if (!monitoringEmptyOk) failed += 1;

const leadsOs = fs.readFileSync(path.join(root, 'src/pages/admin/AdminLeadsOsPage.tsx'), 'utf8');
const metaDemoOk = leadsOs.includes('isMetaIntegrationLive') && leadsOs.includes('Meta integration is not live');
console.log(`${metaDemoOk ? '✓' : '✗'} AdminLeadsOsPage: Meta demo banner on social tab`);
if (!metaDemoOk) failed += 1;

const tourManifest = fs.readFileSync(path.join(root, 'src/config/tourManifest.ts'), 'utf8');
const platformSops = fs.readFileSync(path.join(root, 'src/domain/platformSops.ts'), 'utf8');
const launchHelpStrip = fs.readFileSync(path.join(root, 'src/components/tours/FinelyLaunchHelpStrip.tsx'), 'utf8');
const launchOsOk =
  launchSnapshot.includes('launch_os_proactive_strips') &&
  launchSnapshot.includes('launch_os_noticed_strips') &&
  launchSnapshot.includes('launch_os_tour_resources') &&
  fs.readFileSync(path.join(root, 'src/pages/ResourcesPage.tsx'), 'utf8').includes('TOUR_MANIFEST') &&
  tourManifest.includes('tour-fundability-readiness') &&
  tourManifest.includes('tour-portal-my-tasks') &&
  platformSops.includes("relatedTourId: 'tour-fundability-readiness'") &&
  platformSops.includes("relatedTourId: 'tour-portal-my-tasks'") &&
  launchHelpStrip.includes('/personal-credit') &&
  fs.existsSync(path.join(root, 'scripts/prerender-tour-narration.mjs')) &&
  fs.existsSync(path.join(root, 'scripts/audit-launch-noticed-strips.mjs'));
console.log(`${launchOsOk ? '✓' : '✗'} Launch OS: tours + SOP links + help strip + voice prerender scripts`);
if (!launchOsOk) failed += 1;

const launchOsAuditOk =
  fs.readFileSync(path.join(root, 'scripts/audit-launch-noticed-strips.mjs'), 'utf8').includes('PersonalCreditPage') &&
  fs.readFileSync(path.join(root, 'scripts/audit-launch-noticed-strips.mjs'), 'utf8').includes('portal/index.tsx') &&
  fs.readFileSync(path.join(root, 'scripts/audit-launch-proactive-strips.mjs'), 'utf8').includes('FundabilityReadinessPage') &&
  fs.existsSync(path.join(root, 'scripts/audit-launch-sop-tours.mjs'));
console.log(`${launchOsAuditOk ? '✓' : '✗'} Launch OS: proactive + noticed + SOP tour audit scripts`);
if (!launchOsAuditOk) failed += 1;

const onboardingNoticedOk =
  fs.readFileSync(path.join(root, 'src/components/portal/index.tsx'), 'utf8').includes('buildOnboardingMonitoringNoticedItems') &&
  fs.readFileSync(path.join(root, 'src/components/PortalSteps.jsx'), 'utf8').includes('FinelyNoticedStrip') &&
  fs.readFileSync(path.join(root, 'src/components/PortalSteps.jsx'), 'utf8').includes('What holds your');
console.log(`${onboardingNoticedOk ? '✓' : '✗'} Launch OS: onboarding BureauSync Finely-noticed strip + plain language`);
if (!onboardingNoticedOk) failed += 1;

const seniorUxOk =
  launchSnapshot.includes('launch_os_senior_ux') &&
  launchSnapshot.includes('launch_os_module_playbooks') &&
  launchSnapshot.includes('launch_os_letter_agent_chain') &&
  launchSnapshot.includes('launch_os_plain_language') &&
  launchSnapshot.includes('launch_os_sprint_code_complete') &&
  fs.existsSync(path.join(root, 'scripts/audit-senior-ux.mjs')) &&
  fs.existsSync(path.join(root, 'scripts/audit-plain-language.mjs')) &&
  fs.readFileSync(path.join(root, 'scripts/audit-senior-ux.mjs'), 'utf8').includes('PersonalCreditPage') &&
  fs.readFileSync(path.join(root, 'src/components/layout/PageShell.tsx'), 'utf8').includes('fc-senior-simple') &&
  fs.existsSync(path.join(root, 'docs/LAUNCH-READY-SPRINT.md')) &&
  fs.existsSync(path.join(root, 'src/config/modulePlaybooks.ts')) &&
  fs.existsSync(path.join(root, 'src/lib/letterAgentChain.ts')) &&
  fs.existsSync(path.join(root, 'src/data/aiActionAuditLog.ts')) &&
  fs.readFileSync(path.join(root, 'src/components/tours/FinelyLaunchHelpStrip.tsx'), 'utf8').includes('useFinelyVoiceInput');
console.log(`${seniorUxOk ? '✓' : '✗'} Launch OS: senior UX audit + handoff doc`);
if (!seniorUxOk) failed += 1;

console.log('\nRunning typecheck…');
const tc = spawnSync('npm', ['run', 'typecheck'], { cwd: root, shell: true, stdio: 'inherit' });
if (tc.status !== 0) {
  console.log('✗ typecheck failed');
  failed += 1;
} else {
  console.log('✓ typecheck passed');
}

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll critical path checks passed.');
process.exit(failed ? 1 : 0);
