import React from 'react';
import { ArrowRight, MapPin, Moon, Radar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOvernightLeadTotals, getSwarmStats, isSwarmEnabled } from '../../features/overnight50/leadIntelSwarmRepo';

type Props = { compact?: boolean; className?: string };

export function Overnight50AdminNav({ compact = false, className = '' }: Props) {
  const navigate = useNavigate();
  const stats = getSwarmStats();
  const overnight = getOvernightLeadTotals(12);
  const swarmOn = isSwarmEnabled();

  const links = [
    { path: '/admin/overnight', label: 'Overnight50', icon: Moon },
    { path: '/admin/geo-war-room', label: 'Geo War Room', icon: MapPin },
    { path: '/admin/synthetic-staff', label: 'Synthetic Staff', icon: Users },
    { path: '/admin/lead-intel', label: 'Lead Intel Swarm', icon: Radar },
  ] as const;

  return (
    <div className={`rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-black/40 to-emerald-500/10 p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200/90">Overnight50 growth OS</div>
          {!compact ? (
            <p className="mt-1 text-sm text-white/60">Continuous intel, geo funnels, $25/day budget math, synthetic staff shifts.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-white/70">
            Swarm: <strong className={swarmOn ? 'text-emerald-300' : 'text-amber-200'}>{swarmOn ? 'active' : 'paused'}</strong>
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-white/70">
            12h leads: <strong className="text-white">{overnight.total}</strong>
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-white/70">
            Jobs: <strong className="text-white">{stats.running + stats.queued}</strong>
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/[0.08]"
          >
            <Icon size={14} /> {label} <ArrowRight size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}
