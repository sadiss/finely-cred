import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import {
  getToolkitByLead,
  toggleToolkitItem,
  toolkitProgress,
  upsertToolkitChecklist,
  type LeadMagnetToolkitRecord,
} from '../../../lib/leadMagnetToolkitStore';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../features/os/finelyOsLightUi';

type ItemDef = { id: string; label: string; hint?: string };

type Props = {
  leadId: string;
  email: string;
  funnelId: string;
  title: string;
  subtitle: string;
  accent?: 'amber' | 'emerald' | 'sky' | 'violet' | 'fuchsia';
  items: ItemDef[];
  footerTip?: string;
};

export function FunnelToolkitChecklistPanel({
  leadId,
  email,
  funnelId,
  title,
  subtitle,
  accent = 'emerald',
  items,
  footerTip,
}: Props) {
  const [record, setRecord] = useState<LeadMagnetToolkitRecord | null>(() =>
    getToolkitByLead(leadId, funnelId),
  );

  useEffect(() => {
    const existing = getToolkitByLead(leadId, funnelId);
    if (existing) {
      setRecord(existing);
      return;
    }
    const created = upsertToolkitChecklist({
      leadId,
      funnelId,
      email,
      items,
      doneIds: new Set(),
    });
    setRecord(created);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items are stable per funnelId
  }, [leadId, funnelId, email]);

  const progress = useMemo(() => toolkitProgress(record), [record]);

  const onToggle = (itemId: string) => {
    const next = toggleToolkitItem(leadId, funnelId, itemId);
    if (next) setRecord(next);
  };

  return (
    <div className={`${finelyOsCatalogCard(accent)} !p-5 space-y-4 text-left`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={14} /> Free interactive toolkit
          </div>
          <h3 className={`mt-2 text-lg font-black ${FINELY_OS_ENTITY_VALUE}`}>{title}</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black text-emerald-300">{progress.pct}%</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">
            {progress.done}/{progress.total}
          </div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const done = record?.checklist.find((c) => c.id === item.id)?.done ?? false;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  done
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-white/10 bg-black/20 hover:border-white/20'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-white/40 shrink-0 mt-0.5" />
                )}
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${done ? 'text-emerald-100' : 'text-white/90'}`}>
                    {item.label}
                  </span>
                  {item.hint ? (
                    <span className={`block mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {footerTip ? <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{footerTip}</p> : null}
    </div>
  );
}
