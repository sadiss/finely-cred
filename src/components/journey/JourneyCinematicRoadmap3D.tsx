import React, { useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Line, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { JourneyStage } from './JourneyRoadmap';
import type { JourneySceneStop } from './journeySceneModel';

function lerpVec3(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return a.clone().lerp(b, t);
}

function buildCurve(nStops: number) {
  // Gentle “space lane” helix with depth.
  const pts: THREE.Vector3[] = [];
  const n = Math.max(8, Math.round(nStops) * 3);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = t * Math.PI * 3.2;
    const x = -6 + t * 12;
    const y = Math.sin(ang) * 1.2 + (t - 0.5) * 0.6;
    const z = Math.cos(ang) * 2.0;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
}

function Scene(args: {
  stops: JourneySceneStop[];
  activeIndex: number;
  posPct: number; // 0..1 along curve
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  autoCamera: boolean;
  reducedMotion: boolean;
}) {
  const curve = useMemo(() => buildCurve(args.stops.length), [args.stops.length]);
  const linePoints = useMemo(() => curve.getPoints(240), [curve]);

  const nodePositions = useMemo(() => {
    const denom = Math.max(1, args.stops.length - 1);
    return args.stops.map((_, i) => curve.getPointAt(i / denom));
  }, [args.stops, curve]);

  const markerRef = React.useRef<THREE.Mesh | null>(null);
  const glowRef = React.useRef<THREE.Mesh | null>(null);

  useFrame((state, dt) => {
    const t = Math.max(0, Math.min(1, args.posPct));
    const p = curve.getPointAt(t);

    if (markerRef.current) markerRef.current.position.copy(p);
    if (glowRef.current) glowRef.current.position.copy(p);

    if (args.autoCamera && !args.reducedMotion) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const ahead = curve.getPointAt(Math.min(1, t + 0.01));
      const dir = ahead.clone().sub(p).normalize();
      const desired = p.clone().add(new THREE.Vector3(-2.6, 1.6, 5.6)).add(dir.multiplyScalar(1.4));
      cam.position.copy(lerpVec3(cam.position, desired, 1 - Math.pow(0.001, dt)));
      cam.lookAt(p);
    }
  });

  const activePos = nodePositions[Math.min(args.activeIndex, nodePositions.length - 1)] ?? new THREE.Vector3(0, 0, 0);

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 12, 28]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 3]} intensity={1.1} color="#ffd08a" />
      <pointLight position={[-5, 0, -2]} intensity={0.8} color="#6ee7ff" />

      <Environment preset="city" />
      <Sparkles count={args.reducedMotion ? 40 : 140} size={1.2} speed={args.reducedMotion ? 0.2 : 0.6} opacity={0.25} scale={[20, 12, 18]} />

      {/* Spline rail */}
      <Line points={linePoints} color="#f59e0b" lineWidth={2.4} transparent opacity={0.5} />
      <Line points={linePoints} color="#10b981" lineWidth={7} transparent opacity={0.12} />

      {/* Nodes */}
      {args.stops.map((s, i) => {
        const p = nodePositions[i]!;
        const done = i < args.activeIndex;
        const current = i === args.activeIndex;
        const selected = i === args.selectedIndex;
        const color = done ? '#34d399' : current ? '#fbbf24' : '#94a3b8';
        const emissive = done ? '#14532d' : current ? '#7c2d12' : '#0b1220';

        return (
          <group key={s.id} position={[p.x, p.y, p.z]}>
            <Float enabled={!args.reducedMotion} speed={1.2} rotationIntensity={0.35} floatIntensity={0.6}>
              <mesh
                onPointerDown={(e) => {
                  e.stopPropagation();
                  args.onSelectIndex(i);
                }}
              >
                <sphereGeometry args={[selected ? 0.32 : 0.26, 24, 24]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={selected ? 1.2 : 0.6} />
              </mesh>
            </Float>

            <Text
              position={[0.55, 0.35, 0]}
              fontSize={0.28}
              color={selected ? '#fff' : 'rgba(255,255,255,0.70)'}
              anchorX="left"
              anchorY="middle"
            >
              {s.label}
            </Text>
          </group>
        );
      })}

      {/* Marker (ship/cursor) */}
      <group>
        <mesh ref={markerRef} position={[activePos.x, activePos.y, activePos.z]}>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#f59e0b" emissive="#7c2d12" emissiveIntensity={1.2} metalness={0.35} roughness={0.25} />
        </mesh>
        <mesh ref={glowRef} position={[activePos.x, activePos.y, activePos.z]}>
          <sphereGeometry args={[0.55, 18, 18]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.12} />
        </mesh>
      </group>
    </>
  );
}

export function JourneyCinematicRoadmap3D(args: {
  stops: JourneySceneStop[];
  stage: JourneyStage;
  activeIndex: number;
  posPct: number;
  reducedMotion: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(() => Math.min(args.activeIndex, Math.max(0, args.stops.length - 1)));
  const [autoCamera, setAutoCamera] = useState(true);

  const selected = args.stops[Math.min(selectedIndex, args.stops.length - 1)] ?? args.stops[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Cinematic roadmap</div>
          <div className="mt-1 text-white font-semibold truncate">
            Current stage: <span className="text-amber-200 font-mono">{String(args.stage)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoCamera((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            title="Toggle cinematic camera motion"
          >
            Auto camera: {autoCamera ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="h-[420px]">
        <Canvas
          camera={{ position: [-6, 2.2, 8], fov: 55, near: 0.1, far: 200 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene
            stops={args.stops}
            activeIndex={args.activeIndex}
            posPct={args.posPct}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            autoCamera={autoCamera}
            reducedMotion={args.reducedMotion}
          />
        </Canvas>
      </div>

      <div className="px-5 py-5 border-t border-white/10">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Selected stop</div>
            <div className="mt-2 text-white font-semibold">{selected?.label ?? '—'}</div>
            <div className="mt-1 text-white/60 text-sm">{selected?.hint ?? '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Progress</div>
            <div className="mt-2 text-2xl font-light text-white">{Math.round(args.posPct * 100)}%</div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400" style={{ width: `${Math.round(args.posPct * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

