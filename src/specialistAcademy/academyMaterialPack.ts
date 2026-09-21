import { ACADEMY_COURSE_MODULES } from './academyWalkthroughs';
import { academyBaseUrl } from './academyTraineeEmailPipeline';

const SOP_LINKS = [
  { en: 'SOP-08 Debt triage', id: 'sop-8' },
  { en: 'SOP-09 Validation send', id: 'sop-9' },
  { en: 'SOP-10 Summons awareness', id: 'sop-10' },
  { en: 'SOP-11 Restore rounds', id: 'sop-11' },
  { en: 'SOP-13 Evidence & OCR', id: 'sop-13' },
];

const CARD_NOTE =
  'Flash cards F01–F14 + F-BUILD: open Specialist Academy → Library → cards group.';

export function buildMaterialPackBody(lang: 'en' | 'ht'): string {
  const base = academyBaseUrl();
  const lines: string[] = [];
  lines.push(lang === 'ht' ? '=== Modil prensipal ===' : '=== Core modules ===');
  for (const m of ACADEMY_COURSE_MODULES) {
    const title = lang === 'ht' ? m.titleHt : m.titleEn;
    lines.push(`• ${title}: ${base}/${m.lessonId}`);
    if (m.quizId) lines.push(`  Quiz: ${base}/quiz/${m.quizId}`);
  }
  lines.push('');
  lines.push(lang === 'ht' ? '=== SOP (klike nan akademi) ===' : '=== SOPs (in academy library) ===');
  for (const s of SOP_LINKS) {
    lines.push(`• ${s.en}: ${base}/${s.id}`);
  }
  lines.push('');
  lines.push(lang === 'ht' ? '=== Kat ===' : '=== Cards ===');
  lines.push(CARD_NOTE);
  lines.push('');
  lines.push(
    lang === 'ht'
      ? 'Tout materyèl edikasyon sèlman — pa konsèy legal, pa garanti efase oswa finansman.'
      : 'All materials are educational only — not legal advice; no guaranteed deletions or funding.',
  );
  return lines.join('\n');
}
