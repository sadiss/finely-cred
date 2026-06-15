import React, { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrthographicCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowRight, CheckCircle2, Circle, ListChecks, Lock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../domain/projects';
import type { TaskItem } from '../../domain/tasks';
import type { JourneyStage } from './JourneyRoadmap';
import type { JourneySceneStop } from './journeySceneModel';
import {
  aggregateWorkloadByStop,
  biomeColor,
  buildJourneyMapStops,
  buildRoadCurve3D,
  type JourneyMapStop,
} from './journeyMapModel';

/** Premium asphalt highway — wide ribbon mesh, not rail lines. */
function AsphaltRoadMesh({ curve, progressT }: { curve: THREE.CatmullRomCurve3; progressT: number }) {
  const { roadGeo, progressGeo } = useMemo(() => {
    const segments = 120;
    const width = 0.85;
    const points = curve.getPoints(segments);
    const buildRibbon = (pts: THREE.Vector3[]) => {
      const positions: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i]!;
        const p1 = pts[i + 1]!;
        const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);
        const a = p0.clone().add(perp);
        const b = p0.clone().sub(perp);
        const c = p1.clone().add(perp);
        const d = p1.clone().sub(perp);
        const base = positions.length / 3;
        positions.push(a.x, a.y + 0.02, a.z, b.x, b.y + 0.02, b.z, c.x, c.y + 0.02, c.z, d.x, d.y + 0.02, d.z);
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };
    const endIdx = Math.max(2, Math.round(progressT * (points.length - 1)));
    return {
      roadGeo: buildRibbon(points),
      progressGeo: buildRibbon(points.slice(0, endIdx + 1)),
    };
  }, [curve, progressT]);

  const centerDash = useMemo(() => {
    const pts = curve.getPoints(80);
    return pts.filter((_, i) => i % 2 === 0);
  }, [curve]);

  return (
    <>
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial color="#2d2a26" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh geometry={roadGeo} position={[0, 0.001, 0]}>
        <meshStandardMaterial color="#3f3f46" roughness={0.85} metalness={0.08} transparent opacity={0.35} />
      </mesh>
      {progressGeo && (
        <mesh geometry={progressGeo}>
          <meshStandardMaterial color="#059669" roughness={0.7} metalness={0.12} emissive="#064e3b" emissiveIntensity={0.15} />
        </mesh>
      )}
      {centerDash.map((p, i) => (
        <mesh key={i} position={[p.x, 0.04, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.35, 0.08]} />
          <meshBasicMaterial color="#fefce8" transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

function RouteMilestone(args: {
  stop: JourneyMapStop;
  position: THREE.Vector3;
  done: boolean;
  current: boolean;
  openTasks: number;
}) {
  const c = biomeColor(args.stop.biome);

  return (
    <group position={[args.position.x, args.position.y, args.position.z]}>
      {args.current && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.55, 1.05, 32]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.35} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <ringGeometry args={[0.35, 0.5, 32]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={0.55} />
          </mesh>
          <pointLight color="#22c55e" intensity={1.2} distance={4} position={[0, 0.5, 0]} />
        </>
      )}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.35, 8]} />
        <meshStandardMaterial color="#78716c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.75, 0.42, 0.08]} />
        <meshStandardMaterial
          color={args.current ? '#22c55e' : args.done ? '#10b981' : c.fill}
          emissive={args.current ? '#14532d' : args.done ? '#064e3b' : '#052e16'}
          emissiveIntensity={args.current ? 0.85 : 0.2}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      <Text position={[0, 0.78, 0.05]} fontSize={0.13} color="#f8fafc" anchorX="center" maxWidth={1.1}>
        {args.stop.label}
      </Text>
      {args.current && (
        <Html position={[0, 1.15, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500 text-black border border-emerald-200 shadow-[0_0_20px_rgba(34,197,94,0.6)]">
            YOU ARE HERE
          </span>
        </Html>
      )}
      {args.openTasks > 0 && (
        <Html position={[0, 1.0, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/90 text-slate-800">{args.openTasks} tasks</span>
        </Html>
      )}
    </group>
  );
}

/** Single premium red sports car — only one vehicle on the route. */
function RedCarMarker({ curve, t, reducedMotion }: { curve: THREE.CatmullRomCurve3; t: number; reducedMotion: boolean }) {
  const ref = React.useRef<THREE.Group>(null);
  const wheelRefs = React.useRef<THREE.Mesh[]>([]);

  useFrame((_, dt) => {
    const p = curve.getPointAt(Math.max(0, Math.min(1, t)));
    const ahead = curve.getPointAt(Math.max(0, Math.min(1, t + 0.006)));
    if (ref.current) {
      ref.current.position.copy(p);
      ref.current.position.y += 0.06;
      ref.current.lookAt(ahead.x, ref.current.position.y, ahead.z);
    }
    if (!reducedMotion) {
      for (const w of wheelRefs.current) {
        if (w) w.rotation.x += dt * 8;
      }
    }
  });

  const wheel = (x: number, z: number, idx: number) => (
    <mesh
      key={idx}
      ref={(el) => {
        if (el) wheelRefs.current[idx] = el;
      }}
      position={[x, 0.05, z]}
      rotation={[0, 0, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
      <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
    </mesh>
  );

  return (
    <group ref={ref}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.62, 0.11, 0.3]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.88} roughness={0.12} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0.04, 0.22, 0]}>
        <boxGeometry args={[0.34, 0.12, 0.26]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.15} transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.24, 0.12, 0]}>
        <boxGeometry args={[0.1, 0.07, 0.28]} />
        <meshStandardMaterial color="#fef08a" emissive="#ca8a04" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.28, 0.14, 0]}>
        <boxGeometry args={[0.06, 0.05, 0.24]} />
        <meshStandardMaterial color="#fef08a" emissive="#ca8a04" emissiveIntensity={0.9} />
      </mesh>
      {wheel(-0.18, 0.15, 0)}
      {wheel(0.18, 0.15, 1)}
      {wheel(-0.18, -0.15, 2)}
      {wheel(0.18, -0.15, 3)}
      <pointLight intensity={0.6} color="#fca5a5" distance={2.5} position={[0.25, 0.18, 0]} />
    </group>
  );
}

