/** Video command glue — upload analysis → assets → growth promotion. */

export const VIDEO_COMMAND_WORKFLOW_STEPS = [
  'import',
  'understand',
  'destinations',
  'publish',
  'promote',
] as const;

export type VideoCommandWorkflowStep = (typeof VIDEO_COMMAND_WORKFLOW_STEPS)[number];

export type VideoCommandDestinationMode = 'course' | 'resources' | 'testimonial';

export type VideoCommandRecord = {
  id: string;
  title: string;
  uploadAnalysisId?: string;
  resourceVideoId?: string;
  contentStudioAssetId?: string;
  lifecycle: VideoCommandWorkflowStep;
  destinationMode?: VideoCommandDestinationMode;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  createdAt: string;
  updatedAt: string;
};

export function videoCommandWorkflowLabel(step: VideoCommandWorkflowStep): string {
  const map: Record<VideoCommandWorkflowStep, string> = {
    import: 'Import',
    understand: 'Understand',
    destinations: 'Destinations',
    publish: 'Publish',
    promote: 'Promote',
  };
  return map[step];
}

export function nextVideoCommandWorkflowStep(step: VideoCommandWorkflowStep): VideoCommandWorkflowStep | null {
  const idx = VIDEO_COMMAND_WORKFLOW_STEPS.indexOf(step);
  if (idx < 0 || idx >= VIDEO_COMMAND_WORKFLOW_STEPS.length - 1) return null;
  return VIDEO_COMMAND_WORKFLOW_STEPS[idx + 1];
}
