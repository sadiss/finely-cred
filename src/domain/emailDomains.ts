/** Outbound email domain + signature configuration (Comms OS). */
export type EmailDomain = {
  id: string;
  label: string;
  /** DNS domain (e.g. finelycred.com) — verify in SendGrid before live sends. */
  domain: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  /** Optional link branding base (defaults to comms appBaseUrl). */
  linkBaseUrl?: string;
  isDefault?: boolean;
  /** Mark verified once SendGrid domain authentication is complete. */
  verified?: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailSignature = {
  id: string;
  domainId: string;
  label: string;
  personaName: string;
  title?: string;
  phone?: string;
  /** HTML block (inline styles) appended to outbound HTML emails. */
  htmlBlock: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmailDomainsStore = {
  domains: EmailDomain[];
  signatures: EmailSignature[];
};
