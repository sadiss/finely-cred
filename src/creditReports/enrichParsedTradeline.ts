import type { Bureau, ParsedTradeline, PaymentHistory2Y, TradelineRow } from '../domain/creditReports';
import { looksLikeMailingAddress, looksLikePhone } from './creditorContactExtract';

function parseMoney(s: string | undefined): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[, ]/g, '').replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function firstValue(row: TradelineRow | undefined): string | undefined {
  if (!row?.byBureau) return undefined;
  const v = row.byBureau.EXP ?? row.byBureau.TUC ?? row.byBureau.EQF;
  return (v ?? '').trim() || undefined;
}

function maskAccount(s: string | undefined): string | undefined {
  if (!s || s.length < 4) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '*'.repeat(Math.min(digits.length - 4, 8)) + digits.slice(-4);
}

function findField(t: ParsedTradeline, ...labels: string[]): TradelineRow | undefined {
  const lower = (x: string) => x.toLowerCase();
  for (const label of labels) {
    const row = t.fields.find((f) => lower(f.label).includes(lower(label)));
    if (row) return row;
  }
  return undefined;
}

/** Prefer real mailing/contact address rows; never treat "Original Creditor" name as an address. */
function findCreditorAddressField(t: ParsedTradeline): TradelineRow | undefined {
  const preferred = [
    'creditor address',
    'collector address',
    'mailing address',
    'contact address',
    'subscriber address',
    'furnisher address',
    'business address',
  ];
  for (const label of preferred) {
    const row = findField(t, label);
    const v = firstValue(row);
    if (v && (looksLikeMailingAddress(v) || /\d/.test(v))) return row;
  }
  for (const f of t.fields || []) {
    const s = (f.label || '').toLowerCase();
    if (!s.includes('address')) continue;
    if (/previous|former|prior|consumer|borrower|personal|employer/.test(s)) continue;
    const v = firstValue(f);
    if (v && (looksLikeMailingAddress(v) || (/\d/.test(v) && v.length >= 8))) return f;
  }
  return undefined;
}

function findCreditorPhoneField(t: ParsedTradeline): TradelineRow | undefined {
  const preferred = ['creditor phone', 'collector phone', 'customer service', 'telephone', 'phone number'];
  for (const label of preferred) {
    const row = findField(t, label);
    const v = firstValue(row);
    if (v && looksLikePhone(v)) return row;
  }
  for (const f of t.fields || []) {
    const s = (f.label || '').toLowerCase();
    if (!/\bphone\b|telephone/.test(s)) continue;
    if (/consumer|borrower|personal|home|mobile|cell/.test(s)) continue;
    const v = firstValue(f);
    if (v && looksLikePhone(v)) return f;
  }
  return undefined;
}

