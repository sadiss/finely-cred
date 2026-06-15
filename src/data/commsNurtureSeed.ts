import type { CommsTemplate } from '../domain/comms';
import { listCommsTemplates, upsertCommsTemplate } from './commsRepo';
import { NURTURE_SEQUENCES } from '../domain/nurtureSequences';

function nowIso() {
  return new Date().toISOString();
}

/** Seed Comms Studio templates referenced by nurture sequence steps (Phase 12). */
export function ensureNurtureCommsTemplatesOnce() {
  const existing = new Set(listCommsTemplates().map((t) => t.id));
  const templateIds = new Set<string>();
  for (const seq of NURTURE_SEQUENCES) {
    for (const step of seq.steps) {
      if (step.channel === 'email') templateIds.add(step.templateId);
    }
  }

  let changed = false;
  for (const templateId of templateIds) {
    if (existing.has(templateId)) continue;
    const tpl: CommsTemplate = {
      id: templateId,
      name: templateId.replace(/_/g, ' '),
      channel: 'email',
      enabled: true,
      subjectTemplate: '{{subject}}',
      bodyTemplate: '{{body}}',
      tags: ['nurture', 'seed'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    upsertCommsTemplate(tpl);
    existing.add(templateId);
    changed = true;
  }

  return changed;
}

/** Alias for admin tooling — returns count of nurture templates present. */
export function countNurtureCommsTemplates() {
  ensureNurtureCommsTemplatesOnce();
  const ids = new Set<string>();
  for (const seq of NURTURE_SEQUENCES) {
    for (const step of seq.steps) {
      if (step.channel === 'email') ids.add(step.templateId);
    }
  }
  const have = listCommsTemplates().filter((t) => ids.has(t.id));
  return { expected: ids.size, present: have.length };
}
