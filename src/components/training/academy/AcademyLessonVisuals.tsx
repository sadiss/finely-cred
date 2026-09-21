import React from 'react';
import { getWalkthroughForLesson } from '../../../specialistAcademy/academyWalkthroughs';
import { AcademyWalkthroughGallery } from './AcademyWalkthroughGallery';

export function AcademyLessonVisuals({
  lessonId,
  lang,
  reduceMotion,
}: {
  lessonId?: string;
  lang: 'en' | 'ht';
  reduceMotion?: boolean;
}) {
  const steps = getWalkthroughForLesson(lessonId);
  if (!steps.length) return null;
  const title =
    lessonId === 'f-visual-walkthrough'
      ? lang === 'ht'
        ? 'Restore → mail (demo)'
        : 'Restore → mail (demo)'
      : undefined;
  return <AcademyWalkthroughGallery steps={steps} lang={lang} title={title} reduceMotion={reduceMotion} />;
}
