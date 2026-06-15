/** AI Education Studio — enterprise production pipeline model (Kajabi + Teachable + AI video studio). */

export type {
  CourseLevel,
  CourseStudioMeta,
  VideoProductionStyle,
  VideoProviderId,
  VideoScenePlan,
} from '../../domain/educationStudio';

export type EducationEngineId =
  | 'curriculum'
  | 'authoring'
  | 'video'
  | 'multimedia'
  | 'experience';

export type EducationAgentId =
  | 'curriculum_architect'
  | 'instructional_designer'
  | 'subject_matter_expert'
  | 'script_writer'
  | 'video_director'
  | 'storyboard_artist'
  | 'voice_director'
  | 'assessment_designer'
  | 'marketing_agent'
  | 'quality_assurance';

export const EDUCATION_ENGINES: {
  id: EducationEngineId;
  title: string;
  description: string;
  outputs: string[];
}[] = [
  {
    id: 'curriculum',
    title: 'Curriculum Engine',
    description: 'Structures, objectives, skill maps, pathways, and certification tracks.',
    outputs: ['Course outline', 'Learning objectives', 'Module plan', 'Prerequisite map'],
  },
  {
    id: 'authoring',
    title: 'Course Authoring Engine',
    description: 'Lessons, quizzes, workbooks, case studies, and visual block editor.',
    outputs: ['Lesson content', 'Quizzes & exams', 'Workbooks', 'Discussion prompts'],
  },
  {
    id: 'video',
    title: 'Video Production Engine',
    description: 'AI movie studio — storyboards, scenes, VO scripts, cinematic prompts.',
    outputs: ['Scene breakdowns', 'Storyboards', 'Narration scripts', 'Provider prompts'],
  },
  {
    id: 'multimedia',
    title: 'Multimedia Engine',
    description: 'Voiceovers, slides, diagrams, flashcards, and downloadable assets.',
    outputs: ['AI voiceover', 'Slide decks', 'Infographics', 'Flashcards & PDFs'],
  },
  {
    id: 'experience',
    title: 'Learning Experience Engine',
    description: 'Player, progress, certificates, cohorts, and assessments.',
    outputs: ['Course player', 'Progress tracking', 'Certificates', 'Knowledge checks'],
  },
];

export const EDUCATION_AGENTS: { id: EducationAgentId; label: string; role: string }[] = [
  { id: 'curriculum_architect', label: 'Curriculum Architect', role: 'Designs course structure and pathways' },
  { id: 'instructional_designer', label: 'Instructional Designer', role: 'Optimizes learning effectiveness' },
  { id: 'subject_matter_expert', label: 'Subject Matter Expert', role: 'Creates accurate educational content' },
  { id: 'script_writer', label: 'Script Writer', role: 'Writes lesson and narration scripts' },
  { id: 'video_director', label: 'Video Director', role: 'Plans cinematic lesson production' },
  { id: 'storyboard_artist', label: 'Storyboard Artist', role: 'Designs scenes and visual flow' },
  { id: 'voice_director', label: 'Voice Director', role: 'Shapes narration tone and pacing' },
  { id: 'assessment_designer', label: 'Assessment Designer', role: 'Builds quizzes and exams' },
  { id: 'marketing_agent', label: 'Marketing Agent', role: 'Creates landing and sales copy' },
  { id: 'quality_assurance', label: 'Quality Assurance', role: 'Reviews accuracy and completeness' },
];

export const VIDEO_PROVIDERS: { id: import('../../domain/educationStudio').VideoProviderId; label: string; hint: string }[] = [
  { id: 'kling', label: 'Kling AI', hint: 'Cinematic motion, short-film quality' },
  { id: 'runway', label: 'Runway', hint: 'Gen-3 video, creative control' },
  { id: 'veo', label: 'Google Veo', hint: 'High-fidelity generative video' },
  { id: 'pika', label: 'Pika Labs', hint: 'Fast explainer clips' },
  { id: 'luma', label: 'Luma Dream Machine', hint: 'Scene continuity' },
  { id: 'manual', label: 'Manual export', hint: 'Storyboard + assets only' },
];

export const VIDEO_STYLES: { id: import('../../domain/educationStudio').VideoProductionStyle; label: string }[] = [
  { id: 'talking_head', label: 'Talking-head instructor' },
  { id: 'animated_explainer', label: 'Animated explainer' },
  { id: 'whiteboard', label: 'Whiteboard lesson' },
  { id: 'motion_graphics', label: 'Motion graphics' },
  { id: 'documentary', label: 'Documentary style' },
  { id: 'corporate', label: 'Corporate training' },
  { id: 'cinematic', label: 'Cinematic storytelling' },
  { id: 'short_film', label: 'Short-film educational' },
];
