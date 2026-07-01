/**
 * White-label physical mail — vendor names must never appear in UI, agent copy, or client API payloads.
 */
export const FINELY_MAIL_PROVIDER = 'finely' as const;

export type FinelyMailProvider = typeof FINELY_MAIL_PROVIDER;

/** Normalize legacy stored values (`lob`, etc.) to the public brand id. */
export function normalizeMailProvider(_raw?: string | null): FinelyMailProvider {
  return FINELY_MAIL_PROVIDER;
}

export const FINELY_MAIL_COPY = {
  serviceName: 'Finely Mail',
  sendSubtitle: 'Send this PDF via US mail directly from Finely Cred.',
  creditsEstimate: 'Finely Mail estimate',
  adminSecretsHint:
    'Set MAIL_API_ID and MAIL_API_KEY in Supabase edge secrets. Maintain prepaid balance in your mail account billing.',
  adminFeatureSecrets: 'MAIL_API_ID, MAIL_API_KEY (edge)',
  humanConfirm: 'Physical mail always requires human confirm in Letter Studio.',
  humanReviewBeforeSend: 'Human review required before physical mail send.',
  evidenceGatesConfirm: 'Evidence gates passed — confirm mail send in Letter Studio.',
  agentNeverAutoSend:
    'Never approve physical mail send without evidence gates passing.',
} as const;
