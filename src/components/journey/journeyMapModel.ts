import * as THREE from 'three';
import type { Project, ProjectStage } from '../../domain/projects';
import type { TaskItem, TaskStage } from '../../domain/tasks';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../lib/workVisibility';
import type { JourneyStage } from './JourneyRoadmap';

export type MapStopLink = { label: string; path: string };

export type JourneyMapStop = {
  id: JourneyStage;
  label: string;
  hint: string;
  x: number;
  y: number;
  biome: 'meadow' | 'forest' | 'lake' | 'highland' | 'city' | 'summit';
  links: MapStopLink[];
  taskStages: TaskStage[];
  projectStages: ProjectStage[];
};

const BASE_LINKS: Record<JourneyStage, MapStopLink[]> = {
  intake: [{ label: 'Profile goals', path: '/portal/dashboard#profile-goals-readiness' }],
  report_upload: [{ label: 'Upload report', path: '/portal/reports' }],
  analysis: [{ label: 'Credit analysis', path: '/portal/analysis' }, { label: 'Disputes', path: '/portal/disputes' }],
  evidence: [{ label: 'Documents', path: '/portal/documents' }, { label: 'Reports intel', path: '/portal/reports' }],
  letters: [{ label: 'Template library', path: '/portal/templates' }, { label: 'Letter studio', path: '/portal/letters' }],
  mailing: [{ label: 'Tasks & mail', path: '/portal/projects' }, { label: 'Dispute center', path: '/portal/disputes' }],
  funding: [{ label: 'Wealth paths', path: '/portal/wealth-paths' }, { label: 'Build center', path: '/portal/build' }],
  complete: [{ label: 'Projects', path: '/portal/projects' }, { label: 'Letters vault', path: '/portal/letters/vault' }],
};

const ROUTE_POINTS: Array<{ x: number; y: number; biome: JourneyMapStop['biome'] }> = [
  { x: 10, y: 68, biome: 'meadow' },
  { x: 22, y: 54, biome: 'forest' },
  { x: 34, y: 46, biome: 'lake' },
  { x: 46, y: 50, biome: 'forest' },
  { x: 56, y: 38, biome: 'highland' },
  { x: 66, y: 42, biome: 'city' },
  { x: 78, y: 30, biome: 'highland' },
  { x: 90, y: 22, biome: 'summit' },
];

const STAGE_IDS: JourneyStage[] = [
  'intake',
  'report_upload',
  'analysis',
  'evidence',
  'letters',
  'mailing',
  'funding',
  'complete',
];

const STAGE_TASK_MAP: Record<JourneyStage, TaskStage[]> = {
  intake: ['intake'],
  report_upload: ['reports'],
  analysis: ['reports', 'disputes'],
  evidence: ['evidence'],
  letters: ['disputes', 'debt', 'identity'],
  mailing: ['disputes', 'debt'],
  funding: ['funding'],
  complete: ['complete'],
};

const STAGE_PROJECT_MAP: Record<JourneyStage, ProjectStage[]> = {
  intake: ['intake'],
  report_upload: ['reports'],
  analysis: ['reports', 'disputes'],
  evidence: ['evidence'],
  letters: ['disputes', 'debt', 'identity'],
  mailing: ['disputes'],
  funding: ['funding'],
  complete: ['complete'],
};

function laneLabels(laneRaw?: string | null): Partial<Record<JourneyStage, { label: string; hint: string }>> {
  const lane = (laneRaw || 'other').toLowerCase();
  if (lane.includes('business')) {
    return {
      intake: { label: 'Intake', hint: 'Business goal + readiness.' },
      report_upload: { label: 'Profile', hint: 'Entity + fundability.' },
      analysis: { label: 'Audit', hint: 'Signals + gaps.' },
      evidence: { label: 'Docs', hint: 'Proof pack.' },
      letters: { label: 'Vendors', hint: 'Sequence stack.' },
      mailing: { label: 'Funding', hint: 'Apply windows.' },
      funding: { label: 'Scale', hint: 'Limits + approvals.' },
      complete: { label: 'Complete', hint: 'Archive outcomes.' },
    };
  }
  if (lane.includes('debt')) {
    return {
      intake: { label: 'Intake', hint: 'Jurisdiction + deadlines.' },
      report_upload: { label: 'Evidence', hint: 'Docs + dates.' },
      analysis: { label: 'Strategy', hint: 'Defense lanes.' },
      evidence: { label: 'Packets', hint: 'Proof pack.' },
      letters: { label: 'Letters', hint: 'Draft & send.' },
      mailing: { label: 'Tracking', hint: 'Mail + responses.' },
      funding: { label: 'Resolution', hint: 'Settlement/closure.' },
      complete: { label: 'Complete', hint: 'Archive outcomes.' },
    };
  }
  return {};
}

