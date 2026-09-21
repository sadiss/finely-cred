/**
 * Nurture sequence definitions — maps to Comms templates (academy_trainee_*).
 * Processed via nurtureEngine → academyTraineeEmailPipeline → send-email edge.
 */

import type { AcademyTraineeEmailEvent } from '../specialistAcademy/academyTraineeEmailPipeline';

export type NurtureSequenceId = 'academy_trainee_v1' | 'lounge_welcome_v1';

export type NurtureStepDef = {
  id: string;
  event: AcademyTraineeEmailEvent | 'lounge_welcome';
  templateSuffix: string;
  dedupeHours?: number;
};

export const ACADEMY_TRAINEE_SEQUENCE: { id: NurtureSequenceId; label: string; steps: NurtureStepDef[] } = {
  id: 'academy_trainee_v1',
  label: 'Specialist Academy trainee lifecycle',
  steps: [
    { id: 'welcome', event: 'welcome', templateSuffix: 'welcome' },
    { id: 'module_started', event: 'module_started', templateSuffix: 'module_started', dedupeHours: 24 },
    { id: 'module_completed', event: 'module_completed', templateSuffix: 'module_completed' },
    { id: 'quiz_passed', event: 'quiz_passed', templateSuffix: 'quiz_passed' },
    { id: 'quiz_retry', event: 'quiz_retry', templateSuffix: 'quiz_retry', dedupeHours: 12 },
    { id: 'weekly_digest', event: 'weekly_digest', templateSuffix: 'weekly_digest', dedupeHours: 168 },
    { id: 'course_complete', event: 'course_complete', templateSuffix: 'course_complete' },
    { id: 'material_pack', event: 'material_pack', templateSuffix: 'material_pack' },
  ],
};

export const LOUNGE_WELCOME_SEQUENCE: { id: NurtureSequenceId; label: string; steps: NurtureStepDef[] } = {
  id: 'lounge_welcome_v1',
  label: 'Specialist Lounge welcome (uses academy welcome template + lounge link)',
  steps: [{ id: 'lounge_welcome', event: 'welcome', templateSuffix: 'welcome' }],
};
