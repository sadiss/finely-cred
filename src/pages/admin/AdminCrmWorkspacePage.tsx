import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listCrmRecords, convertCrmRecordToPartner, getRecommendedPackageForRecord } from '../../data/crmRecordsRepo';
import { getTaskPlaybookStats } from '../../data/taskPlaybooksRepo';
import { CRM_PIPELINES } from '../../features/crm/pipelines';
import { CrmPipelineBoard, CrmRecordPanel } from '../../features/crm/components/CrmPipelineBoard';
import { CrmAICopilotPanel } from '../../features/crm/components/CrmAICopilotPanel';
import { CrmForecastPanel } from '../../features/crm/components/CrmForecastPanel';
import { CrmQuickCreatePanel } from '../../features/crm/components/CrmQuickCreatePanel';
import { CrmConsentPanel } from '../../features/crm/components/CrmConsentPanel';
import { applyCrmSmartList } from '../../features/crm/smartLists/crmSmartLists';
import { buildPipelineForecast, formatForecastCents } from '../../features/crm/forecast/buildPipelineForecast';
import type { CrmRecord } from '../../domain/crmRecords';
import type { CrmRecordStage } from '../../domain/crmRecords';
import { setCrmRecordStage } from '../../data/crmRecordsRepo';
import { UserPlus, Gift, FileSpreadsheet } from 'lucide-react';
import { CrmBulkDataPanel } from '../../features/crm/components/CrmBulkDataPanel';
import { CrmSmartListsPanel } from '../../features/crm/components/CrmSmartListsPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_TOOLBAR,
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildCrmNoticedItems } from '../../lib/finelyProactiveSignals';
import { applyCrmRoutingRules } from '../../features/crm/routing/applyCrmRoutingRules';

type CrmHubTab = 'pipeline' | 'forecast';

