import type { AutomationActionV2 } from '../domain/automationStudio';

export type AutomationActionCategory = 'workboard' | 'comms' | 'workflow' | 'ops';

export type AutomationActionDef = {
  type: AutomationActionV2['type'];
  label: string;
  category: AutomationActionCategory;
  description?: string;
};

export const AUTOMATION_ACTION_DEFS: AutomationActionDef[] = [
  { type: 'create_task', label: 'Create task', category: 'workboard' },
  { type: 'create_project', label: 'Create project', category: 'workboard' },
  { type: 'set_task_stage', label: 'Set task stage', category: 'workboard' },
  { type: 'set_task_status', label: 'Set task status', category: 'workboard' },
  { type: 'set_task_priority', label: 'Set task priority', category: 'workboard' },
  { type: 'add_task_comment', label: 'Add task comment', category: 'workboard' },
  { type: 'add_task_checklist_items', label: 'Add task checklist items', category: 'workboard' },
  { type: 'append_task_notes', label: 'Append task notes', category: 'workboard' },
  { type: 'add_task_tags', label: 'Add task tags', category: 'workboard' },
  { type: 'add_task_labels', label: 'Add task labels', category: 'workboard' },
  { type: 'assign_task_users', label: 'Assign task users', category: 'workboard' },
  { type: 'set_project_stage', label: 'Set project stage', category: 'workboard' },
  { type: 'set_project_status', label: 'Set project status', category: 'workboard' },
  { type: 'add_project_note', label: 'Add project note', category: 'workboard' },

  { type: 'send_comms_template', label: 'Send comms template', category: 'comms' },
  { type: 'create_notification', label: 'Create notification', category: 'comms' },
  { type: 'send_invite_reminder', label: 'Send invite reminder', category: 'ops' },
  { type: 'bundle_nudge', label: 'Bundle nudge', category: 'ops' },
  { type: 'upsert_partner_signal', label: 'Upsert partner signal', category: 'ops' },

  { type: 'run_workflow', label: 'Run workflow', category: 'workflow' },
];

export function actionDef(type: AutomationActionV2['type']): AutomationActionDef | undefined {
  return AUTOMATION_ACTION_DEFS.find((d) => d.type === type);
}

