import type { Bureau, DisputeCandidate, ParsedCreditReport, TradelineRow } from '../domain/creditReports';
import type { DisputeReasonSuggestion } from '../domain/disputeReasons';

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

export function suggestDisputeReasonsForCandidate(candidate: DisputeCandidate): DisputeReasonSuggestion[] {
  const out: DisputeReasonSuggestion[] = [];

  // Always include a small, consistent baseline.
  out.push(
    mk('base_inaccurate_or_unverified', 'The information appears inaccurate, incomplete, and/or cannot be verified with competent evidence.'),
    mk('base_method_of_verification', 'Please provide the method of verification used and the documentary basis relied upon to verify this item.'),
    mk('base_delete_or_correct', 'If you cannot verify the item as reported, please delete or correct it and send me updated results in writing.'),
  );

  // Type-specific baseline (still non-legal-advice language)
  const t = norm(candidate.type);
  if (t.includes('collection')) {
    out.push(
      mk('coll_ownership_chain', 'Please verify the ownership/authority to report this collection, including the original creditor relationship and itemization.'),
    );
  }
  if (t.includes('charge') || t.includes('charge-off') || t.includes('charge off')) {
    out.push(
      mk('co_metro2_accuracy', 'Please review Metro 2 accuracy for this account (status, dates, balances, and payment history must be internally consistent).'),
    );
  }
  if (t.includes('late')) {
    out.push(
      mk('late_history_accuracy', 'Please verify the accuracy of the delinquency history and confirm it matches the actual payment record.'),
    );
  }
  if (t.includes('public record')) {
    out.push(
      mk('pr_court_record', 'Please verify the underlying court/public record details and ensure the record is correctly associated with my file.'),
    );
    const st = norm(candidate.subtype || '');
    if (st.includes('bankrupt') || st.includes('chapter')) {
      out.push(
        mk('bk_case_details', 'Please verify the bankruptcy case details (case number, filing date, disposition) and ensure it is correctly associated with my file.'),
      );
    }
  }
  if (t.includes('inquiry')) {
    out.push(
      mk('inquiry_permissible', 'I do not recall authorizing this inquiry. Please provide the permissible purpose and the name of the party who requested this inquiry, or remove it from my file.'),
    );
  }

  // De-dup by id (stable) while preserving order.
  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function suggestDisputeReasons(parsed: ParsedCreditReport, candidate: DisputeCandidate): DisputeReasonSuggestion[] {
  const out: DisputeReasonSuggestion[] = [...suggestDisputeReasonsForCandidate(candidate)];
  const t = norm(candidate.type);

  // Attempt to derive data-backed contradictions from parsed content.
  const tradeline =
    parsed.tradelines.find((x) => norm(x.creditorName) === norm(candidate.account)) ??
    parsed.tradelines.find((x) => norm(candidate.account).includes(norm(x.creditorName))) ??
    parsed.tradelines.find((x) => norm(x.creditorName).includes(norm(candidate.account))) ??
    null;

  if (tradeline) {
    const keyFields = [
      'Account Status',
      'Account Type',
      'Date Opened',
      'Date Reported',
      'Date of First Delinquency',
      'Balance',
      'Past Due',
      'Credit Limit',
      'High Credit',
      'Monthly Payment',
      'Payment Status',
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
            `${bureauLabel(b)} contradiction: status indicates current/paid-as-agreed, but the 24-month history shows derogatory codes. Please correct the reporting or delete if unverifiable.`,
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
            `Partial reporting detected in "${section.title}": "${row.label}" appears on some bureaus but not others. Please verify accuracy and ensure consistent reporting.`,
          ),
        );
      }
    }
  }

  // De-dup by id (stable) while preserving order.
  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

/** Full library of dispute reasons by negative type (for download/education). */
export const DISPUTE_REASONS_LIBRARY: Record<string, { label: string; reasons: string[] }> = {
  general: { label: 'General (all types)', reasons: ['The information appears inaccurate, incomplete, and/or cannot be verified with competent evidence.', 'Please provide the method of verification used and the documentary basis relied upon to verify this item.', 'If you cannot verify the item as reported, please delete or correct it and send me updated results in writing.'] },
  collection: { label: 'Collections', reasons: ['Please verify the ownership/authority to report this collection, including the original creditor relationship and itemization.', 'Please verify the amount owed, date of last activity, and the chain of assignment from the original creditor.'] },
  charge_off: { label: 'Charge-offs', reasons: ['Please review Metro 2 accuracy for this account (status, dates, balances, and payment history must be internally consistent).', 'Please verify the charge-off date and the balance at charge-off.'] },
  late_payment: { label: 'Late payments', reasons: ['Please verify the accuracy of the delinquency history and confirm it matches the actual payment record.'] },
  bankruptcy: { label: 'Bankruptcy', reasons: ['Please verify the bankruptcy case details (case number, filing date, disposition) and ensure it is correctly associated with my file.', 'This account was included in/discharged through bankruptcy. Please update the status and balance accordingly.'] },
  public_record: { label: 'Public records', reasons: ['Please verify the underlying court/public record details and ensure the record is correctly associated with my file.', 'The judgment/lien may have been satisfied or vacated. Please verify the current status with the court.'] },
  inquiry: { label: 'Inquiries', reasons: ['I do not recall authorizing this inquiry. Please provide the permissible purpose and the name of the party who requested this inquiry, or remove it from my file.'] },
};

export function getDisputeReasonsLibraryAsText(): string {
  const lines: string[] = ['Finely Cred — Dispute Reasons Library', '=====================================', '', 'Use these reason snippets when drafting dispute letters. Select the ones that best fit your situation. This is not legal advice.', ''];
  for (const [, { label, reasons }] of Object.entries(DISPUTE_REASONS_LIBRARY)) {
    lines.push(`## ${label}`);
    lines.push('');
    reasons.forEach((r, i) => { lines.push(`${i + 1}. ${r}`); });
    lines.push('');
  }
  lines.push('— End of library —');
  return lines.join('\n');
}

