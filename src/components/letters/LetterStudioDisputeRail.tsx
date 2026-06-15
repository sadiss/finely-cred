import React from 'react';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';

export type DisputeRailItem = {
  key: string;
  bureau: Bureau;
  account: string;
  type: string;
  code: string;
  hasEvidence: boolean;
  reasonCount: number;
};

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeBureau: Bureau;
  onSelectBureau: (b: Bureau) => void;
  items: DisputeRailItem[];
  focusedKey: string | null;
  onFocusItem: (key: string, bureau: Bureau) => void;
  countsByBureau: Record<Bureau, number>;
};

const BUREAUS: Bureau[] = ['EXP', 'EQF', 'TUC'];

export function LetterStudioDisputeRail({
  collapsed,
  onToggleCollapsed,
  activeBureau,
  onSelectBureau,
  items,
  focusedKey,
  onFocusItem,
  countsByBureau,
}: Props) {
  const bureauItems = items.filter((i) => i.bureau === activeBureau);

  return (
    <aside
      className={
        'shrink-0 flex flex-col rounded-2xl border border-white/[0.08] bg-fc-input overflow-hidden transition-all duration-300 ' +
        (collapsed ? 'w-[52px] lg:w-[56px]' : 'w-full lg:w-[240px] xl:w-[260px]')
      }
    >
      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-white/[0.08] bg-white/[0.02]">
        {!collapsed ? (
          <div className="min-w-0 px-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-300">Letter workspace</div>
            <div className="text-[10px] text-white/45 truncate">Disputes & bureaus</div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="p-2 rounded-lg fc-light-glass-panel fc-light-chrome-panel border hover:bg-white/[0.05] text-white/55 hover:text-white shrink-0"
          title={collapsed ? 'Expand letter list' : 'Collapse letter list'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {!collapsed ? (
        <>
          <div className="flex border-b border-white/[0.08]">
            {BUREAUS.map((b) => {
              const count = countsByBureau[b] ?? 0;
              const on = b === activeBureau;
              if (!count) return null;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onSelectBureau(b)}
                  className={
                    'flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all ' +
                    (on ? 'bg-amber-500/15 text-amber-100 border-b-2 border-amber-500' : 'text-white/45 hover:text-white/70 hover:bg-white/[0.02]')
                  }
                  title={bureauFullName(b)}
                >
                  {bureauShortCode(b)}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 max-h-[420px] lg:max-h-[calc(100vh-22rem)] overflow-y-auto p-2 space-y-1">
            {bureauItems.length === 0 ? (
              <div className="px-2 py-4 text-[11px] text-white/40 text-center">No disputes for this bureau.</div>
            ) : (
              bureauItems.map((item) => {
                const focused = focusedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onFocusItem(item.key, item.bureau)}
                    className={
                      'w-full text-left rounded-xl border px-3 py-2.5 transition-all ' +
                      (focused
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-white/[0.08] bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]')
                    }
                    title={`${item.account} — ${item.type}`}
                  >
                    <div className="text-[11px] font-semibold text-white truncate">{item.account}</div>
                    <div className="text-[9px] text-white/40 truncate mt-0.5">{item.type}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span
                        className={
                          'px-1.5 py-0.5 rounded text-[8px] font-black uppercase ' +
                          (item.hasEvidence ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200')
                        }
                      >
                        {item.hasEvidence ? 'Ev' : 'No ev'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-white/5 text-white/50">
                        R{item.reasonCount}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center py-3 gap-2">
          {BUREAUS.filter((b) => (countsByBureau[b] ?? 0) > 0).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                onSelectBureau(b);
                onToggleCollapsed();
              }}
              className={
                'w-9 h-9 rounded-lg border text-[9px] font-black ' +
                (b === activeBureau ? 'border-amber-500/40 bg-amber-500/15 text-amber-100' : 'border-white/[0.08] text-white/50')
              }
              title={bureauFullName(b)}
            >
              {bureauShortCode(b).slice(0, 1)}
            </button>
          ))}
          <ChevronRight size={12} className="text-white/25 mt-auto" />
        </div>
      )}
    </aside>
  );
}