export default function AdminCrmWorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hubTab, setHubTab] = useState<CrmHubTab>('pipeline');
  const [version, setVersion] = useState(0);
  const [pipelineId, setPipelineId] = useState('clients');
  const [query, setQuery] = useState('');
  const [smartListId, setSmartListId] = useState<string>('all');
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const stats = useMemo(() => getTaskPlaybookStats(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pipe = params.get('pipeline');
    if (pipe && CRM_PIPELINES.some((p) => p.id === pipe)) setPipelineId(pipe);
    const smart = params.get('smartList');
    if (smart) setSmartListId(smart);
    const hub = searchParams.get('tab');
    if (hub === 'pipeline' || hub === 'forecast') setHubTab(hub);
  }, [searchParams]);

  const selectHubTab = (id: CrmHubTab) => {
    setHubTab(id);
    navigate(`/admin/crm?tab=${id}`, { replace: true });
  };

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const pipeline = CRM_PIPELINES.find((p) => p.id === pipelineId) ?? CRM_PIPELINES[0];
  const baseRecords = useMemo(
    () =>
      listCrmRecords({
        q: query,
        target: pipeline.target,
        kind: pipeline.kindFilter?.length === 1 ? pipeline.kindFilter[0] : undefined,
      }).filter((r) => !pipeline.kindFilter?.length || pipeline.kindFilter.includes(r.kind)),
    [query, pipeline, version],
  );
  const records = useMemo(() => applyCrmSmartList(baseRecords, smartListId), [baseRecords, smartListId]);
  const forecast = useMemo(() => buildPipelineForecast(pipeline, baseRecords), [pipeline, baseRecords]);

  const convert = async (record: CrmRecord) => {
    const recs = getRecommendedPackageForRecord(record);
    const packageId = recs[0]?.id;
    const result = await convertCrmRecordToPartner({ recordId: record.id, packageId });
    if (result?.partnerId) {
      navigate(`/admin/partners/${result.partnerId}${result.projectId ? `?project=${result.projectId}` : ''}`);
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="CRM workspace"
      subtitle={`Unified pipeline — ${stats.playbookCount}+ playbooks, ${stats.bundleCount} service bundles.`}
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyNoticedStrip items={buildCrmNoticedItems({ recordsInPipeline: records.length })} />
        <FinelyNowDoThisStrip currentIndex={1} />
        <FinelyUnifiedHubLayout
          eyebrow="CRM OS"
          title="Pipeline workspace"
          subtitle="Drag deals, apply smart lists, and jump to forecast or AI copilot — one tab at a time."
          accent="sky"
          kpis={[
            { label: 'In view', value: String(records.length), accent: 'sky' },
            { label: 'Pipeline', value: pipeline.label, accent: 'violet' },
            { label: 'Forecast', value: formatForecastCents(forecast.weightedForecastCents), accent: 'emerald', hint: 'weighted' },
          ]}
          tabs={[
            { id: 'pipeline', label: 'Pipeline board', badge: records.length || undefined },
            { id: 'forecast', label: 'Forecast & AI' },
          ]}
          activeTab={hubTab}
          onTabChange={(id) => selectHubTab(id as CrmHubTab)}
          primaryAction={{ label: 'Sequences', onClick: () => navigate('/admin/crm/sequences') }}
          secondaryAction={{ label: 'Playbook library', onClick: () => navigate('/admin/playbooks') }}
        >
          <div className={FINELY_OS_TOOLBAR}>
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className={FINELY_OS_ENTITY_SELECT}
            >
              {CRM_PIPELINES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, company…"
              className={`flex-1 min-w-[200px] ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
            />
            <button type="button" onClick={() => setQuickCreateOpen(true)} className={FINELY_OS_SUCCESS_BTN}>
              <UserPlus size={14} />
              New lead
            </button>
            <button type="button" onClick={() => navigate('/admin/crm/routing')} className={FINELY_OS_SECONDARY_BTN}>
              Routing
            </button>
            <button type="button" onClick={() => navigate('/admin/crm/referrals')} className={`${FINELY_OS_SECONDARY_BTN} border-violet-500/30`}>
              <Gift size={14} />
              Referrals
            </button>
            <button type="button" onClick={() => setBulkOpen(true)} className={FINELY_OS_SECONDARY_BTN}>
              <FileSpreadsheet size={14} />
              Import / export
            </button>
          </div>

          <CrmSmartListsPanel records={baseRecords} value={smartListId} onChange={setSmartListId} />

          {hubTab === 'pipeline' ? (
            <div className="flex flex-col xl:flex-row gap-4">
              <div className={`flex-1 min-w-0 ${FINELY_OS_BOARD_SHELL}`}>
                <CrmPipelineBoard
                  pipelineId={pipelineId}
                  records={records}
                  onSelect={setSelected}
                  onStageChange={(recordId, stage) => {
                    setCrmRecordStage(recordId, stage as CrmRecordStage);
                    const next = applyCrmRoutingRules(recordId);
                    window.dispatchEvent(new Event('finely:store'));
                    setVersion((v) => v + 1);
                    if (selected?.id === recordId && next) setSelected(next);
                  }}
                />
              </div>
              <div className="space-y-4">
                <CrmRecordPanel
                  record={selected}
                  onClose={() => setSelected(null)}
                  onConvert={convert}
                  onUpdated={() => setVersion((v) => v + 1)}
                />
                {selected ? (
                  <CrmConsentPanel record={selected} onUpdated={() => setVersion((v) => v + 1)} />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <CrmForecastPanel forecast={forecast} />
              {selected ? (
                <CrmAICopilotPanel record={selected} />
              ) : (
                <div className={FINELY_OS_ENTITY_EMPTY}>
                  <p className={FINELY_OS_ENTITY_BODY}>Select a record on the Pipeline board tab to open AI copilot insights here.</p>
                </div>
              )}
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>

      <CrmQuickCreatePanel
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={(record) => {
          setPipelineId('inbound');
          setSelected(record);
          setHubTab('pipeline');
          setVersion((v) => v + 1);
        }}
      />
      <CrmBulkDataPanel
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        records={records}
        onImported={() => setVersion((v) => v + 1)}
      />
    </PageShell>
  );
}
