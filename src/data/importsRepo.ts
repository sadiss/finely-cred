import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { ImportBatch, LegacyPartnerExportV1 } from '../domain/imports';
import { createPartner, findPartnerByImportExternalId, adminUpsertPartner } from './partnersRepo';
import { createTask } from './tasksRepo';
import { importLegacyPartnerArtifacts } from './legacyPartnerArtifactsImport';
import { seedLegacyPartnerNotes } from './legacyPartnerNotesImport';
import { addAuditEvent } from './auditRepo';

const KEY = 'finely.imports.v1';

type Store = { batches: ImportBatch[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { batches: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listImportBatches(): ImportBatch[] {
  return loadStore().batches.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function importLegacyPartners(args: {
  exportData: LegacyPartnerExportV1;
  claimBaseUrl: string;
  filename?: string;
  dryRun?: boolean;
  importArtifacts?: boolean;
}): Promise<ImportBatch> {
  const batch: ImportBatch = {
    id: newId('import'),
    source: 'laravel',
    createdAt: nowIso(),
    filename: args.filename,
    partnerCount: args.exportData.partners?.length ?? 0,
    createdPartnerIds: [],
    errors: [],
    artifacts: args.importArtifacts
      ? { evidenceCreated: 0, reportsCreated: 0, lettersCreated: 0, businessProfilesUpdated: 0 }
      : undefined,
  };

  const partners = Array.isArray(args.exportData.partners) ? args.exportData.partners : [];
  for (const p of partners) {
    try {
      const externalId = String(p.externalId || '').trim();
      if (!externalId) throw new Error('Missing externalId');
      const fullName = String(p.fullName || '').trim();
      if (!fullName) throw new Error('Missing fullName');

      const exists = await findPartnerByImportExternalId({ source: 'laravel', externalId });
      if (exists) {
        batch.createdPartnerIds.push(exists.id);
        if (args.dryRun) continue;

        const notesText = p.notes ? String(p.notes).trim() : '';
        if (notesText) {
          if (!exists.notes) {
            await adminUpsertPartner({ ...exists, notes: notesText });
          }
          seedLegacyPartnerNotes({ partnerId: exists.id, notesText, externalId });
        }

        if (args.importArtifacts) {
          const artifactResult = await importLegacyPartnerArtifacts({
            partnerId: exists.id,
            exportPartner: p,
            dryRun: false,
          });
          if (batch.artifacts) {
            batch.artifacts.evidenceCreated += artifactResult.evidenceCreated;
            batch.artifacts.reportsCreated += artifactResult.reportsCreated;
            batch.artifacts.lettersCreated += artifactResult.lettersCreated;
            batch.artifacts.businessProfilesUpdated += artifactResult.businessProfilesUpdated;
          }
        }
        continue;
      }

      if (args.dryRun) {
        batch.createdPartnerIds.push(`dryrun:${externalId}`);
        continue;
      }

      const created = await createPartner({
        fullName,
        email: p.email ? String(p.email).trim() : undefined,
        phone: p.phone ? String(p.phone).trim() : undefined,
        primaryRoute: (p.primaryRoute as any) ?? undefined,
        lane: (p.lane as any) ?? undefined,
        journeyStage: (p.journeyStage as any) ?? undefined,
        journeySignals: (p.journeySignals as any) ?? undefined,
        intake: buildIntakeFromLegacy(p),
        importSource: 'laravel',
        importExternalId: externalId,
        asAdmin: true,
      });
      batch.createdPartnerIds.push(created.id);

      if (p.notes) {
        const notesText = String(p.notes).trim();
        await adminUpsertPartner({
          ...created,
          notes: notesText,
        });
        seedLegacyPartnerNotes({ partnerId: created.id, notesText, externalId });
        addAuditEvent({
          partnerId: created.id,
          actorType: 'system',
          action: 'legacy.import.notes',
          entityType: 'partner',
          entityId: created.id,
          meta: { source: 'laravel', externalId, noteLength: String(p.notes).length },
        });
      }

      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      for (const t of tasks) {
        const title = String((t as any)?.title || '').trim();
        if (!title) continue;
        createTask({
          partnerId: created.id,
          title,
          kind: (t as any).kind ?? 'general',
          stage: (t as any).stage ?? undefined,
          priority: (t as any).priority ?? undefined,
          status: (t as any).status ?? 'pending',
          dueAt: (t as any).dueAt ?? undefined,
          notes: (t as any).notes ?? undefined,
          tags: (t as any).tags ?? undefined,
          assignedTo: 'partner',
        });
      }

      if (args.importArtifacts) {
        const artifactResult = await importLegacyPartnerArtifacts({
          partnerId: created.id,
          exportPartner: p,
          dryRun: false,
        });
        if (batch.artifacts) {
          batch.artifacts.evidenceCreated += artifactResult.evidenceCreated;
          batch.artifacts.reportsCreated += artifactResult.reportsCreated;
          batch.artifacts.lettersCreated += artifactResult.lettersCreated;
          batch.artifacts.businessProfilesUpdated += artifactResult.businessProfilesUpdated;
        }
      }
    } catch (e: any) {
      batch.errors.push({ externalId: (p as any)?.externalId, message: e?.message || 'Import failed.' });
    }
  }

  if (args.dryRun && args.importArtifacts && batch.artifacts) {
    for (const p of partners) {
      try {
        const externalId = String(p.externalId || '').trim();
        const exists = await findPartnerByImportExternalId({ source: 'laravel', externalId });
        const partnerId = exists?.id ?? `dryrun:${externalId}`;
        const artifactResult = await importLegacyPartnerArtifacts({
          partnerId,
          exportPartner: p,
          dryRun: true,
        });
        batch.artifacts.evidenceCreated += artifactResult.evidenceCreated;
        batch.artifacts.reportsCreated += artifactResult.reportsCreated;
        batch.artifacts.lettersCreated += artifactResult.lettersCreated;
        batch.artifacts.businessProfilesUpdated += artifactResult.businessProfilesUpdated;
      } catch {
        // dry-run artifact preview is best-effort
      }
    }
  }

  const store = loadStore();
  if (!args.dryRun) {
    store.batches.push(batch);
    saveStore(store);
  }
  return batch;
}

/** Tier 371/376 — backfill Phase 2 artifacts for partners already imported from the same export. */
export async function importLegacyArtifactsForExistingPartners(args: {
  exportData: LegacyPartnerExportV1;
  dryRun?: boolean;
}): Promise<ImportBatch> {
  const batch: ImportBatch = {
    id: newId('import'),
    source: 'laravel',
    createdAt: nowIso(),
    partnerCount: args.exportData.partners?.length ?? 0,
    createdPartnerIds: [],
    errors: [],
    artifacts: { evidenceCreated: 0, reportsCreated: 0, lettersCreated: 0, businessProfilesUpdated: 0 },
  };

  const partners = Array.isArray(args.exportData.partners) ? args.exportData.partners : [];
  for (const p of partners) {
    try {
      const externalId = String(p.externalId || '').trim();
      if (!externalId) throw new Error('Missing externalId');
      const existing = await findPartnerByImportExternalId({ source: 'laravel', externalId });
      if (!existing) {
        batch.errors.push({ externalId, message: 'Partner not imported yet — run full import first.' });
        continue;
      }
      if (args.dryRun) {
        batch.createdPartnerIds.push(`dryrun-artifacts:${externalId}`);
      } else {
        batch.createdPartnerIds.push(existing.id);
      }
      const artifactResult = await importLegacyPartnerArtifacts({
        partnerId: existing.id,
        exportPartner: p,
        dryRun: args.dryRun,
      });
      if (!args.dryRun && p.notes) {
        const notesText = String(p.notes).trim();
        if (notesText) {
          if (!existing.notes) {
            await adminUpsertPartner({ ...existing, notes: notesText });
          }
          seedLegacyPartnerNotes({ partnerId: existing.id, notesText, externalId });
        }
      }
      batch.artifacts!.evidenceCreated += artifactResult.evidenceCreated;
      batch.artifacts!.reportsCreated += artifactResult.reportsCreated;
      batch.artifacts!.lettersCreated += artifactResult.lettersCreated;
      batch.artifacts!.businessProfilesUpdated += artifactResult.businessProfilesUpdated;
    } catch (e: any) {
      batch.errors.push({ externalId: (p as any)?.externalId, message: e?.message || 'Artifact import failed.' });
    }
  }

  if (!args.dryRun) {
    const store = loadStore();
    store.batches.push(batch);
    saveStore(store);
  }
  return batch;
}

function buildIntakeFromLegacy(p: LegacyPartnerExportV1['partners'][0]) {
  const addr = (p.journeySignals as any)?.legacyAddress;
  if (!addr || typeof addr !== 'object') return {};
  return {
    personal: {
      address1: addr.street || undefined,
      address2: addr.apartment || undefined,
      city: addr.city || undefined,
      state: addr.state || undefined,
      postalCode: addr.postalCode || undefined,
      dob: addr.dob || undefined,
    },
  };
}

