/**
 * Course builder intelligence — auto-fix, bulk automation, publish scoring.
 */

import type { Course, CourseLesson, LessonContentBlock } from '../../domain/courses';

export type CourseIntelligenceReport = {
  score: number;
  issues: Array<{ severity: 'error' | 'warn' | 'info'; message: string; lessonId?: string }>;
  suggestions: string[];
  lessonCount: number;
  quizCount: number;
  blocksNeedingRender: number;
};

const PORTAL_RENDER_TYPES = new Set([
  'markdown',
  'callout',
  'checklist',
  'steps',
  'image',
  'embed',
  'link',
  'quiz_mcq',
  'quiz_true_false',
  'divider',
  'quote',
  'video_asset',
  'audio_asset',
]);

function normalizeQuizBlock(block: LessonContentBlock): LessonContentBlock {
  if (block.type !== 'quiz_mcq') return block;
  const d = block.data ?? {};
  const answerIndex =
    typeof d.answerIndex === 'number'
      ? d.answerIndex
      : typeof d.correctIndex === 'number'
        ? d.correctIndex
        : 0;
  return {
    ...block,
    data: {
      ...d,
      answerIndex,
      correctIndex: answerIndex,
      explain: d.explain ?? d.explanation ?? '',
    },
  };
}

export function analyzeCourseIntelligence(course: Course): CourseIntelligenceReport {
  const issues: CourseIntelligenceReport['issues'] = [];
  const suggestions: string[] = [];
  let lessonCount = 0;
  let quizCount = 0;
  let blocksNeedingRender = 0;

  if (!course.title?.trim()) issues.push({ severity: 'error', message: 'Course title is empty.' });
  if (!course.desc?.trim()) issues.push({ severity: 'warn', message: 'Add a course description for portal catalog.' });
  if (!course.modules?.length) issues.push({ severity: 'error', message: 'No modules — add curriculum.' });

  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      lessonCount += 1;
      const blocks = lesson.content ?? [];
      if (!blocks.length) {
        issues.push({ severity: 'warn', message: `Lesson "${lesson.title}" has no content blocks.`, lessonId: lesson.id });
      }
      for (const b of blocks) {
        if (b.type === 'quiz_mcq' || b.type === 'quiz_true_false') quizCount += 1;
        if (!PORTAL_RENDER_TYPES.has(b.type)) blocksNeedingRender += 1;
        if (b.type === 'quiz_mcq') {
          const d = b.data ?? {};
          if (typeof d.answerIndex !== 'number' && typeof d.correctIndex !== 'number') {
            issues.push({
              severity: 'error',
              message: `Quiz missing answer index in "${lesson.title}".`,
              lessonId: lesson.id,
            });
          }
        }
      }
    }
  }

  if (blocksNeedingRender > 0) {
    suggestions.push(`${blocksNeedingRender} block(s) use advanced types — run Auto-fix to convert to markdown/callout where possible.`);
  }
  if (!course.published && lessonCount >= 3) {
    suggestions.push('Ready to publish — toggle Published after review.');
  }
  if (quizCount === 0 && lessonCount >= 4) {
    suggestions.push('Add quizzes for engagement — use AI Generate quiz on lessons.');
  }
  if (!course.tags?.length) {
    suggestions.push('Add tags (disputes, affiliate, business) so Training Academy and hubs surface this course.');
  }

  let score = 100;
  for (const i of issues) {
    if (i.severity === 'error') score -= 15;
    if (i.severity === 'warn') score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  return { score, issues, suggestions, lessonCount, quizCount, blocksNeedingRender };
}

export function autoFixCourseBlocks(course: Course): Course {
  return {
    ...course,
    modules: (course.modules ?? []).map((mod) => ({
      ...mod,
      lessons: (mod.lessons ?? []).map((lesson) => autoFixLesson(lesson)),
    })),
  };
}

function autoFixLesson(lesson: CourseLesson): CourseLesson {
  const content = (lesson.content ?? []).map((b) => {
    let next = normalizeQuizBlock(b);
    if (!PORTAL_RENDER_TYPES.has(next.type)) {
      const preview = JSON.stringify(next.data ?? {}, null, 2).slice(0, 800);
      next = {
        id: next.id,
        type: 'markdown',
        data: { markdown: `### ${next.type.replace(/_/g, ' ')}\n\n\`\`\`json\n${preview}\n\`\`\`` },
      };
    }
    return next;
  });
  return { ...lesson, content };
}

export function suggestCourseTags(course: Course): string[] {
  const text = `${course.title} ${course.desc} ${(course.modules ?? []).map((m) => m.title).join(' ')}`.toLowerCase();
  const tags = new Set<string>(course.tags ?? []);
  if (/dispute|fcra|bureau|letter/.test(text)) tags.add('disputes');
  if (/affiliate|referral|commission/.test(text)) tags.add('affiliate');
  if (/business|vendor|entity|d-u-n-s/.test(text)) tags.add('business');
  if (/debt|validation|fdcpa/.test(text)) tags.add('debt');
  if (/fund|loan|stack/.test(text)) tags.add('funding');
  if (/restore|personal|credit score/.test(text)) tags.add('personal');
  return [...tags];
}
