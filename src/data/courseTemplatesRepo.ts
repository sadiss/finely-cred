import type { Course } from '../domain/courses';
import { nowIso } from '../domain/courses';
import type { LessonBlockType } from '../domain/courses';
import type { CourseTemplate, CourseTemplateCategory, CourseTemplateId } from '../domain/courseTemplates';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { getCourse, upsertCourse } from './coursesRepo';
import { LESSON_BLOCK_TYPES } from '../courses/blockRegistry';

const KEY = 'finely.courseTemplates.v1';

type Store = { templates: CourseTemplate[] };

function seedBlueprint(title: string, desc: string, category: CourseTemplateCategory, tags: string[]) {
  return {
    id: newId('course_tpl'),
    title,
    description: desc,
    category,
    tags,
    blueprint: {
      title,
      desc,
      tags,
      modules: [
        {
          title: 'Module 1',
          lessons: [
            {
              title: 'Lesson 1',
              summary: 'High-signal lesson.',
              blocks: [{ type: 'markdown', data: { markdown: `## ${title}\n\n` } }],
            },
            {
              title: 'Lesson 2',
              summary: 'Execute the workflow.',
              blocks: [
                { type: 'callout', data: { tone: 'info', title: 'Outcome', markdown: 'What you will do after this lesson.' } },
                { type: 'checklist', data: { title: 'Checklist', items: [''] } },
              ],
            },
          ],
        },
      ],
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  } satisfies CourseTemplate;
}

function starterTemplates(): CourseTemplate[] {
  // 30+ starter presets (intentionally lightweight; admins can expand once instantiated)
  const defs: Array<{ t: string; d: string; c: CourseTemplateCategory; tags: string[] }> = [
    { t: 'Dispute Rounds Mastery', d: 'Round 1 → Round 2 → Round 3, evidence discipline, responses, cadence.', c: 'disputes', tags: ['personal', 'disputes'] },
    { t: 'Evidence Vault Discipline', d: 'How to build exhibits, organize files, and stay audit-ready.', c: 'operations', tags: ['evidence', 'workflow'] },
    { t: 'Identity Theft Recovery', d: 'Freezes, fraud alerts, FTC packet, and block workflow.', c: 'identity', tags: ['identity', 'personal'] },
    { t: 'Debt Validation Playbook', d: 'Validation letters, timelines, dispute escalation, and response handling.', c: 'debt', tags: ['debt', 'validation'] },
    { t: 'ChexSystems Cleanup', d: 'Depository reporting basics, disputes, and recovery steps.', c: 'personal_credit', tags: ['banking', 'chexsystems'] },
    { t: 'Credit Basics (No Fluff)', d: 'The minimum knowledge required to execute the portal workflows.', c: 'general', tags: ['basics', 'personal'] },
    { t: 'Business Credit Foundations', d: 'Entity basics, D-U-N-S, profiles, and vendor sequencing.', c: 'business_credit', tags: ['business', 'bureaus'] },
    { t: 'PAYDEX + Trade Lines', d: 'Payments reporting cadence and how to build strong trade depth.', c: 'business_credit', tags: ['dnb', 'paydex'] },
    { t: 'Experian Business Profile Fix', d: 'Match/merge, inaccuracies, and dispute-ready documentation.', c: 'business_credit', tags: ['experian', 'business'] },
    { t: 'Equifax Business Profile Fix', d: 'Common data errors, proof, and escalation paths.', c: 'business_credit', tags: ['equifax', 'business'] },
    { t: 'Funding Readiness Sprint', d: 'Underwriting narrative, docs, relationship cadence.', c: 'funding', tags: ['funding', 'readiness'] },
    { t: 'Lender Logic Primer', d: 'What lenders care about and how to sequence applications.', c: 'funding', tags: ['lender_logic'] },
    { t: 'Business Banking Setup', d: 'Bank-ready profile, policies, and docs checklist.', c: 'operations', tags: ['banking', 'business'] },
    { t: 'Vendor → Store Cards Ladder', d: 'Step-by-step ladder plan and tracking.', c: 'business_credit', tags: ['vendors', 'ladder'] },
    { t: 'Dispute Packet Builder', d: 'How to assemble exhibits, cover letters, and response windows.', c: 'disputes', tags: ['packets', 'mailing'] },
    { t: 'Mailing Discipline (Certified + Tracking)', d: 'Address verification, mailing rounds, and follow-up tasks.', c: 'operations', tags: ['mail', 'workflow'] },
    { t: 'Affiliate Launch Kit', d: 'Offer positioning, tracking, and compliance basics.', c: 'marketing', tags: ['affiliate'] },
    { t: 'Consultation Intake Script', d: 'Discovery questions, qualifying, and next steps.', c: 'operations', tags: ['intake', 'sales'] },
    { t: 'CRM Basics for Operators', d: 'Stages, follow-ups, and clean handoffs.', c: 'operations', tags: ['crm'] },
    { t: 'Comms Studio Operator', d: 'Email/SMS structure, sequences, and safety rules.', c: 'operations', tags: ['comms'] },
    { t: 'Personal Credit Goals + Routines', d: 'Score snapshots, utilization habits, and routines.', c: 'personal_credit', tags: ['goals', 'routines'] },
    { t: 'Utilization Control System', d: 'Reporting dates, buffers, and step-by-step tracking.', c: 'personal_credit', tags: ['utilization'] },
    { t: 'Tradelines Education (AU)', d: 'How AU tradelines work and how to evaluate fit.', c: 'personal_credit', tags: ['tradelines'] },
    { t: 'Collections Settlement Strategy', d: 'Negotiation framework and documentation discipline.', c: 'debt', tags: ['collections'] },
    { t: 'Regulatory Complaints 101', d: 'When and how to file (non-legal).', c: 'compliance', tags: ['complaints'] },
    { t: 'Document Intel Basics', d: 'Parsing, structuring, and extracting key signals.', c: 'operations', tags: ['docintel'] },
    { t: 'Admin Workflow Queue SOP', d: 'How to run daily ops and keep cases moving.', c: 'operations', tags: ['ops'] },
    { t: 'Business Profile Field Guide', d: '20+ fields that matter and how to keep them consistent.', c: 'business_credit', tags: ['profile'] },
    { t: 'Roadmap Execution System', d: 'Use the roadmap to sequence work without overwhelm.', c: 'general', tags: ['roadmap'] },
    { t: 'Dispute Response Handling', d: 'How to process bureau responses and decide next moves.', c: 'disputes', tags: ['responses'] },
    { t: 'Credit Report Reading Lab', d: 'Learn to read reports and identify candidates.', c: 'personal_credit', tags: ['reports'] },
    { t: 'Business Credit Bureau Map', d: 'Which bureaus matter for which goals and why.', c: 'business_credit', tags: ['bureaus'] },
  ];
  return defs.map((x) => seedBlueprint(x.t, x.d, x.c, x.tags));
}

function loadStore(): Store {
  return loadJson<Store>(
    KEY,
    {
      templates: starterTemplates(),
    },
    1,
  );
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listCourseTemplates(): CourseTemplate[] {
  return loadStore().templates.slice().sort((a, b) => a.title.localeCompare(b.title));
}

export function getCourseTemplate(id: CourseTemplateId): CourseTemplate | null {
  return loadStore().templates.find((t) => t.id === id) ?? null;
}

export function upsertCourseTemplate(tpl: CourseTemplate): CourseTemplate {
  const store = loadStore();
  const idx = store.templates.findIndex((t) => t.id === tpl.id);
  const next: CourseTemplate = { ...tpl, updatedAt: nowIso() };
  if (idx >= 0) store.templates[idx] = next;
  else store.templates.push(next);
  saveStore(store);
  return next;
}

export function deleteCourseTemplate(id: CourseTemplateId) {
  const store = loadStore();
  store.templates = store.templates.filter((t) => t.id !== id);
  saveStore(store);
}

export function createCourseFromTemplate(args: {
  templateId: CourseTemplateId;
  titleOverride?: string;
  tagOverrides?: string[];
}): Course {
  const tpl = getCourseTemplate(args.templateId);
  if (!tpl) throw new Error('Template not found.');

  const now = nowIso();
  const course: Course = {
    id: newId('course'),
    title: (args.titleOverride ?? tpl.blueprint.title).trim() || 'New course',
    desc: (tpl.blueprint.desc || '').trim(),
    tags: args.tagOverrides ?? tpl.blueprint.tags ?? tpl.tags ?? [],
    published: false,
    modules: (tpl.blueprint.modules ?? []).map((m) => ({
      id: newId('mod'),
      title: String(m.title || 'Module'),
      lessons: (m.lessons ?? []).map((l) => ({
        id: newId('lesson'),
        title: String(l.title || 'Lesson'),
        summary: l.summary ? String(l.summary) : undefined,
        content: (l.blocks && Array.isArray(l.blocks) ? l.blocks : [{ type: 'markdown', data: { markdown: `## ${String(l.title || 'Lesson')}\n\n` } }])
          .filter(Boolean)
          .slice(0, 120)
          .map((b: any) => {
            const rawType = String(b?.type || 'markdown').trim() as LessonBlockType;
            const type: LessonBlockType = (LESSON_BLOCK_TYPES as any).includes(rawType) ? rawType : 'markdown';
            const data = (b?.data && typeof b.data === 'object') ? b.data : {};
            return { id: newId('blk'), type, data };
          }),
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };

  return upsertCourse(course);
}

export function createCourseTemplateFromCourse(args: {
  courseId: string;
  category?: CourseTemplateCategory;
  titleOverride?: string;
  descriptionOverride?: string;
  tagOverrides?: string[];
}): CourseTemplate {
  const course = getCourse(args.courseId as any);
  if (!course) throw new Error('Course not found.');
  const now = nowIso();
  const title = (args.titleOverride ?? course.title).trim() || 'Course template';
  const description = (args.descriptionOverride ?? course.desc ?? '').trim();
  const tags = (args.tagOverrides ?? course.tags ?? []).slice(0, 24);

  const tpl: CourseTemplate = {
    id: newId('course_tpl'),
    title,
    description,
    category: args.category ?? 'general',
    tags,
    blueprint: {
      title,
      desc: description,
      tags,
      modules: (course.modules ?? []).slice(0, 60).map((m) => ({
        title: String(m.title || 'Module'),
        lessons: (m.lessons ?? []).slice(0, 60).map((l) => ({
          title: String(l.title || 'Lesson'),
          summary: l.summary ? String(l.summary) : undefined,
          blocks: Array.isArray((l as any).content) ? (l as any).content : [],
        })),
      })),
    },
    createdAt: now,
    updatedAt: now,
  };

  return upsertCourseTemplate(tpl);
}

