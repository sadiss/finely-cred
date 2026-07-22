import fs from 'fs';

const path = 'e:/Finely-Cred/Tishobe/finely-cred-main/src/pages/admin/PartnerDetailPage.tsx';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("notifyPartnerNoteEmail")) {
  s = s.replace(
    "import { PartnerNotesTab } from '../../features/partner/PartnerNotesTab';",
    "import { PartnerNotesTab } from '../../features/partner/PartnerNotesTab';\nimport { notifyPartnerNoteEmail } from '../../lib/partnerNoteEmail';",
  );
}

const oldOnSave = `            onSaveNote={() => {
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
            }}`;

const newOnSave = `            onSaveNote={({ emailPartner }) => {
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
              setNotesVersion((v) => v + 1);
            }}`;

if (!s.includes(oldOnSave)) {
  console.error('onSaveNote block not found — PartnerDetailPage may already be patched or changed.');
  process.exit(1);
}

s = s.replace(oldOnSave, newOnSave);
fs.writeFileSync(path, s);
console.log('PartnerDetailPage notes email patch applied.');
