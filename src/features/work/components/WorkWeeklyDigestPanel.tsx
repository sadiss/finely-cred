import React, { useState } from 'react';
import { ArrowRight, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WeeklyWorkDigest } from '../digest/buildWeeklyWorkDigest';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_LUXURY_PAGINATION,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  finelyOsKpiTile,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';

const KIND_CHIP: Record<string, 'ok' | 'warn' | 'blocked'> = {
  overdue: 'blocked',
  due_soon: 'ok',
  sla: 'warn',
  milestone: 'ok',
  idle: 'warn',
};

export function WorkWeeklyDigestPanel({ digest }: { digest: WeeklyWorkDigest }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(digest.items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = digest.items.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="space-y-4">
      <div className={FINELY_OS_BANNER}>
        <CalendarRange className="text-emerald-400 shrink-0 mt-0.5" size={18} />
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/80`}>{digest.weekLabel}</div>
          <p className={`text-sm mt-1 ${FINELY_OS_ENTITY_BODY}`}>{digest.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Open tasks', value: digest.stats.openTasks },
          { label: 'Overdue', value: digest.stats.overdue, tone: digest.stats.overdue ? 'text-rose-300' : undefined },
          { label: 'Due this week', value: digest.stats.dueThisWeek },
          { label: 'Active projects', value: digest.stats.activeProjects },
        ].map((m, i) => (
          <div key={m.label} className={`rounded-xl border p-3 ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${m.tone ?? FINELY_OS_ENTITY_VALUE}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {digest.items.length ? (
        <>
          <div className="grid sm:grid-cols-2 gap-2">
            {slice.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.href && navigate(item.href)}
                className={`text-left p-3 transition-all ${finelyOsKpiTile(i + 1)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={finelyOsStatusChip(KIND_CHIP[item.kind] ?? 'ok')}>{item.kind.replace('_', ' ')}</span>
                  {item.href ? <ArrowRight size={14} className="text-white/40 shrink-0" /> : null}
                </div>
                <div className={`mt-2 text-sm line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                <div className={`text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{item.subtitle}</div>
              </button>
            ))}
          </div>
          {digest.items.length > pageSize ? (
            <div className={FINELY_OS_LUXURY_PAGINATION}>
              <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>
                Page {safePage + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} className={FINELY_OS_LUXURY_PAGINATION_BTN}>
                  <ChevronLeft size={14} />
                </button>
                <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className={FINELY_OS_LUXURY_PAGINATION_BTN}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className={FINELY_OS_LUXURY_EMPTY}>No priority items this week — great momentum.</div>
      )}
    </div>
  );
}
