import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Pin, PinOff, Search, Share2, Trash2 } from 'lucide-react';
import { partnerNoteToTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import type { PartnerNote } from '../../domain/partnerNotes';
import {
  FINELY_OS_ENTITY_ACTION,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function PartnerNotesTab({
  systemNotes,
  manualNotes,
  notesDraft,
  setNotesDraft,
  notesVisibleToPartner,
  setNotesVisibleToPartner,
  notesPinned,
  setNotesPinned,
  onSaveNote,
  onToggleVisibility,
  onTogglePin,
  onDeleteNote,
  legacyNotesText,
  onImportLegacy,
}: {
  systemNotes: { createdAt: string; title: string; body: string }[];
  manualNotes: PartnerNote[];
  notesDraft: string;
  setNotesDraft: (v: string) => void;
  notesVisibleToPartner: boolean;
  setNotesVisibleToPartner: (v: boolean) => void;
  notesPinned: boolean;
  setNotesPinned: (v: boolean) => void;
  onSaveNote: () => void;
  onToggleVisibility: (n: PartnerNote) => void;
  onTogglePin: (n: PartnerNote) => void;
  onDeleteNote: (n: PartnerNote) => void;
  legacyNotesText?: string;
  onImportLegacy?: () => void;
}) {
  const timelineItems = [
    ...systemNotes.map((n, i) => ({
      id: `sys-${i}-${n.createdAt}`,
      createdAt: n.createdAt,
      title: n.title,
      body: n.body,
      kind: 'system' as const,
    })),
    ...manualNotes.map(partnerNoteToTimelineItem),
  ];
  const [filter, setFilter] = useState<'all' | 'manual' | 'system' | 'pinned' | 'internal' | 'partner'>('all');
  const [query, setQuery] = useState('');
  const noteStats = useMemo(
    () => ({
      total: manualNotes.length + systemNotes.length,
      manual: manualNotes.length,
      pinned: manualNotes.filter((n) => n.pinned).length,
      partnerVisible: manualNotes.filter((n) => n.visibility === 'partner').length,
      system: systemNotes.length,
    }),
    [manualNotes, systemNotes],
  );
  const filteredManualNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return manualNotes
      .filter((n) => {
        if (filter === 'system') return false;
        if (filter === 'pinned' && !n.pinned) return false;
        if (filter === 'internal' && n.visibility !== 'internal') return false;
        if (filter === 'partner' && n.visibility !== 'partner') return false;
        if (!q) return true;
        return `${n.title || ''} ${n.body} ${n.authorEmail || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt));
  }, [manualNotes, filter, query]);

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { id: 'all', label: 'All activity', value: noteStats.total, hint: 'Notes + system' },
          { id: 'manual', label: 'Team notes', value: noteStats.manual, hint: 'Saved by staff' },
          { id: 'pinned', label: 'Pinned', value: noteStats.pinned, hint: 'Priority context' },
          { id: 'partner', label: 'Partner-visible', value: noteStats.partnerVisible, hint: 'Shared notes' },
          { id: 'system', label: 'System', value: noteStats.system, hint: 'Automatic updates' },
        ].map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              if (k.id === 'all' || k.id === 'manual' || k.id === 'system' || k.id === 'pinned' || k.id === 'partner') setFilter(k.id);
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left hover:bg-white/[0.06] transition-all"
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
            <div className={`mt-1 text-2xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{k.value}</div>
            <div className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{k.hint}</div>
          </button>
        ))}
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 md:!p-6 space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Add team note</p>
            <p className={`${FINELY_OS_ENTITY_BODY} max-w-2xl`}>Capture calls, evidence reminders, underwriting context, promises made, and partner-visible next steps. Pin anything that should stay at the top.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setNotesVisibleToPartner(false)} className={!notesVisibleToPartner ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}>
              <EyeOff size={14} /> Internal
            </button>
            <button type="button" onClick={() => setNotesVisibleToPartner(true)} className={notesVisibleToPartner ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}>
              <Eye size={14} /> Partner-visible
            </button>
          </div>
        </div>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={5}
          className={`${FINELY_OS_ENTITY_INPUT} resize-y min-h-[120px] w-full`}
          placeholder="Example: Partner uploading updated ID Friday; wants funding path after round 1 disputes."
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
            <input type="checkbox" checked={notesPinned} onChange={(e) => setNotesPinned(e.target.checked)} className="accent-amber-500" />
            Pinned
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setNotesDraft('Call summary:\n\nDecision:\n\nNext step:\n\nOwner:\n\nDue date:')}>
              Call template
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setNotesDraft('Partner-visible update:\n\nWhat changed:\n\nWhat to do next:\n\nWhere to click:')}>
              Partner update template
            </button>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={!notesDraft.trim()} onClick={onSaveNote}>
              Save note
            </button>
          </div>
        </div>
      </div>

      {legacyNotesText?.trim() && !manualNotes.length && onImportLegacy ? (
        <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-3`}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Legacy profile notes</p>
          <p className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{legacyNotesText}</p>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onImportLegacy}>
            Import into timeline
          </button>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Saved notes command deck</p>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Organized cards, not a long wall. Filter, pin, share, or delete quickly.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3">
              <Search size={14} className="text-white/35" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="bg-transparent py-2 text-sm text-white/80 outline-none placeholder:text-white/30" placeholder="Search notes..." />
            </div>
            {(['all', 'manual', 'system', 'pinned', 'internal', 'partner'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={filter === f ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredManualNotes.map((n) => (
            <div key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold line-clamp-2`}>{n.title || 'Team note'}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case font-mono text-[11px]`}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {n.pinned ? <span className={finelyOsStatusChip('warn')}>Pinned</span> : null}
                  {n.visibility === 'partner' ? <span className={finelyOsStatusChip('ok')}>Partner</span> : <span className={finelyOsStatusChip('blocked')}>Internal</span>}
                </div>
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm whitespace-pre-wrap line-clamp-6`}>{n.body}</div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onToggleVisibility(n)}>
                  {n.visibility === 'partner' ? <EyeOff size={14} /> : <Share2 size={14} />}
                  {n.visibility === 'partner' ? 'Make internal' : 'Share'}
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onTogglePin(n)}>
                  {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {n.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button type="button" className={FINELY_OS_ENTITY_ACTION} onClick={() => onDeleteNote(n)}>
                  <Trash2 size={14} className="text-red-300" /> Delete
                </button>
              </div>
            </div>
          ))}
          {filter !== 'system' && !filteredManualNotes.length ? (
            <div className={`${FINELY_OS_ENTITY_BODY} rounded-2xl border border-white/10 bg-white/[0.03] p-5`}>
              No notes match this filter.
            </div>
          ) : null}
        </div>
      </div>

      {(systemNotes.length && (filter === 'all' || filter === 'system')) ? (
        <details className={`${finelyOsCatalogCard('emerald')} !p-5`}>
          <summary className={`cursor-pointer ${FINELY_OS_ENTITY_VALUE}`}>System activity ({systemNotes.length})</summary>
          <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {timelineItems.filter((i) => i.kind === 'system').slice(0, 18).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold line-clamp-2`}>{item.title}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case font-mono text-[11px]`}>{new Date(item.createdAt).toLocaleString()}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} mt-3 text-sm line-clamp-4`}>{item.body}</div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
