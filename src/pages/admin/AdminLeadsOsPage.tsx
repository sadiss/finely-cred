import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Globe, Instagram, Link2, Sparkles, Target, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listProspects } from '../../data/crmProspectsRepo';
import { CRM_PIPELINES } from '../../features/crm/pipelines';
import { CrmPipelineBoard, CrmRecordPanel } from '../../features/crm/components/CrmPipelineBoard';
import { applyCrmRoutingRules } from '../../features/crm/routing/applyCrmRoutingRules';
import { setCrmRecordStage } from '../../data/crmRecordsRepo';
import type { CrmRecord, CrmRecordStage } from '../../domain/crmRecords';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { LeadIntelHub } from '../../features/leadIntel/LeadIntelHub';
import { LeadDistributionHub } from '../../features/leadDistribution/LeadDistributionHub';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_TOOLBAR,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
  finelyOsInlineListItem,
  finelyOsDeckTile,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { loadMetaIntegrationConfig, isMetaIntegrationLive } from '../../data/metaIntegrationRepo';
import { scoreLead, kanbanStageForLead } from '../../lib/leadScoring';
import { enrollLeadInNurtureSequence } from '../../lib/nurtureEngine';
import { LeadBulkImportPanel } from '../../features/leadsOs/LeadBulkImportPanel';
import { LeadScrapeSourcePicker } from '../../features/leadsOs/LeadScrapeSourcePicker';
import { LeadTrashPanel } from '../../features/studioCommandOs/LeadTrashPanel';
import { NurtureOpsStrip } from '../../features/leadsOs/NurtureOpsStrip';
import { isLeadTrashed } from '../../features/studioCommandOs/leadTrashRepo';
import { listInboxMessages } from '../../data/socialHubRepo';
import { CmoUnifiedCommandCenter } from '../../components/cmo/CmoUnifiedCommandCenter';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { Overnight50AdminNav } from '../../components/overnight50/Overnight50AdminNav';
import { onBoardStageMaybeBooked } from '../../features/marketingDesk/marketingDeskBookedHandoff';
import { isCreditSpecialistLeadOffer, leadOfferLabel } from '../../lib/leadOfferLabels';

type LeadsTab = 'inbound' | 'intel' | 'distribution' | 'social' | 'routing' | 'cmo';
type InboundView = 'pipeline' | 'cleanup';
type PageMode = 'launcher' | LeadsTab;

const OWNER_TILES: Array<{
  id: LeadsTab;
  title: string;
  blurb: string;
  accent: 'violet' | 'emerald' | 'sky' | 'fuchsia' | 'amber';
}> = [
  { id: 'inbound', title: 'Inbound CRM', blurb: 'Pipeline board + cleanup for form leads.', accent: 'violet' },
  { id: 'cmo', title: 'CMO Command', blurb: 'Owner command center for growth ops.', accent: 'amber' },
  { id: 'distribution', title: 'Distribution', blurb: 'Link library → campaigns → channels.', accent: 'amber' },
  { id: 'social', title: 'Social Leads', blurb: 'Meta Lead Ads + Messenger / IG.', accent: 'sky' },
  { id: 'routing', title: 'Routing', blurb: 'Round-robin and territory rules.', accent: 'emerald' },
  { id: 'intel', title: 'Lead hunt preview', blurb: 'Owner simulation — practice counters only.', accent: 'fuchsia' },
];

const DESK_TILES: Array<{
  title: string;
  blurb: string;
  href: string;
  accent: 'emerald' | 'violet' | 'rose' | 'sky';
}> = [
  { title: 'Find new people', blurb: 'One-tap Find · Daily pack · Review.', href: '/admin/marketing?tab=desk&helper=find', accent: 'emerald' },
  { title: 'Board', blurb: 'New → Talking → Booked → Won/No.', href: '/admin/marketing?tab=desk&helper=board', accent: 'violet' },
  { title: 'Clean out junk', blurb: 'Hide from Board. Put back anytime.', href: '/admin/marketing?tab=desk&helper=clean', accent: 'rose' },
  { title: 'Mail on autopilot', blurb: 'Ready / Needs setup / Paused.', href: '/admin/marketing?tab=desk&helper=mail', accent: 'sky' },
];

function tabFromParams(params: URLSearchParams): PageMode {
  const tab = params.get('tab') as LeadsTab | null;
  if (tab && OWNER_TILES.some((t) => t.id === tab)) return tab;
  return 'launcher';
}