function Scene(args: {
  stops: JourneySceneStop[];
  mapStops: JourneyMapStop[];
  activeIndex: number;
  posPct: number;
  workload: Map<JourneyStage, { openTasks: number; dueSoon: number }>;
  reducedMotion: boolean;
}) {
  const curve = useMemo(() => buildRoadCurve3D(args.stops.length), [args.stops.length]);
  const nodePositions = useMemo(
    () => args.stops.map((_, i) => curve.getPointAt(i / Math.max(1, args.stops.length - 1))),
    [curve, args.stops.length],
  );

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 18, 0.01]} zoom={32} near={0.1} far={100} />
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#b8dff5', 22, 50]} />
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[8, 20, 6]} intensity={1.1} color="#fff7ed" castShadow />
      <directionalLight position={[-5, 12, -3]} intensity={0.3} color="#bae6fd" />
      <hemisphereLight intensity={0.5} color="#e0f2fe" groundColor="#4ade80" />

      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#65a30d" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[38, 5]} />
        <meshStandardMaterial color="#a8a29e" roughness={1} />
      </mesh>

      <AsphaltRoadMesh curve={curve} progressT={args.posPct} />

      {args.stops.map((s, i) => {
        const p = nodePositions[i]!;
        const ms = args.mapStops[i];
        const w = args.workload.get(s.id) ?? { openTasks: 0, dueSoon: 0 };
        if (!ms) return null;
        return (
          <RouteMilestone
            key={s.id}
            stop={ms}
            position={p}
            done={i < args.activeIndex}
            current={i === args.activeIndex}
            openTasks={w.openTasks}
          />
        );
      })}

      <RedCarMarker curve={curve} t={args.posPct} reducedMotion={args.reducedMotion} />
    </>
  );
}

