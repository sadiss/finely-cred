import React, { useEffect, useMemo, useState } from 'react';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';

function endOfWeekCountdown(): Date {
  const now = new Date();
  const end = new Date(now);
  const day = end.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7);
  return end;
}

function defaultSlots(funnelId: string): number {
  const seed = funnelId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 12 + ((seed + new Date().getDate() * 7) % 28);
}

type Props = {
  config: LeadMagnetFunnelConfig;
  accentRgb: string;
};

/** Single-line urgency — sits in nav, no full-width orange bar. */
export function LeadMagnetNavUrgency({ config, accentRgb }: Props) {
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
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const ms = Math.max(0, target.getTime() - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);

  return (
    <span className="lm-nav-urgency hidden md:inline" style={{ color: `rgba(${accentRgb},0.85)` }}>
      {slots} kits left · {h}h {m}m
    </span>
  );
}
