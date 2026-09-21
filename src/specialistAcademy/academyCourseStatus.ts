import { getQuizPasses } from '../components/training/AcademyQuizPanel';
import { getAcademyProgress, academyProgressPercent } from './academyProgress';
import { ACADEMY_ITEMS } from './academyCatalog';
import { ACADEMY_COURSE_MODULES } from './academyWalkthroughs';

export function getAcademyCourseStatus() {
  const progress = getAcademyProgress();
  const passes = getQuizPasses();
  const coreLessons = ACADEMY_COURSE_MODULES.map((m) => m.lessonId);
  const coreLessonsDone = coreLessons.filter((id) => progress.has(id)).length;
  const quizIds = ACADEMY_COURSE_MODULES.map((m) => m.quizId).filter(Boolean) as string[];
  const quizzesPassed = quizIds.filter((id) => passes[id]?.passed).length;
  const percent = academyProgressPercent(ACADEMY_ITEMS.length, progress);
  const complete = coreLessons.every((id) => progress.has(id)) && quizIds.every((id) => passes[id]?.passed);
  return { percent, coreLessonsDone, coreLessonsTotal: coreLessons.length, quizzesPassed, quizzesTotal: quizIds.length, complete };
}
