import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Flame, Users } from 'lucide-react';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';

function endOfWeekCountdown(): Date {
  const now = new Date();
  const end = new Date(now);
  const day = end.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 7);
  }
  return end;
}

function defaultSlots(funnelId: string): number {
  const seed = funnelId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const day = new Date().getDate();
  return 12 + ((seed + day * 7) % 28);
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { h: '00', m: '00', s: '00' };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

type Props = {
  config: LeadMagnetFunnelConfig;
  trustLabel: string;
  accentRgb: string;
};

export function LeadMagnetUrgencyRail({ config, trustLabel, accentRgb }: Props) {
  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => {
    const onStore = () => setStoreTick((t) => t + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  const media = useMemo(() => getFunnelMediaForConfig(config), [config, storeTick]);
  const target = useMemo(() => {
    if (media?.urgencyCountdownEnd) {
      const d = new Date(media.urgencyCountdownEnd);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return endOfWeekCountdown();
  }, [media?.urgencyCountdownEnd]);

  const slots = media?.urgencySlotsRemaining ?? defaultSlots(config.funnelId);
  const showLive = media?.showLivePulse !== false;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const cd = formatCountdown(target.getTime() - now);

  return (
    <div className="lm-urgency-rail" style={{ '--lm-accent': accentRgb } as React.CSSProperties}>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/75">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            {config.urgencyText}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/70">
            <Clock className="w-3.5 h-3.5" style={{ color: `rgb(${accentRgb})` }} />
            <span className="tabular-nums font-black text-white">
              {cd.h}:{cd.m}:{cd.s}
            </span>
            <span className="text-white/40">left this week</span>
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/70">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-black text-amber-200">{slots}</span>
            <span className="text-white/40">kits left · {trustLabel} claimed</span>
          </span>
          {showLive ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Specialists online
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
