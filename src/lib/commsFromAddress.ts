import { getCommsSettings } from '../data/settingsRepo';
import { getDefaultEmailDomain, getEmailDomain } from '../data/emailDomainsRepo';

export type ResolvedFromAddress = {
  email: string;
  name: string;
  replyTo?: string;
  domainId?: string;
  linkBaseUrl?: string;
};

/** Resolve SendGrid from/reply-to using multi-domain config with settings fallback. */
export function resolveEmailFromAddress(domainId?: string): ResolvedFromAddress {
  const comms = getCommsSettings();
  const domain = domainId ? getEmailDomain(domainId) : getDefaultEmailDomain();

  if (domain) {
    return {
      email: domain.fromEmail || comms.sendgridFromEmail || '',
      name: domain.fromName || comms.sendgridFromName || 'Finely Cred',
      replyTo: domain.replyToEmail,
      domainId: domain.id,
      linkBaseUrl: domain.linkBaseUrl || comms.appBaseUrl,
    };
  }

  return {
    email: comms.sendgridFromEmail || '',
    name: comms.sendgridFromName || 'Finely Cred',
    linkBaseUrl: comms.appBaseUrl,
  };
}