export default function AdminLeadsOsPage({
  embedded = false,
  initialTab,
}: {
  embedded?: boolean;
  initialTab?: string | null;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = tabFromParams(params);
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [version, setVersion] = useState(0);
  const [inboundQuery, setInboundQuery] = useState('');
  const [inboundView, setInboundView] = useState<InboundView>('pipeline');
  const [intelSourceHint, setIntelSourceHint] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (embedded && initialTab && OWNER_TILES.some((t) => t.id === initialTab)) {
      setMode(initialTab as LeadsTab);
      return;
    }
    if (embedded && mode === 'launcher') setMode('inbound');
  }, [embedded, mode, initialTab]);

  const pipeline = CRM_PIPELINES.find((p) => p.id === 'inbound') ?? CRM_PIPELINES[0];
  const inboundRecords = useMemo(
    () =>
      listCrmRecords({ q: inboundQuery, target: pipeline.target, kind: pipeline.kindFilter?.[0] }).filter(
        (r) => !pipeline.kindFilter?.length || pipeline.kindFilter.includes(r.kind),
      ),
    [pipeline, version, inboundQuery],
  );
  const captures = useMemo(() => listLeadCaptures(), [version]);
  const metaLeads = useMemo(
    () =>
      captures.filter(
        (c) =>
          (c.interest ?? '').includes('meta') ||
          c.utmSource === 'facebook' ||
          c.utmMedium === 'lead_ad' ||
          (c.funnelPath ?? '').includes('social-hub'),
      ),
    [captures],
  );
  const socialInbox = useMemo(() => listInboxMessages(), [version]);
  const intelImports = useMemo(
    () => listProspects().filter((p) => (p.tags ?? []).includes('lead-intel')),
    [version],
  );
  const [offerFilter, setOfferFilter] = useState<'all' | 'credit_specialist'>('all');
  const scoredCaptures = useMemo(
    () =>
      captures
        .filter((c) => !isLeadTrashed(c.id))
        .filter((c) => (offerFilter === 'credit_specialist' ? isCreditSpecialistLeadOffer(c.offer) : true))
        .map((c) => ({ lead: c, score: scoreLead(c), stage: kanbanStageForLead(c) })),
    [captures, version, offerFilter],
  );
  const csCaptureCount = useMemo(
    () => captures.filter((c) => !isLeadTrashed(c.id) && isCreditSpecialistLeadOffer(c.offer)).length,
    [captures, version],
  );

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const setMode = (next: PageMode) => {
    const p = new URLSearchParams(params);
    if (next === 'launcher') p.delete('tab');
    else p.set('tab', next);
    setParams(p, { replace: true });
  };

  const tab = mode;

  const syncMetaLeadsNurture = () => {
    let enrolled = 0;
    for (const lead of metaLeads) {
      const scored = scoreLead(lead);
      const hit = enrollLeadInNurtureSequence({
        leadId: lead.id,
        sequenceId: scored.suggestedSequenceId,
        tenantId: 'finely_cred',
        context: { email: lead.email, fullName: lead.fullName, source: 'meta_lead' },
      });
      if (hit) enrolled += 1;
    }
    setNotice(`Nurture sync: ${enrolled} Meta lead(s) enrolled or refreshed.`);
    setVersion((v) => v + 1);
  };

  const body = (
      <div className={FINELY_OS_PAGE}>
        {!embedded ? (
        <div className={`${FINELY_OS_VIEW_TABS} flex flex-wrap gap-1 mb-3`}>
          <button type="button" className={finelyOsViewTab(mode === 'launcher')} onClick={() => setMode('launcher')}>
            Launcher
          </button>
          {OWNER_TILES.map((t) => (
            <button key={t.id} type="button" className={finelyOsViewTab(mode === t.id)} onClick={() => setMode(t.id)}>
              {t.title}
            </button>
          ))}
        </div>
        ) : null}
        {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/preview')}
              className={FINELY_OS_SECONDARY_BTN}
              title="Structure preview — live theme unchanged"
            >
              Layout previews
            </button>
            <button type="button" onClick={() => navigate('/admin/marketing?tab=desk')} className={FINELY_OS_PRIMARY_BTN}>
              Open Marketing Desk
            </button>
          </div>
        </div>
        ) : null}

        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}

        {mode === 'launcher' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-400/25 bg-black/35 !p-4">
              <div className={`text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80`}>Owner Leads Ops</div>
              <h1 className={`mt-1 text-xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>Daily work is on Marketing Desk</h1>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Open Find, Board, Clean, or Mail below. Owner power tools stay here — practice mode and adapters live under Advanced labs.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Inbound CRM {inboundRecords.length}</span>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Captures {captures.filter((c) => !isLeadTrashed(c.id)).length}</span>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Intel imports {intelImports.length}</span>
              </div>
            </div>

            <NurtureOpsStrip />

            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Marketing Desk</div>
              <div className="mt-2 grid sm:grid-cols-2 gap-3">
                {DESK_TILES.map((t) => (
                  <button
                    key={t.href}
                    type="button"
                    className={`${finelyOsDeckTile(t.accent)} !p-4 text-left`}
                    onClick={() => navigate(t.href)}
                  >
                    <div className="font-semibold text-white">{t.title}</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{t.blurb}</p>
                    <span className="mt-3 inline-flex text-xs font-semibold text-amber-200/90">Open →</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Owner power tools</div>
              <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {OWNER_TILES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${finelyOsDeckTile(t.accent)} !p-4 text-left`}
                    onClick={() => setMode(t.id)}
                  >
                    <div className="font-semibold text-white">{t.title}</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{t.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-black/25 !p-4">
              <summary className="cursor-pointer select-none text-white font-semibold">
                Advanced labs · Practice mode / adapters / Overnight
              </summary>
              <div className="mt-4 space-y-4">
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Practice mode only — not live Find. Marketing hire should stay on Marketing Desk.
                </p>
                <Overnight50AdminNav compact />
                <LeadIntelSwarmDashboard />
                <FinelyOsGlassPanel icon={Sparkles} title="Source adapters (labs)" subtitle="Templates for Owner Intel — not the daily Find path." accent="fuchsia">
                  <LeadScrapeSourcePicker
                    onSelect={(_source, query) => {
                      setIntelSourceHint(query);
                      setMode('intel');
                      setNotice(`Source template loaded: "${query}" — open Intel labs below.`);
                    }}
                  />
                </FinelyOsGlassPanel>
              </div>
            </details>
          </div>
        ) : null}

        {mode !== 'launcher' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setMode('launcher')}>
                ← All tiles
              </button>
              {/* Intel room has its own Find CTA — avoid a second identical Desk button here */}
              {mode !== 'intel' ? (
                <button type="button" onClick={() => navigate('/admin/marketing?tab=desk')} className={FINELY_OS_SECONDARY_BTN}>
                  Marketing Desk home
                </button>
              ) : null}
            </div>

            {mode === 'inbound' ? (
              <>
                <div className={`${FINELY_OS_VIEW_TABS} flex flex-wrap gap-1`}>
                  <button type="button" onClick={() => setInboundView('pipeline')} className={finelyOsViewTab(inboundView === 'pipeline', 'violet')}>
                    Pipeline board
                  </button>
                  <button type="button" onClick={() => setInboundView('cleanup')} className={finelyOsViewTab(inboundView === 'cleanup', 'fuchsia')}>
                    Clean out junk
                  </button>
                </div>

                {inboundView === 'cleanup' ? (
                  <LeadTrashPanel />
                ) : (
                  <>
                    <div className={FINELY_OS_TOOLBAR}>
                      <input
                        value={inboundQuery}
                        onChange={(e) => setInboundQuery(e.target.value)}
                        placeholder="Search inbound leads…"
                        className={`flex-1 min-w-[200px] ${FINELY_OS_ENTITY_VALUE} bg-transparent outline-none text-sm placeholder:text-white/35`}
                      />
                      <button
                        type="button"
                        onClick={() => setOfferFilter((f) => (f === 'all' ? 'credit_specialist' : 'all'))}
                        className={offerFilter === 'credit_specialist' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                      >
                        Credit Specialists ({csCaptureCount})
                      </button>
                      <button type="button" onClick={() => navigate('/admin/crm?pipeline=agents')} className={FINELY_OS_SECONDARY_BTN}>
                        Specialists CRM
                      </button>
                      <button type="button" onClick={() => navigate('/admin/crm?pipeline=inbound')} className={FINELY_OS_SECONDARY_BTN}>
                        Full CRM workspace
                      </button>
                    </div>
                    <div className="flex flex-col xl:flex-row gap-4">
                      <div className={`flex-1 min-w-0 ${FINELY_OS_BOARD_SHELL}`}>
                        <CrmPipelineBoard
                          pipelineId="inbound"
                          records={inboundRecords}
                          onSelect={setSelected}
                          onStageChange={(recordId, stage) => {
                            setCrmRecordStage(recordId, stage as CrmRecordStage);
                            applyCrmRoutingRules(recordId);
                            if (stage === 'booked') onBoardStageMaybeBooked(recordId, stage);
                            window.dispatchEvent(new Event('finely:store'));
                            setVersion((v) => v + 1);
                          }}
                        />
                      </div>
                      <div className="space-y-4 xl:w-80 shrink-0">
                        <FinelyOsGlassPanel icon={Sparkles} title="Lead scoring" subtitle="Fit + suggested action" accent="fuchsia">
                          <FinelyOsPaginatedStack
                            items={scoredCaptures}
                            pageSize={6}
                            emptyMessage="No web captures yet."
                            itemSpacingClassName="space-y-2"
                            renderItem={({ lead, score, stage }) => (
                              <div key={lead.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm`}>
                                <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lead.fullName || lead.email}</div>
                                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>
                                  {leadOfferLabel(lead.offer)} · Score {score.score} · {score.band} · {stage}
                                  {lead.funnelId ? ` · ${lead.funnelId}` : lead.funnelPath ? ` · ${lead.funnelPath}` : ''}
                                </div>
                                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{score.suggestedAction}</div>
                                <button
                                  type="button"
                                  className={`${FINELY_OS_SECONDARY_BTN} mt-2 !text-[10px] !py-1`}
                                  onClick={() => {
                                    enrollLeadInNurtureSequence({
                                      leadId: lead.id,
                                      sequenceId: score.suggestedSequenceId,
                                      tenantId: 'finely_cred',
                                      context: { personaId: score.suggestedPersonaId, fit: score.fit },
                                    });
                                    window.dispatchEvent(new Event('finely:store'));
                                  }}
                                >
                                  Enroll {score.suggestedSequenceId.replace('seq_', '')}
                                </button>
                              </div>
                            )}
                          />
                        </FinelyOsGlassPanel>
                        <CrmRecordPanel record={selected} onClose={() => setSelected(null)} onUpdated={() => setVersion((v) => v + 1)} />
                        <FinelyOsGlassPanel icon={Target} title="Bulk import" subtitle="CSV → capture pipeline" accent="sky">
                          <LeadBulkImportPanel onImported={() => setVersion((v) => v + 1)} />
                        </FinelyOsGlassPanel>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}

            {mode === 'intel' ? (
              <div className="space-y-4">
                <div className={`${finelyOsCatalogCard('emerald')} !p-4 flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Daily hunt lives on Marketing Desk</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                      Opens Find new people (Review · pack · sleep schedule). Labs below are Owner-only.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => navigate('/admin/marketing?tab=desk&helper=find')}
                  >
                    Open Marketing Desk Find
                  </button>
                </div>
                <details className="rounded-2xl border border-white/10 bg-black/25 !p-4" open>
                  <summary className="cursor-pointer select-none text-white font-semibold">Advanced labs · practice mode & adapters</summary>
                  <div className="mt-4 space-y-4">
                    <Overnight50AdminNav compact />
                    <LeadIntelSwarmDashboard />
                    <FinelyOsGlassPanel icon={Sparkles} title="Lead Intelligence Agent" subtitle="Owner labs — discover → stage → import." accent="fuchsia">
                      <LeadScrapeSourcePicker
                        onSelect={(_source, query) => {
                          setIntelSourceHint(query);
                          setNotice(`Source template loaded: "${query}" — use Intel Agent search below.`);
                        }}
                      />
                      {intelSourceHint ? (
                        <div className={`mt-4 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                          Suggested query: <span className="font-semibold text-fuchsia-100">{intelSourceHint}</span>
                        </div>
                      ) : null}
                      <div className="mt-4">
                        <LeadIntelHub embedded showCompliance={false} />
                      </div>
                    </FinelyOsGlassPanel>
                  </div>
                </details>
              </div>
            ) : null}

            {mode === 'distribution' ? (
              <FinelyOsGlassPanel icon={Globe} title="Lead Growth Distribution" subtitle="Five wisdom levels — link library → campaigns → queue → channels → Python CLI." accent="amber">
                <LeadDistributionHub />
              </FinelyOsGlassPanel>
            ) : null}

            {mode === 'social' ? (
              <FinelyOsGlassPanel icon={Instagram} title="Social Leads" subtitle="Meta Lead Ads + Messenger/IG capture." accent="sky">
                {!isMetaIntegrationLive() ? (
                  <div className={`${FINELY_OS_NOTICE_WARN} mb-4 text-sm`}>
                    Meta integration is not live — connect in{' '}
                    <button type="button" className="underline text-amber-200" onClick={() => navigate('/admin/settings?tab=integrations')}>
                      Admin Settings → Integrations
                    </button>{' '}
                    or use Social Hub simulate for local dev.
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button type="button" onClick={() => navigate('/admin/social-hub')} className={FINELY_OS_PRIMARY_BTN}>
                    Open Social Hub
                  </button>
                  <button type="button" onClick={() => navigate('/admin/settings?tab=integrations')} className={FINELY_OS_SECONDARY_BTN}>
                    Meta settings
                  </button>
                  <button type="button" onClick={syncMetaLeadsNurture} disabled={!metaLeads.length} className={FINELY_OS_SUCCESS_BTN}>
                    Sync Meta nurture
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-sky-500/25 p-4 text-sm`}>
                    <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Meta leads: {metaLeads.length}</div>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Status: {loadMetaIntegrationConfig().status} · webhook ingests to lead_captures + meta_inbox_messages.</p>
                    {metaLeads.length > 0 ? (
                      <div className="mt-3">
                        <FinelyOsPaginatedStack
                          items={metaLeads}
                          pageSize={6}
                          emptyMessage="No Meta leads."
                          itemSpacingClassName="space-y-2"
                          renderItem={(l) => {
                            const s = scoreLead(l);
                            return (
                              <div key={l.id} className={`${finelyOsInlineListItem()} text-xs`}>
                                {l.fullName || l.email} · score {s.score} · {s.band}
                              </div>
                            );
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-sky-500/25 p-4 text-sm`}>
                    <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Inbox threads: {socialInbox.length}</div>
                    {socialInbox.length === 0 ? (
                      <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>No DMs yet — connect Meta webhooks or simulate in Social Hub.</div>
                    ) : (
                      <div className="mt-3">
                        <FinelyOsPaginatedStack
                          items={socialInbox}
                          pageSize={6}
                          emptyMessage="No inbox threads."
                          itemSpacingClassName="space-y-2"
                          renderItem={(m) => (
                            <div key={m.id} className={`${finelyOsInlineListItem()} text-xs ${FINELY_OS_ENTITY_BODY}`}>
                              {m.text}
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </FinelyOsGlassPanel>
            ) : null}

            {mode === 'routing' ? (
              <FinelyOsGlassPanel icon={Users} title="Lead routing" subtitle="Round-robin, territory, and CRM assignment preview." accent="emerald">
                <p className={`${FINELY_OS_ENTITY_BODY} mb-4`}>Configure round-robin and auto-assignment in CRM Routing. Inbound leads from this hub respect those rules on stage change.</p>
                <button type="button" onClick={() => navigate('/admin/crm/routing')} className={FINELY_OS_PRIMARY_BTN}>
                  <Link2 size={14} /> Open routing rules
                </button>
              </FinelyOsGlassPanel>
            ) : null}

            {mode === 'cmo' ? (
              <div className="space-y-4">
                <details className="rounded-2xl border border-white/10 bg-black/25 !p-4">
                  <summary className="cursor-pointer select-none text-white font-semibold">Advanced labs · Overnight / practice mode</summary>
                  <div className="mt-4">
                    <Overnight50AdminNav compact />
                  </div>
                </details>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate('/admin/cmo')} className={FINELY_OS_SECONDARY_BTN}>
                    Open full CMO Command page
                  </button>
                </div>
                <CmoUnifiedCommandCenter embedded defaultTab="staff" />
              </div>
            ) : null}
          </div>
        ) : null}

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
  );

  if (embedded) return body;

  return (
    <PageShell badge="Admin" title="Owner Leads Ops" subtitle="Power tools for inbound, labs, social, and routing — daily marketing lives on Marketing Desk.">
      {body}
    </PageShell>
  );
}
