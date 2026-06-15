export type VideoProviderId = 'kling' | 'runway' | 'veo' | 'pika' | 'luma' | 'manual';

export type VideoProductionStyle =
  | 'talking_head'
  | 'animated_explainer'
  | 'whiteboard'
  | 'motion_graphics'
  | 'documentary'
  | 'corporate'
  | 'cinematic'
  | 'short_film';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CourseStudioMeta = {
  level?: CourseLevel;
  learningObjectives?: string[];
  productionStyle?: VideoProductionStyle;
  videoProvider?: VideoProviderId;
  generationPrompt?: string;
  lastGeneratedAt?: string;
  marketingHeadline?: string;
  marketingSummary?: string;
};

export type VideoScenePlan = {
  id: string;
  lessonId?: string;
  sceneNumber: number;
  title: string;
  visualPrompt: string;
  voiceover: string;
  onScreenText?: string;
  cameraDirection?: string;
  durationSec?: number;
  provider?: VideoProviderId;
  status: 'draft' | 'prompt_ready' | 'render_queued' | 'complete';
};
