import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Compass, ListChecks, Lock, MapPin, Mountain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../domain/projects';
import type { TaskItem } from '../../domain/tasks';
import type { JourneyStage } from './JourneyRoadmap';
import {
  aggregateWorkloadByStop,
  biomeColor,
  buildJourneyMapStops,
  positionAlongRoute,
  svgRoadPath,
  svgRoadPathToIndex,
  type JourneyMapStop,
} from './journeyMapModel';

function microProgress(stage: JourneyStage, signals?: Record<string, unknown>) {
  const reports = Number(signals?.reports ?? 0);
  const evidence = Number(signals?.evidence ?? 0);
  const openTasks = Number(signals?.openTasks ?? 0);
  if (stage === 'report_upload') return Math.min(0.9, reports > 0 ? 0.8 : 0.15);
  if (stage === 'analysis') return Math.min(0.9, reports > 0 ? 0.5 : 0.2);
  if (stage === 'evidence') return Math.min(0.9, evidence > 0 ? 0.75 : 0.2);
  if (stage === 'letters') return Math.min(0.9, openTasks > 0 ? 0.6 : 0.3);
  return 0.15;
}

function MapLandmarks() {
  return (
    <>
      <ellipse cx="34" cy="52" rx="9" ry="5" fill="rgba(14,116,144,0.35)" stroke="rgba(56,189,248,0.25)" strokeWidth="0.4" />
      <ellipse cx="18" cy="62" rx="7" ry="4" fill="rgba(21,128,61,0.25)" />
      <path d="M 6 78 Q 20 70 34 74 T 62 68 T 88 58 L 98 80 L 6 80 Z" fill="rgba(20,83,45,0.35)" />
      <path d="M 52 28 L 58 18 L 64 28 Z" fill="rgba(68,64,60,0.5)" stroke="rgba(168,162,158,0.3)" strokeWidth="0.3" />
      <path d="M 74 24 L 80 12 L 86 24 Z" fill="rgba(120,53,15,0.45)" stroke="rgba(251,191,36,0.35)" strokeWidth="0.3" />
      {[12, 28, 44, 58, 72].map((x, i) => (
        <circle key={i} cx={x} cy={74 - (i % 3) * 4} r="0.8" fill="rgba(34,197,94,0.35)" />
      ))}
    </>
  );
}

function StopPin(args: {
  stop: JourneyMapStop;
  index: number;
  done: boolean;
  current: boolean;
  workload: { openTasks: number; dueSoon: number };
}) {
  const c = biomeColor(args.stop.biome);
  const ring = args.done ? '#34d399' : args.current ? '#22c55e' : 'rgba(255,255,255,0.25)';
  return (
    <g pointerEvents="none" style={{ pointerEvents: 'none' }}>
      {args.current && (
        <>
          <circle cx={args.stop.x} cy={args.stop.y} r="8" fill="rgba(34,197,94,0.12)" stroke="rgba(74,222,128,0.35)" strokeWidth="0.6" />
          <circle cx={args.stop.x} cy={args.stop.y} r="5.5" fill="rgba(34,197,94,0.2)" />
        </>
      )}
      <circle cx={args.stop.x} cy={args.stop.y} r="4.2" fill="rgba(0,0,0,0.5)" stroke={ring} strokeWidth="1.1" />
      <circle cx={args.stop.x} cy={args.stop.y - 0.6} r="1.8" fill={args.current ? '#22c55e' : c.stroke} opacity={args.done || args.current ? 1 : 0.55} />
      <rect x={args.stop.x - 2.4} y={args.stop.y - 4.8} width="4.8" height="1.9" rx="0.5" fill={args.current ? '#15803d' : c.fill} stroke={args.current ? '#4ade80' : c.stroke} strokeWidth="0.3" opacity="0.95" />
      <text x={args.stop.x} y={args.stop.y - 7.5} fontSize="2.4" textAnchor="middle" fill={args.current ? '#bbf7d0' : 'rgba(255,255,255,0.85)'} fontWeight="600">
        {args.stop.label}
      </text>
      <text x={args.stop.x} y={args.stop.y + 8} fontSize="2" textAnchor="middle" fill="rgba(255,255,255,0.4)">
        {String(args.index + 1).padStart(2, '0')}
      </text>
      {args.workload.openTasks > 0 ? (
        <g>
          <circle cx={args.stop.x + 4.5} cy={args.stop.y - 4.5} r="2.4" fill={args.workload.dueSoon ? '#ef4444' : '#f59e0b'} />
          <text x={args.stop.x + 4.5} y={args.stop.y - 3.7} fontSize="2.2" textAnchor="middle" fill="#000" fontWeight="700">
            {args.workload.openTasks}
          </text>
        </g>
      ) : args.done ? (
        <text x={args.stop.x + 4.2} y={args.stop.y - 3.8} fontSize="3" fill="#34d399">
          ✓
        </text>
      ) : null}
    </g>
  );
}

