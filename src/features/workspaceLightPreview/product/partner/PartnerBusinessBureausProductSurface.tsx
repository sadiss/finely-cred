import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CircleHelp,
  PlayCircle,
  ShieldCheck,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { BusinessCommandStrip } from '../../../../components/business/BusinessCommandStrip';
import { deleteBusinessScoreSnapshot, listBusinessScoreSnapshots, upsertBusinessScoreSnapshot } from '../../../../data/businessCreditRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { BusinessBureau, BusinessScoreSnapshot, BusinessScoreType } from '../../../../domain/businessCredit';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
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
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerBusinessBureausControlRoom.css';

const SERVICE_LINE_ID = 'business' as const;

const BUREAU_FAMILIES: Array<{
  id: BusinessBureau;
  label: string;
  focus: string;
  bullets: string[];
  accent: 'violet' | 'emerald' | 'sky';
}> = [
  {
    id: 'dnb',
    label: 'Dun & Bradstreet (D&B)',
    focus: 'Commercial identity anchor',
    bullets: ['D-U-N-S number is your business SSN', 'PAYDEX scores payment behavior 0–100', 'Vendor reporting feeds PAYDEX', 'Target 80+ PAYDEX before high-limit apps'],
    accent: 'violet',
  },
  {
    id: 'experian_business',
    label: 'Experian Business',
    focus: 'Trade lines & Intelliscore',
    bullets: ['Intelliscore Plus predicts payment risk', 'Trade lines build file depth', 'Personal guarantor may matter early', 'Monitor derogatory commercial entries'],
    accent: 'emerald',
  },
  {
    id: 'equifax_business',
    label: 'Equifax Business',
    focus: 'Commercial risk signals',
    bullets: ['Equifax Business Score for creditworthiness', 'Used by some lenders and vendors', 'Cross-check with D&B for consistency', 'Dispute inaccuracies via business dispute center'],
    accent: 'sky',
  },
];

function latestByBureau(snapshots: BusinessScoreSnapshot[]): Record<BusinessBureau, BusinessScoreSnapshot | null> {
  const out: Record<BusinessBureau, BusinessScoreSnapshot | null> = {
    dnb: null,
    experian_business: null,
    equifax_business: null,
  };
  for (const snapshot of snapshots) {
    const existing = out[snapshot.bureau];
    if (!existing || new Date(snapshot.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      out[snapshot.bureau] = snapshot;
    }
  }
  return out;
}

function partnerOwnsBusinessLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; partner: Partner; snapshots: BusinessScoreSnapshot[] };

