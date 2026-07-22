import fs from 'fs';

const path = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/pages/admin/PartnerDetailPage.tsx';
let s = fs.readFileSync(path, 'utf8');
const startMarker = "        {tab === 'notes' && (";
const endMarker = "        {tab === 'debt' && (";
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker);
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}
const replacement = `        {tab === 'notes' && (
          <PartnerNotesTab
            systemNotes={systemNotes}
            manualNotes={sortedManualNotes}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            notesVisibleToPartner={notesVisibleToPartner}
            setNotesVisibleToPartner={setNotesVisibleToPartner}
            notesPinned={notesPinned}
            setNotesPinned={setNotesPinned}
            onSaveNote={() => {
              const body = notesDraft.trim();
              if (!body || !partner) return;
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
                meta: { kind: 'manual', visibility: notesVisibleToPartner ? 'partner' : 'internal', pinned: notesPinned },
              });
              setNotesDraft('');
              setNotesVisibleToPartner(false);
              setNotesPinned(false);
              setNotesVersion((v) => v + 1);
            }}
            onToggleVisibility={(n) => {
              upsertPartnerNote({ ...n, visibility: n.visibility === 'partner' ? 'internal' : 'partner' });
              setNotesVersion((v) => v + 1);
            }}
            onTogglePin={(n) => {
              upsertPartnerNote({ ...n, pinned: !Boolean(n.pinned) });
              setNotesVersion((v) => v + 1);
            }}
            onDeleteNote={(n) => {
              if (!window.confirm('Delete this note?')) return;
              deletePartnerNote(n.id);
              setNotesVersion((v) => v + 1);
            }}
            legacyNotesText={partner.notes}
            onImportLegacy={() => {
              seedLegacyPartnerNotes({
                partnerId: partner.id,
                notesText: partner.notes,
                externalId: partner.importExternalId || partner.id,
                forceRefresh: true,
              });
              setNotesVersion((v) => v + 1);
            }}
          />
        )}

`;
s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(path, s);
console.log('ok');
