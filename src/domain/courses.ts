import { newId } from '../utils/ids';

export type CourseId = string;
export type CourseModuleId = string;
export type CourseLessonId = string;

export type LessonBlockType =
  | 'markdown'
  | 'heading'
  | 'subheading'
  | 'rich_text'
  | 'callout'
  | 'quote'
  | 'divider'
  | 'image'
  | 'gallery'
  | 'embed_url'
  | 'button_link'
  | 'download'
  | 'checklist'
  | 'steps'
  | 'faq'
  | 'accordion'
  | 'table'
  | 'code'
  | 'quiz_mcq'
  | 'quiz_true_false'
  | 'reflection_prompt'
  | 'assignment'
  | 'rubric'
  | 'survey'
  | 'form'
  | 'kpi'
  | 'timeline'
  | 'progress_checkpoint'
  | 'video_asset'
  | 'audio_asset'
  | 'podcast_episode'
  | 'worksheet'
  | 'flashcards'
  | 'glossary'
  | 'cta';

export type LessonContentBlock = {
  id: string;
  type: LessonBlockType;
  /**
   * Block payload. Different blocks store different fields.
   * This flexible structure allows 30+ block types without bloating every lesson schema.
   */
  data: Record<string, any>;
};

export type CourseLesson = {
  id: CourseLessonId;
  title: string;
  summary?: string;
  content: LessonContentBlock[];
  /** Optional prerequisites (lesson ids). */
  prereqLessonIds?: CourseLessonId[];
  /** Optional drip schedule: unlock N days after enrollment. */
  dripDays?: number;
  /** Optional estimate for planning. */
  estimatedMinutes?: number;
};

export type CourseModule = {
  id: CourseModuleId;
  title: string;
  lessons: CourseLesson[];
  /** Optional prerequisites (module ids). */
  prereqModuleIds?: CourseModuleId[];
  /** Optional drip schedule: unlock N days after enrollment. */
  dripDays?: number;
};

export type Course = {
  id: CourseId;
  title: string;
  desc: string;
  tags?: string[];
  published: boolean;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
};

export type LessonProgress = {
  lessonId: CourseLessonId;
  completedAt?: string;
};

export type CourseProgress = {
  id: string;
  partnerId: string;
  courseId: CourseId;
  enrolledAt: string;
  completedAt?: string;
  certificateId?: string;
  lessons: LessonProgress[];
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function newCourse(args?: Partial<Pick<Course, 'title' | 'desc' | 'tags'>>): Course {
  const now = nowIso();
  return {
    id: newId('course'),
    title: args?.title ?? 'New course',
    desc: args?.desc ?? 'Describe the outcome, who it’s for, and what they’ll be able to do after completing it.',
    tags: args?.tags ?? [],
    published: false,
    modules: [
      {
        id: newId('mod'),
        title: 'Module 1',
        lessons: [
          {
            id: newId('lesson'),
            title: 'Lesson 1',
            summary: 'A fast, high-signal lesson.',
            content: [
              {
                id: newId('blk'),
                type: 'markdown',
                data: { markdown: '## Lesson\n\nWrite your lesson content here.\n' },
              },
            ],
          },
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