export default function PartnerBusinessBureausProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? BarChart3;
  const scaffoldAccent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [selectedBureau, setSelectedBureau] = useState<BusinessBureau>('dnb');
  const [bureau, setBureau] = useState<BusinessBureau>('dnb');
  const [scoreType, setScoreType] = useState<BusinessScoreType>('PAYDEX');
  const [scoreValue, setScoreValue] = useState('');
  const [reportedTradelines, setReportedTradelines] = useState('');
  const [reportedPaidPayments, setReportedPaidPayments] = useState('');
  const [derogFlags, setDerogFlags] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsBusinessLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      const snapshots = listBusinessScoreSnapshots(loaded.id);
      if (!cancelled) setState({ status: 'ready', partner: loaded, snapshots });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load bureau scores right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => { cancelled = true; };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);
  const partner = state.status === 'ready' ? state.partner : sessionPartner;
  const snapshots = state.status === 'ready' ? state.snapshots : [];
  const byBureau = latestByBureau(snapshots);
  const trackedCount = Object.values(byBureau).filter(Boolean).length;
  const derogTotal = snapshots.reduce((sum, snap) => sum + (snap.derogFlags?.length ?? 0), 0);
  const paydex = byBureau.dnb?.scoreValue;
  const selectedFamily = BUREAU_FAMILIES.find((f) => f.id === selectedBureau) ?? BUREAU_FAMILIES[0];

  const metrics: ProductMetric[] = [
    { label: 'Snapshots', value: snapshots.length, hint: 'Score history', accent: 'sky', icon: BarChart3, onClick: () => navigate(mapPortalHref('/business/bureaus')) },
    { label: 'Bureaus tracked', value: `${trackedCount}/3`, hint: 'D&B · Experian · Equifax', accent: 'emerald', icon: ShieldCheck, onClick: () => navigate(mapPortalHref('/business/bureaus')) },
    { label: 'Derog flags', value: derogTotal, hint: 'Open commercial flags', accent: 'rose', icon: ShieldAlert, onClick: () => navigate(mapPortalHref('/business/disputes')) },
    { label: 'PAYDEX', value: typeof paydex === 'number' ? paydex : '—', hint: typeof paydex === 'number' && paydex >= 80 ? 'On target' : 'Target 80+', accent: 'violet', icon: Target, onClick: () => navigate(mapPortalHref('/business/bureaus')) },
  ];

  const controlRoomBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-biz-bureau-control-room`} data-surface-layout="control-room">
      <BusinessCommandStrip partner={partner ?? null} />

      <div
        className={`fc-wlp-biz-bureau-alert-rail ${finelyOsCatalogCard(derogTotal > 0 ? 'rose' : 'sky')} p-6 lg:p-8`}
        data-fc-accent={derogTotal > 0 ? 'rose' : 'sky'}
      >
        <div className="min-w-0">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Bureau observatory</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Commercial score control room</h2>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {trackedCount < 3
              ? `${3 - trackedCount} bureau${3 - trackedCount === 1 ? '' : 's'} still need a baseline snapshot.`
              : 'All three bureaus have logged scores — refresh after each vendor reporting cycle.'}
          </p>
        </div>
        {derogTotal > 0 ? (
          <div className="flex items-center gap-3 shrink-0">
            <ShieldAlert size={22} className="text-rose-500 shrink-0" />
            <div>
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{derogTotal} derog flag{derogTotal === 1 ? '' : 's'}</div>
              <button type="button" onClick={() => navigate(mapPortalHref('/business/disputes'))} className="mt-1 text-sm font-bold text-rose-600 underline">
                Open dispute center
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(mapPortalHref('/business/vendors'))} className={FINELY_OS_SECONDARY_BTN}>
              Vendor center
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/business/profile'))} className={FINELY_OS_PRIMARY_BTN}>
              Business profile
            </button>
          </div>
        )}
      </div>

      <div className="fc-wlp-biz-bureau-status-grid">
        {BUREAU_FAMILIES.map((family) => {
          const snapshot = byBureau[family.id];
          const active = family.id === selectedBureau;
          const scoreOk = typeof snapshot?.scoreValue === 'number' && snapshot.scoreValue >= 80;
          return (
            <button
              key={family.id}
              type="button"
              onClick={() => setSelectedBureau(family.id)}
              className={`fc-wlp-biz-bureau-status-tile ${finelyOsCatalogCard(family.accent)}`}
              data-fc-accent={family.accent}
              data-active={active ? 'true' : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <TrendingUp size={20} />
                <span className={finelyOsStatusChip(snapshot ? (scoreOk ? 'ok' : 'warn') : 'blocked')}>
                  {snapshot ? snapshot.scoreType : 'Not tracked'}
                </span>
              </div>
              <div className="fc-wlp-biz-bureau-status-score mt-3">{snapshot?.scoreValue ?? '—'}</div>
              <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{family.label.split('(')[0].trim()}</div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{family.focus}</p>
            </button>
          );
        })}
      </div>

      <div className="fc-wlp-biz-bureau-deck">
        <aside className="fc-wlp-biz-bureau-rail min-w-0">
          <div className={`${finelyOsCatalogCard(selectedFamily.accent)} p-6 lg:p-8 space-y-3`} data-fc-accent={selectedFamily.accent}>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Selected bureau</p>
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedFamily.label}</h2>
            <ul className={`list-disc pl-5 text-sm font-bold ${FINELY_OS_ENTITY_BODY} space-y-1`}>
              {selectedFamily.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <button type="button" onClick={() => navigate(mapPortalHref('/business/profile'))} className={FINELY_OS_SECONDARY_BTN}>
              Profile readiness <ArrowRight size={14} />
            </button>
          </div>

          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-3`} data-fc-accent="rose">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Consistency rules</span>
            </div>
            <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY} space-y-2`}>
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Must match everywhere</div>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Legal name + suffix</li>
                  <li>Address + suite/unit</li>
                  <li>Phone, 411, website</li>
                  <li>EIN and SOS records</li>
                </ul>
              </div>
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Common mistakes</div>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>PO box vs street mix</li>
                  <li>Personal phone on apps</li>
                  <li>Revolving before Tier 1</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4 min-w-0`} data-fc-accent="violet">
          <div className={FINELY_OS_ENTITY_TITLE}>Score capture</div>
          {!partner ? (
            <div className={FINELY_OS_NOTICE}>Sign in to store score snapshots.</div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const v = scoreValue.trim() ? Number(scoreValue) : null;
                const tl = reportedTradelines.trim() ? Number(reportedTradelines) : null;
                const pp = reportedPaidPayments.trim() ? Number(reportedPaidPayments) : null;
                upsertBusinessScoreSnapshot({
                  partnerId: partner.id,
                  bureau,
                  scoreType,
                  scoreValue: Number.isFinite(v as number) ? (v as number) : null,
                  reportedTradelines: Number.isFinite(tl as number) ? (tl as number) : null,
                  reportedPaidPayments: Number.isFinite(pp as number) ? (pp as number) : null,
                  derogFlags: derogFlags.split(',').map((x) => x.trim()).filter(Boolean),
                  notes: notes.trim() || undefined,
                });
                setScoreValue('');
                setReportedTradelines('');
                setReportedPaidPayments('');
                setDerogFlags('');
                setNotes('');
                setRetryToken((t) => t + 1);
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
                  <input value={scoreValue} onChange={(e) => setScoreValue(e.target.value.replace(/[^\d.]/g, '').slice(0, 6))} className={FINELY_OS_ENTITY_INPUT} placeholder="80" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Tradelines</div>
                  <input value={reportedTradelines} onChange={(e) => setReportedTradelines(e.target.value.replace(/\D/g, '').slice(0, 4))} className={FINELY_OS_ENTITY_INPUT} placeholder="5" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Paid payments</div>
                  <input value={reportedPaidPayments} onChange={(e) => setReportedPaidPayments(e.target.value.replace(/\D/g, '').slice(0, 6))} className={FINELY_OS_ENTITY_INPUT} placeholder="12" />
                </label>
              </div>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Derog flags (comma separated)</div>
                <input value={derogFlags} onChange={(e) => setDerogFlags(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="collections, lien" />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Notes</div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} min-h-[120px] resize-y`} rows={4} />
              </label>
              <button type="submit" className={`${FINELY_OS_PRIMARY_BTN} w-full`}>Add snapshot</button>
            </form>
          )}
        </div>

        <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 min-w-0`} data-fc-accent="emerald">
          <div className="flex items-center justify-between gap-3">
            <div className={FINELY_OS_ENTITY_TITLE}>Snapshot river</div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{snapshots.length}</div>
          </div>
          <div className="fc-wlp-biz-bureau-snapshot-river mt-4">
            <div className="fc-wlp-biz-bureau-snapshot-river-head">Recent history</div>
            {snapshots.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No snapshots yet. Log your first score in capture.</div>
            ) : (
              snapshots.slice(0, 20).map((s) => (
                <div key={s.id} className={finelyOsInlineListItem()}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_VALUE}>{s.bureau.replaceAll('_', ' ')} • {s.scoreType}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{new Date(s.updatedAt).toLocaleString()}</div>
                    </div>
                    {partner ? (
                      <button type="button" onClick={() => { deleteBusinessScoreSnapshot(partner.id, s.id); setRetryToken((t) => t + 1); }} className={FINELY_OS_SECONDARY_BTN} title="Delete snapshot">
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: 'Score', value: s.scoreValue ?? '—' },
                      { label: 'Tradelines', value: s.reportedTradelines ?? '—' },
                      { label: 'Paid', value: s.reportedPaidPayments ?? '—' },
                      { label: 'Derogs', value: (s.derogFlags ?? []).length ? s.derogFlags.join(', ') : '—' },
                    ].map((cell, i) => (
                      <div key={cell.label} className={finelyOsKpiTile(i)}>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{cell.value}</div>
                      </div>
                    ))}
                  </div>
                  {s.notes ? <div className={`mt-3 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{s.notes}</div> : null}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );

  const askFinelyPrompt = 'Which business bureau should I prioritize first?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Business bureaus' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow={demoSpec?.eyebrow ?? 'Business bureaus'} title={demoSpec?.title ?? 'Business bureaus & scores'} description={demoSpec?.description ?? 'D&B, Experian Business, and Equifax Business.'} status="demo data" freshness="demo snapshot" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} metricTitle="Bureau coverage" metricDescription="Track each commercial bureau separately." primaryAction={<ProductPagePrimaryAction label="Open bureau tracker" onClick={() => navigate(mapPortalHref('/business/bureaus'))} />}>
        {controlRoomBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading bureau scores" />;
  if (state.status === 'error') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business bureaus" title="Business bureaus & scores" description="Commercial bureau tracking." status="Error" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}>
        <ProductEmptyState title="Could not load bureau scores" description={state.message} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>} />
      </ProductHubScaffold>
    );
  }
  if (state.status === 'locked') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business bureaus" title="Business bureaus & scores" description="Commercial bureau tracking." status="Not started" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} primaryAction={<ProductPagePrimaryAction label="Explore business credit" onClick={() => navigate(serviceLine.upsellPath)} />}>
        <ProductEmptyState title="Not started yet" description={serviceLine.upsellHeadline} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>See business options</button>} />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Business bureaus"
      title="Business bureaus & scores"
      description="D&B, Experian Business, and Equifax Business — track PAYDEX and reporting depth."
      status={`${trackedCount}/3 bureaus tracked · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Bureau coverage"
      metricDescription="Status grid and alert rail — capture scores in the control deck."
      primaryAction={<ProductPagePrimaryAction label="Business profile" onClick={() => navigate(mapPortalHref('/business/profile'))} />}
      secondaryAction={<button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/business/vendors'))}>Vendor center</button>}
    >
      {controlRoomBody}
      <aside className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="sky">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">{trackedCount < 3 ? 'Close bureau coverage gaps' : 'Keep scores current'}</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Log PAYDEX and commercial scores after each vendor reporting cycle.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
