import type { LessonBlockType, LessonContentBlock } from '../domain/courses';
import { newId } from '../utils/ids';

export type LessonBlockCategory =
  | 'content'
  | 'layout'
  | 'action'
  | 'assessment'
  | 'media'
  | 'data'
  | 'advanced';

export type LessonBlockDefinition = {
  type: LessonBlockType;
  label: string;
  category: LessonBlockCategory;
  description?: string;
  createDefault: () => LessonContentBlock;
};

function mk(type: LessonBlockType, data: Record<string, any>): LessonContentBlock {
  return { id: newId('blk'), type, data };
}

export const LESSON_BLOCK_DEFS: LessonBlockDefinition[] = [
  // Content
  {
    type: 'markdown',
    label: 'Markdown',
    category: 'content',
    description: 'Primary lesson body (supports headings, lists, checklists).',
    createDefault: () => mk('markdown', { markdown: '## Section\n\nWrite here.\n' }),
  },
  { type: 'heading', label: 'Heading', category: 'content', createDefault: () => mk('heading', { text: 'Heading' }) },
  { type: 'subheading', label: 'Subheading', category: 'content', createDefault: () => mk('subheading', { text: 'Subheading' }) },
  { type: 'rich_text', label: 'Rich text', category: 'content', createDefault: () => mk('rich_text', { markdown: 'Write text…' }) },
  { type: 'callout', label: 'Callout', category: 'content', createDefault: () => mk('callout', { tone: 'info', title: 'Key point', markdown: 'Explain why it matters.' }) },
  { type: 'quote', label: 'Quote', category: 'content', createDefault: () => mk('quote', { quote: 'Quote', by: '—' }) },
  { type: 'divider', label: 'Divider', category: 'layout', createDefault: () => mk('divider', {}) },

  // Media
  { type: 'image', label: 'Image', category: 'media', createDefault: () => mk('image', { src: '', alt: '', caption: '' }) },
  { type: 'gallery', label: 'Gallery', category: 'media', createDefault: () => mk('gallery', { images: [{ src: '', alt: '' }] }) },
  { type: 'embed_url', label: 'Embed URL', category: 'media', createDefault: () => mk('embed_url', { url: '', caption: '' }) },
  { type: 'button_link', label: 'Button link', category: 'action', createDefault: () => mk('button_link', { label: 'Open link', url: '' }) },
  { type: 'download', label: 'Download', category: 'action', createDefault: () => mk('download', { label: 'Download file', url: '' }) },
  { type: 'video_asset', label: 'Video asset', category: 'media', createDefault: () => mk('video_asset', { videoAssetId: '', caption: '' }) },
  { type: 'audio_asset', label: 'Audio asset', category: 'media', createDefault: () => mk('audio_asset', { audioAssetId: '', caption: '' }) },
  { type: 'podcast_episode', label: 'Podcast episode', category: 'media', createDefault: () => mk('podcast_episode', { title: 'Episode', url: '', notes: '' }) },

  // Action & workflows
  { type: 'checklist', label: 'Checklist', category: 'action', createDefault: () => mk('checklist', { title: 'Checklist', items: [''] }) },
  { type: 'steps', label: 'Steps', category: 'action', createDefault: () => mk('steps', { title: 'Steps', steps: [''] }) },
  { type: 'reflection_prompt', label: 'Reflection prompt', category: 'action', createDefault: () => mk('reflection_prompt', { prompt: 'Write your answer…' }) },
  { type: 'assignment', label: 'Assignment', category: 'action', createDefault: () => mk('assignment', { title: 'Assignment', instructions: 'Do this…', deliverable: '' }) },
  { type: 'worksheet', label: 'Worksheet', category: 'action', createDefault: () => mk('worksheet', { title: 'Worksheet', fields: [{ label: 'Field', placeholder: '' }] }) },
  { type: 'cta', label: 'CTA panel', category: 'action', createDefault: () => mk('cta', { title: 'Next action', markdown: 'Do this next.', buttonLabel: 'Continue', buttonUrl: '' }) },
  { type: 'progress_checkpoint', label: 'Progress checkpoint', category: 'action', createDefault: () => mk('progress_checkpoint', { title: 'Checkpoint', criteria: [''] }) },

  // Assessment
  { type: 'quiz_mcq', label: 'Quiz (MCQ)', category: 'assessment', createDefault: () => mk('quiz_mcq', { question: 'Question?', choices: ['A', 'B'], answerIndex: 0, explain: '' }) },
  { type: 'quiz_true_false', label: 'Quiz (True/False)', category: 'assessment', createDefault: () => mk('quiz_true_false', { question: 'Statement…', answer: true, explain: '' }) },
  { type: 'rubric', label: 'Rubric', category: 'assessment', createDefault: () => mk('rubric', { rows: [{ criterion: 'Quality', levels: ['Needs work', 'Good', 'Great'] }] }) },
  { type: 'survey', label: 'Survey', category: 'assessment', createDefault: () => mk('survey', { questions: [{ prompt: 'Question', type: 'text' }] }) },
  { type: 'form', label: 'Form', category: 'advanced', createDefault: () => mk('form', { fields: [{ key: 'field', label: 'Field', type: 'text' }] }) },

  // Data/knowledge
  { type: 'faq', label: 'FAQ', category: 'content', createDefault: () => mk('faq', { items: [{ q: 'Question?', a: 'Answer…' }] }) },
  { type: 'accordion', label: 'Accordion', category: 'layout', createDefault: () => mk('accordion', { items: [{ title: 'Section', markdown: 'Body…' }] }) },
  { type: 'table', label: 'Table', category: 'data', createDefault: () => mk('table', { headers: ['A', 'B'], rows: [['', '']] }) },
  { type: 'code', label: 'Code', category: 'content', createDefault: () => mk('code', { language: 'text', code: '' }) },
  { type: 'kpi', label: 'KPI cards', category: 'data', createDefault: () => mk('kpi', { items: [{ label: 'Metric', value: '0', hint: '' }] }) },
  { type: 'timeline', label: 'Timeline', category: 'data', createDefault: () => mk('timeline', { items: [{ title: 'Step', detail: 'What happens' }] }) },
  { type: 'flashcards', label: 'Flashcards', category: 'assessment', createDefault: () => mk('flashcards', { cards: [{ front: 'Term', back: 'Definition' }] }) },
  { type: 'glossary', label: 'Glossary', category: 'content', createDefault: () => mk('glossary', { terms: [{ term: 'Term', definition: 'Definition' }] }) },
];

export const LESSON_BLOCK_TYPES: LessonBlockType[] = LESSON_BLOCK_DEFS.map((d) => d.type);

export function defForType(type: LessonBlockType): LessonBlockDefinition | undefined {
  return LESSON_BLOCK_DEFS.find((d) => d.type === type);
}

export function createLessonBlock(type: LessonBlockType): LessonContentBlock {
  return defForType(type)?.createDefault() ?? { id: newId('blk'), type, data: {} };
}

