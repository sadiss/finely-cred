import React, { useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { CrmRecord, CrmRecordStage } from '../../../domain/crmRecords';
import { formatForecastCents } from '../forecast/buildPipelineForecast';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { CRM_PIPELINES } from '../pipelines';
import { scoreCrmRecord } from '../../../lib/crmDealScoring';
import { buildConversionLikelihoodContext, computeConversionLikelihood } from '../../../lib/agentAttributionEngine';
import { getFinelyBridgeBadges } from '../../../lib/finelyBridgeCreditProgram';
import { listPartnersLocal } from '../../../data/partnersRepo';
import { FINELY_OS_DRAG_HINT, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE, finelyOsColumnThemeByColor, finelyOsStatusChip } from '../../os/finelyOsLightUi';
import { useBoardDragDrop } from '../../os/useBoardDragDrop';

export { CrmRecordPanel } from './CrmRecordDrawer';

const CONVERSION_LIKELIHOOD_CHIP_TONE = { low: 'blocked', medium: 'warn', high: 'ok' } as const;

function stageCardTone(stage: CrmRecordStage) {
  if (stage === 'converted' || stage === 'won' || stage === 'active_client') return 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20';
  if (stage === 'disqualified' || stage === 'lost') return 'border-rose-500/35 bg-rose-500/10 ring-1 ring-rose-400/20';
  if (stage === 'booked' || stage === 'replied') return 'border-amber-500/35 bg-amber-500/10 ring-1 ring-amber-400/20';
  return 'border-white/[0.08] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08] hover:border-violet-400/30';
}

export function CrmPipelineBoard({
  pipelineId,
  records,
  onSelect,
  onStageChange,
}: {
  pipelineId: string;
  records: CrmRecord[];
  onSelect: (record: CrmRecord) => void;
  onStageChange: (recordId: string, stage: CrmRecordStage) => void;
}) {
  const pipeline = CRM_PIPELINES.find((p) => p.id === pipelineId) ?? CRM_PIPELINES[0];
  const partnerById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof listPartnersLocal>[number]>();
    for (const p of listPartnersLocal()) map.set(p.id, p);
    return map;
  }, [records]);
  // G4a — internal-only conversion-likelihood signal, built once per board render (not per card).
  const conversionLikelihoodContext = useMemo(() => buildConversionLikelihoodContext(), [records]);
  const byStage = useMemo(() => {
    const map = new Map<CrmRecordStage, CrmRecord[]>();
    for (const s of pipeline.stages) map.set(s.id, []);
    for (const r of records) {
      const list = map.get(r.stage) ?? [];
      list.push(r);
      map.set(r.stage, list);
    }
    return map;
  }, [records, pipeline.stages]);

  const handleMove = useCallback(
    (recordId: string, stage: CrmRecordStage) => {
      onStageChange(recordId, stage);
    },
    [onStageChange],
  );

  const { cardDragProps, columnDropProps, stopDragOnControl } = useBoardDragDrop<CrmRecordStage>(handleMove);

  return (
    <div>
      <p className={FINELY_OS_DRAG_HINT}>
        <GripVertical size={12} /> Drag cards between columns to change stage — or use the arrows on each card
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 md:hidden snap-x snap-mandatory -mx-1 px-1">
        {pipeline.stages.map((stage) => {
          const count = (byStage.get(stage.id) ?? []).length;
          const theme = finelyOsColumnThemeByColor(stage.color);
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => document.getElementById(`crm-pipeline-col-${stage.id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })}
              className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border ${theme.header}`}
            >
              {stage.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-4 -mx-1 px-1">
        {pipeline.stages.map((stage) => {
          const cards = byStage.get(stage.id) ?? [];
          const theme = finelyOsColumnThemeByColor(stage.color);
          const dropProps = columnDropProps(stage.id, `${theme.drop} rounded-xl transition-all min-h-[140px] p-1`);
          return (
            <div key={stage.id} id={`crm-pipeline-col-${stage.id}`} className="min-w-[85vw] sm:min-w-[240px] w-[85vw] sm:w-[240px] shrink-0 snap-start scroll-ml-4">
              <div className={`rounded-xl border px-3 py-2 mb-2 flex items-center justify-between ${theme.header}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/85">
                  <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                  {stage.label}
                </span>
                <span className="text-xs font-semibold text-white/70 bg-white/[0.08] px-2 py-0.5 rounded-full">{cards.length}</span>
              </div>
              <div {...dropProps} className={`space-y-2 min-h-[140px] rounded-xl ${theme.body} ${dropProps.className ?? ''}`}>
                {cards.length === 0 ? (
                  <div className={`rounded-xl border border-dashed border-violet-400/30 p-4 text-center text-xs m-1 ${FINELY_OS_ENTITY_BODY}`}>
                    Drop here
                  </div>
                ) : (
                  cards.map((record) => {
                    const drag = cardDragProps(record.id, `rounded-xl border p-3 shadow-sm hover:shadow-md transition-all ${stageCardTone(record.stage)}`);
                    return (
                      <div
                        key={record.id}
                        {...drag}
                        onClick={() => onSelect(record)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSelect(record)}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical size={14} className="text-white/25 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm truncate ${FINELY_OS_ENTITY_VALUE}`}>{crmRecordDisplayName(record)}</div>
                            <div className={`text-xs truncate mt-1 ${FINELY_OS_ENTITY_BODY}`}>{record.contact.email || record.contact.company || record.kind}</div>
                          </div>
                        </div>
                        {record.dealValueCents ? (
                          <div className="mt-2 text-[10px] font-bold text-emerald-300">{formatForecastCents(record.dealValueCents)}</div>
                        ) : null}
                        {record.score != null ? (
                          <div className={`mt-2 inline-flex ${finelyOsStatusChip('ok')}`}>
                            Score {record.score}
                          </div>
                        ) : null}
                        {(() => {
                          const deal = scoreCrmRecord(record);
                          if (deal.band === 'won') return null;
                          const chip = deal.band === 'high' ? 'ok' : 'warn';
                          return (
                            <div className={`mt-2 inline-flex ${finelyOsStatusChip(chip)}`} title={deal.factors.join(' · ')}>
                              Win {deal.winProbability}%
                            </div>
                          );
                        })()}
                        {(() => {
                          const signal = computeConversionLikelihood(record, conversionLikelihoodContext);
                          if (record.stage === 'lost' || record.stage === 'disqualified') return null;
                          if (['converted', 'won', 'active_client'].includes(record.stage)) return null;
                          return (
                            <div
                              className={`mt-2 ml-1 inline-flex ${finelyOsStatusChip(CONVERSION_LIKELIHOOD_CHIP_TONE[signal.bucket])}`}
                              title={`Agent signal (internal): ${signal.factors.join(' · ')}`}
                            >
                              Agent signal: {signal.bucket}
                            </div>
                          );
                        })()}
                        {record.workSignals?.riskLevel === 'high' || record.workSignals?.riskLevel === 'medium' ? (
                          <div
                            className={`mt-2 inline-flex ${finelyOsStatusChip(record.workSignals.riskLevel === 'high' ? 'blocked' : 'warn')}`}
                          >
                            Work {record.workSignals.riskLevel}
                          </div>
                        ) : null}
                        {(() => {
                          if (!record.partnerId) return null;
                          const badges = getFinelyBridgeBadges(partnerById.get(record.partnerId));
                          if (!badges) return null;
                          return (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className={finelyOsStatusChip('ok')} title="Finely Cred credit phase">
                                {badges.phaseLabel.replace('Phase ', 'P')}
                              </span>
                              {badges.handoffQueued ? (
                                <span className={finelyOsStatusChip('warn')}>Handoff queued</span>
                              ) : null}
                              {badges.bridgeBadge ? (
                                <span className={finelyOsStatusChip('ok')}>Bridge</span>
                              ) : null}
                            </div>
                          );
                        })()}
                        {(() => {
                          const idx = pipeline.stages.findIndex((s) => s.id === record.stage);
                          const prevStage = idx > 0 ? pipeline.stages[idx - 1] : null;
                          const nextStage = idx >= 0 && idx < pipeline.stages.length - 1 ? pipeline.stages[idx + 1] : null;
                          return (
                            <div {...stopDragOnControl} className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={!prevStage}
                                onClick={() => prevStage && onStageChange(record.id, prevStage.id)}
                                title={prevStage ? `Move back to ${prevStage.label}` : undefined}
                                className="p-1 rounded-lg border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/25 disabled:opacity-25 disabled:pointer-events-none"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={!nextStage}
                                onClick={() => nextStage && onStageChange(record.id, nextStage.id)}
                                title={nextStage ? `Move to ${nextStage.label}` : undefined}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-25 disabled:pointer-events-none"
                              >
                                {nextStage ? nextStage.label : 'Final stage'} <ChevronRight size={12} />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
