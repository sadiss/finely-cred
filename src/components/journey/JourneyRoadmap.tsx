import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Mail,
  Map as MapIcon,
  Route,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { Project } from '../../domain/projects';
import type { TaskItem } from '../../domain/tasks';
import { JourneyMapView } from './JourneyMapView';
import { loadPartnerMapData, aggregateWorkloadByStop, buildJourneyMapStops } from './journeyMapModel';
import type { JourneySceneStop } from './journeySceneModel';

const JourneyCinematicRoadmap3D = React.lazy(() =>
  import('./JourneyCinematicRoadmap3D').then((m) => ({ default: m.JourneyCinematicRoadmap3D })),
);

export type JourneyStage =
  | 'intake'
  | 'report_upload'
  | 'analysis'
  | 'evidence'
  | 'letters'
  | 'mailing'
  | 'funding'
  | 'complete';

type Stop = { id: JourneyStage; label: string; Icon: any; hint: string };

const STOPS: Stop[] = [
  { id: 'intake', label: 'Intake', Icon: ClipboardList, hint: 'Goals, lane, readiness.' },
  { id: 'report_upload', label: 'Reports', Icon: FileText, hint: 'Upload & parse.' },
  { id: 'analysis', label: 'Analysis', Icon: Sparkles, hint: 'Identify negatives.' },
  { id: 'evidence', label: 'Evidence', Icon: ImageIcon, hint: 'Capture exhibits.' },
  { id: 'letters', label: 'Letters', Icon: Mail, hint: 'Draft & save.' },
  { id: 'mailing', label: 'Mail', Icon: Mail, hint: 'Send + track.' },
  { id: 'funding', label: 'Funding', Icon: Trophy, hint: 'Apply window.' },
  { id: 'complete', label: 'Complete', Icon: CheckCircle2, hint: 'Archive outcomes.' },
];

