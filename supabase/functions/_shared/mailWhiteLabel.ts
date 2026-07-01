/** White-label mail — public provider id returned to clients (never vendor names). */
export const PUBLIC_MAIL_PROVIDER = 'finely' as const;

export function publicMailProvider(): typeof PUBLIC_MAIL_PROVIDER {
  return PUBLIC_MAIL_PROVIDER;
}

/** Scrub vendor names from error text that may reach end users. */
export function sanitizeMailUserMessage(message: string): string {
  return message
    .replace(/letterstream/gi, 'mail service')
    .replace(/\blob\.com\b/gi, 'mail service')
    .replace(/\blob\b/gi, 'mail service')
    .replace(/LETTERSTREAM_[A-Z_]+/g, 'MAIL_API_*')
    .replace(/LOB_API_KEY/g, 'MAIL_API_KEY');
}
