export type LegacyFileKind =
  | 'credit_report'
  | 'dispute_letter'
  | 'validation_letter'
  | 'affidavit'
  | 'government_id'
  | 'proof_of_address'
  | 'ssn_card'
  | 'other_evidence';

export type LegacyFileClassification = {
  kind: LegacyFileKind;
  tag: string;
  caption: string;
  letterType?: 'dispute' | 'validation';
  letterTitle?: string;
};

function norm(fileName: string): string {
  return fileName.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => hay.includes(n));
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Legacy letter';
}

/**
 * Heuristic classifier for Laravel `doc_files` rows — most partner uploads are
 * dispute letters, credit reports, validation letters, or affidavits, not IDs.
 */
export function classifyLegacyFileName(fileName: string): LegacyFileClassification {
  const raw = String(fileName || '').trim();
  const n = norm(raw);
  const ext = raw.includes('.') ? raw.split('.').pop()?.toLowerCase() ?? '' : '';

  if (
    includesAny(n, [
      'credit report',
      'creditreport',
      'cr report',
      'tri merge',
      'tri-merge',
      '3 bureau',
      '3b report',
      '3-bureau',
      'smartcredit',
      'smart credit',
      'identityiq',
      'identity iq',
      'myfico',
      'my fico',
      'annual credit',
      'report exp',
      'report eqf',
      'report tuc',
      'experian report',
      'equifax report',
      'transunion report',
      'trans union report',
      'html report',
      'credit snapshot',
      'score tracker',
      'fico score',
      'vantage score',
      'bureau report',
      'merged report',
      'pull report',
    ]) ||
    (ext === 'html' && includesAny(n, ['report', 'exp', 'eqf', 'tuc', 'bureau', 'credit'])) ||
    (ext === 'pdf' && includesAny(n, ['experian', 'equifax', 'transunion', 'trans union']) && !includesAny(n, ['letter', 'dispute', 'validation'])) ||
    /\b(exp|eqf|tuc)\b.*\.(pdf|html|htm)$/i.test(raw) ||
    /^(exp|eqf|tuc)[\s._-]/i.test(raw)
  ) {
    return {
      kind: 'credit_report',
      tag: 'credit-report',
      caption: 'Legacy credit report — re-upload file from old server archive',
    };
  }

  if (includesAny(n, ['affidavit', 'notarized', 'fcra affidavit', 'identity theft affidavit'])) {
    return {
      kind: 'affidavit',
      tag: 'affidavit',
      caption: 'Legacy affidavit — re-upload file from old server archive',
      letterType: 'dispute',
      letterTitle: titleFromFileName(raw),
    };
  }

  if (
    includesAny(n, [
      'validation',
      'debt validation',
      'dv letter',
      '609 letter',
      '609 dispute',
      'collection letter',
      'pay for delete',
      'settlement letter',
      'cease and desist',
      'cease & desist',
    ])
  ) {
    return {
      kind: 'validation_letter',
      tag: 'validation-letter',
      caption: 'Legacy validation / debt letter — re-upload file from old server archive',
      letterType: 'validation',
      letterTitle: titleFromFileName(raw),
    };
  }

  if (
    includesAny(n, [
      'dispute letter',
      'deletion letter',
      'letter to bureau',
      'letter to exp',
      'letter to eqf',
      'letter to tuc',
      'round 1',
      'round 2',
      'round 3',
      'round one',
      'round two',
      'credit repair letter',
      'bureau letter',
      'exp letter',
      'eqf letter',
      'tuc letter',
      'generate letter',
      'dispute exp',
      'dispute eqf',
      'dispute tuc',
      'dispute to',
    ]) ||
    /\bround\s*\d\b/.test(n) ||
    /\bletter\b.*\b(exp|eqf|tuc|bureau)\b/.test(n)
  ) {
    return {
      kind: 'dispute_letter',
      tag: 'dispute-letter',
      caption: 'Legacy dispute letter — re-upload file from old server archive',
      letterType: 'dispute',
      letterTitle: titleFromFileName(raw),
    };
  }

  if (
    includesAny(n, [
      'driver license',
      'drivers license',
      "driver's license",
      'dl front',
      'dl back',
      'passport',
      'state id',
      'id card',
      'photo id',
      'identification card',
    ]) &&
    !includesAny(n, ['validation', 'identity theft'])
  ) {
    return {
      kind: 'government_id',
      tag: 'government-id',
      caption: 'Legacy government ID — re-upload file from old server archive',
    };
  }

  if (includesAny(n, ['ssn', 'social security', 'social-security', 'ss card', 'sscard'])) {
    return {
      kind: 'ssn_card',
      tag: 'ssn-card',
      caption: 'Legacy SSN card image — re-upload file from old server archive',
    };
  }

  if (
    includesAny(n, [
      'utility bill',
      'bank statement',
      'proof of address',
      'proof of residence',
      'lease agreement',
      'pay stub',
      'paystub',
    ])
  ) {
    return {
      kind: 'proof_of_address',
      tag: 'proof-of-address',
      caption: 'Legacy proof of address — re-upload file from old server archive',
    };
  }

  return {
    kind: 'other_evidence',
    tag: 'legacy-document',
    caption: 'Legacy partner document — re-upload file from old server archive',
  };
}
