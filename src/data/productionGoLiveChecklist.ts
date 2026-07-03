/** Production deploy checklist — copy-paste commands for go-live. */

export type GoLiveDeployStep = {
  id: string;
  title: string;
  detail: string;
  command?: string;
  href?: string;
  required: boolean;
};

export const PRODUCTION_GO_LIVE_STEPS: GoLiveDeployStep[] = [
  {
    id: 'migration_comms',
    title: 'Run comms integration migration',
    detail: 'Creates comms_send_logs + email_webhook_events tables with admin RLS.',
    command: 'supabase db push',
    required: true,
  },
  {
    id: 'deploy_email_webhook',
    title: 'Deploy email-webhook edge function',
    detail: 'Resend / SendGrid / SES delivery events → email_webhook_events.',
    command: 'supabase functions deploy email-webhook',
    required: true,
  },
  {
    id: 'deploy_comms_oauth',
    title: 'Deploy comms-oauth-callback edge function',
    detail: 'Outlook / Gmail / Zoho OAuth code exchange (register redirect URIs in Comms Settings).',
    command: 'supabase functions deploy comms-oauth-callback',
    required: true,
  },
  {
    id: 'env_site_url',
    title: 'Set FINELY_SITE_URL secret',
    detail: 'OAuth callback redirect target for comms-oauth-callback edge function.',
    command: 'supabase secrets set FINELY_SITE_URL=https://finelycred.com',
    required: true,
  },
  {
    id: 'env_comms_secrets',
    title: 'Set comms delivery secrets',
    detail: 'SENDGRID_API_KEY, TWILIO_*, SMS_SENDER_ID in Supabase Edge secrets.',
    command: 'supabase secrets set SENDGRID_API_KEY=… TWILIO_ACCOUNT_SID=… TWILIO_AUTH_TOKEN=…',
    required: true,
  },
  {
    id: 'env_oauth_clients',
    title: 'Set OAuth client IDs (optional)',
    detail: 'OUTLOOK_CLIENT_ID, GMAIL_CLIENT_ID, ZOHO_CLIENT_ID + secrets for enterprise send-as.',
    command: 'supabase secrets set OUTLOOK_CLIENT_ID=… OUTLOOK_CLIENT_SECRET=…',
    required: false,
  },
  {
    id: 'wire_email_webhook',
    title: 'Wire provider webhooks',
    detail: 'Point Resend/SendGrid/SES to https://YOUR_PROJECT.supabase.co/functions/v1/email-webhook',
    href: '/admin/integrations',
    required: true,
  },
  {
    id: 'meta_oauth',
    title: 'Register Meta OAuth redirect URIs',
    detail: 'Copy URIs from Comms Settings or Social Hub → Settings.',
    href: '/admin/social-hub?tab=settings',
    required: false,
  },
  {
    id: 'enable_live_comms',
    title: 'Enable live dispute + bankruptcy comms',
    detail: 'Comms Settings → toggle Live delivery + verify automation flags.',
    href: '/admin/comms?room=settings',
    required: true,
  },
];