export function JourneyRoadmap(args: {
  stage?: JourneyStage | string;
  signals?: Record<string, any>;
  lane?: string;
  /** Default view mode (map vs timeline vs cinematic). */
  defaultView?: 'map' | 'timeline' | 'cinematic';
  partnerId?: string;
  tasks?: TaskItem[];
  projects?: Project[];
}) {
  const stage = (args.stage || 'intake') as JourneyStage;
  const lane = (args.lane || 'other').toLowerCase();

  const viewKey = useMemo(() => `fc.journey.view.${lane.includes('business') ? 'business' : lane.includes('debt') ? 'debt' : 'default'}`, [lane]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  const [view, setView] = useState<'map' | 'timeline' | 'cinematic'>(() => {
    try {
      const v = window.localStorage.getItem(viewKey);
      if (v === 'map' || v === 'timeline' || v === 'cinematic') return v;
    } catch {
      // ignore
    }
    return args.defaultView ?? 'map';
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(viewKey, view);
    } catch {
      // ignore
    }
  }, [view, viewKey]);

  useEffect(() => {
    // Reduced motion accessibility.
    try {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      const apply = () => setReducedMotion(Boolean(mq?.matches));
      apply();
      mq?.addEventListener?.('change', apply);
      return () => mq?.removeEventListener?.('change', apply);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // WebGL availability check (fallback safety).
    try {
      const canvas = document.createElement('canvas');
      const ok = Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      setWebglOk(ok);
    } catch {
      setWebglOk(false);
    }
  }, []);

  const stops = useMemo(() => {
    // Lane-aware copy (same underlying stage IDs, different meaning).
    if (lane.includes('business')) {
      return [
        { ...STOPS[0]!, label: 'Intake', hint: 'Business goal + readiness.' },
        { ...STOPS[1]!, label: 'Profile', hint: 'Entity + fundability.' },
        { ...STOPS[2]!, label: 'Audit', hint: 'Signals + gaps.' },
        { ...STOPS[3]!, label: 'Docs', hint: 'Proof pack.' },
        { ...STOPS[4]!, label: 'Vendors', hint: 'Sequence stack.' },
        { ...STOPS[5]!, label: 'Funding', hint: 'Apply windows.' },
        { ...STOPS[6]!, label: 'Scale', hint: 'Limits + approvals.' },
        { ...STOPS[7]!, label: 'Complete', hint: 'Archive outcomes.' },
      ] as Stop[];
    }
    if (lane.includes('debt')) {
      return [
        { ...STOPS[0]!, label: 'Intake', hint: 'Jurisdiction + deadlines.' },
        { ...STOPS[1]!, label: 'Evidence', hint: 'Docs + dates.' },
        { ...STOPS[2]!, label: 'Strategy', hint: 'Defense lanes.' },
        { ...STOPS[3]!, label: 'Packets', hint: 'Proof pack.' },
        { ...STOPS[4]!, label: 'Letters', hint: 'Draft & send.' },
        { ...STOPS[5]!, label: 'Tracking', hint: 'Mail + responses.' },
        { ...STOPS[6]!, label: 'Resolution', hint: 'Settlement/closure.' },
        { ...STOPS[7]!, label: 'Complete', hint: 'Archive outcomes.' },
      ] as Stop[];
    }
    return STOPS;
  }, [lane]);

  const idx = Math.max(0, stops.findIndex((s) => s.id === stage));

  const micro = useMemo(() => {
    // small intra-stage progress based on live signals
    const reports = Number(args.signals?.reports ?? 0);
    const evidence = Number(args.signals?.evidence ?? 0);
    const openTasks = Number(args.signals?.openTasks ?? 0);
    if (stage === 'report_upload') return Math.min(0.9, reports > 0 ? 0.8 : 0.15);
    if (stage === 'analysis') return Math.min(0.9, reports > 0 ? 0.5 : 0.2);
    if (stage === 'evidence') return Math.min(0.9, evidence > 0 ? 0.75 : 0.2);
    if (stage === 'letters') return Math.min(0.9, openTasks > 0 ? 0.6 : 0.3);
    return 0.15;
  }, [args.signals, stage]);

  const posPct = useMemo(() => {
    const base = idx / Math.max(1, STOPS.length - 1);
    const next = Math.min(1, base + micro * (1 / Math.max(1, STOPS.length - 1)));
    return next;
  }, [idx, micro]);

  const active = stops[Math.min(idx, stops.length - 1)]!;

  const mapData = useMemo(() => {
    if (args.tasks && args.projects) return { tasks: args.tasks, projects: args.projects };
    if (args.partnerId) return loadPartnerMapData(args.partnerId);
    return { tasks: [] as TaskItem[], projects: [] as Project[] };
  }, [args.partnerId, args.tasks, args.projects]);

  const timelineWorkload = useMemo(
    () => aggregateWorkloadByStop({ stops: buildJourneyMapStops(args.lane), tasks: mapData.tasks, projects: mapData.projects }),
    [args.lane, mapData.tasks, mapData.projects],
  );

  const cinematicAllowed = webglOk && !reducedMotion;
  useEffect(() => {
    if (view === 'cinematic' && !cinematicAllowed) setView('timeline');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematicAllowed]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setView('map')}
          className={
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
            (view === 'map' ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white')
          }
          title="World-map view"
        >
          <MapIcon size={14} /> Map
        </button>
        <button
          type="button"
          onClick={() => setView('timeline')}
          className={
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
            (view === 'timeline'
              ? 'bg-amber-500 text-black border-amber-400'
              : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white')
          }
          title="Timeline view"
        >
          <Route size={14} /> Timeline
        </button>
        <button
          type="button"
          onClick={() => (cinematicAllowed ? setView('cinematic') : null)}
          disabled={!cinematicAllowed}
          className={
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ' +
            (view === 'cinematic'
              ? 'bg-amber-500 text-black border-amber-400'
              : !cinematicAllowed
                ? 'bg-white/5 text-white/30 border-white/[0.08] cursor-not-allowed'
                : 'bg-white/5 text-white/70 border-white/[0.08] hover:bg-white/10 hover:text-white')
          }
          title={!webglOk ? 'WebGL not available on this device' : reducedMotion ? 'Reduced motion enabled (cinematic disabled)' : 'Cinematic 3D view'}
        >
          <Sparkles size={14} /> Cinematic
        </button>
      </div>

      {view === 'map' ? (
        <JourneyMapView
          stage={stage}
          signals={args.signals}
          lane={args.lane}
          tasks={mapData.tasks}
          projects={mapData.projects}
          partnerId={args.partnerId}
        />
      ) : view === 'cinematic' ? (
        <div className="space-y-3">
          {!cinematicAllowed ? (
            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 text-white/60 text-sm">
              Cinematic view is unavailable on this device (WebGL) or disabled by reduced-motion preference.
            </div>
          ) : null}
          <Suspense
            fallback={
              <div className="fc-light-glass-panel fc-light-chrome-panel p-6 text-white/60 text-sm">
                Loading cinematic scene…
              </div>
            }
          >
            <JourneyCinematicRoadmap3D
              stops={stops.map((s) => ({ id: s.id, label: s.label, hint: s.hint })) as JourneySceneStop[]}
              stage={stage}
              activeIndex={idx}
              posPct={posPct}
              reducedMotion={reducedMotion}
              lane={args.lane}
              tasks={mapData.tasks}
              projects={mapData.projects}
            />
          </Suspense>
        </div>
      ) : (
        <div className="fc-light-glass-panel fc-light-chrome-panel p-6 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">Journey roadmap</div>
              <div className="mt-2 text-white font-semibold">Cinematic progress track</div>
              <div className="mt-1 text-white/55 text-sm">
                Current: <span className="text-white/80 font-mono">{active.label}</span> — {active.hint}
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">stage:{stage}</div>
          </div>

          <div className="mt-6 relative">
            {/* Track */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700"
                style={{ width: `${Math.round(posPct * 100)}%` }}
              />
            </div>

            {/* Marker */}
            <div className="absolute -top-3 transition-all duration-700" style={{ left: `calc(${posPct * 100}% - 14px)` }}>
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-amber-500 shadow-xl shadow-amber-900/40 border border-amber-300/50 animate-pulse" />
                <div className="absolute inset-0 w-7 h-7 rounded-full bg-amber-500/40 blur-md" />
              </div>
            </div>

            {/* Stops */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {stops.map((s, i) => {
                const done = i < idx;
                const current = i === idx;
                const w = timelineWorkload.get(s.id);
                const cls = done
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                  : current
                    ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/60';
                return (
                  <div key={s.id} className={`rounded-2xl border p-3 ${cls}`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <s.Icon size={14} className={done ? 'text-emerald-300' : current ? 'text-amber-300' : 'text-white/40'} />
                        <div className="text-[10px] font-black uppercase tracking-widest truncate">{s.label}</div>
                      </div>
                      {w && w.openTasks > 0 ? (
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/[0.07] text-[9px] font-black">{w.openTasks}</span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-[11px] leading-snug opacity-80">{s.hint}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {[
                { k: 'reports', v: Number(args.signals?.reports ?? 0) },
                { k: 'evidence', v: Number(args.signals?.evidence ?? 0) },
                { k: 'openTasks', v: Number(args.signals?.openTasks ?? 0) },
              ].map((x) => (
                <div key={x.k} className="fc-light-glass-panel fc-light-chrome-panel p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">{x.k}</div>
                  <div className="mt-2 text-2xl font-light text-white">{Number.isFinite(x.v) ? x.v : 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