export function JourneyMapView(args: {
  stage?: JourneyStage | string;
  signals?: Record<string, unknown>;
  lane?: string;
  tasks?: TaskItem[];
  projects?: Project[];
  partnerId?: string;
}) {
  const navigate = useNavigate();
  const stage = (args.stage || 'intake') as JourneyStage;
  const stops = useMemo(() => buildJourneyMapStops(args.lane), [args.lane]);
  const idx = Math.max(0, stops.findIndex((s) => s.id === stage));
  const micro = useMemo(() => microProgress(stage, args.signals), [stage, args.signals]);
  const pos = useMemo(() => positionAlongRoute(stops, idx, micro), [stops, idx, micro]);

  const workloadMap = useMemo(
    () =>
      aggregateWorkloadByStop({
        stops,
        tasks: args.tasks ?? [],
        projects: args.projects ?? [],
      }),
    [stops, args.tasks, args.projects],
  );

  const selectedStop = stops[idx] ?? stops[0]!;
  const selectedWorkload = workloadMap.get(selectedStop.id) ?? { openTasks: 0, doneTasks: 0, dueSoon: 0, tasks: [] };

  const road = useMemo(() => svgRoadPath(stops), [stops]);
  const progressRoad = useMemo(() => svgRoadPathToIndex(stops, idx, micro), [stops, idx, micro]);
  const totalOpen = useMemo(() => [...workloadMap.values()].reduce((a, w) => a + w.openTasks, 0), [workloadMap]);

  return (
    <div className="rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-fc-deep via-fc-shell to-fc-chrome overflow-hidden shadow-2xl shadow-black/50">
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white/[0.05]">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-emerald-300/80">
            <Mountain size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Expedition map</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">Your credit restoration route</h3>
          <p className="text-sm text-white/50 mt-0.5 inline-flex items-center gap-1.5">
            <Lock size={12} className="text-amber-300/80" /> Step set by your case team — follow the road to your current milestone.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Open tasks on map</p>
            <p className="text-lg font-bold text-amber-300">{totalOpen}</p>
          </div>
          <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/40">Progress</p>
            <p className="text-lg font-bold text-emerald-300">{Math.round(((idx + micro) / Math.max(1, stops.length - 1)) * 100)}%</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-12">
        <div className="xl:col-span-8 p-4 border-b xl:border-b-0 xl:border-r border-white/[0.08]">
          <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden bg-fc-section">
            <svg viewBox="10 22 80 52" className="w-full h-[340px] md:h-[420px]">
              <defs>
                <linearGradient id="fc-map-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7ec8e3" />
                  <stop offset="45%" stopColor="#bae6fd" />
                  <stop offset="100%" stopColor="#86efac" />
                </linearGradient>
                <linearGradient id="fc-road-asphalt" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#292524" />
                  <stop offset="50%" stopColor="#44403c" />
                  <stop offset="100%" stopColor="#292524" />
                </linearGradient>
                <linearGradient id="fc-car-red" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <filter id="fc-map-glow">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="fc-green-glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect x="10" y="22" width="80" height="52" fill="url(#fc-map-sky)" />
              <MapLandmarks />

              {/* Premium asphalt road */}
              <path d={road} fill="none" stroke="#1c1917" strokeWidth="7.5" strokeLinecap="round" opacity="0.95" />
              <path d={road} fill="none" stroke="url(#fc-road-asphalt)" strokeWidth="5.5" strokeLinecap="round" />
              <path d={road} fill="none" stroke="#57534e" strokeWidth="5.2" strokeLinecap="round" opacity="0.5" />
              <path
                d={road}
                fill="none"
                stroke="#fefce8"
                strokeWidth="0.4"
                strokeDasharray="1.4 2.2"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Traveled portion — emerald highway */}
              <path d={progressRoad} fill="none" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" filter="url(#fc-map-glow)" />
              <path d={progressRoad} fill="none" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />

              {stops.map((s, i) => (
                <StopPin
                  key={s.id}
                  stop={s}
                  index={i}
                  done={i < idx}
                  current={i === idx}
                  workload={workloadMap.get(s.id) ?? { openTasks: 0, dueSoon: 0 }}
                />
              ))}

              {/* Single shiny red car */}
              <g transform={`translate(${pos.x}, ${pos.y})`} filter="url(#fc-map-glow)">
                <ellipse cx="0" cy="1.2" rx="3.2" ry="0.8" fill="rgba(0,0,0,0.25)" />
                <rect x="-3.2" y="-1.1" width="6.4" height="1.8" rx="0.45" fill="url(#fc-car-red)" stroke="#fca5a5" strokeWidth="0.2" />
                <rect x="-1.6" y="-2.4" width="3.2" height="1.3" rx="0.35" fill="#1e293b" opacity="0.85" />
                <rect x="-2.8" y="-0.5" width="0.9" height="0.55" rx="0.15" fill="#fef08a" opacity="0.95" />
                <circle cx="-1.8" cy="1" r="0.65" fill="#0f172a" stroke="#334155" strokeWidth="0.15" />
                <circle cx="1.8" cy="1" r="0.65" fill="#0f172a" stroke="#334155" strokeWidth="0.15" />
                <circle cx="2.4" cy="-0.3" r="0.25" fill="#fef9c3" opacity="0.9" />
              </g>

              {/* Compass */}
              <g transform="translate(88, 8)">
                <circle r="5" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
                <text y="-1.5" fontSize="2.5" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontWeight="700">
                  N
                </text>
              </g>
            </svg>

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
              {(['meadow', 'forest', 'lake', 'city', 'summit'] as const).map((b) => (
                <span key={b} className="px-2 py-1 rounded-md bg-fc-input border border-white/[0.08] text-[9px] uppercase tracking-widest text-white/45">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 p-4 space-y-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-emerald-200/70">Current destination</p>
                <p className="text-lg font-semibold text-white mt-1">{selectedStop.label}</p>
                <p className="text-sm text-white/55 mt-1">{selectedStop.hint}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.06] p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-amber-300">{selectedWorkload.openTasks}</p>
                <p className="text-[9px] uppercase text-white/40">Open</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-emerald-300">{selectedWorkload.doneTasks}</p>
                <p className="text-[9px] uppercase text-white/40">Done</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-red-300">{selectedWorkload.dueSoon}</p>
                <p className="text-[9px] uppercase text-white/40">Due soon</p>
              </div>
            </div>
          </div>

          {selectedWorkload.tasks.length > 0 ? (
            <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
                <ListChecks size={12} /> Tasks at this stop
              </div>
              {selectedWorkload.tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate('/portal/projects')}
                  className="w-full text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 hover:border-amber-500/25 transition-all"
                >
                  <p className="text-sm text-white/85 truncate">{t.title}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 uppercase">{t.status.replace('_', ' ')}</p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('/portal/projects')}
                className="w-full text-[10px] font-black uppercase tracking-widest text-amber-300 py-2"
              >
                Open task board →
              </button>
            </div>
          ) : (
            <div className="fc-light-glass-panel fc-light-chrome-panel p-4 text-sm text-white/45">
              No open tasks at this stop.{' '}
              {selectedStop.id === stage
                ? 'You are here — your car is at the glowing green destination. Use quick routes below.'
                : 'Your case team will advance you to the next stop when ready.'}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-white/40 px-1">Quick routes</p>
            {selectedStop.links.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="w-full flex items-center justify-between fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2.5 text-sm text-white/75 hover:border-emerald-500/25 hover:text-white transition-all"
              >
                {link.label}
                <ArrowRight size={14} className="text-white/35" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/portal/projects')}
              className="w-full flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-sm text-violet-100 hover:bg-violet-500/10 transition-all"
            >
              View project board
              <Compass size={14} />
            </button>
          </div>

          {idx > 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-300/80 px-1">
              <CheckCircle2 size={14} /> {idx} landmark{idx === 1 ? '' : 's'} cleared on your route
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
