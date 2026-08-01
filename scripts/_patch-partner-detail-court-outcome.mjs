#!/usr/bin/env node
/**
 * Patch PartnerDetailPage (admin) — surface Roosevelt-style post-court payment
 * plan status, progress, and escalation risk flags inline in each debt case row
 * on the Debt tab. Idempotent (skips if already patched).
 * Educational self-help · not legal advice.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/pages/admin/PartnerDetailPage.tsx');
let s = fs.readFileSync(filePath, 'utf8');

if (s.includes('getCourtOutcomeByDebtCase')) {
  console.log('PartnerDetailPage already patched with court outcome — skipping.');
  process.exit(0);
}

// 1) Imports — court outcome repo/domain/escalation helpers + alert banner.
const importAnchor = "import { createDebtCase, listDebtByPartner } from '../../data/debtRepo';";
if (!s.includes(importAnchor)) {
  console.error('Import anchor not found — aborting without changes.');
  process.exit(1);
}
s = s.replace(
  importAnchor,
  `${importAnchor}
import { getCourtOutcomeByDebtCase } from '../../data/courtOutcomeRepo';
import { courtOutcomeHeadline, formatUsdCents, paymentPlanProgress } from '../../domain/courtOutcomes';
import { postCourtPlanRiskFlags } from '../../lib/postCourtPaymentPlanPath';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';`,
);

// 2) Debt case row — inline court outcome status + risk flags.
const rowAnchor = `                  renderItem={(d) => (
                    <div key={d.id} className={\`\${finelyOsInlineListItem()} p-4 flex items-center justify-between gap-4\`}>
                      <div className="min-w-0">
                        <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{d.name}</div>
                        <div className={\`\${FINELY_OS_ENTITY_SUBLABEL} mt-0.5\`}>
                          {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                          {d.courtCaseNumber ? \` · \${d.courtCaseNumber}\` : ''}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                        Context
                      </span>
                    </div>
                  )}`;

if (!s.includes(rowAnchor)) {
  console.error('Debt case row anchor not found — aborting without changes.');
  process.exit(1);
}

const rowReplacement = `                  renderItem={(d) => {
                    const courtOutcome = getCourtOutcomeByDebtCase(d.id);
                    const outcomeProgress = courtOutcome?.plan
                      ? paymentPlanProgress(courtOutcome.plan, { confirmedCount: courtOutcome.confirmedPaymentIsos?.length ?? 0 })
                      : null;
                    const outcomeRiskFlags = courtOutcome ? postCourtPlanRiskFlags(courtOutcome) : [];
                    return (
                      <div key={d.id} className={\`\${finelyOsInlineListItem()} !p-0 overflow-hidden\`}>
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className={\`\${FINELY_OS_ENTITY_VALUE} truncate\`}>{d.name}</div>
                            <div className={\`\${FINELY_OS_ENTITY_SUBLABEL} mt-0.5\`}>
                              {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                              {d.courtCaseNumber ? \` · \${d.courtCaseNumber}\` : ''}
                            </div>
                          </div>
                          {courtOutcome ? (
                            <span className="shrink-0 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
                              Court plan
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                              Context
                            </span>
                          )}
                        </div>
                        {courtOutcome ? (
                          <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
                            <div className={\`text-xs \${FINELY_OS_ENTITY_BODY}\`}>{courtOutcomeHeadline(courtOutcome)}</div>
                            {outcomeProgress && courtOutcome.plan ? (
                              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-white/60">
                                <span>Paid {outcomeProgress.confirmedCount}/{courtOutcome.plan.termMonths}</span>
                                <span>·</span>
                                <span>Next due {outcomeProgress.nextDueIso || '—'}</span>
                                <span>·</span>
                                <span>Remaining {formatUsdCents(outcomeProgress.remainingCents)}</span>
                              </div>
                            ) : null}
                            {outcomeRiskFlags.length ? (
                              <FinelyOsAlertBanner tone="warning" message={\`Escalation may be needed — \${outcomeRiskFlags.join(' · ')}\`} />
                            ) : (
                              <FinelyOsAlertBanner tone="success" message="Plan on track — no escalation needed right now." />
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  }}`;

s = s.replace(rowAnchor, rowReplacement);

fs.writeFileSync(filePath, s);
console.log('Patched PartnerDetailPage — inline court outcome status on debt case rows.');
