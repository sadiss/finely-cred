import {
  TRAINING_ACADEMY_VERSION,
  getAllLessonIdsForPlan,
  getTrainingLesson,
  getTrainingPlan,
  partnerLaneToTrainingRole,
  type TrainingRoleId,
} from '../domain/trainingAcademy';
import { issueCertificate } from './certificatesRepo';
import { loadJson, saveJson } from './localJsonStore';
import type { PartnerLane } from '../domain/partners';

const KEY = 'finely.trainingAcademy.v1';

export type TrainingEnrollment = {
  partnerId: string;
  primaryRole: TrainingRoleId;
  enrolledAt: string;
  academyVersion: number;
  completedLessonIds: string[];
  passedQuizLessonIds: string[];
  certificationIds: string[];
  coreCompletedAt?: string;
  updatedAt: string;
};

type Store = { enrollments: TrainingEnrollment[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { enrollments: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getOrCreateEnrollment(args: {
  partnerId: string;
  lane?: PartnerLane;
  isAdmin?: boolean;
}): TrainingEnrollment {
  const store = loadStore();
  let row = store.enrollments.find((e) => e.partnerId === args.partnerId);
  const primaryRole = partnerLaneToTrainingRole(args.lane);
  const now = new Date().toISOString();
  if (!row) {
    row = {
      partnerId: args.partnerId,
      primaryRole,
      enrolledAt: now,
      academyVersion: TRAINING_ACADEMY_VERSION,
      completedLessonIds: [],
      passedQuizLessonIds: [],
      certificationIds: [],
      updatedAt: now,
    };
    store.enrollments.push(row);
    saveStore(store);
  }
  return row;
}

export function markTrainingLessonComplete(args: {
  partnerId: string;
  lessonId: string;
  lane?: PartnerLane;
  isAdmin?: boolean;
  recipientName?: string;
}): TrainingEnrollment {
  const store = loadStore();
  const row = getOrCreateEnrollment(args);
  const idx = store.enrollments.findIndex((e) => e.partnerId === args.partnerId);
  const now = new Date().toISOString();
  const completed = new Set(row.completedLessonIds);
  completed.add(args.lessonId);
  const next: TrainingEnrollment = { ...row, completedLessonIds: [...completed], updatedAt: now };

  const hit = getTrainingLesson(args.lessonId);
  if (hit?.module.certification) {
    const certId = hit.module.certification.id;
    const modLessons = hit.module.lessons.map((l) => l.id);
    const allDone = modLessons.every((id) => completed.has(id));
    if (allDone && !next.certificationIds.includes(certId)) {
      next.certificationIds = [...next.certificationIds, certId];
      issueCertificate({
        partnerId: args.partnerId,
        courseId: certId,
        courseTitle: hit.module.certification.title,
        recipientName: args.recipientName,
        issuedAt: now,
      });
    }
  }

  const plan = getTrainingPlan({ lane: args.lane, isAdmin: args.isAdmin });
  const coreIds = plan.coreModules.flatMap((m) => m.lessons.map((l) => l.id));
  if (coreIds.every((id) => completed.has(id))) {
    next.coreCompletedAt = next.coreCompletedAt ?? now;
  }

  store.enrollments[idx] = next;
  saveStore(store);
  return next;
}

export function passTrainingQuiz(args: {
  partnerId: string;
  lessonId: string;
  selectedIndex: number;
  lane?: PartnerLane;
  isAdmin?: boolean;
  recipientName?: string;
}): { ok: boolean; message: string; enrollment?: TrainingEnrollment } {
  const hit = getTrainingLesson(args.lessonId);
  if (!hit?.lesson.quiz?.length) {
    markTrainingLessonComplete(args);
    return { ok: true, message: 'Lesson marked complete.' };
  }
  const q = hit.lesson.quiz[0]!;
  if (args.selectedIndex !== q.correctIndex) {
    return { ok: false, message: 'Not quite — review the material and try again.' };
  }
  const store = loadStore();
  const row = getOrCreateEnrollment(args);
  const idx = store.enrollments.findIndex((e) => e.partnerId === args.partnerId);
  const passed = new Set(row.passedQuizLessonIds);
  passed.add(args.lessonId);
  store.enrollments[idx] = { ...row, passedQuizLessonIds: [...passed], updatedAt: new Date().toISOString() };
  saveStore(store);
  const enrollment = markTrainingLessonComplete(args);
  return { ok: true, message: 'Quiz passed — lesson complete.', enrollment };
}

export function getTrainingProgress(args: {
  partnerId: string;
  lane?: PartnerLane;
  isAdmin?: boolean;
  isAgencyTenant?: boolean;
}) {
  const plan = getTrainingPlan({ lane: args.lane, isAdmin: args.isAdmin, isAgencyTenant: args.isAgencyTenant });
  const enrollment = getOrCreateEnrollment(args);
  const allIds = getAllLessonIdsForPlan(plan);
  const coreIds = plan.coreModules.flatMap((m) => m.lessons.map((l) => l.id));
  const roleIds = plan.roleModules.flatMap((m) => m.lessons.map((l) => l.id));
  const done = new Set(enrollment.completedLessonIds);
  const pct = (ids: string[]) => (ids.length ? Math.round((ids.filter((id) => done.has(id)).length / ids.length) * 100) : 100);
  return {
    enrollment,
    plan,
    overallPct: pct(allIds),
    corePct: pct(coreIds),
    rolePct: pct(roleIds),
    coreComplete: Boolean(enrollment.coreCompletedAt),
    certifications: enrollment.certificationIds,
  };
}

export function isCoreTrainingComplete(partnerId: string): boolean {
  const row = loadStore().enrollments.find((e) => e.partnerId === partnerId);
  return Boolean(row?.coreCompletedAt);
}
