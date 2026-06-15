import type { Bureau, DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';

function norm(s: string) {
  return (s || '').toLowerCase();
}

/** Reject labels that are score models or generic placeholders so they don't appear as dispute item names. */
function isInvalidAccountLabel(account: string): boolean {
  const a = norm(account).trim();
  if (!a) return true;
  if (/^fico\s*(score)?\s*[0-9]{1,2}$/.test(a)) return true;
  if (/^vantagescore(\s*[0-9.]*)?$/.test(a)) return true;
  if (/^(credit\s*)?score(\s*[0-9])?$/.test(a)) return true;
  if (a === 'collection account' || a === 'collection accounts') return true;
  if (a === 'collections' && account.trim() === 'Collections') return false; // section title used as fallback for s.rows
  return false;
}

/** True if this table looks like collections (has creditor/agency/account-like column), not a score table. */
function tableLooksLikeCollections(columns: string[]): boolean {
  const lower = columns.map((c) => (c || '').toLowerCase());
  const hasCreditorCol = lower.some((c) => /creditor|agency|furnisher|original|collector|account|name/.test(c));
  const looksLikeScoreTable = lower.some((c) => /fico|vantage|score/.test(c));
  return hasCreditorCol && !looksLikeScoreTable;
}

function getField(tradeline: { fields?: { label: string; byBureau?: Partial<Record<Bureau, string>> }[] }, labelIncludes: string) {
  return (tradeline.fields ?? []).find((f) => f?.label && norm(f.label).includes(norm(labelIncludes)));
}

function anyFieldText(t: { fields?: { label: string; byBureau?: Partial<Record<Bureau, string>> }[] }, ...needles: string[]) {
  const lower = (x: string) => (x || '').toLowerCase();
  const pick = (by: any) => (by?.EXP || by?.TUC || by?.EQF || '').toString();
  return (t.fields ?? [])
    .filter((f) => f?.label && needles.some((n) => lower(f.label).includes(lower(n))))
    .map((f) => pick(f.byBureau))
    .join(' ')
    .trim();
}

function likelyDerogCode(code: string) {
  const c = norm(code);
  return (
    c === 'co' ||
    c === 'cl' ||
    c === 'col' ||
    c === 'collection' ||
    c.includes('charge') ||
    c === '30' ||
    c === '60' ||
    c === '90' ||
    c === '120' ||
    c.includes('late')
  );
}

export function deriveDisputeCandidates(parsed: ParsedCreditReport, reportId?: string): DisputeCandidate[] {
  const out: DisputeCandidate[] = [];

  for (const t of parsed.tradelines) {
    const acctType = getField(t, 'Account Type')?.byBureau ?? {};
    const acctStatus = getField(t, 'Account Status')?.byBureau ?? {};
    const payStatus = getField(t, 'Payment Status')?.byBureau ?? {};

    const bureaus: Bureau[] = ['TUC', 'EXP', 'EQF'];
    for (const b of bureaus) {
      const type = acctType[b] ?? '';
      const status = acctStatus[b] ?? '';
      const paymentStatus = payStatus[b] ?? '';

      const historyCodes = t.paymentHistory2y?.byBureau?.[b]?.map((x) => x.code).filter(Boolean) ?? [];
      const statusBlob = norm([type, status, paymentStatus, anyFieldText(t, 'payment status', 'pay status', 'worst pay', 'rating', 'remarks')].join(' '));
      const typeBlob = norm([type, anyFieldText(t, 'account type', 'account type - detail', 'type of account', 'portfolio type')].join(' '));
      const isOpen = statusBlob.includes('open');
      const hasDerog =
        historyCodes.some(likelyDerogCode) ||
        statusBlob.includes('collection') ||
        statusBlob.includes('charge') ||
        statusBlob.includes('charge-off') ||
        statusBlob.includes('charge off') ||
        statusBlob.includes('repos') ||
        statusBlob.includes('repo') ||
        statusBlob.includes('foreclos') ||
        statusBlob.includes('bankrupt') ||
        statusBlob.includes('30') ||
        statusBlob.includes('60') ||
        statusBlob.includes('90') ||
        statusBlob.includes('120') ||
        statusBlob.includes('late') ||
        statusBlob.includes('delinq');

      if (!hasDerog) continue;

      let issueType = 'Derogatory Item';
      let code = 'FCRA § 611';
      let statusLabel = 'Requires verification';

      const looksLikeCollection =
        statusBlob.includes('collection') ||
        typeBlob.includes('collection') ||
        historyCodes.some((x) => {
          const v = norm(x);
          return v.includes('col') || v === 'cl';
        });
      const looksLikeChargeOff = statusBlob.includes('charge') || historyCodes.some((x) => norm(x) === 'co');
      const looksLikeRepo = statusBlob.includes('repo') || statusBlob.includes('repossession');
      const looksLikeForeclosure = statusBlob.includes('foreclos');
      const looksLikeLate =
        historyCodes.some((x) => ['30', '60', '90', '120'].includes(norm(x))) ||
        statusBlob.includes('30') ||
        statusBlob.includes('60') ||
        statusBlob.includes('90') ||
        statusBlob.includes('120') ||
        statusBlob.includes('late') ||
        statusBlob.includes('delinq');

      if (looksLikeRepo) {
        issueType = 'Repossession';
        code = 'FCRA § 623';
        statusLabel = 'Reporting accuracy review';
      } else if (looksLikeForeclosure) {
        issueType = 'Foreclosure';
        code = 'FCRA § 623';
        statusLabel = 'Reporting accuracy review';
      } else if (looksLikeChargeOff && !looksLikeCollection) {
        issueType = 'Charge-Off';
        code = '15 U.S.C. § 1681';
        statusLabel = 'Metro2 accuracy review';
      } else if (looksLikeCollection) {
        issueType = 'Collection';
        code = 'FCRA § 623';
        statusLabel = 'Validation required';
      } else if (looksLikeLate) {
        issueType = 'Late Payment';
        code = 'FCRA § 623';
        statusLabel = isOpen ? 'Reporting accuracy review (open account)' : 'Reporting accuracy review';
      }

      out.push({
        id: `${reportId || 'report'}_${t.creditorName}_${b}_${issueType}`.replace(/\s+/g, '_'),
        bureau: b,
        account: t.creditorName,
        type: issueType,
        status: statusLabel,
        code,
        reportId,
      });
    }
  }

  // Public records / bankruptcy sections (best-effort, provider-dependent)
  const isEmptyish = (v: string) => {
    const s = norm(v).replace(/\s+/g, ' ').trim();
    if (!s) return true;
    if (s === '-' || s === '—') return true;
    if (s.includes('no record')) return true;
    if (s.includes('none')) return true;
    if (s.includes('n/a')) return true;
    if (s.includes('not available')) return true;
    return false;
  };

  const sectionToCandidateType = (key: string) => {
    if (key === 'public_records') return 'Public Record';
    // Legacy/back-compat: older parsed reports may store bankruptcy as its own section key.
    if (key === 'bankruptcy') return 'Public Record';
    if (key === 'inquiries') return 'Inquiry';
    return 'Negative Item';
  };

  for (const s of parsed.sections ?? []) {
    if (!['public_records', 'bankruptcy', 'collections', 'inquiries'].includes(s.key)) continue;
    const bureaus: Bureau[] = ['TUC', 'EXP', 'EQF'];
    if (s.rows?.length) {
      for (const b of bureaus) {
        const anyValue = s.rows.some((r) => {
          const v = r.byBureau?.[b];
          return v ? !isEmptyish(v) : false;
        });
        if (!anyValue) continue;
        const issueType = s.key === 'collections' ? 'Collection' : sectionToCandidateType(s.key);
        out.push({
          id: `${reportId || 'report'}_${s.key}_${b}`.replace(/\s+/g, '_'),
          bureau: b,
          account: s.title,
          type: issueType,
          subtype: s.key === 'bankruptcy' ? 'Bankruptcy' : undefined,
          status: 'Requires verification',
          code: 'FCRA § 611',
          reportId,
        });
      }
    } else if (s.table?.rows?.length) {
      // Generic tables (collections, inquiries) — create per-row or per-bureau candidates.
      const issueType = s.key === 'collections' ? 'Collection' : s.key === 'inquiries' ? 'Inquiry' : sectionToCandidateType(s.key);
      const status =
        s.key === 'inquiries'
          ? 'Verify permissible purpose'
          : s.key === 'public_records' || s.key === 'bankruptcy'
            ? 'Requires verification'
            : 'Requires review';
      const code = s.key === 'inquiries' ? 'FCRA § 611(a)(2)' : 'FCRA § 611';
      if (s.key === 'inquiries') {
        s.table.rows.slice(0, 50).forEach((row, ri) => {
          const firstCol = (row[0] ?? '').trim() || 'Inquiry';
          const account = firstCol.length > 60 ? firstCol.slice(0, 60) + '…' : firstCol;
          for (const b of bureaus) {
            out.push({
              id: `${reportId || 'report'}_inquiry_${ri}_${b}`.replace(/\s+/g, '_'),
              bureau: b,
              account,
              type: 'Inquiry',
              status,
              code,
              reportId,
            });
          }
        });
      } else if (s.key === 'public_records' || s.key === 'bankruptcy') {
        // Public records: one candidate per row, across bureaus (provider tables are often not bureau-scoped).
        const cols = s.table!.columns;
        const lowerCols = cols.map((c) => (c || '').toLowerCase());
        const recordTypeIdx = lowerCols.findIndex((c) => c.includes('record type') || c === 'type' || c.includes('public record type'));
        const detailIdx = lowerCols.findIndex((c) => c.includes('details') || c.includes('description'));
        const caseIdx = lowerCols.findIndex((c) => c.includes('case') || c.includes('docket'));
        const courtIdx = lowerCols.findIndex((c) => c.includes('court'));
        const amountIdx = lowerCols.findIndex((c) => c.includes('amount') || c.includes('balance'));

        s.table!.rows.slice(0, 80).forEach((row, ri) => {
          const recordType =
            (recordTypeIdx >= 0 ? (row[recordTypeIdx] ?? '').trim() : '') || (s.key === 'bankruptcy' ? 'Bankruptcy' : '');
          const fromDetails = detailIdx >= 0 ? (row[detailIdx] ?? '').trim() : '';
          const fromCase = caseIdx >= 0 ? (row[caseIdx] ?? '').trim() : '';
          const fromCourt = courtIdx >= 0 ? (row[courtIdx] ?? '').trim() : '';
          const fromAmount = amountIdx >= 0 ? (row[amountIdx] ?? '').trim() : '';
          const firstCol = (row[0] ?? '').trim();

          const labelParts = [
            recordType,
            fromCourt ? `Court: ${fromCourt}` : '',
            fromCase ? `Case: ${fromCase}` : '',
            fromAmount ? `Amount: ${fromAmount}` : '',
            fromDetails && fromDetails !== firstCol ? fromDetails : '',
          ]
            .map((x) => (x || '').trim())
            .filter(Boolean);
          const label = (labelParts[0] || firstCol || 'Public record').trim();
          const account = (label.length > 80 ? label.slice(0, 80) + '…' : label) || `Public record ${ri + 1}`;

          for (const b of bureaus) {
            out.push({
              id: `${reportId || 'report'}_public_record_${ri}_${b}`.replace(/\s+/g, '_'),
              bureau: b,
              account,
              type: 'Public Record',
              subtype: recordType || undefined,
              status,
              code,
              reportId,
            });
          }
        });
      } else {
        // Collections: one candidate per row; prefer name-like columns over "account" (may be account number)
        const cols = s.table!.columns;
        const lowerCols = cols.map((c) => (c || '').toLowerCase());
        if (!tableLooksLikeCollections(cols)) continue;
        const nameLikeIdx = lowerCols.findIndex((c) => /creditor|agency|furnisher|original\s*creditor|collector|subscriber|name/.test(c) && !/account\s*#|account\s*number|acct\s*no/.test(c));
        const fallbackIdx = lowerCols.findIndex((c) => /creditor|agency|furnisher|original|collector|account|name/.test(c));
        const creditorColIdx = nameLikeIdx >= 0 ? nameLikeIdx : fallbackIdx;
        const looksLikeName = (v: string) => (v || '').trim().length > 1 && !/^\d[\d\s\-*.,]*$/.test((v || '').trim()) && (v || '').trim().length < 200;
        const isNumberLikeCol = (col: string) => /account\s*#|account\s*number|acct|balance|amount|date\s*opened|phone|^\d+$/.test((col || '').toLowerCase());
        s.table!.rows.slice(0, 50).forEach((row, ri) => {
          const firstCol = (row[0] ?? '').trim();
          const fromCreditorCol = creditorColIdx >= 0 ? (row[creditorColIdx] ?? '').trim() : '';
          const fromFirst = firstCol && looksLikeName(firstCol) ? firstCol : '';
          let account = (fromCreditorCol || fromFirst || firstCol || '').trim().slice(0, 80);
          if (!account || isInvalidAccountLabel(account)) {
            const nameCandidates = row
              .map((cell, ci) => ({ cell: (cell ?? '').trim(), col: cols[ci] }))
              .filter(({ cell, col }) => looksLikeName(cell) && !isNumberLikeCol(col || ''))
              .map(({ cell }) => cell);
            account = nameCandidates.length ? nameCandidates.reduce((a, b) => a.length >= b.length ? a : b, '') : '';
          }
          if (!account || isInvalidAccountLabel(account)) account = `Collection ${ri + 1}`;
          account = account.slice(0, 80);
          if (isInvalidAccountLabel(account)) return;
          for (const b of bureaus) {
            out.push({
              id: `${reportId || 'report'}_collection_${ri}_${b}`.replace(/\s+/g, '_'),
              bureau: b,
              account,
              type: issueType,
              status,
              code,
              reportId,
            });
          }
        });
      }
    }
  }

  // Personal information (Phase 8): name/address/phone blocks often contain inaccuracies.
  // We create candidates when there is enough signal (multiple entries / AKAs) so the UI can suggest disputing PI.
  try {
    const pi = parsed.personalInfo;
    const akaCount = Array.isArray(pi?.aka) ? pi!.aka!.map((x) => String(x || '').trim()).filter(Boolean).length : 0;
    const addrCount = Array.isArray(pi?.addresses) ? pi!.addresses!.filter((a) => String(a?.raw || a?.line1 || '').trim()).length : 0;
    const phoneCount = Array.isArray(pi?.phones) ? pi!.phones!.filter((p) => String(p?.number || '').trim()).length : 0;
    const hasPi = Boolean((pi?.fullName || '').trim()) || akaCount > 0 || addrCount > 0 || phoneCount > 0;
    const shouldSuggest = akaCount > 0 || addrCount > 1 || phoneCount > 1;
    if (hasPi && shouldSuggest) {
      const bureaus: Bureau[] = ['TUC', 'EXP', 'EQF'];
      for (const b of bureaus) {
        out.push({
          id: `${reportId || 'report'}_personal_info_${b}`.replace(/\s+/g, '_'),
          bureau: b,
          account: 'Personal Information',
          type: 'Personal Information',
          status: 'Correct/remove inaccurate identifiers',
          code: 'FCRA § 611',
          reportId,
        });
      }
    }
  } catch {
    // best-effort only
  }

  // Filter out any candidate with score-like or generic account name (can slip in from misclassified sections)
  const filtered = out.filter((c) => !isInvalidAccountLabel(c.account));

  // Deduplicate; prefer tradeline-based (same account+bureau+type). Skip section-based collection when tradeline already has this account+bureau.
  const seen = new Set<string>();
  const tradelineAccountBureau = new Set(filtered.filter((c) => c.id.includes('_report') && !c.id.includes('_collection_') && !c.id.includes('_inquiry_')).map((c) => `${norm(c.account)}|${c.bureau}`));
  return filtered.filter((c) => {
    const k = `${c.reportId || ''}|${c.bureau}|${c.account}|${c.type}`;
    if (seen.has(k)) return false;
    if (c.type === 'Collection' && c.id.includes('_collection_') && tradelineAccountBureau.has(`${norm(c.account)}|${c.bureau}`)) return false;
    seen.add(k);
    return true;
  });
}

