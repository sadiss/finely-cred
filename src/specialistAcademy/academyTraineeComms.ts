import type { CommsTemplate } from '../domain/comms';
import { createCommsTemplate, getCommsTemplate, upsertCommsTemplate } from '../data/commsRepo';
import { renderTextTemplate } from '../utils/textTemplate';

export const ACADEMY_TRAINEE_TEMPLATE_PREFIX = 'academy_trainee_';

const FOOTER_EN =
  '\n\n— Finely Cred Specialist Academy\nEducational only. Not legal advice. No guaranteed deletions, scores, or funding approvals.';
const FOOTER_HT =
  '\n\n— Finely Cred Akademi Espesyalis\nEdikasyon sèlman. Pa konsèy legal. Pa garanti efase, nòt, oswa apwobasyon finansman.';

function tpl(
  id: string,
  name: string,
  subject: string,
  body: string,
  tags: string[],
): Omit<CommsTemplate, 'createdAt' | 'updatedAt'> {
  return {
    id,
    name,
    channel: 'email',
    enabled: true,
    subjectTemplate: subject,
    bodyTemplate: body,
    tags: ['academy-trainee', ...tags],
  };
}

const BUILTIN: Omit<CommsTemplate, 'createdAt' | 'updatedAt'>[] = [
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}welcome`,
    'Academy — Welcome / enrolled',
    'Welcome to Finely Cred Specialist Academy',
    `Hi {{trainee.name}},\n\nYou are enrolled in the Specialist Academy — consumer-power restore training with interactive walkthroughs and quizzes.\n\nStart here: {{academy.url}}\n\nLanguage: {{trainee.lang}}\n${FOOTER_EN}`,
    ['welcome'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}module_started`,
    'Academy — Module started',
    'Module started: {{module.title}}',
    `Hi {{trainee.name}},\n\nYou opened module **{{module.title}}** in Specialist Academy.\n\nContinue: {{academy.lessonUrl}}\n${FOOTER_EN}`,
    ['module'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}module_completed`,
    'Academy — Module completed',
    'Module complete: {{module.title}}',
    `Hi {{trainee.name}},\n\nNice work — you marked **{{module.title}}** complete. Course progress: {{progress.percent}}%.\n\nNext: {{academy.nextUrl}}\n${FOOTER_EN}`,
    ['module'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}quiz_passed`,
    'Academy — Quiz passed',
    'Quiz passed: {{quiz.title}} ({{quiz.score}}%)',
    `Hi {{trainee.name}},\n\nYou passed **{{quiz.title}}** with {{quiz.score}}% (pass mark {{quiz.passPercent}}%).\n\nReview: {{academy.quizUrl}}\n${FOOTER_EN}`,
    ['quiz'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}quiz_retry`,
    'Academy — Quiz retry',
    'Quiz retry suggested: {{quiz.title}} ({{quiz.score}}%)',
    `Hi {{trainee.name}},\n\nYour score on **{{quiz.title}}** was {{quiz.score}}%. Pass mark is {{quiz.passPercent}}% — review the lesson and retake when ready.\n\nStudy: {{academy.lessonUrl}}\n${FOOTER_EN}`,
    ['quiz'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}weekly_digest`,
    'Academy — Weekly digest',
    'Your Specialist Academy week in review',
    `Hi {{trainee.name}},\n\nProgress: {{progress.percent}}%\nLessons completed this week: {{progress.weekCompleted}}\nQuizzes passed: {{progress.quizzesPassed}}\n\nOpen academy: {{academy.url}}\n${FOOTER_EN}`,
    ['digest'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}material_pack`,
    'Academy — Trainee material pack',
    'Your Finely Specialist material pack',
    `Hi {{trainee.name}},\n\nYour coach shared the **Specialist Material Pack** — links to academy modules, SOPs, and reference cards.\n\n{{materialPack.body}}\n\nOpen academy: {{academy.url}}\n${FOOTER_EN}`,
    ['material', 'pack'],
  ),
  tpl(
    `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}course_complete`,
    'Academy — Course complete',
    'Specialist Academy complete — next steps',
    `Hi {{trainee.name}},\n\nYou completed the core Specialist Academy path. Next: Haitian desk shadowing and live scrubbed files with your coach.\n\nOpen academy: {{academy.url}}\n${FOOTER_EN}`,
    ['complete'],
  ),
];

export function ensureAcademyTraineeTemplates(): void {
  for (const b of BUILTIN) {
    const existing = getCommsTemplate(b.id);
    if (!existing) {
      createCommsTemplate(b);
    } else if (!existing.tags?.includes('academy-trainee')) {
      upsertCommsTemplate({ ...existing, tags: [...(existing.tags ?? []), 'academy-trainee'] });
    }
  }
}

export function renderAcademyTraineeEmail(
  templateId: string,
  ctx: Record<string, unknown>,
): { subject: string; body: string } | null {
  const t = getCommsTemplate(templateId);
  if (!t) return null;
  const subject = t.subjectTemplate ? renderTextTemplate(t.subjectTemplate, ctx) : t.name;
  const body = renderTextTemplate(t.bodyTemplate, ctx);
  return { subject, body };
}