export function JourneyCinematicRoadmap3D(args: {
  stops: JourneySceneStop[];
  stage: JourneyStage;
  activeIndex: number;
  posPct: number;
  reducedMotion: boolean;
  tasks?: TaskItem[];
  projects?: Project[];
  lane?: string;
}) {
  const navigate = useNavigate();
  const mapStops = useMemo(() => buildJourneyMapStops(args.lane), [args.lane]);
  const workloadMap = useMemo(
    () => aggregateWorkloadByStop({ stops: mapStops, tasks: args.tasks ?? [], projects: args.projects ?? [] }),
    [mapStops, args.tasks, args.projects],
  );
  const workloadLite = useMemo(() => {
    const m = new Map<JourneyStage, { openTasks: number; dueSoon: number }>();
    for (const [k, v] of workloadMap) m.set(k, { openTasks: v.openTasks, dueSoon: v.dueSoon });
    return m;
  }, [workloadMap]);

  const activeIndex = Math.min(args.activeIndex, Math.max(0, args.stops.length - 1));
  const currentStop = args.stops[activeIndex];
  const currentMap = mapStops[activeIndex];
  const currentWork = currentStop ? workloadMap.get(currentStop.id) : undefined;
  const doneCount = Math.max(0, activeIndex);
  const totalOpen = [...workloadMap.values()].reduce((a, w) => a + w.openTasks, 0);

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-sky-100/10 via-[#0c1210] to-[#070b09] overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-500/10 to-emerald-500/10">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-sky-300/80">Premium road map · top view</div>
          <div className="mt-1 text-white font-semibold truncate">
            Current stop: {currentMap?.label ?? '—'} · {doneCount}/{args.stops.length} cleared
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-emerald-200/90">
            <Lock size={11} /> Step assigned by your Finely case team — read-only
          </div>
        </div>
        {totalOpen > 0 ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center">
            <p className="text-[9px] uppercase text-amber-200/70">Open tasks</p>
            <p className="text-lg font-bold text-amber-300">{totalOpen}</p>
          </div>
        ) : null}
      </div>

      <div className="grid xl:grid-cols-12">
        <div className="xl:col-span-3 border-b xl:border-b-0 xl:border-r border-white/[0.08] max-h-[580px] overflow-y-auto bg-white/[0.05]">
          <div className="p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40 px-1">Route destinations</div>
            {args.stops.map((s, i) => {
              const ms = mapStops[i];
              const w = workloadMap.get(s.id);
              const done = i < activeIndex;
              const current = i === activeIndex;
              return (
                <div
                  key={s.id}
                  className={`w-full text-left rounded-xl border px-3 py-3 flex items-start gap-3 pointer-events-none ${
                    current
                      ? 'border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_24px_rgba(34,197,94,0.15)]'
                      : done
                        ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                        : 'border-white/[0.08] bg-white/[0.06] opacity-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : current ? (
                      <MapPin size={16} className="text-emerald-400" />
                    ) : (
                      <Circle size={16} className="text-white/25" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">{ms?.label ?? s.label}</span>
                      {w && w.openTasks > 0 ? (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[9px] font-black text-amber-200">{w.openTasks}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-white/45 line-clamp-2">{s.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-9">
          <div className="h-[540px]">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
              <Scene
                stops={args.stops}
                mapStops={mapStops}
                activeIndex={activeIndex}
                posPct={args.posPct}
                workload={workloadLite}
                reducedMotion={args.reducedMotion}
              />
            </Canvas>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 border-t border-white/[0.08] grid lg:grid-cols-3 gap-4 bg-white/[0.06]">
        <div className="lg:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-300/70">Your current destination</p>
            <p className="text-lg font-semibold text-white mt-1">{currentMap?.label ?? '—'}</p>
            <p className="text-sm text-white/55 mt-1">{currentStop?.hint ?? '—'}</p>
          </div>
          {currentWork && currentWork.tasks.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
                <ListChecks size={12} /> Linked tasks at this stop
              </div>
              {currentWork.tasks.map((t) => (
                <div key={t.id} className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2 text-sm text-white/80 truncate">
                  {t.title}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(currentMap?.links ?? []).map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[10px] font-black uppercase text-white/60 hover:border-emerald-500/30 hover:text-emerald-200"
              >
                {link.label} <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>
        <div className="fc-light-glass-panel fc-light-chrome-panel p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Road progress</p>
          <p className="text-4xl font-light text-white mt-2">{Math.round(args.posPct * 100)}%</p>
          <div className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.round(args.posPct * 100)}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-white/45 leading-relaxed">
            Your red car follows the premium road to each glowing green destination. Your case manager advances the step when you are ready — contact them in the Communication Hub.
          </p>
        </div>
      </div>
    </div>
  );
}
