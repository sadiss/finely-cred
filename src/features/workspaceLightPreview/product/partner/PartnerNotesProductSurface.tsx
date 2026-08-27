import React, { useCallback, useMemo, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { addAuditEvent } from '../../../../data/auditRepo';
import {
  createPartnerNote,
  deletePartnerNote,
  listPartnerNotesByPartner,
  upsertPartnerNote,
} from '../../../../data/partnerNotesRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { notifyPartnerNoteEmail } from '../../../../lib/partnerNoteEmail';
import { PartnerNotesTab } from '../../../partner/PartnerNotesTab';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PAGE, finelyOsCatalogCard } from '../../../os/finelyOsLightUi';
import { ProductEmptyState } from '../components/ProductUi';
import './partnerWorkstationSurfaceTabs.css';

/** Split workbench notes room for the partner inspector — queue, compose, and inspector rail. */
export default function PartnerNotesProductSurface({ partnerId }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const [notesDraft, setNotesDraft] = useState('');
  const [notesVisibleToPartner, setNotesVisibleToPartner] = useState(false);
  const [notesPinned, setNotesPinned] = useState(false);
  const [version, setVersion] = useState(0);

  const allNotes = useMemo(
    () => (partner ? listPartnerNotesByPartner(partner.id) : []),
    [partner, version],
  );
  const manualNotes = useMemo(() => allNotes.filter((n) => n.kind === 'manual'), [allNotes]);
  const systemNotes = useMemo(
    () =>
      allNotes
        .filter((n) => n.kind === 'system')
        .map((n) => ({ createdAt: n.createdAt, title: n.title || 'System', body: n.body })),
    [allNotes],
  );

  const actorEmail = auth.user?.email || undefined;
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  if (!partner) {
    return (
      <ProductEmptyState
        title="No partner file"
        description="Open a partner record to write notes."
      />
    );
  }

  const partnerVisible = manualNotes.filter((n) => n.visibility === 'partner').length;
  const pinnedCount = manualNotes.filter((n) => n.pinned).length;

  return (
    <div className={`${FINELY_OS_PAGE} space-y-5`} data-surface-layout="notes-workbench">
      <header className={`${finelyOsCatalogCard('violet')} flex flex-wrap items-center justify-between gap-4 p-6 lg:p-8`} data-fc-accent="violet">
        <div className="flex items-start gap-4 min-w-0">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 shrink-0">
            <StickyNote size={26} />
          </div>
          <div className="min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Partner notes</p>
            <h1 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partner.profile.fullName || 'Partner file'}</h1>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Queue on the left, compose in the center, full note detail on the right.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className={`${finelyOsCatalogCard('emerald')} px-5 py-4 text-center`} data-fc-accent="emerald">
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{manualNotes.length}</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Team notes</div>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} px-5 py-4 text-center`} data-fc-accent="sky">
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{pinnedCount}</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Pinned</div>
          </div>
          <div className={`${finelyOsCatalogCard('rose')} px-5 py-4 text-center`} data-fc-accent="rose">
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partnerVisible}</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Shared</div>
          </div>
        </div>
      </header>

      <PartnerNotesTab
        layout="workbench"
        systemNotes={systemNotes}
        manualNotes={manualNotes}
        notesDraft={notesDraft}
        setNotesDraft={setNotesDraft}
        notesVisibleToPartner={notesVisibleToPartner}
        setNotesVisibleToPartner={setNotesVisibleToPartner}
        notesPinned={notesPinned}
        setNotesPinned={setNotesPinned}
        onSaveNote={({ emailPartner }) => {
          const body = notesDraft.trim();
          if (!body) return;
          createPartnerNote({
            partnerId: partner.id,
            kind: 'manual',
            authorType: 'admin',
            authorEmail: actorEmail,
            visibility: notesVisibleToPartner ? 'partner' : 'internal',
            body,
            pinned: notesPinned,
          });
          addAuditEvent({
            partnerId: partner.id,
            actorType: 'admin',
            actorEmail,
            action: 'partner.note_created',
            entityType: 'partner_note',
            entityId: 'note',
            meta: {
              kind: 'manual',
              visibility: notesVisibleToPartner ? 'partner' : 'internal',
              pinned: notesPinned,
              emailedPartner: Boolean(emailPartner && notesVisibleToPartner),
            },
          });
          if (emailPartner && notesVisibleToPartner) {
            void notifyPartnerNoteEmail({
              partnerId: partner.id,
              body,
              authorLabel: actorEmail || 'Finely Cred team',
              partner,
            });
          }
          setNotesDraft('');
          setNotesVisibleToPartner(false);
          setNotesPinned(false);
          bump();
        }}
        onToggleVisibility={(n) => {
          upsertPartnerNote({
            ...n,
            visibility: n.visibility === 'partner' ? 'internal' : 'partner',
          });
          bump();
        }}
        onTogglePin={(n) => {
          upsertPartnerNote({ ...n, pinned: !n.pinned });
          bump();
        }}
        onDeleteNote={(n) => {
          deletePartnerNote(n.id);
          bump();
        }}
      />
    </div>
  );
}
