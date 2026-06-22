import type { Bureau, DisputeCandidate, ParsedCreditReport, ParsedTradeline, TradelineRow } from '../domain/creditReports';
import type { DisputeReasonSuggestion } from '../domain/disputeReasons';
import legacyReasonsExport from '../generated/legacyDisputeReasons.json';
import { bureauScreenshotLead, filterFactualDisputeReasons, withBureauScreenshotLead } from './disputeFactualReasons';

function norm(s: string) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function emptyish(v?: string | null) {
  const s = norm(v || '');
  if (!s) return true;
  if (s === '-' || s === '—') return true;
  if (s === 'n/a') return true;
  if (s.includes('not available')) return true;
  if (s.includes('no record')) return true;
  if (s.includes('none')) return true;
  return false;
}

function distinctNonEmpty(values: string[]) {
  const set = new Set(values.map((v) => v.trim()).filter((v) => !emptyish(v)));
  return Array.from(set);
}

function findRow(rows: TradelineRow[] | undefined, labelIncludes: string): TradelineRow | null {
  const list = rows ?? [];
  const needle = norm(labelIncludes);
  return list.find((r) => r?.label && norm(r.label).includes(needle)) ?? null;
}

function bureauLabel(b: Bureau) {
  if (b === 'EXP') return 'Experian';
  if (b === 'EQF') return 'Equifax';
  return 'TransUnion';
}

function mk(id: string, text: string): DisputeReasonSuggestion {
  return { id, text };
}

