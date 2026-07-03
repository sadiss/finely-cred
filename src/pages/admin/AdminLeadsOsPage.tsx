import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Facebook, Globe, Instagram, Link2, Sparkles, Target, Users } from 'lucide-react';
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
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { loadMetaIntegrationConfig, isMetaIntegrationLive } from '../../data/metaIntegrationRepo';
import { scoreLead, kanbanStageForLead } from '../../lib/leadScoring';
import { enrollLeadInNurtureSequence } from '../../lib/nurtureEngine';
import { LeadBulkImportPanel } from '../../features/leadsOs/LeadBulkImportPanel';
import { LeadScrapeSourcePicker } from '../../features/leadsOs/LeadScrapeSourcePicker';
import { LeadTrashPanel } from '../../features/studioCommandOs/LeadTrashPanel';
import { listInboxMessages } from '../../data/socialHubRepo';
import { CmoUnifiedCommandCenter } from '../../components/cmo/CmoUnifiedCommandCenter';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { Overnight50AdminNav } from '../../components/overnight50/Overnight50AdminNav';

type LeadsTab = 'inbound' | 'intel' | 'distribution' | 'social' | 'routing' | 'cmo';
type InboundView = 'pipeline' | 'cleanup';

const TABS: Array<{ id: LeadsTab; label: string; icon: typeof Target; accent: 'violet' | 'emerald' | 'sky' | 'fuchsia' | 'amber' }> = [
  { id: 'inbound', label: 'Inbound', icon: Target, accent: 'violet' },
  { id: 'intel', label: 'Intel Agent', icon: Sparkles, accent: 'fuchsia' },
  { id: 'cmo', label: 'CMO Command', icon: Bot, accent: 'amber' },
  { id: 'distribution', label: 'Distribution', icon: Globe, accent: 'amber' },
  { id: 'social', label: 'Social Leads', icon: Facebook, accent: 'sky' },
  { id: 'routing', label: 'Routing', icon: Users, accent: 'emerald' },
];

export default function AdminLeadsOsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as LeadsTab) || 'inbound';
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [version, setVersion] = useState(0);
  const [inboundQuery, setInboundQuery] = useState('');
  const [inboundView, setInboundView] = useState<InboundView>('pipeline');
  const [intelSourceHint, setIntelSourceHint] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
  const scoredCaptures = useMemo(
    () => captures.map((c) => ({ lead: c, score: scoreLead(c), stage: kanbanStageForLead(c) })),
    [captures],
  );

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const setTab = (next: LeadsTab) => {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    setParams(p, { replace: true });
  };

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

  return (
    <PageShell badge="Admin" title="Leads OS" subtitle="Unified inbound, intel discovery, social capture, and routing — GHL-class lead command center.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Lead growth"
          title="Leads command center"
          subtitle="Strategy call requests, web captures, Lead Intelligence prospects, and Meta Lead Ads — stage, score, assign, and enroll from one hub."
          accent="violet"
          kpis={[
            { label: 'Inbound CRM', value: String(inboundRecords.length), accent: 'violet' },
            { label: 'Web captures', value: String(captures.length), accent: 'fuchsia' },
            { label: 'Intel imports', value: String(intelImports.length), accent: 'emerald', hint: 'lead-intel tag' },
            { label: 'Converted', value: String(inboundRecords.filter((r) => r.stage === 'won').length), accent: 'sky' },
          ]}
          tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as LeadsTab)}
          primaryAction={{ label: 'Routing rules', onClick: () => navigate('/admin/crm/routing') }}
          secondaryAction={{ label: 'CRM intel imports', onClick: () => navigate('/admin/crm?smartList=lead_intel_imports') }}
        >
          {notice ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
          ) : null}

          {tab === 'inbound' ? (
          <>
            <div className={`${FINELY_OS_VIEW_TABS} flex flex-wrap gap-1`}>
              <button type="button" onClick={() => setInboundView('pipeline')} className={finelyOsViewTab(inboundView === 'pipeline', 'violet')}>
                Pipeline board
              </button>
              <button type="button" onClick={() => setInboundView('cleanup')} className={finelyOsViewTab(inboundView === 'cleanup', 'fuchsia')}>
                Lead cleanup & trash
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
                    window.dispatchEvent(new Event('finely:store'));
                    setVersion((v) => v + 1);
                  }}
                />
              </div>
              <div className="space-y-4 xl:w-80 shrink-0">
                <FinelyOsGlassPanel icon={Sparkles} title="Lead scoring" subtitle="ML-style fit + suggested action" accent="fuchsia">
                  <FinelyOsPaginatedStack
                    items={scoredCaptures}
                    pageSize={6}
                    emptyMessage="No web captures yet."
                    itemSpacingClassName="space-y-2"
                    renderItem={({ lead, score, stage }) => (
                      <div key={lead.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm`}>
                        <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lead.fullName || lead.email}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>
                          Score {score.score} · {score.band} · {stage}
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
                <FinelyOsGlassPanel icon={Target} title="Bulk import" subtitle="CSV → full capture pipeline" accent="sky">
                  <LeadBulkImportPanel onImported={() => setVersion((v) => v + 1)} />
                </FinelyOsGlassPanel>
              </div>
            </div>
            </>
            )}
          </>
        ) : null}

        {tab === 'intel' ? (
          <div className="space-y-4">
            <Overnight50AdminNav compact />
            <LeadIntelSwarmDashboard />
          <FinelyOsGlassPanel icon={Sparkles} title="Lead Intelligence Agent" subtitle="Discover → stage → import — full CRM-grade prospecting workspace." accent="fuchsia">
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
        ) : null}

        {tab === 'distribution' ? (
          <FinelyOsGlassPanel icon={Globe} title="Lead Growth Distribution" subtitle="Five wisdom levels — link library → campaigns → queue → channels → Python CLI." accent="amber">
            <LeadDistributionHub />
          </FinelyOsGlassPanel>
        ) : null}

        {tab === 'social' ? (
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

        {tab === 'routing' ? (
          <FinelyOsGlassPanel icon={Users} title="Lead routing" subtitle="Round-robin, territory, and CRM assignment preview." accent="emerald">
            <p className={`${FINELY_OS_ENTITY_BODY} mb-4`}>Configure round-robin and auto-assignment in CRM Routing. Inbound leads from this hub respect those rules on stage change.</p>
            <button type="button" onClick={() => navigate('/admin/crm/routing')} className={FINELY_OS_PRIMARY_BTN}>
              <Link2 size={14} /> Open routing rules
            </button>
          </FinelyOsGlassPanel>
        ) : null}

        {tab === 'cmo' ? (
          <div className="space-y-4">
            <Overnight50AdminNav compact />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/admin/cmo')} className={FINELY_OS_SECONDARY_BTN}>
                Open full CMO Command page
              </button>
            </div>
            <CmoUnifiedCommandCenter embedded defaultTab="staff" />
          </div>
        ) : null}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
