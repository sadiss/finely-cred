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
          accent="sky"
          kpis={[
            { label: 'Snapshots', value: String(snapshots.length), accent: 'violet' },
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
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            {[
              {
                bureau: 'Dun & Bradstreet (D&B)',
                accent: 'violet' as const,
                focus: 'Commercial identity anchor',
                bullets: ['D-U-N-S number is your business SSN', 'PAYDEX scores payment behavior 0–100', 'Vendor reporting feeds PAYDEX over time', 'Target 80+ PAYDEX before high-limit apps'],
              },
              {
                bureau: 'Experian Business',
                accent: 'emerald' as const,
                focus: 'Trade lines & Intelliscore',
                bullets: ['Intelliscore Plus predicts payment risk', 'Trade lines from vendors build file depth', 'Personal guarantor may still matter early', 'Monitor derogatory commercial entries'],
              },
              {
                bureau: 'Equifax Business',
                accent: 'sky' as const,
                focus: 'Commercial risk signals',
                bullets: ['Equifax Business Score for creditworthiness', 'Used by some lenders and vendors', 'Cross-check with D&B for consistency', 'Dispute inaccurate entries via business dispute center'],
              },
            ].map((card) => (
              <div key={card.bureau} className={`${finelyOsCatalogCard(card.accent)} space-y-4`} data-fc-accent={card.accent}>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{card.bureau}</div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{card.focus}</div>
                <ul className={`list-disc pl-4 text-base ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                  {card.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`${finelyOsCatalogCard('rose')} space-y-4`} data-fc-accent="rose">
            <div className="inline-flex items-center gap-2 text-violet-700">
              <ShieldCheck size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Profile consistency rules</span>
            </div>
            <div className={`grid md:grid-cols-2 gap-4 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Must match everywhere</div>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Legal business name + suffix (LLC/Inc)</li>
                  <li>Address format + suite/unit</li>
                  <li>Phone + 411 listing + website/domain</li>
                  <li>EIN and Secretary of State records</li>
                </ul>
              </div>
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Common mistakes to avoid</div>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Mixing PO box and street addresses randomly</li>
                  <li>Personal phone/email on vendor applications</li>
                  <li>Applying for revolving before Tier 1 vendors report</li>
                  <li>Ignoring derogatory commercial bureau entries</li>
                </ul>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_PRIMARY_BTN}>
              Improve profile readiness <ArrowRight size={14} />
            </button>
          </div>
        </div>
          )}

          {tab === 'scores' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} space-y-4`} data-fc-accent="violet">
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

          <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
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
