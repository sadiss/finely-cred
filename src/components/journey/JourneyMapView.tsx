import React, { useMemo } from 'react';
import { CheckCircle2, ClipboardList, FileText, Image as ImageIcon, Mail, Sparkles, Trophy } from 'lucide-react';
import type { JourneyStage } from './JourneyRoadmap';

type Stop = { id: JourneyStage; label: string; Icon: any; hint: string };

const BASE_STOPS: Stop[] = [
  { id: 'intake', label: 'Intake', Icon: ClipboardList, hint: 'Goals, lane, readiness.' },
  { id: 'report_upload', label: 'Reports', Icon: FileText, hint: 'Upload & parse.' },
  { id: 'analysis', label: 'Analysis', Icon: Sparkles, hint: 'Identify negatives.' },
  { id: 'evidence', label: 'Evidence', Icon: ImageIcon, hint: 'Capture exhibits.' },
  { id: 'letters', label: 'Letters', Icon: Mail, hint: 'Draft & save.' },
  { id: 'mailing', label: 'Mail', Icon: Mail, hint: 'Send + track.' },
  { id: 'funding', label: 'Funding', Icon: Trophy, hint: 'Apply window.' },
  { id: 'complete', label: 'Complete', Icon: CheckCircle2, hint: 'Archive outcomes.' },
];

const POINTS = [
  { x: 10, y: 74 },
  { x: 22, y: 52 },
  { x: 36, y: 66 },
  { x: 48, y: 40 },
  { x: 62, y: 56 },
  { x: 72, y: 34 },
  { x: 86, y: 50 },
  { x: 92, y: 30 },
] as const;

function laneStops(laneRaw?: string | null): Stop[] {
  const lane = (laneRaw || 'other').toLowerCase();
  if (lane.includes('business')) {
    return [
      { ...BASE_STOPS[0]!, label: 'Intake', hint: 'Business goal + readiness.' },
      { ...BASE_STOPS[1]!, label: 'Profile', hint: 'Entity + fundability.' },
      { ...BASE_STOPS[2]!, label: 'Audit', hint: 'Signals + gaps.' },
      { ...BASE_STOPS[3]!, label: 'Docs', hint: 'Proof pack.' },
      { ...BASE_STOPS[4]!, label: 'Vendors', hint: 'Sequence stack.' },
      { ...BASE_STOPS[5]!, label: 'Funding', hint: 'Apply windows.' },
      { ...BASE_STOPS[6]!, label: 'Scale', hint: 'Limits + approvals.' },
      { ...BASE_STOPS[7]!, label: 'Complete', hint: 'Archive outcomes.' },
    ] as Stop[];
  }
  if (lane.includes('debt')) {
    return [
      { ...BASE_STOPS[0]!, label: 'Intake', hint: 'Jurisdiction + deadlines.' },
      { ...BASE_STOPS[1]!, label: 'Evidence', hint: 'Docs + dates.' },
      { ...BASE_STOPS[2]!, label: 'Strategy', hint: 'Defense lanes.' },
      { ...BASE_STOPS[3]!, label: 'Packets', hint: 'Proof pack.' },
      { ...BASE_STOPS[4]!, label: 'Letters', hint: 'Draft & send.' },
      { ...BASE_STOPS[5]!, label: 'Tracking', hint: 'Mail + responses.' },
      { ...BASE_STOPS[6]!, label: 'Resolution', hint: 'Settlement/closure.' },
      { ...BASE_STOPS[7]!, label: 'Complete', hint: 'Archive outcomes.' },
    ] as Stop[];
  }
  return BASE_STOPS;
}

function svgPathFromPoints(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  const [p0, ...rest] = points;
  let d = `M ${p0!.x} ${p0!.y}`;
  for (let i = 0; i < rest.length; i++) {
    const p = rest[i]!;
    const prev = points[i]!;
    const cx = (prev.x + p.x) / 2;
    d += ` Q ${cx} ${prev.y} ${p.x} ${p.y}`;
  }
  return d;
}

export function JourneyMapView(args: { stage?: JourneyStage | string; signals?: Record<string, any>; lane?: string }) {
  const stage = (args.stage || 'intake') as JourneyStage;
  const stops = useMemo(() => laneStops(args.lane), [args.lane]);
  const idx = Math.max(0, stops.findIndex((s) => s.id === stage));

  const points = useMemo(() => {
    // Ensure we always have enough points (fallback repeats last).
    const base = Array.from({ length: stops.length }, (_, i) => POINTS[i] ?? POINTS[POINTS.length - 1]!);
    return base.slice(0, stops.length);
  }, [stops.length]);

  const path = useMemo(() => svgPathFromPoints(points as any), [points]);

  const badges = useMemo(() => {
    const s = args.signals ?? {};
    const reports = Number(s.reports ?? 0);
    const evidence = Number(s.evidence ?? 0);
    const openCases = Number(s.openCases ?? 0);
    const openTasks = Number(s.openTasks ?? 0);
    const out: Array<{ title: string; hint: string }> = [];
    if (reports > 0) out.push({ title: 'Report uploaded', hint: 'You’ve started your restore journey.' });
    if (evidence > 0) out.push({ title: 'Evidence discipline', hint: 'Screenshots captured and stored.' });
    if (openCases > 0) out.push({ title: 'First case created', hint: 'Disputes are being tracked.' });
    if (openTasks > 0) out.push({ title: 'Momentum', hint: 'Active tasks are in motion.' });
    return out.slice(0, 4);
  }, [args.signals]);

  const active = stops[Math.min(idx, stops.length - 1)]!;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(900px 420px at 15% 0%, rgba(245,158,11,0.18) 0%, transparent 60%)' }} />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 34px), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 34px)',
          }}
        />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Journey map</div>
            <div className="mt-2 text-white font-semibold">World-route view</div>
            <div className="mt-1 text-white/55 text-sm">
              Current stop: <span className="text-white/80 font-mono">{active.label}</span> — {active.hint}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">stage:{stage}</div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <svg viewBox="0 0 100 85" className="w-full h-[280px] md:h-[320px]">
            {/* Route */}
            <path d={path} fill="none" stroke="rgba(245,158,11,0.55)" strokeWidth="2.2" strokeLinecap="round" />
            <path d={path} fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="6.5" strokeLinecap="round" />

            {/* Stops */}
            {stops.map((s, i) => {
              const p = points[i]!;
              const done = i < idx;
              const current = i === idx;
              const ring = done ? 'rgba(16,185,129,0.75)' : current ? 'rgba(245,158,11,0.85)' : 'rgba(255,255,255,0.20)';
              const fill = done ? 'rgba(16,185,129,0.30)' : current ? 'rgba(245,158,11,0.30)' : 'rgba(0,0,0,0.40)';
              return (
                <g key={s.id}>
                  <circle cx={p.x} cy={p.y} r={4.2} fill={fill} stroke={ring} strokeWidth={1.2} />
                  <circle cx={p.x} cy={p.y} r={7.8} fill="transparent" stroke={ring} strokeOpacity={0.25} strokeWidth={1} />
                  <text x={p.x + 3.3} y={p.y - 4.2} fontSize="3.0" fill="rgba(255,255,255,0.70)">
                    {s.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-4 grid md:grid-cols-4 gap-3">
            {(badges.length ? badges : [{ title: 'No signals yet', hint: 'Upload a report to begin.' }]).map((b) => (
              <div key={b.title} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Badge</div>
                <div className="mt-2 text-white font-semibold">{b.title}</div>
                <div className="mt-1 text-white/55 text-sm">{b.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

