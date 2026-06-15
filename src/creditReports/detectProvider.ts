import type { CreditReportProvider } from '../domain/creditReports';

export function detectProviderFromHtml(html: string): CreditReportProvider {
  const h = html.toLowerCase();
  // IdentityIQ
  if (
    h.includes('identityiq') ||
    h.includes('member.identityiq.com') ||
    h.includes('identityiq.com/sc-') ||
    h.includes('identityiq.com/secure')
  ) {
    return 'identityiq';
  }
  // MyScoreIQ
  if (
    h.includes('myscoreiq') ||
    h.includes('member.myscoreiq.com') ||
    h.includes('myscoreiq.com/get-fico') ||
    h.includes('myscoreiq.com/business-credit')
  ) {
    return 'myscoreiq';
  }
  return 'unknown';
}

export function detectProviderFromText(text: string): CreditReportProvider {
  const h = (text || '').toLowerCase();
  if (
    h.includes('identityiq') ||
    h.includes('member.identityiq.com') ||
    h.includes('identity iq') ||
    h.includes('id iq')
  ) {
    return 'identityiq';
  }
  if (
    h.includes('myscoreiq') ||
    h.includes('member.myscoreiq.com') ||
    h.includes('my score iq') ||
    h.includes('score iq')
  ) {
    return 'myscoreiq';
  }
  return 'unknown';
}

