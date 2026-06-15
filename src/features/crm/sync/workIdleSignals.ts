import type { CrmRecord, CrmWorkIdleSignals } from '../../../domain/crmRecords';
import { loadJson } from '../../../data/localJsonStore';
import type { Partner } from '../../../domain/partners';
import { listTasks } from '../../../data/tasksRepo';
import { listProjects } from '../../../data/projectsRepo';
import { listAllSlaBreaches } from '../../work/sla/listSlaBreaches';

const LOCAL_PARTNERS_KEY = 'finely.partners.v1';

function loadLocalPartners(): Partner[] {
  return loadJson<{ partners: Partner[] }>(LOCAL_PARTNERS_KEY, { partners: [] }, 1).partners ?? [];
}

export function resolvePartnerIdForCrmRecord(record: CrmRecord): string | undefined {
  if (record.partnerId) return record.partnerId;
  const tagPartner = (record.tags ?? []).find((t) => t.startsWith('partner:'));
  if (tagPartner) return tagPartner.replace('partner:', '');
  const email = record.contact.email?.trim().toLowerCase();
  if (!email) return undefined;
  const match = loadLocalPartners().find((p) => p.profile.email?.trim().toLowerCase() === email);
  return match?.id;
}

function lastTaskActivityMs(partnerId: string): number | null {
  const tasks = listTasks().filter((t) => t.partnerId === partnerId && t.status !== 'cancelled');
  if (!tasks.length) return null;
  let latest = 0;
  for (const t of tasks) {
    const candidates = [t.updatedAt, t.createdAt, t.completedAt, t.dueAt].filter(Boolean) as string[];
    for (const iso of candidates) {
      const ms = Date.parse(iso);
      if (Number.isFinite(ms) && ms > latest) latest = ms;
    }
  }
  return latest || null;
}

export function buildWorkIdleSignalsForPartner(partnerId: string): CrmWorkIdleSignals {
  const breaches = listAllSlaBreaches().filter((b) => b.partnerId === partnerId);
  const lastActivity = lastTaskActivityMs(partnerId);
  const idleDays = lastActivity ? (Date.now() - lastActivity) / 86400000 : 999;

  let riskLevel: CrmWorkIdleSignals['riskLevel'] = 'low';
  if (breaches.length >= 2 || idleDays >= 14) riskLevel = 'high';
  else if (breaches.length >= 1 || idleDays >= 7) riskLevel = 'medium';

  return {
    partnerId,
    idleDays: Math.round(idleDays * 10) / 10,
    slaBreachCount: breaches.length,
    riskLevel,
  };
}

export function enrichCrmRecordWithWorkSignals(record: CrmRecord): CrmRecord {
  const partnerId = resolvePartnerIdForCrmRecord(record);
  if (!partnerId) return record;
  const projects = listProjects().filter((p) => p.partnerId === partnerId);
  if (!projects.length && !listTasks().some((t) => t.partnerId === partnerId)) return record;
  return {
    ...record,
    partnerId: record.partnerId ?? partnerId,
    projectIds: record.projectIds ?? projects.map((p) => p.id),
    workSignals: buildWorkIdleSignalsForPartner(partnerId),
  };
}
