/**
 * Twilio + Phone Hub production readiness — webhook URLs and go-live checklist.
 */

import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { getCommsSettings } from '../data/settingsRepo';

export type PhoneProductionCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
};

export function buildTwilioWebhookUrl(): string | null {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return null;
  return `${url}/functions/v1/twilio-webhook`;
}

export function getPhoneProductionChecks(): PhoneProductionCheck[] {
  const webhookUrl = buildTwilioWebhookUrl();
  const comms = getCommsSettings();
  const fromPhone = (comms.twilioFromPhone ?? '').trim();
  const commsOn = isFeatureEnabled('commsDelivery');

  return [
    {
      id: 'supabase',
      label: 'Supabase project linked',
      ok: isSupabaseConfigured,
      hint: isSupabaseConfigured
        ? 'Edge functions can receive Twilio webhooks.'
        : 'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local.',
    },
    {
      id: 'webhook_deploy',
      label: 'twilio-webhook function deployed',
      ok: Boolean(webhookUrl),
      hint: webhookUrl
        ? 'Run npm run deploy:functions — twilio-webhook is in the launch subset.'
        : 'Configure Supabase URL first, then deploy edge functions.',
    },
    {
      id: 'twilio_console',
      label: 'Twilio Console webhooks',
      ok: Boolean(webhookUrl),
      hint: webhookUrl
        ? `Paste ${webhookUrl} as SMS + Voice webhook (POST) on your Twilio number.`
        : 'Webhook URL appears when Supabase is configured.',
    },
    {
      id: 'from_phone',
      label: 'Twilio from number configured',
      ok: Boolean(fromPhone),
      hint: fromPhone
        ? `Outbound SMS/calls use ${fromPhone}.`
        : 'Admin → Settings → Comms → set twilioFromPhone.',
    },
    {
      id: 'comms_delivery',
      label: 'Comms Delivery enabled',
      ok: commsOn,
      hint: commsOn
        ? 'Live SMS send is enabled.'
        : 'Enable commsDelivery in Admin → Settings for outbound SMS.',
    },
    {
      id: 'edge_secrets',
      label: 'Twilio edge secrets (server)',
      ok: isSupabaseConfigured,
      hint: 'Set TWILIO_AUTH_TOKEN (+ optional TWILIO_FROM_PHONE) as Supabase function secrets before go-live.',
    },
  ];
}

export function isPhoneProductionReady(): boolean {
  const checks = getPhoneProductionChecks();
  return checks.every((c) => c.id === 'edge_secrets' || c.ok);
}

export function summarizePhoneProductionForCoOwner(): string {
  const checks = getPhoneProductionChecks();
  const webhook = buildTwilioWebhookUrl();
  const lines = checks.map((c) => `- [${c.ok ? 'OK' : 'TODO'}] ${c.label}: ${c.hint}`);
  return [
    'Phone Hub production readiness:',
    webhook ? `Webhook URL: ${webhook}` : 'Webhook URL: configure Supabase first.',
    ...lines,
  ].join('\n');
}
