import React, { useMemo } from 'react';
import { Headphones } from 'lucide-react';
import type { Course, CourseLesson } from '../../domain/courses';
import { buildDefaultNarration, getGuideNarration } from '../../resources/guideNarration';
import { lessonToNarration } from '../../lib/courseVoiceNarrate';
import { resolveCourseLessonVoiceContentId } from '../../lib/courseVoiceCatalog';
import { GuideAudioPlayer } from '../resources/GuideAudioPlayer';
import { FINELY_OS_ENTITY_SUBLABEL, finelyOsGlassShell } from '../../features/os/finelyOsLightUi';

export function CourseLessonAudioPlayer({ course, lesson }: { course: Course; lesson: CourseLesson }) {
  const contentId = resolveCourseLessonVoiceContentId(course, lesson);

  const narration = useMemo(() => {
    const custom = getGuideNarration(contentId, `${course.title} — ${lesson.title}`, []);
    if (custom.segments.length > 3) return custom;
    return lessonToNarration(course, lesson);
  }, [contentId, course, lesson]);

  const fallbackNarration = useMemo(
    () =>
      buildDefaultNarration(contentId, `${course.title} — ${lesson.title}`, [
        { heading: lesson.title, bullets: [lesson.summary ?? 'Listen to this lesson.'] },
      ]),
    [contentId, course.title, lesson.summary, lesson.title],
  );

  return (
    <div className={`${finelyOsGlassShell('inner', 'amber')} p-4 space-y-3`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
        <Headphones size={14} className="text-amber-300" /> Lesson audio
      </div>
      <GuideAudioPlayer
        narration={narration.segments.length > 1 ? narration : fallbackNarration}
        presetOnly
        tenantId="finely_cred"
        contentType="course_lesson"
      />
    </div>
  );
}
