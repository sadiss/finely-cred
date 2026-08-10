import type { DisputeCandidate } from '../domain/creditReports';
import type { DebtCase } from '../domain/debt';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { letterCategoryForCandidate } from '../creditReports/letterCategory';
import type { SelectedDispute } from '../components/disputes/DisputePickerModal';
import { normCreditorName } from './debtCreditorIntel';
import { resolveBureauDisputeLaws, type LetterCitation } from '../domain/bureauDisputeLawResolver';
import { classifyCandidateNegativeType } from '../creditReports/negativePlaybooks';

export function seedLawsForSelected(selected: SelectedDispute[]): Record<string, LetterCitation[]> {
  const laws: Record<string, LetterCitation[]> = {};
  for (const s of selected) {
    laws[s.key] = resolveBureauDisputeLaws(classifyCandidateNegativeType(s.candidate as any));
  }
  return laws;
}

function namesLikelyMatch(a: string, b: string) {
  const x = normCreditorName(a);
  const y = normCreditorName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const parts = x.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => y.includes(p));
}

function debtNameHints(debt: DebtCase): string[] {
  return [
    debt.name,
    debt.recipientName,
    debt.collectorName,
    debt.originalCreditor,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function isCollectionsLaneCandidate(c: DisputeCandidate): boolean {
  return letterCategoryForCandidate(c).key === 'collections';
}

/**
 * Match bureau dispute candidates for the tradeline / collector tied to this debt case.
 */
export function matchDisputeCandidatesForDebtCase(
  debt: DebtCase | null | undefined,
  reports: Array<{ id: string; parsed?: import('../domain/creditReports').ParsedCreditReport | null }>,
): SelectedDispute[] {
  if (!debt) return [];
  const hints = debtNameHints(debt);
  const out: SelectedDispute[] = [];
  const seen = new Set<string>();

  const push = (c: DisputeCandidate, reportId: string) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    out.push({
      key: c.id,
      candidate: c,
      source: { kind: 'report', reportId },
    });
  };

  for (const report of reports) {
    if (!report.parsed) continue;
    const candidates = deriveDisputeCandidates(report.parsed, report.id);

    if (debt.reportId === report.id && typeof debt.tradelineIndex === 'number') {
      const t = report.parsed.tradelines?.[debt.tradelineIndex];
      const acct = String(t?.creditorName || '').trim();
      if (acct) {
        for (const c of candidates) {
          if (!isCollectionsLaneCandidate(c)) continue;
          if (namesLikelyMatch(c.account, acct)) push(c, report.id);
        }
      }
    }

    for (const c of candidates) {
      if (!isCollectionsLaneCandidate(c)) continue;
      if (hints.some((h) => namesLikelyMatch(c.account, h))) push(c, report.id);
    }
  }

  return out;
}

export function mergeHandoffIntoSelectedDisputes(
  existing: SelectedDispute[],
  handoff: SelectedDispute[],
): SelectedDispute[] {
  if (!handoff.length) return existing;
  const byKey = new Map<string, SelectedDispute>();
  for (const s of existing) byKey.set(s.key, s);
  for (const s of handoff) byKey.set(s.key, s);
  return Array.from(byKey.values());
}
