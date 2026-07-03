import type { Course, CourseLesson } from '../../domain/courses';
import { upsertCourse } from '../../data/coursesRepo';
import { upsertResourceVideo } from '../../data/resourceVideosRepo';
import { newId } from '../../utils/ids';
import type { ContentStudioIntake } from '../studioCommandOs/types';
import type { VideoCommandRequest } from '../studioCommandOs/types';
import type { CourseLessonVideoStage } from '../../data/courseVideoPipelineRepo';

export function lessonMarkdownFromBlocks(lesson: CourseLesson): string {
  const md = (lesson.content ?? [])
    .filter((b) => b.type === 'markdown')
    .map((b) => String(b.data?.markdown ?? ''))
    .join('\n\n')
    .trim();
  return md || lesson.summary || '';
}

export function lessonHasAttachedVideo(lesson: CourseLesson): boolean {
  return (lesson.content ?? []).some((b) => b.type === 'video_asset' && Boolean(b.data?.videoAssetId));
}

export function countLessonScenesForLesson(course: Course, lessonId: string): number {
  return (course.videoScenes ?? []).filter((s) => s.lessonId === lessonId).length;
}

export function inferLessonVideoStage(args: {
  lesson: CourseLesson;
  sceneCount: number;
  pipelineStage?: CourseLessonVideoStage;
}): CourseLessonVideoStage {
  if (args.pipelineStage === 'published') return 'published';
  if (lessonHasAttachedVideo(args.lesson)) return args.pipelineStage === 'rendered' ? 'attached' : 'attached';
  if (args.pipelineStage === 'rendered') return 'rendered';
  if (args.pipelineStage === 'render_queued') return 'render_queued';
  if (args.sceneCount > 0) return 'storyboard';
  const md = lessonMarkdownFromBlocks(args.lesson);
  if (md.includes('## Video storyboard') || md.includes('Scene ')) return 'storyboard';
  if (md.length > 120) return 'script';
  return 'draft';
}

export function contentStudioUrlForCourseLesson(
  courseId: string,
  lessonId: string,
  room: 'course_videos' | 'video' = 'course_videos',
): string {
  const params = new URLSearchParams({ room, courseId, lessonId });
  return `/admin/content-studio?${params.toString()}`;
}

export function intakeFromCourseLesson(args: {
  course: Course;
  lesson: CourseLesson;
  lessonMarkdown?: string;
}): ContentStudioIntake {
  const md = args.lessonMarkdown ?? lessonMarkdownFromBlocks(args.lesson);
  return {
    prompt:
      `Course lesson video for "${args.course.title}" — lesson "${args.lesson.title}". ` +
      `Create a polished 16:9 educational video with narration, on-screen captions, and compliance-safe credit education. ` +
      `Lesson content:\n${md.slice(0, 4000)}`,
    sourceSurface: 'course_builder',
    requestedAssetType: 'course_lesson_video',
    audience: 'Finely Cred learners and partners completing credit education',
    offer: `${args.course.title} — ${args.lesson.title}`,
    publishTarget: 'course_lesson',
    durationSec: Math.min(180, Math.max(45, (args.lesson.estimatedMinutes ?? 8) * 60)),
    aspect: '16:9',
    brandPreset: 'credit_education',
    complianceStrict: true,
    ownerStaffId: 'content_director',
  };
}

export function videoCommandRequestFromCourseLesson(args: {
  course: Course;
  lesson: CourseLesson;
  lessonMarkdown?: string;
}): Partial<VideoCommandRequest> {
  const md = args.lessonMarkdown ?? lessonMarkdownFromBlocks(args.lesson);
  const intake = intakeFromCourseLesson(args);
  return {
    prompt: intake.prompt,
    durationSec: intake.durationSec ?? 90,
    aspect: '16:9',
    intent: 'business_credit_education',
    voiceStyle: 'friendly_educator',
    visualStyle: 'cinematic',
    audience: intake.audience,
    offer: intake.offer,
    includeCaptions: true,
    complianceStrict: true,
  };
}

export function attachResourceVideoToLesson(args: {
  course: Course;
  lessonId: string;
  resourceVideoId: string;
  caption?: string;
}): Course {
  const next: Course = {
    ...args.course,
    modules: (args.course.modules ?? []).map((module) => ({
      ...module,
      lessons: (module.lessons ?? []).map((lesson) => {
        if (lesson.id !== args.lessonId) return lesson;
        const existing = (lesson.content ?? []).filter((b) => b.type !== 'video_asset');
        return {
          ...lesson,
          content: [
            {
              id: newId('blk'),
              type: 'video_asset' as const,
              data: {
                videoAssetId: args.resourceVideoId,
                caption: args.caption ?? `${lesson.title} (lesson video)`,
              },
            },
            ...existing,
          ],
        };
      }),
    })),
  };
  upsertCourse(next);
  return next;
}

export function attachBlobToCourseLesson(args: {
  course: Course;
  lessonId: string;
  blobRef: string;
  title: string;
  summary?: string;
}): Course {
  const resource = upsertResourceVideo({
    title: args.title,
    desc: args.summary || 'Generated lesson video from Content Studio.',
    blobRef: args.blobRef,
    mimeType: 'video/webm',
    tags: ['content-studio', 'course', args.course.id],
    isPublic: false,
  });
  return attachResourceVideoToLesson({
    course: args.course,
    lessonId: args.lessonId,
    resourceVideoId: resource.id,
    caption: args.title,
  });
}
