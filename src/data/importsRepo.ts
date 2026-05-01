import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { ImportBatch, LegacyPartnerExportV1 } from '../domain/imports';
import { createPartner, findPartnerByImportExternalId } from './partnersRepo';
import { createTask } from './tasksRepo';

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

export function importLegacyPartners(args: {
  exportData: LegacyPartnerExportV1;
  claimBaseUrl: string;
  filename?: string;
}): ImportBatch {
  const batch: ImportBatch = {
    id: newId('import'),
    source: 'laravel',
    createdAt: nowIso(),
    filename: args.filename,
    partnerCount: args.exportData.partners?.length ?? 0,
    createdPartnerIds: [],
    errors: [],
  };

  const partners = Array.isArray(args.exportData.partners) ? args.exportData.partners : [];
  for (const p of partners) {
    try {
      const externalId = String(p.externalId || '').trim();
      if (!externalId) throw new Error('Missing externalId');
      const fullName = String(p.fullName || '').trim();
      if (!fullName) throw new Error('Missing fullName');

      const exists = findPartnerByImportExternalId({ source: 'laravel', externalId });
      if (exists) throw new Error(`Already imported (partnerId: ${exists.id})`);

      const created = createPartner({
        fullName,
        email: p.email ? String(p.email).trim() : undefined,
        phone: p.phone ? String(p.phone).trim() : undefined,
        primaryRoute: (p.primaryRoute as any) ?? undefined,
        lane: (p.lane as any) ?? undefined,
        journeyStage: (p.journeyStage as any) ?? undefined,
        journeySignals: (p.journeySignals as any) ?? undefined,
        intake: {},
        importSource: 'laravel',
        importExternalId: externalId,
      });
      batch.createdPartnerIds.push(created.id);

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
    } catch (e: any) {
      batch.errors.push({ externalId: (p as any)?.externalId, message: e?.message || 'Import failed.' });
    }
  }

  const store = loadStore();
  store.batches.push(batch);
  saveStore(store);
  return batch;
}

