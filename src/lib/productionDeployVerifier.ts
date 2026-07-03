import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled, getCommsSettings } from '../data/settingsRepo';
import {
  isDisputeRoundCommsLive,
  isBankruptcyLaneCommsAutoEnabled,
  loadCommsEmailProvidersConfig,
} from '../data/commsEmailProviderRepo';
import { listCommsTemplates } from '../data/commsRepo';
import { listEmailWebhookEvents } from '../data/commsWebhookRepo';
import { countProfessionalCommsTemplates } from '../data/commsProfessionalTemplateSeed';
import { isMetaIntegrationLive, loadMetaIntegrationConfig } from '../data/metaIntegrationRepo';
import type { GoLiveDeployStep } from '../data/productionGoLiveChecklist';
import { PRODUCTION_GO_LIVE_STEPS } from '../data/productionGoLiveChecklist';
import { getSupabaseProjectUrl } from './productionEdgeUrls';

export type DeployStepVerification = {
  id: string;
  autoOk: boolean | null;
  autoDetail: string;
};

function oauthProviderConnected(): boolean {
  const cfg = loadCommsEmailProvidersConfig();
  return ['outlook', 'gmail', 'zoho'].some((id) => cfg.providers[id as keyof typeof cfg.providers]?.status === 'connected');
}

export function verifyProductionDeployStep(stepId: string): DeployStepVerification {
  const comms = getCommsSettings();
  const templates = listCommsTemplates();
  const proCount = countProfessionalCommsTemplates();
  const webhooks = listEmailWebhookEvents(5);
  const meta = loadMetaIntegrationConfig();

  switch (stepId) {
    case 'migration_comms':
      return {
        id: stepId,
        autoOk: isSupabaseConfigured ? true : null,
        autoDetail: isSupabaseConfigured
          ? 'Supabase client configured — run db push against your linked project'
          : 'Cannot verify migration without Supabase project link',
      };
    case 'deploy_email_webhook':
    case 'deploy_comms_oauth':
      return {
        id: stepId,
        autoOk: getSupabaseProjectUrl() ? null : null,
        autoDetail: getSupabaseProjectUrl()
          ? 'Use Production URLs panel — edge probe runs on Integration Hub load'
          : 'Set VITE_SUPABASE_URL to enable edge URL builder + probes',
      };
    case 'env_site_url':
      return {
        id: stepId,
        autoOk: Boolean(loadCommsEmailProvidersConfig().productionSiteUrl?.trim()),
        autoDetail: loadCommsEmailProvidersConfig().productionSiteUrl
          ? `Production site URL in Comms Settings: ${loadCommsEmailProvidersConfig().productionSiteUrl}`
          : 'Set FINELY_SITE_URL secret + production site URL in Comms Settings',
      };
    case 'env_comms_secrets':
      return {
        id: stepId,
        autoOk: isFeatureEnabled('commsDelivery') && Boolean(comms.sendgridFromEmail?.trim()),
        autoDetail: isFeatureEnabled('commsDelivery')
          ? comms.sendgridFromEmail
            ? `From address set: ${comms.sendgridFromEmail}`
            : 'commsDelivery on — set from-address in Settings'
          : 'Enable commsDelivery feature flag + set edge secrets',
      };
    case 'env_oauth_clients':
      return {
        id: stepId,
        autoOk: oauthProviderConnected(),
        autoDetail: oauthProviderConnected()
          ? 'At least one OAuth provider connected in Comms Settings'
          : 'Optional — connect Outlook/Gmail/Zoho when enterprise send-as is ready',
      };
    case 'wire_email_webhook':
      return {
        id: stepId,
        autoOk: webhooks.length > 0,
        autoDetail: webhooks.length
          ? `${webhooks.length} recent webhook event(s) ingested`
          : 'No webhook events yet — wire provider to /functions/v1/email-webhook',
      };
    case 'meta_oauth':
      return {
        id: stepId,
        autoOk: isMetaIntegrationLive(),
        autoDetail: isMetaIntegrationLive()
          ? `${meta.connectedPages.length} Meta page(s) live`
          : meta.status === 'connected'
            ? 'Meta connected — verify webhook'
            : 'Optional — connect in Social Hub Settings',
      };
    case 'enable_live_comms':
      return {
        id: stepId,
        autoOk: isFeatureEnabled('commsDelivery') && isDisputeRoundCommsLive(),
        autoDetail: `Live delivery ${isDisputeRoundCommsLive() ? 'on' : 'off'} · bankruptcy auto ${isBankruptcyLaneCommsAutoEnabled() ? 'on' : 'off'} · ${templates.length} templates (${proCount} professional)`,
      };
    default:
      return { id: stepId, autoOk: null, autoDetail: 'Manual verification required' };
  }
}

export function verifyAllProductionDeploySteps(): DeployStepVerification[] {
  return PRODUCTION_GO_LIVE_STEPS.map((s) => verifyProductionDeployStep(s.id));
}

export function countAutoVerifiedRequiredSteps(steps: GoLiveDeployStep[] = PRODUCTION_GO_LIVE_STEPS): {
  verified: number;
  required: number;
} {
  const required = steps.filter((s) => s.required);
  const verified = required.filter((s) => verifyProductionDeployStep(s.id).autoOk === true).length;
  return { verified, required: required.length };
}
