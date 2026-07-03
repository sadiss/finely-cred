/** Derive Supabase edge function URLs from VITE_SUPABASE_URL for go-live wiring. */

export function getSupabaseProjectUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return url?.trim() ? url.replace(/\/$/, '') : null;
}

export function buildEdgeFunctionUrl(functionName: string): string | null {
  const base = getSupabaseProjectUrl();
  if (!base) return null;
  return `${base}/functions/v1/${functionName}`;
}

export type ProductionEdgeEndpoint = {
  id: string;
  label: string;
  path: string;
  url: string;
  copyHint: string;
};

export function listProductionEdgeEndpoints(): ProductionEdgeEndpoint[] {
  const emailWebhook = buildEdgeFunctionUrl('email-webhook');
  const oauthCallback = buildEdgeFunctionUrl('comms-oauth-callback');
  if (!emailWebhook || !oauthCallback) return [];

  return [
    {
      id: 'email_webhook_resend',
      label: 'Email webhook — Resend',
      path: '/functions/v1/email-webhook?provider=resend',
      url: `${emailWebhook}?provider=resend`,
      copyHint: 'Resend dashboard → Webhooks → POST this URL',
    },
    {
      id: 'email_webhook_sendgrid',
      label: 'Email webhook — SendGrid',
      path: '/functions/v1/email-webhook?provider=sendgrid',
      url: `${emailWebhook}?provider=sendgrid`,
      copyHint: 'SendGrid → Mail Settings → Event Webhook',
    },
    {
      id: 'email_webhook_ses',
      label: 'Email webhook — AWS SES',
      path: '/functions/v1/email-webhook?provider=ses',
      url: `${emailWebhook}?provider=ses`,
      copyHint: 'SES → Configuration set → Event destination',
    },
    {
      id: 'comms_oauth_outlook',
      label: 'Comms OAuth callback — Outlook',
      path: '/functions/v1/comms-oauth-callback?provider=outlook',
      url: `${oauthCallback}?provider=outlook`,
      copyHint: 'Azure App → Redirect URI (also register SPA URI in Comms Settings)',
    },
    {
      id: 'comms_oauth_gmail',
      label: 'Comms OAuth callback — Gmail',
      path: '/functions/v1/comms-oauth-callback?provider=gmail',
      url: `${oauthCallback}?provider=gmail`,
      copyHint: 'Google Cloud Console → OAuth redirect URI',
    },
    {
      id: 'comms_oauth_zoho',
      label: 'Comms OAuth callback — Zoho',
      path: '/functions/v1/comms-oauth-callback?provider=zoho',
      url: `${oauthCallback}?provider=zoho`,
      copyHint: 'Zoho API console → Authorized redirect URI',
    },
  ];
}

export function buildProductionDeployCommandBundle(): string {
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  const lines = [
    '# Finely Cred — production deploy bundle',
    'supabase db push',
    'supabase functions deploy email-webhook',
    'supabase functions deploy comms-oauth-callback',
    `supabase secrets set FINELY_SITE_URL=${siteUrl}`,
    'supabase secrets set SENDGRID_API_KEY=… TWILIO_ACCOUNT_SID=… TWILIO_AUTH_TOKEN=… SMS_SENDER_ID=…',
    '# Optional enterprise OAuth:',
    'supabase secrets set OUTLOOK_CLIENT_ID=… OUTLOOK_CLIENT_SECRET=… GMAIL_CLIENT_ID=… GMAIL_CLIENT_SECRET=…',
    '',
    '# Wire provider webhooks to:',
    ...listProductionEdgeEndpoints()
      .filter((e) => e.id.startsWith('email_webhook'))
      .map((e) => `# ${e.label}: ${e.url}`),
  ];
  return lines.join('\n');
}
