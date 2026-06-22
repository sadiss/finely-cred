import React from 'react';
import { Trash2 } from 'lucide-react';
import { PartnerActivityTimeline, partnerNoteToTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import type { PartnerNote } from '../../domain/partnerNotes';
import {
  FINELY_OS_ENTITY_ACTION,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
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

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className={`${finelyOsCatalogCard('violet')} !p-5 md:!p-6 space-y-4`}>
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Add team note</p>
          <p className={FINELY_OS_ENTITY_BODY}>Internal call summaries and partner context. Mark visible when the partner should see it in their portal.</p>
        </div>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={5}
          className={`${FINELY_OS_ENTITY_INPUT} resize-y min-h-[120px] w-full`}
          placeholder="Example: Partner uploading updated ID Friday; wants funding path after round 1 disputes."
        />
        <div className="flex flex-wrap items-center gap-4">
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
            <input type="checkbox" checked={notesVisibleToPartner} onChange={(e) => setNotesVisibleToPartner(e.target.checked)} className="accent-amber-500" />
            Visible to partner
          </label>
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
            <input type="checkbox" checked={notesPinned} onChange={(e) => setNotesPinned(e.target.checked)} className="accent-amber-500" />
            Pinned
          </label>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={!notesDraft.trim()} onClick={onSaveNote}>
            Save note
          </button>
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

      <PartnerActivityTimeline items={timelineItems} emptyMessage="No notes or activity yet." />

      {manualNotes.length ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-5`}>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>Manage saved notes</p>
          <div className="space-y-2">
            {manualNotes.slice(0, 20).map((n) => (
              <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className={`${FINELY_OS_ENTITY_BODY} text-sm truncate max-w-[min(100%,420px)]`}>{n.body.slice(0, 80)}{n.body.length > 80 ? '…' : ''}</span>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onToggleVisibility(n)}>
                    {n.visibility === 'partner' ? 'Internal' : 'Share'}
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onTogglePin(n)}>
                    {n.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button type="button" className={FINELY_OS_ENTITY_ACTION} onClick={() => onDeleteNote(n)}>
                    <Trash2 size={14} className="text-red-300" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
