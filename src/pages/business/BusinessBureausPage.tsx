import React, { useMemo, useState } from 'react';
import { ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { deleteBusinessScoreSnapshot, listBusinessScoreSnapshots, upsertBusinessScoreSnapshot } from '../../data/businessCreditRepo';
import type { BusinessBureau, BusinessScoreType } from '../../domain/businessCredit';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,

  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type BureauTab = 'guide' | 'scores';

export default function BusinessBureausPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<BureauTab>('guide');
  const snapshots = useMemo(() => (partner ? listBusinessScoreSnapshots(partner.id) : []), [partner?.id]);

  const [bureau, setBureau] = useState<BusinessBureau>('dnb');
  const [scoreType, setScoreType] = useState<BusinessScoreType>('PAYDEX');
  const [scoreValue, setScoreValue] = useState<string>('');
  const [reportedTradelines, setReportedTradelines] = useState<string>('');
  const [reportedPaidPayments, setReportedPaidPayments] = useState<string>('');
  const [derogFlags, setDerogFlags] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  return (
    <PageShell
      badge="Business Portal"
      title="Business Bureaus & Scores"
      subtitle="Guided knowledge for D&B, Experian Business, and Equifax Business. Learn what matters, what to avoid, and how to align your profile across the board."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Business bureaus & scores"
          subtitle="D&B, Experian Business, and Equifax Business — what matters and how to track progress."
          accent="amber"
          kpis={[
            { label: 'Snapshots', value: String(snapshots.length), accent: 'amber' },
            { label: 'Bureaus', value: '3', accent: 'emerald' },
          ]}
          tabs={[
            { id: 'guide', label: 'Guide' },
            { id: 'scores', label: 'Score tracker' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as BureauTab)}
          primaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
          secondaryAction={{ label: 'Vendor center', onClick: () => navigate('/business/vendors') }}
        >
          {tab === 'guide' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-3`} data-fc-accent="amber">
            <div className="inline-flex items-center gap-2 text-amber-700">
              <ShieldCheck size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>A→Z guidance</span>
            </div>
            <div className={FINELY_OS_ENTITY_BODY}>
              This hub will be expanded into a full roadmap and score tracker. For now, use it as your "what matters" reference and link-out point from Profile, Vendors, and Lender Logic.
            </div>
            <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_PRIMARY_BTN}>
              Improve profile readiness <ArrowRight size={14} />
            </button>
          </div>

          <details className={`${finelyOsCatalogCard('emerald')} !p-0 overflow-hidden`} data-fc-accent="emerald" open>
            <summary className="cursor-pointer select-none px-5 py-4 hover:bg-black/[0.04] transition-colors">
              <div className={FINELY_OS_ENTITY_VALUE}>What bureaus do (high level)</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>Expand</div>
            </summary>
            <div className={`px-5 pb-5 ${FINELY_OS_ENTITY_BODY} space-y-3`}>
              <div>
                <span className={FINELY_OS_ENTITY_VALUE}>Dun & Bradstreet (D&B)</span>: establishes a commercial identity (D‑U‑N‑S) and payment behavior signals.
              </div>
              <div>
                <span className={FINELY_OS_ENTITY_VALUE}>Experian Business</span>: business credit file and payment/trade reporting signals.
              </div>
              <div>
                <span className={FINELY_OS_ENTITY_VALUE}>Equifax Business</span>: commercial file + risk signals often referenced by certain lenders and reporting vendors.
              </div>
            </div>
          </details>

          <details className={`${finelyOsCatalogCard('sky')} !p-0 overflow-hidden`} data-fc-accent="sky">
            <summary className="cursor-pointer select-none px-5 py-4 hover:bg-black/[0.04] transition-colors">
              <div className={FINELY_OS_ENTITY_VALUE}>Profile consistency rules</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>Expand</div>
            </summary>
            <div className={`px-5 pb-5 ${FINELY_OS_ENTITY_BODY} space-y-2`}>
              <div className={FINELY_OS_ENTITY_VALUE}>Everything should match across the board:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Legal business name + suffix (LLC/Inc) exactly</li>
                <li>Address format + suite/unit</li>
                <li>Phone + 411 listing + website/domain</li>
                <li>EIN and state records</li>
              </ul>
              <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>We'll expand this into guided checklists and "what to put / not to put" steps in the next phases.</div>
            </div>
          </details>
        </div>
          )}

          {tab === 'scores' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_TITLE}>Manual score tracker (for now)</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              Add score snapshots per bureau. Track <span className={FINELY_OS_ENTITY_VALUE}>reported tradelines</span> and{' '}
              <span className={FINELY_OS_ENTITY_VALUE}>reported paid payments</span>—these are key inputs to improving business profiles over time.
            </div>
            {!partner ? (
              <div className={FINELY_OS_NOTICE}>Sign in as a partner to store score snapshots.</div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partner) return;
                  const v = scoreValue.trim() ? Number(scoreValue) : null;
                  const tl = reportedTradelines.trim() ? Number(reportedTradelines) : null;
                  const pp = reportedPaidPayments.trim() ? Number(reportedPaidPayments) : null;
                  upsertBusinessScoreSnapshot({
                    partnerId: partner.id,
                    bureau,
                    scoreType,
                    scoreValue: Number.isFinite(v as any) ? (v as any) : null,
                    reportedTradelines: Number.isFinite(tl as any) ? (tl as any) : null,
                    reportedPaidPayments: Number.isFinite(pp as any) ? (pp as any) : null,
                    derogFlags: derogFlags
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean),
                    notes: notes.trim() || undefined,
                  });
                  setScoreValue('');
                  setReportedTradelines('');
                  setReportedPaidPayments('');
                  setDerogFlags('');
                  setNotes('');
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Bureau</div>
                    <select value={bureau} onChange={(e) => setBureau(e.target.value as BusinessBureau)} className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}>
                      <option value="dnb">D&B</option>
                      <option value="experian_business">Experian Business</option>
                      <option value="equifax_business">Equifax Business</option>
                    </select>
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Score type</div>
                    <select value={scoreType} onChange={(e) => setScoreType(e.target.value as BusinessScoreType)} className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}>
                      <option value="PAYDEX">PAYDEX</option>
                      <option value="IntelliscorePlus">Intelliscore Plus</option>
                      <option value="EquifaxBusinessScore">Equifax Business Score</option>
                      <option value="FICO_SBSS">FICO SBSS</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Score</div>
                    <input value={scoreValue} onChange={(e) => setScoreValue(e.target.value.replace(/[^\d.]/g, '').slice(0, 6))} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. 80" />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Tradelines</div>
                    <input value={reportedTradelines} onChange={(e) => setReportedTradelines(e.target.value.replace(/\D/g, '').slice(0, 4))} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. 5" />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Paid payments</div>
                    <input value={reportedPaidPayments} onChange={(e) => setReportedPaidPayments(e.target.value.replace(/\D/g, '').slice(0, 6))} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. 12" />
                  </label>
                </div>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Derog flags (comma separated)</div>
                  <input value={derogFlags} onChange={(e) => setDerogFlags(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. collections, lien, bankruptcy" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Notes</div>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} min-h-[84px] resize-y`} placeholder="Optional notes about what changed." />
                </label>
                <button type="submit" className={`${FINELY_OS_PRIMARY_BTN} w-full`}>
                  Add snapshot
                </button>
              </form>
            )}
          </div>

          <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
            <div className="flex items-center justify-between gap-3">
              <div className={FINELY_OS_ENTITY_TITLE}>Snapshots</div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{snapshots.length}</div>
            </div>
            <div className="mt-4 grid gap-3">
              {snapshots.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No snapshots yet. Add your first score snapshot on the left.</div>
              ) : (
                snapshots.slice(0, 20).map((s) => (
                  <div key={s.id} className={finelyOsInlineListItem()}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={FINELY_OS_ENTITY_VALUE}>
                          {s.bureau.replaceAll('_', ' ')} • {s.scoreType}
                        </div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{new Date(s.updatedAt).toLocaleString()}</div>
                      </div>
                      {partner ? (
                        <button type="button" onClick={() => deleteBusinessScoreSnapshot(partner.id, s.id)} className={FINELY_OS_SECONDARY_BTN} title="Delete snapshot">
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid md:grid-cols-4 gap-3">
                      {[
                        { label: 'Score', value: s.scoreValue ?? '—' },
                        { label: 'Tradelines', value: s.reportedTradelines ?? '—' },
                        { label: 'Paid payments', value: s.reportedPaidPayments ?? '—' },
                        { label: 'Derogs', value: (s.derogFlags ?? []).length ? s.derogFlags.join(', ') : '—' },
                      ].map((cell, i) => (
                        <div key={cell.label} className={finelyOsKpiTile(i)}>
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{cell.value}</div>
                        </div>
                      ))}
                    </div>
                    {s.notes ? <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{s.notes}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
