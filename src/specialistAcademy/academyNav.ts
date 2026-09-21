import { ACADEMY_ITEMS, type AcademyItem } from './academyCatalog';

/** Recommended read order for specialists (consumer-power first). */
export const ACADEMY_LEARNING_PATH_IDS: string[] = [
  'f-consumer-power',
  'f-visual-walkthrough',
  'f-doctrine',
  'f-debt-validation',
  'f-summons',
  'f-debt-legal',
  'f-rounds',
  'f-evidence-ocr',
  'f-prior-company',
  'f-build',
  'h-metro2',
  'h-fcra',
  'h-fdcpa',
  'h-cfpb',
  'workflow',
];

export function academyLessonNeighbors(itemId: string | null | undefined): {
  prev: AcademyItem | null;
  next: AcademyItem | null;
} {
  if (!itemId) return { prev: null, next: null };
  const path = ACADEMY_LEARNING_PATH_IDS
    .map((id) => ACADEMY_ITEMS.find((x) => x.id === id))
    .filter(Boolean) as AcademyItem[];
  const idx = path.findIndex((x) => x.id === itemId);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? path[idx - 1] : null,
    next: idx < path.length - 1 ? path[idx + 1] : null,
  };
}