function parsePaymentHistoryFromCodesString(byBureauText: Partial<Record<Bureau, string>>): PaymentHistory2Y | undefined {
  const tokensFrom = (raw: string) => {
    const s = (raw || '')
      .replace(/[|,;/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!s) return [];

    const scrubbed = s
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = scrubbed.split(' ').map((p) => p.trim()).filter(Boolean);
    const allowed = new Set(['OK', 'CUR', 'CURRENT', '--', '-', '30', '60', '90', '120', 'CO', 'C/O', 'CL', 'COL']);
    const out: string[] = [];
    for (const p of parts) {
      const up = p.toUpperCase();
      if (allowed.has(up)) out.push(up === 'CUR' || up === 'CURRENT' ? 'OK' : up === 'C/O' ? 'CO' : up);
      else if (/^(OK|CO|CL|COL|30|60|90|120)$/i.test(p)) out.push(up);
      if (out.length >= 36) break;
    }
    return out;
  };

  const byBureau: Partial<Record<Bureau, { code: string }[]>> = {};
  let maxLen = 0;
  (['TUC', 'EXP', 'EQF'] as const).forEach((b) => {
    const t = tokensFrom(byBureauText[b] ?? '');
    if (t.length >= 6) {
      byBureau[b] = t.map((code) => ({ code }));
      maxLen = Math.max(maxLen, t.length);
    }
  });

  if (maxLen < 6) return undefined;
  return { months: [], years: [], byBureau };
}

/** Populate typed ParsedTradeline fields from canonical row labels (HTML + text/PDF paths). */
export function enrichParsedTradeline(t: ParsedTradeline): ParsedTradeline {
  const out: ParsedTradeline = { ...t };
  const get = (...labels: string[]) => findField(t, ...labels);
  const getVal = (...labels: string[]) => firstValue(get(...labels));

  const dateOpened = getVal('date opened', 'opened', 'open date');
  if (dateOpened) out.dateOpened = dateOpened;
  const dateClosed = getVal('date closed', 'closed', 'close date');
  if (dateClosed) out.dateClosed = dateClosed;
  const dofd = getVal('date of first delinquency', 'dofd', 'first delinquency');
  if (dofd) out.dofd = dofd;
  const dateLastActive = getVal('date last active', 'date of last activity', 'last active', 'last activity');
  if (dateLastActive) out.dateLastActive = dateLastActive;
  const dateLastReported = getVal('last reported', 'date reported', 'date last reported');
  if (dateLastReported) out.dateLastReported = dateLastReported;

  const balance = parseMoney(getVal('balance', 'current balance', 'amount owed', 'balance amount'));
  if (balance != null) out.balance = balance;
  const creditLimit = parseMoney(getVal('credit limit', 'high credit', 'credit line', 'limit'));
  if (creditLimit != null) out.creditLimit = creditLimit;
  const highBalance = parseMoney(getVal('high balance', 'high credit'));
  if (highBalance != null) out.highBalance = highBalance;
  const pastDue = parseMoney(getVal('past due', 'amount past due'));
  if (pastDue != null) out.pastDue = pastDue;
  const monthlyPayment = parseMoney(getVal('monthly payment', 'payment', 'scheduled payment'));
  if (monthlyPayment != null) out.monthlyPayment = monthlyPayment;

  const accountType = getVal('account type', 'type of account', 'type');
  if (accountType) out.accountType = accountType;
  const accountStatus = getVal('account status', 'status');
  if (accountStatus) out.accountStatus = accountStatus;
  const responsibility = getVal('responsibility', 'terms', 'loan type');
  if (responsibility) out.responsibility = responsibility;

  const acctNum = getVal('account #', 'account number', 'account no');
  if (acctNum) out.accountNumberMasked = maskAccount(acctNum);
  const addr = firstValue(findCreditorAddressField(t));
  if (addr) out.creditorAddress = addr;
  const phone = firstValue(findCreditorPhoneField(t));
  if (phone) out.creditorPhone = phone;

  const bureaus: Bureau[] = ['TUC', 'EXP', 'EQF'];
  const util: Partial<Record<Bureau, number>> = {};
  for (const b of bureaus) {
    const balRow = get('balance', 'current balance', 'amount owed');
    const limRow = get('credit limit', 'high credit', 'credit line');
    const bal = balRow?.byBureau?.[b] != null ? parseMoney(balRow.byBureau[b]) : null;
    const lim = limRow?.byBureau?.[b] != null ? parseMoney(limRow.byBureau[b]) : null;
    if (bal != null && lim != null && lim > 0) {
      util[b] = Math.round((bal / lim) * 100);
    }
  }
  if (Object.keys(util).length) out.utilizationPct = util;

  if (!out.paymentHistory2y || Object.keys(out.paymentHistory2y.byBureau ?? {}).length === 0) {
    const histRow =
      get('payment history', 'pay history', 'pmt history', 'payment history profile', '24 month', '2-year') ??
      get('payment status history', 'status history');
    if (histRow?.byBureau) {
      const fallback = parsePaymentHistoryFromCodesString(histRow.byBureau);
      if (fallback) out.paymentHistory2y = fallback;
    }
  }

  return out;
}
