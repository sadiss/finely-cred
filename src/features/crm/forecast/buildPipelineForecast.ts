import type { CrmRecord, CrmRecordStage } from '../../../domain/crmRecords';
import { isClosedStage } from '../../../domain/crmRecords';
import type { CrmPipelineDef } from '../pipelines';

const STAGE_WEIGHT: Record<string, number> = {
  new: 0.05,
  researching: 0.1,
  contact_ready: 0.15,
  outreach_sent: 0.2,
  contacted: 0.25,
  replied: 0.4,
  booked: 0.6,
  converted: 1,
  won: 1,
  active_client: 1,
  disqualified: 0,
  lost: 0,
};

export type PipelineForecast = {
  pipelineId: string;
  recordCount: number;
  openCount: number;
  totalPipelineCents: number;
  weightedForecastCents: number;
  byStage: Array<{ stage: CrmRecordStage; count: number; valueCents: number; weightedCents: number }>;
};

function dealValueForRecord(record: CrmRecord): number {
  return record.dealValueCents ?? 0;
}

function stageWeight(stage: CrmRecordStage): number {
  return STAGE_WEIGHT[String(stage)] ?? 0.1;
}

export function buildPipelineForecast(pipeline: CrmPipelineDef, records: CrmRecord[]): PipelineForecast {
  const open = records.filter((r) => !isClosedStage(r.stage));
  const byStageMap = new Map<CrmRecordStage, { count: number; valueCents: number; weightedCents: number }>();

  for (const stage of pipeline.stages) {
    byStageMap.set(stage.id, { count: 0, valueCents: 0, weightedCents: 0 });
  }

  let totalPipelineCents = 0;
  let weightedForecastCents = 0;

  for (const r of open) {
    const value = dealValueForRecord(r);
    const weight = stageWeight(r.stage);
    totalPipelineCents += value;
    weightedForecastCents += Math.round(value * weight);
    const cur = byStageMap.get(r.stage) ?? { count: 0, valueCents: 0, weightedCents: 0 };
    cur.count++;
    cur.valueCents += value;
    cur.weightedCents += Math.round(value * weight);
    byStageMap.set(r.stage, cur);
  }

  return {
    pipelineId: pipeline.id,
    recordCount: records.length,
    openCount: open.length,
    totalPipelineCents,
    weightedForecastCents,
    byStage: pipeline.stages.map((s) => ({
      stage: s.id,
      ...(byStageMap.get(s.id) ?? { count: 0, valueCents: 0, weightedCents: 0 }),
    })),
  };
}

export function formatForecastCents(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}
