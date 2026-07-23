import type { LegacyPartnerExportV1 } from '../domain/imports';
import { classifyLegacyFileName } from './classifyLegacyFileName';
import { parseLegacyPartnerNotesFromExport } from './legacyPartnerNotesIntel';

export type LegacyRepairPreviewRow = {
  fileName: string;
  before: string;
  after: string;
};

export type LegacyRepairPartnerPreview = {
  externalId: string;
  fullName: string;
  email?: string;
  fileReclassifications: LegacyRepairPreviewRow[];
  noteEvents: Array<{ kind: string; action: string; date?: string }>;
  suggestedRound: string;
  suggestedStage?: string;
  nextActions: string[];
};

/** Dry-run preview for admin repair tool — shows before/after classification + note intel. */
export function previewLegacyPartnerRepair(args: {
  exportPartner: LegacyPartnerExportV1['partners'][0];
  /** Prior classification tag/kind from a mis-import (optional). */
  priorKindByFile?: Record<string, string>;
}): LegacyRepairPartnerPreview {
  const p = args.exportPartner;
  const intel = parseLegacyPartnerNotesFromExport(p);
  const fileReclassifications: LegacyRepairPreviewRow[] = [];

  for (const doc of p.legacyDocuments ?? []) {
    const fileName = String(doc.fileName || '').trim();
    if (!fileName) continue;
    const cls = classifyLegacyFileName(fileName);
    const before = args.priorKindByFile?.[fileName] ?? 'other_evidence (generic vault)';
    fileReclassifications.push({
      fileName,
      before,
      after: `${cls.kind} → ${cls.tag}`,
    });
  }

  return {
    externalId: String(p.externalId || ''),
    fullName: String(p.fullName || ''),
    email: p.email ? String(p.email) : undefined,
    fileReclassifications,
    noteEvents: intel.events.map((e) => ({
      kind: e.kind,
      action: e.action,
      date: e.mailedAt ?? e.receivedAt,
    })),
    suggestedRound: intel.suggestedRound,
    suggestedStage: intel.suggestedStage,
    nextActions: intel.nextActions,
  };
}

export function formatLegacyRepairPreview(preview: LegacyRepairPartnerPreview): string {
  const lines = [
    `${preview.fullName} (${preview.email ?? preview.externalId})`,
    `Round ${preview.suggestedRound}${preview.suggestedStage ? ` · stage ${preview.suggestedStage}` : ''}`,
    '',
    'Files:',
    ...preview.fileReclassifications.map((r) => `  ${r.fileName}: ${r.before} → ${r.after}`),
    '',
    `Note events (${preview.noteEvents.length}):`,
    ...preview.noteEvents.map((e) => `  ${e.kind} ${e.action}${e.date ? ` @ ${new Date(e.date).toLocaleDateString()}` : ''}`),
  ];
  if (preview.nextActions.length) {
    lines.push('', 'Next actions:', ...preview.nextActions.map((a) => `  • ${a}`));
  }
  return lines.join('\n');
}
