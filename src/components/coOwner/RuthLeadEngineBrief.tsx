import React, { useMemo, useState } from 'react';
import { Crown, Radar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listProspects } from '../../data/crmProspectsRepo';
import { CO_OWNER_IDENTITY } from '../../domain/coOwnerIdentity';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/** Ruth co-owner brief: Lead Engine imports + what to do now. */
export function RuthLeadEngineBrief({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  const brief = useMemo(() => {
    void tick;
    const all = listProspects({ q: '', target: 'all' }).filter((p) => (p.tags ?? []).includes('lead-engine'));
    const today = all.filter((p) => isToday(p.createdAt) || isToday(p.updatedAt));
    const hot = all.filter((p) => (p.score ?? 0) >= 60 || p.intel?.intentTier === 'hot').slice(0, 5);
    const bc = all.filter((p) => (p.tags ?? []).includes('business_credit')).length;
    return { total: all.length, today: today.length, hot, bc };
  }, [tick]);

  return (
    <section className={`${finelyOsCatalogCardCompact('emerald')} space-y-3`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <Crown size={14} /> {CO_OWNER_IDENTITY.name} · Daily growth brief
          </div>
          <h3 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>Lead Engine · what matters now</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Real imports from Start Lead Engine (not synthetic swarm counters). Review hot prospects, then book or assign.
          </p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setTick((t) => t + 1)} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-xl border p-3 ${finelyOsMicroStat('emerald')}`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Engine total</div>
          <div className="text-xl font-black text-white">{brief.total}</div>
        </div>
        <div className={`rounded-xl border p-3 ${finelyOsMicroStat('amber')}`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Today</div>
          <div className="text-xl font-black text-white">{brief.today}</div>
        </div>
        <div className={`rounded-xl border p-3 ${finelyOsMicroStat('violet')}`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>BC lane</div>
          <div className="text-xl font-black text-white">{brief.bc}</div>
        </div>
      </div>

      {!compact && brief.hot.length ? (
        <div className="space-y-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Hot / high-score</div>
          {brief.hot.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/85">
              <span className="font-semibold">{p.company?.name || p.contact?.name || 'Prospect'}</span>
              <span className="text-white/45"> · score {p.score}</span>
              {p.company?.website ? <span className="block text-xs text-white/50 truncate">{p.company.website}</span> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          No Lead Engine imports yet — run Start Lead Engine, then refresh this brief.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`} onClick={() => navigate('/admin/lead-intel')}>
          <Radar size={14} /> Lead Intel / Engine
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')}>
          CRM imports
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/ops-agent')}>
          Open Ruth command
        </button>
      </div>
    </section>
  );
}
