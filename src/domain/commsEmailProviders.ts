/** Enterprise email provider adapters — Outlook, Gmail, Zoho, native Finely delivery. */

export type CommsEmailProviderId = 'finely_native' | 'outlook' | 'gmail' | 'zoho';

export type CommsEmailProviderStatus = 'connected' | 'disconnected' | 'pending_oauth' | 'error';

export type CommsEmailProviderConfig = {
  id: CommsEmailProviderId;
  label: string;
  description: string;
  /** OAuth or SMTP bridge */
  connectionMode: 'oauth' | 'smtp' | 'api';
  status: CommsEmailProviderStatus;
  fromAddresses: string[];
  replyTo?: string;
  signatureHtml?: string;
  calendarBridge?: boolean;
  sharedMailbox?: boolean;
  lastSyncAt?: string;
  errorMessage?: string;
};

export const COMMS_EMAIL_PROVIDERS: CommsEmailProviderConfig[] = [
  {
    id: 'finely_native',
    label: 'Finely Cred (SendGrid)',
    description: 'Default transactional + marketing delivery with DKIM, bounce handling, and Velvet Hammer compliance gate.',
    connectionMode: 'api',
    status: 'connected',
    fromAddresses: ['noreply@finelycred.com', 'support@finelycred.com'],
    calendarBridge: false,
    sharedMailbox: false,
  },
  {
    id: 'outlook',
    label: 'Microsoft Outlook / 365',
    description: 'Send-as shared mailboxes, calendar invites, read receipts, and enterprise routing for credit specialists.',
    connectionMode: 'oauth',
    status: 'pending_oauth',
    fromAddresses: [],
    calendarBridge: true,
    sharedMailbox: true,
  },
  {
    id: 'gmail',
    label: 'Google Workspace (Gmail)',
    description: 'Gmail + Google Calendar bridges, alias send-as, and team inbox mirroring for partner success.',
    connectionMode: 'oauth',
    status: 'pending_oauth',
    fromAddresses: [],
    calendarBridge: true,
    sharedMailbox: true,
  },
  {
    id: 'zoho',
    label: 'Zoho Mail / CRM',
    description: 'Zoho Mail + CRM sync for sequences, deal-stage triggers, and specialist assignment routing.',
    connectionMode: 'oauth',
    status: 'pending_oauth',
    fromAddresses: [],
    calendarBridge: true,
    sharedMailbox: true,
  },
];

export function providerLabel(id: CommsEmailProviderId): string {
  return COMMS_EMAIL_PROVIDERS.find((p) => p.id === id)?.label ?? id;
}

export function providerBadgeTone(id: CommsEmailProviderId): string {
  switch (id) {
    case 'outlook':
      return 'text-sky-300 border-sky-500/30 bg-sky-500/10';
    case 'gmail':
      return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
    case 'zoho':
      return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
    default:
      return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  }
}
