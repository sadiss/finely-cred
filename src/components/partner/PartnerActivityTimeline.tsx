import React from 'react';
import { Activity, Pin, ScrollText, User } from 'lucide-react';
import type { PartnerNote } from '../../domain/partnerNotes';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export type ActivityTimelineItem = {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  kind: 'system' | 'manual';
  visibility?: 'internal' | 'partner';
  pinned?: boolean;
  authorEmail?: string;
};

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function partnerNoteToTimelineItem(n: PartnerNote): ActivityTimelineItem {
  return {
    id: n.id,
    createdAt: n.createdAt,
    title: n.title || (n.kind === 'manual' ? 'Team note' : 'Update'),
    body: n.body,
    kind: n.kind === 'manual' ? 'manual' : 'system',
    visibility: n.visibility,
    pinned: n.pinned,
    authorEmail: n.authorEmail,
  };
}

export function PartnerActivityTimeline({
  items,
  emptyMessage = 'No activity yet.',
  accent = 'violet',
}: {
  items: ActivityTimelineItem[];
  emptyMessage?: string;
  accent?: 'violet' | 'amber' | 'emerald';
}) {
  const sorted = [...items].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  if (!sorted.length) {
    return (
      <div className={`${finelyOsCatalogCard(accent)} !p-6 ${FINELY_OS_ENTITY_BODY}`}>{emptyMessage}</div>
    );
  }

  return (
    <div className={`${finelyOsCatalogCard(accent)} !p-0 overflow-hidden w-full`}>
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
        <Activity size={16} className="text-fuchsia-300/80" />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Timeline</span>
        <span className={`ml-auto ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{sorted.length} entries</span>
      </div>
      <ol className="divide-y divide-white/[0.06]">
        {sorted.map((item) => (
          <li key={item.id} className="relative px-5 py-4 md:px-6 md:py-5 hover:bg-white/[0.02] transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] flex items-center justify-center">
                {item.kind === 'manual' ? (
                  <ScrollText size={16} className="text-violet-300" />
                ) : (
                  <Activity size={16} className="text-sky-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={`${FINELY_OS_ENTITY_VALUE} text-base`}>{item.title}</h4>
                  {item.pinned ? <span className={finelyOsStatusChip('warn')}><Pin size={10} className="inline mr-1" />Pinned</span> : null}
                  {item.visibility === 'partner' ? (
                    <span className={finelyOsStatusChip('ok')}>Partner-visible</span>
                  ) : item.kind === 'manual' ? (
                    <span className={finelyOsStatusChip('blocked')}>Internal</span>
                  ) : null}
                </div>
                <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case font-mono text-[11px]`}>
                  <span>{fmtWhen(item.createdAt)}</span>
                  {item.authorEmail ? (
                    <span className="inline-flex items-center gap-1">
                      <User size={10} /> {item.authorEmail}
                    </span>
                  ) : null}
                </div>
                <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed whitespace-pre-wrap break-words`}>
                  {item.body}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