// ---------------------------------------------------------------------------
// Intra-account (single-tradeline) Metro 2 contradiction checks.
// These produce SPECIFIC, data-backed dispute reasons from one account's own
// fields (no cross-bureau comparison needed), e.g. "balance exceeds limit",
// "closed account still shows a balance", "DOFD precedes Date Opened". They use
// the typed fields the HTML parser populates (balance/creditLimit/dofd/...) and
// fall back to scanning the row labels the text/PDF parser produces.
// ---------------------------------------------------------------------------
function num(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function parseMoneyLoose(s?: string | null): number | null {
  if (s == null) return null;
  const cleaned = String(s).replace(/[, $]/g, '').replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function firstBureauValue(row: TradelineRow | null): string {
  if (!row) return '';
  return (row.byBureau.EXP || row.byBureau.EQF || row.byBureau.TUC || '').trim();
}

function rowValue(tl: ParsedTradeline, labelIncludes: string): string {
  return firstBureauValue(findRow(tl.fields, labelIncludes));
}

function parseDateLoose(s?: string | null): Date | null {
  const v = (s || '').trim();
  if (!v || emptyish(v)) return null;
  // MM/DD/YYYY or M/D/YY
  let m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const mo = Number(m[1]) - 1;
    const d = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += y < 50 ? 2000 : 1900;
    const dt = new Date(y, mo, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  // MM/YYYY or MM-YYYY
  m = v.match(/(\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const dt = new Date(Number(m[2]), Number(m[1]) - 1, 1);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  // Month-name dates (e.g. "Jan 2020", "January 1, 2020")
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t) : null;
}

function statusBlobOf(tl: ParsedTradeline): string {
  return norm(
    [tl.accountStatus || '', tl.accountType || '', rowValue(tl, 'account status'), rowValue(tl, 'payment status')].join(' '),
  );
}

export function deriveTradelineContradictions(tl: ParsedTradeline, bureau?: Bureau): DisputeReasonSuggestion[] {
  if (!tl) return [];
  const out: DisputeReasonSuggestion[] = [];
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const say = (text: string) => (bureau ? withBureauScreenshotLead(bureau, text) : text);

  const balance = num(tl.balance) ?? parseMoneyLoose(rowValue(tl, 'balance'));
  const limit = num(tl.creditLimit) ?? parseMoneyLoose(rowValue(tl, 'credit limit'));
  const high = num(tl.highBalance) ?? parseMoneyLoose(rowValue(tl, 'high balance'));
  const pastDue = num(tl.pastDue) ?? parseMoneyLoose(rowValue(tl, 'past due'));

  const opened = parseDateLoose(tl.dateOpened) ?? parseDateLoose(rowValue(tl, 'date opened'));
  const closed = parseDateLoose(tl.dateClosed) ?? parseDateLoose(rowValue(tl, 'date closed'));
  const dofd = parseDateLoose(tl.dofd) ?? parseDateLoose(rowValue(tl, 'first delinquency'));
  const lastReported = parseDateLoose(rowValue(tl, 'last reported'));
  const lastActive =
    parseDateLoose(tl.dateLastActive) ??
    parseDateLoose(rowValue(tl, 'last active')) ??
    parseDateLoose(rowValue(tl, 'date of last activity'));

  const status = statusBlobOf(tl);
  const isClosedOrPaid =
    Boolean(tl.dateClosed) || status.includes('closed') || status.includes('paid') || status.includes('transferred');
  const saysCurrent =
    status.includes('current') ||
    status.includes('pays as agreed') ||
    status.includes('paid as agreed') ||
    status.includes('never late');

  // 1) Balance exceeds the reported limit (or high credit/high balance).
  if (balance != null && limit != null && limit > 0 && balance > limit * 1.001) {
    out.push(
      mk(
        'intra_balance_over_limit',
        say(`The reported balance (${money(balance)}) exceeds the reported credit limit (${money(limit)}). Metro 2 fields on this tradeline are internally inconsistent.`),
      ),
    );
  } else if (balance != null && limit == null && high != null && high > 0 && balance > high * 1.001) {
    out.push(
      mk(
        'intra_balance_over_high',
        say(`The reported balance (${money(balance)}) exceeds the reported high balance/high credit (${money(high)}). The balance and high-credit fields conflict on this tradeline.`),
      ),
    );
  }

  // 2) Closed/paid account still carries a balance.
  if (isClosedOrPaid && balance != null && balance > 0) {
    out.push(
      mk(
        'intra_closed_with_balance',
        say(`This account appears closed/paid but still reports an outstanding balance of ${money(balance)} on the tradeline.`),
      ),
    );
  }

  // 3) Past-due amount on an account marked current/paid (contradiction).
  if (pastDue != null && pastDue > 0 && (saysCurrent || isClosedOrPaid)) {
    out.push(
      mk(
        'intra_pastdue_on_current',
        say(`A past-due amount (${money(pastDue)}) is reported on an account marked ${saysCurrent ? 'current/paid as agreed' : 'closed/paid'} — the past-due and status fields conflict.`),
      ),
    );
  }

  // 4) Date of First Delinquency timeline contradictions.
  if (dofd && opened && dofd.getTime() < opened.getTime()) {
    out.push(
      mk(
        'intra_dofd_before_opened',
        say(`The Date of First Delinquency precedes the Date Opened — these dates are chronologically impossible on the same tradeline.`),
      ),
    );
  }
  if (dofd && closed && dofd.getTime() > closed.getTime()) {
    out.push(
      mk(
        'intra_dofd_after_closed',
        say(`The Date of First Delinquency is later than the account's closed date — the delinquency and closure timeline conflict.`),
      ),
    );
  }

  // 5) Last Reported / Last Active timeline contradictions.
  if (lastReported && opened && lastReported.getTime() < opened.getTime()) {
    out.push(
      mk(
        'intra_lastreported_before_opened',
        say(`The Date Last Reported precedes the Date Opened — the reporting timeline is internally inconsistent.`),
      ),
    );
  }
  if (lastActive && lastReported && lastActive.getTime() > lastReported.getTime()) {
    out.push(
      mk(
        'intra_lastactive_after_lastreported',
        say(`The Date of Last Activity is later than the Date Last Reported — these activity dates conflict on the tradeline.`),
      ),
    );
  }

  // 6) Revolving account with no limit/high credit (blocks accurate utilization).
  const typeBlob = norm([tl.accountType || '', rowValue(tl, 'account type')].join(' '));
  const isRevolving =
    typeBlob.includes('revolving') || typeBlob.includes('credit card') || typeBlob.includes('charge card');
  if (isRevolving && limit == null && high == null) {
    out.push(
      mk(
        'intra_missing_limit',
        say(`No credit limit or high balance is reported for this revolving account while a balance is present — utilization cannot be calculated from the fields shown.`),
      ),
    );
  }

  return out;
}

export function suggestDisputeReasonsForCandidate(candidate: DisputeCandidate): DisputeReasonSuggestion[] {
  const out: DisputeReasonSuggestion[] = [];
  const t = norm(candidate.type);
  const sub = norm(candidate.subtype || '');
  const acct = candidate.account.trim() || 'this account';
  const status = candidate.status.trim();
  const code = candidate.code.trim();
  const lead = bureauScreenshotLead(candidate.bureau);
  const say = (text: string) => withBureauScreenshotLead(candidate.bureau, text);

  if (t.includes('collection')) {
    out.push(
      mk('factual_coll_reporting', say(`${acct} is reporting as a collection tradeline${status ? ` with status «${status}»` : ''}${code ? ` (${code})` : ''} — the balance, attribution, and status characterization shown are inaccurate.`)),
      mk('factual_coll_identity', say(`The collection entry for ${acct} does not match any account opened or agreed to under my name and Social Security number.`)),
      mk('factual_coll_balance', say(`The balance and date-of-first-delinquency shown for ${acct} do not align with any validated statement or agreement in my possession.`)),
    );
  }
  if (t.includes('charge')) {
    out.push(
      mk('factual_co_reporting', say(`${acct} is reporting as charged off${status ? ` («${status}»)` : ''} while other balance and payment-history fields still show activity inconsistent with a final charge-off.`)),
      mk('factual_co_balance_static', say(`The charged-off balance reported for ${acct} does not match the amount reflected on my last creditor statement before charge-off.`)),
      mk('factual_co_status_grid', say(`Payment-history codes and the account-status line for ${acct} tell conflicting stories about whether the account was current, delinquent, or charged off.`)),
    );
  }
  if (t.includes('late') || t.includes('derog')) {
    out.push(
      mk('factual_late_grid', say(`The payment grid for ${acct} shows late/derogatory month codes that do not match my bank or creditor payment records for those billing cycles.`)),
      mk('factual_late_status', say(`The account status for ${acct}${status ? ` («${status}»)` : ''} conflicts with derogatory codes still reporting on the same tradeline.`)),
    );
  }
  if (t.includes('repo')) {
    out.push(
      mk('factual_repo_reporting', say(`${acct} is reporting repossession-related status and balance fields that are inaccurate relative to the disposition and sale records I have.`)),
    );
  }
  if (t.includes('foreclos')) {
    out.push(
      mk('factual_fc_reporting', say(`${acct} is reporting foreclosure/mortgage derogatory status that does not match the loan modification, reinstatement, or sale outcome on my servicer records.`)),
    );
  }
  if (t.includes('public record') || sub.includes('bankrupt') || sub.includes('chapter')) {
    out.push(
      mk('factual_pr_reporting', say(`The public-record entry for ${acct}${sub ? ` (${candidate.subtype})` : ''} contains case details that are mis-associated or mis-stated.`)),
      mk('factual_bk_tradeline', say(`Tradelines tied to ${acct} should reflect bankruptcy disposition consistently; the status and balance fields currently shown are inconsistent with a discharged or included account.`)),
    );
  }
  if (t.includes('inquiry')) {
    out.push(
      mk('factual_inquiry', `${lead} a hard inquiry for ${acct} appears without a credit application or transaction I initiated on the reported date.`),
    );
  }
  if (t.includes('personal')) {
    out.push(
      mk('factual_pi', `${lead} personal identifier data includes names, addresses, or employers that are not mine and may be causing mixed-file reporting.`),
    );
  }

  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function suggestDisputeReasons(parsed: ParsedCreditReport, candidate: DisputeCandidate): DisputeReasonSuggestion[] {
  const out: DisputeReasonSuggestion[] = [];
  const t = norm(candidate.type);

  // Attempt to derive data-backed contradictions from parsed content.
  const tradeline =
    parsed.tradelines.find((x) => norm(x.creditorName) === norm(candidate.account)) ??
    parsed.tradelines.find((x) => norm(candidate.account).includes(norm(x.creditorName))) ??
    parsed.tradelines.find((x) => norm(x.creditorName).includes(norm(candidate.account))) ??
    null;

  if (tradeline) {
    // Specific, single-account (Metro 2) contradictions derived from this
    // account's own values — these fire even for single-bureau reports.
    out.push(...deriveTradelineContradictions(tradeline, candidate.bureau));

    // Cross-bureau inconsistencies. Labels here MUST match what the parser
    // emits (see canonicalTradelineLabel in parseTextReport.ts), otherwise the
    // checks silently never match.
    const keyFields = [
      'Account Status',
      'Payment Status',
      'Account Type',
      'Date Opened',
      'Last Reported',
      'Balance',
      'Past Due',
      'Credit Limit',
      'High Balance',
    ];

    for (const label of keyFields) {
      const row = findRow(tradeline.fields, label);
      if (!row) continue;
      const values = [
        row.byBureau.EXP || '',
        row.byBureau.EQF || '',
        row.byBureau.TUC || '',
      ];
      const distinct = distinctNonEmpty(values);
      if (distinct.length >= 2) {
        out.push(
          mk(
            `xb_${norm(label).replace(/[^a-z0-9]+/g, '_')}`,
            `Cross-bureau inconsistency detected: "${label}" is reported differently across bureaus (${distinct.join(' | ')}).`,
          ),
        );
      }
    }

    const statusRow = findRow(tradeline.fields ?? [], 'Account Status') ?? findRow(tradeline.fields ?? [], 'Payment Status');
    const statusExp = statusRow?.byBureau?.EXP || '';
    const statusEqf = statusRow?.byBureau?.EQF || '';
    const statusTuc = statusRow?.byBureau?.TUC || '';

    const history = tradeline.paymentHistory2y?.byBureau ?? {};
    (['EXP', 'EQF', 'TUC'] as const).forEach((b) => {
      const status =
        b === 'EXP' ? statusExp :
        b === 'EQF' ? statusEqf :
        statusTuc;
      const codes = (history[b] ?? []).map((x) => norm(x.code)).filter(Boolean);
      const hasDerog = codes.some((c) => ['30', '60', '90', '120', 'co', 'col'].includes(c) || c.includes('late') || c.includes('charge'));
      const saysCurrent = norm(status).includes('current') || norm(status).includes('pays') || norm(status).includes('paid as agreed');
      if (saysCurrent && hasDerog) {
        out.push(
          mk(
            `contradiction_status_history_${b}`,
            withBureauScreenshotLead(
              b,
              `The status indicates current/paid-as-agreed, but the 24-month history shows derogatory codes (${codes.filter(Boolean).slice(0, 6).join(', ')}).`,
            ),
          ),
        );
      }
    });
  }

  // Sections (bankruptcy/public_records) — best-effort contradictions
  const section =
    (parsed.sections ?? []).find((s) => norm(s.title) === norm(candidate.account)) ??
    (parsed.sections ?? []).find((s) => (t.includes('public record') ? s.key === 'public_records' : false)) ??
    null;

  if (section) {
    for (const row of section.rows ?? []) {
      const by = row?.byBureau;
      if (!by) continue;
      const values = [
        by.EXP || '',
        by.EQF || '',
        by.TUC || '',
      ];
      const distinct = distinctNonEmpty(values);
      const anyPresent = values.some((v) => !emptyish(v));
      const anyMissing = values.some((v) => emptyish(v));
      if (distinct.length >= 2) {
        out.push(
          mk(
            `sec_xb_${norm(row.label).replace(/[^a-z0-9]+/g, '_')}`,
            `Cross-bureau inconsistency detected in "${section.title}": "${row.label}" differs across bureaus (${distinct.join(' | ')}).`,
          ),
        );
      } else if (anyPresent && anyMissing) {
        out.push(
          mk(
            `sec_partial_${norm(row.label).replace(/[^a-z0-9]+/g, '_')}`,
            `Partial reporting detected in "${section.title}": "${row.label}" appears on some bureaus but not others — the file shows inconsistent presence of this field.`,
          ),
        );
      }
    }
  }

  // Data-specific contradictions (above) lead; generic + advanced type-specific
  // reasons come after so the strongest, account-specific angles are listed first.
  out.push(...suggestDisputeReasonsForCandidate(candidate));

  // De-dup by id (stable) while preserving order.
  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/** Full library of dispute reasons by negative type (browse in Letter Studio + download). */
const CORE_DISPUTE_REASONS_LIBRARY: Record<string, { label: string; reasons: string[] }> = {
  general: {
    label: 'General (all types)',
    reasons: [
      'The information appears inaccurate, incomplete, and/or cannot be verified with competent evidence.',
      'Please provide the method of verification used and the documentary basis relied upon to verify this item.',
      'If you cannot verify the item as reported, please delete or correct it and send me updated results in writing.',
      'This account does not belong to me. Please remove it from my credit file immediately.',
      'The dates, balances, or status codes reported are inconsistent with my records and require correction or deletion.',
      'Please identify the furnisher, the date of account acquisition, and all parties who have accessed this account information.',
      'I am disputing the accuracy and completeness of this tradeline under my rights to a reasonable reinvestigation.',
      'The reporting lacks sufficient identifying detail to allow me to validate the debt — provide full verification or delete.',
      'This tradeline contains factual errors that materially affect my creditworthiness and must be corrected or removed.',
      'Please note this dispute on my file and ensure furnishers are notified of my direct dispute under applicable law.',
    ],
  },
  collection: {
    label: 'Collections',
    reasons: [
      'Please verify the ownership/authority to report this collection, including the original creditor relationship and itemization.',
      'Please verify the amount owed, date of last activity, and the chain of assignment from the original creditor.',
      'This collection account is past the reporting period allowed under the FCRA. Please delete it from my file.',
      'I dispute the validity of this debt. Please provide validation including the original signed agreement and payment history.',
      'The collection agency has not provided sufficient proof that they are legally authorized to collect or report this account.',
      'The collection balance includes impermissible fees or interest not authorized by the original agreement.',
      'No valid assignment documentation links this collector to the original creditor — delete pending proof of ownership.',
      'The date of last activity was improperly updated to extend reporting — correct DOFD or delete.',
      'This account was paid in full or settled — the collection status and balance must be updated to zero/paid.',
    ],
  },
  charge_off: {
    label: 'Charge-offs',
    reasons: [
      'Please review Metro 2 accuracy for this account (status, dates, balances, and payment history must be internally consistent).',
      'Please verify the charge-off date and the balance at charge-off.',
      'The balance reported exceeds what is legally collectible or contradicts the charge-off amount on record.',
      'This account was settled for less than the full balance. Please update status and balance to reflect the settlement.',
      'Payment history codes conflict with the reported account status. Please correct or delete inaccurate tradeline data.',
    ],
  },
  late_payment: {
    label: 'Late payments',
    reasons: [
      'Please verify the accuracy of the delinquency history and confirm it matches the actual payment record.',
      'The late payment notation is inaccurate — payments were made on time during the disputed period.',
      'Please provide documentation showing when payments were received and how delinquency codes were assigned.',
      'The date of first delinquency does not align with the payment history grid. Please correct Metro 2 fields.',
    ],
  },
  bankruptcy: {
    label: 'Bankruptcy',
    reasons: [
      'Please verify the bankruptcy case details (case number, filing date, disposition) and ensure it is correctly associated with my file.',
      'This account was included in/discharged through bankruptcy. Please update the status and balance accordingly.',
      'The account should show included in bankruptcy with a zero balance — please correct reporting immediately.',
      'This tradeline was not included in my bankruptcy petition. Please verify association with the court record.',
    ],
  },
  public_record: {
    label: 'Public records',
    reasons: [
      'Please verify the underlying court/public record details and ensure the record is correctly associated with my file.',
      'The judgment/lien may have been satisfied or vacated. Please verify the current status with the court.',
      'This public record has been dismissed or expunged. Please remove it from my credit report.',
      'The amount, filing date, or court jurisdiction reported does not match the official record.',
    ],
  },
  inquiry: {
    label: 'Inquiries',
    reasons: [
      'I do not recall authorizing this inquiry. Please provide the permissible purpose and the name of the party who requested this inquiry, or remove it from my file.',
      'This inquiry was not initiated by me and lacks a permissible purpose under the FCRA.',
      'Please remove this hard inquiry — it was the result of a soft pull or identity mismatch.',
    ],
  },
  identity: {
    label: 'Identity / mixed file',
    reasons: [
      'This account belongs to another individual with a similar name or SSN fragment. Please remove from my file.',
      'I am a victim of identity theft. This account was opened without my knowledge or consent.',
      'Please block this information from my file pursuant to my identity theft report and supporting documentation.',
    ],
  },
  reinsertion: {
    label: 'Re-insertion / prior dispute',
    reasons: [
      'This item was previously deleted after my dispute. Please explain why it was re-inserted without required notice.',
      'I received no notice of re-insertion as required before this negative item was added back to my file.',
      'Please delete this item again — prior investigation found it could not be verified.',
    ],
  },
  balance_limit: {
    label: 'Balance & limit errors',
    reasons: [
      'The balance reported exceeds the credit limit, which is impossible and indicates Metro 2 reporting errors.',
      'The high balance or credit limit shown is incorrect and distorts my utilization ratio.',
      'Please correct the balance to reflect the actual amount owed or delete if unverifiable.',
      'The credit limit field is blank or zero while a balance is reported — this violates logical Metro 2 field consistency.',
      'The high credit amount reported does not match my statements and materially misstates utilization.',
    ],
  },
  account_status: {
    label: 'Account status errors',
    reasons: [
      'The account is reported as open when it was closed by me or the creditor — please update status and dates.',
      'The account shows a derogatory status despite being current or paid as agreed on my records.',
      'Status codes conflict with payment history (e.g., current status with consecutive late codes). Correct or delete.',
      'This account was transferred/sold; the reporting status on my file does not reflect the transfer or closure.',
      'The account is marked paid/closed but still reports a balance or past-due amount — internally inconsistent.',
    ],
  },
  payment_history: {
    label: 'Payment history grid',
    reasons: [
      'Payment history codes do not match actual payment dates on my bank records — please reinvestigate.',
      'Late payment notations appear for months when payment was received on or before the due date.',
      'The payment history grid shows derogatory codes after the account was brought current — please correct.',
      'Metro 2 payment rating fields conflict with the reported account status and require correction.',
      'Please provide the furnishers methodology for assigning each payment history code month-by-month.',
    ],
  },
  duplicate: {
    label: 'Duplicate / split reporting',
    reasons: [
      'This account is duplicated on my file under a slightly different creditor name or account number — please merge or delete the duplicate.',
      'The same debt appears twice with overlapping balances, inflating my obligations and utilization.',
      'Please identify whether this is a duplicate tradeline or a legitimate separate account and correct accordingly.',
      'A transferred account still reports alongside the new servicer — only one accurate tradeline should remain.',
    ],
  },
  authorized_user: {
    label: 'Authorized user / not mine',
    reasons: [
      'I was an authorized user only and am not contractually liable — please remove this tradeline from my file.',
      'This account was opened by another party; I did not apply for or use this account as primary obligor.',
      'Please verify primary account holder identity — this account does not belong on my consumer report.',
    ],
  },
  medical: {
    label: 'Medical collections',
    reasons: [
      'This medical collection may be subject to NAIC/state consumer protections — please verify reporting compliance and accuracy.',
      'The amount billed does not match provider statements or EOB documentation I possess.',
      'Insurance payment was applied but the collection balance was not adjusted — please correct or delete.',
      'Please validate that this medical debt is reportable under current regulatory guidance and furnish proof of ownership.',
    ],
  },
  student_loan: {
    label: 'Student loans',
    reasons: [
      'The loan status (deferment, forbearance, IBR) reported does not match my servicer records.',
      'Multiple disbursements appear as separate delinquencies — please report consolidated status accurately.',
      'The date of first delinquency does not align with when payments were actually missed per servicer records.',
      'Please verify federal loan rehabilitation or consolidation status and update tradeline accordingly.',
    ],
  },
  repossession: {
    label: 'Repossession / auto',
    reasons: [
      'The deficiency balance after repossession is inaccurate or includes impermissible fees — please verify itemization.',
      'Repossession date and balance at repo conflict with lender records — correct Metro 2 fields or delete.',
      'The account should reflect charged-off/repo status with accurate DOFD — current reporting is inconsistent.',
    ],
  },
  foreclosure: {
    label: 'Foreclosure / mortgage',
    reasons: [
      'Foreclosure status is reported inaccurately — the loan was modified, reinstated, or sold and should not show as FC.',
      'The balance and date of first delinquency do not match mortgage servicer records.',
      'Please verify whether this tradeline should report as foreclosure versus short sale/paid — current coding is wrong.',
    ],
  },
  tax_lien: {
    label: 'Tax liens / civil judgments',
    reasons: [
      'This tax lien or civil judgment has been satisfied, released, or vacated — please update or remove.',
      'Public record details (amount, filing date, jurisdiction) do not match official court/county records.',
      'The lien is beyond permissible reporting period or no longer enforceable — delete from my file.',
    ],
  },
  obsolete: {
    label: 'Obsolete / time-barred reporting',
    reasons: [
      'The date of first delinquency indicates this item exceeds the FCRA reporting period — please delete immediately.',
      'This collection is time-barred for reporting purposes based on DOFD — remove from my consumer file.',
      'Continued reporting after obsolescence violates the FCRA — delete and confirm in writing.',
    ],
  },
  fcra_611: {
    label: 'FCRA §611 reinvestigation',
    reasons: [
      'Pursuant to FCRA §611, I demand a reasonable reinvestigation with deletion if information cannot be verified.',
      'Please conduct a reinvestigation and provide the name, address, and phone number of each information furnisher contacted.',
      'If the furnisher cannot verify with competent evidence, delete the item and provide an updated consumer report.',
      'This is a follow-up dispute — prior investigation failed to correct known inaccuracies. Reinvestigate with heightened scrutiny.',
    ],
  },
  fcra_623: {
    label: 'FCRA §623 furnisher duties',
    reasons: [
      'The furnisher must investigate and correct inaccurate information reported to the bureaus under FCRA §623.',
      'Please notify all CRAs to which this information was furnished of any inaccuracy discovered during investigation.',
      'Reporting that cannot be verified after dispute must be blocked from reinsertion without required consumer notice.',
    ],
  },
  fcra_609: {
    label: 'FCRA §609 disclosure',
    reasons: [
      'Under FCRA §609, please disclose the sources of information and method of verification for this tradeline.',
      'Provide all information in your files bearing on this account, including contact details for the furnisher.',
      'I request complete file disclosure related to this account to validate reporting accuracy.',
    ],
  },
  metro2_compliance: {
    label: 'Metro 2 / CDIA compliance',
    reasons: [
      'Metro 2 base segments for this account contain field-level contradictions that fail CDIA logical consistency checks.',
      'Account status, payment rating, and balance fields must align per Metro 2 specification — they currently do not.',
      'Please have your compliance team review Metro 2 segments and correct or delete non-compliant tradeline data.',
      'Special comment codes and compliance condition codes conflict with reported status — correct immediately.',
    ],
  },
  method_of_verification: {
    label: 'Method of verification',
    reasons: [
      'Please provide the method of verification used in your prior investigation — e.g., automated e-OSCAR vs. manual review.',
      'If verification relied on furnisher electronic response only, that is insufficient — provide underlying documentary proof.',
      'I dispute the prior verification outcome; please reopen investigation and document each verification step taken.',
    ],
  },
  round_escalation: {
    label: 'Round 2+ escalation',
    reasons: [
      'This is Round 2 — prior dispute was not resolved. The same inaccuracies persist and require deletion or correction.',
      'Continued reporting after failed verification suggests the furnisher is reporting without a factual basis — delete.',
      'Escalate to supervisor review — repeated reinvestigation must be more than a duplicate of the prior inadequate response.',
      'I am prepared to escalate to CFPB/state AG if accurate verification cannot be produced.',
    ],
  },
};

/** Legacy Laravel inaccuracy library merged from finelyno_finelycred.sql (Tier 374). */
export const DISPUTE_REASONS_LIBRARY: Record<string, { label: string; reasons: string[] }> = {
  ...CORE_DISPUTE_REASONS_LIBRARY,
  ...((legacyReasonsExport as { library?: Record<string, { label: string; reasons: string[] }> }).library ?? {}),
};

/** Factual findings only — strips statute commands and generic "please verify/delete" lines for UI + auto-pick. */
export function getFactualDisputeReasonsLibrary(): Record<string, { label: string; reasons: string[] }> {
  const out: Record<string, { label: string; reasons: string[] }> = {};
  for (const [key, { label, reasons }] of Object.entries(DISPUTE_REASONS_LIBRARY)) {
    const factual = filterFactualDisputeReasons(reasons);
    if (factual.length) out[key] = { label, reasons: factual };
  }
  return out;
}

export function getDisputeReasonsLibraryAsText(): string {
  const library = getFactualDisputeReasonsLibrary();
  const lines: string[] = [
    'Finely Cred — Factual Dispute Findings Library',
    '==============================================',
    '',
    'Factual statements describing what the bureau report shows (for use with screenshot evidence). Procedural commands are excluded. Not legal advice.',
    '',
  ];
  for (const [, { label, reasons }] of Object.entries(library)) {
    lines.push(`## ${label}`);
    lines.push('');
    reasons.forEach((r, i) => {
      lines.push(`${i + 1}. ${r}`);
    });
    lines.push('');
  }
  lines.push('— End of library —');
  return lines.join('\n');
}

