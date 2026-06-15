import { addLeadNote, listLeadOps } from '../../data/leadOpsRepo';
import { addProspectNote, listProspects } from '../../data/crmProspectsRepo';

export function syncWorkTaskActivityToCrm(args: {
  partnerId: string;
  taskTitle: string;
  status: string;
}) {
  const line = `Work: "${args.taskTitle}" → ${args.status.replace('_', ' ')}`;
  for (const op of listLeadOps()) {
    if (op.partnerId === args.partnerId) {
      addLeadNote(op.leadId, line);
    }
  }
  for (const p of listProspects()) {
    if (p.tags?.includes(`partner:${args.partnerId}`)) {
      addProspectNote(p.id, line);
    }
  }
}
