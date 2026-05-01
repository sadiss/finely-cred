import type { JourneyStage } from './JourneyRoadmap';

export type JourneySceneStop = {
  id: JourneyStage;
  label: string;
  hint: string;
};

export function stageIndex(stops: JourneySceneStop[], stage: JourneyStage) {
  const idx = stops.findIndex((s) => s.id === stage);
  return Math.max(0, idx);
}

export function microProgress(args: { stage: JourneyStage; signals?: Record<string, any> }) {
  const reports = Number(args.signals?.reports ?? 0);
  const evidence = Number(args.signals?.evidence ?? 0);
  const openTasks = Number(args.signals?.openTasks ?? 0);
  if (args.stage === 'report_upload') return Math.min(0.9, reports > 0 ? 0.8 : 0.15);
  if (args.stage === 'analysis') return Math.min(0.9, reports > 0 ? 0.5 : 0.2);
  if (args.stage === 'evidence') return Math.min(0.9, evidence > 0 ? 0.75 : 0.2);
  if (args.stage === 'letters') return Math.min(0.9, openTasks > 0 ? 0.6 : 0.3);
  return 0.15;
}

export function positionPct(args: { stops: JourneySceneStop[]; stage: JourneyStage; signals?: Record<string, any> }) {
  const idx = stageIndex(args.stops, args.stage);
  const denom = Math.max(1, args.stops.length - 1);
  const base = idx / denom;
  const micro = microProgress({ stage: args.stage, signals: args.signals });
  return Math.min(1, base + micro * (1 / denom));
}