export function buildJourneyMapStops(lane?: string | null): JourneyMapStop[] {
  const labels = laneLabels(lane);
  const defaults: Record<JourneyStage, { label: string; hint: string }> = {
    intake: { label: 'Intake', hint: 'Goals, lane, readiness.' },
    report_upload: { label: 'Reports', hint: 'Upload & parse.' },
    analysis: { label: 'Analysis', hint: 'Identify negatives.' },
    evidence: { label: 'Evidence', hint: 'Capture exhibits.' },
    letters: { label: 'Letters', hint: 'Draft & save.' },
    mailing: { label: 'Mail', hint: 'Send + track.' },
    funding: { label: 'Funding', hint: 'Apply window.' },
    complete: { label: 'Complete', hint: 'Archive outcomes.' },
  };
  return STAGE_IDS.map((id, i) => {
    const pt = ROUTE_POINTS[i] ?? ROUTE_POINTS[ROUTE_POINTS.length - 1]!;
    const copy = labels[id] ?? defaults[id];
    return {
      id,
      label: copy.label,
      hint: copy.hint,
      x: pt.x,
      y: pt.y,
      biome: pt.biome,
      links: BASE_LINKS[id] ?? [],
      taskStages: STAGE_TASK_MAP[id],
      projectStages: STAGE_PROJECT_MAP[id],
    };
  });
}

export type StopWorkload = {
  openTasks: number;
  doneTasks: number;
  dueSoon: number;
  projectStage?: ProjectStage;
  projectTitle?: string;
  tasks: TaskItem[];
};

export function aggregateWorkloadByStop(args: {
  stops: JourneyMapStop[];
  tasks: TaskItem[];
  projects: Project[];
}): Map<JourneyStage, StopWorkload> {
  const out = new Map<JourneyStage, StopWorkload>();
  const activeProject = args.projects.find((p) => p.status === 'active') ?? args.projects[0];
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;

  for (const stop of args.stops) {
    const matched = args.tasks.filter((t) => stop.taskStages.includes((t.stage ?? 'intake') as TaskStage));
    const open = matched.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    const done = matched.filter((t) => t.status === 'completed');
    const dueSoon = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < now + week);
    out.set(stop.id, {
      openTasks: open.length,
      doneTasks: done.length,
      dueSoon: dueSoon.length,
      projectStage: activeProject?.stage,
      projectTitle: activeProject?.title,
      tasks: open.slice(0, 5),
    });
  }
  return out;
}

export function loadPartnerMapData(partnerId: string) {
  const tasks = listPartnerPortalTasks(listTasksByPartner(partnerId));
  const projects = listPartnerPortalProjects(listProjectsByPartner(partnerId));
  return { tasks, projects };
}

export function svgRoadPath(stops: JourneyMapStop[]): string {
  if (!stops.length) return '';
  let d = `M ${stops[0]!.x} ${stops[0]!.y}`;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1]!;
    const cur = stops[i]!;
    const cx = (prev.x + cur.x) / 2;
    d += ` Q ${cx} ${prev.y} ${cur.x} ${cur.y}`;
  }
  return d;
}

export function svgRoadPathToIndex(stops: JourneyMapStop[], idx: number, micro = 0): string {
  if (!stops.length) return '';
  if (idx <= 0 && micro <= 0) return `M ${stops[0]!.x} ${stops[0]!.y}`;
  const slice = stops.slice(0, Math.min(idx + 1, stops.length));
  let d = svgRoadPath(slice);
  if (micro > 0 && idx < stops.length - 1) {
    const a = stops[idx]!;
    const b = stops[idx + 1]!;
    d += ` L ${a.x + (b.x - a.x) * micro} ${a.y + (b.y - a.y) * micro}`;
  }
  return d;
}

export function positionAlongRoute(stops: JourneyMapStop[], idx: number, micro: number) {
  if (!stops.length) return { x: 50, y: 50 };
  const i = Math.min(idx, stops.length - 1);
  const a = stops[i]!;
  if (i >= stops.length - 1 || micro <= 0) return { x: a.x, y: a.y };
  const b = stops[i + 1]!;
  return { x: a.x + (b.x - a.x) * micro, y: a.y + (b.y - a.y) * micro };
}

export function buildRoadCurve3D(nStops: number): THREE.CatmullRomCurve3 {
  const stops = buildJourneyMapStops().slice(0, nStops);
  const points = stops.map((s, i) => {
    const t = i / Math.max(1, nStops - 1);
    return new THREE.Vector3(
      -11 + t * 22,
      0.06 + Math.sin(t * Math.PI) * 0.18,
      Math.sin(t * Math.PI * 0.75) * 5.5 + (s.biome === 'summit' ? 0.8 : 0),
    );
  });
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.28);
}

export function biomeColor(biome: JourneyMapStop['biome']) {
  switch (biome) {
    case 'meadow':
      return { fill: '#14532d', stroke: '#22c55e', glow: 'rgba(34,197,94,0.25)' };
    case 'forest':
      return { fill: '#064e3b', stroke: '#10b981', glow: 'rgba(16,185,129,0.2)' };
    case 'lake':
      return { fill: '#0c4a6e', stroke: '#38bdf8', glow: 'rgba(56,189,248,0.25)' };
    case 'highland':
      return { fill: '#44403c', stroke: '#a8a29e', glow: 'rgba(168,162,158,0.2)' };
    case 'city':
      return { fill: '#312e81', stroke: '#818cf8', glow: 'rgba(129,140,248,0.25)' };
    case 'summit':
      return { fill: '#78350f', stroke: '#fbbf24', glow: 'rgba(251,191,36,0.35)' };
    default:
      return { fill: '#1e293b', stroke: '#64748b', glow: 'rgba(100,116,139,0.2)' };
  }
}
