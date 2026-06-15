import React, { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Course } from '../../domain/courses';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from '../os/finelyOsLightUi';

export function CoursePublishChecklist({ course }: { course: Course }) {
  const checks = useMemo(() => {
    const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    const hasBlocks = course.modules.some((m) => m.lessons.some((l) => (l.content?.length ?? 0) > 0));
    const hasQuiz = course.modules.some((m) => m.lessons.some((l) => l.content?.some((b) => b.type.startsWith('quiz_'))));
    return [
      { label: 'Course title set', ok: Boolean(course.title?.trim() && course.title !== 'Untitled course') },
      { label: 'Description written', ok: Boolean(course.desc?.trim()) },
      { label: 'At least one module', ok: course.modules.length > 0 },
      { label: 'At least one lesson', ok: lessonCount > 0 },
      { label: 'Lesson content blocks', ok: hasBlocks },
      { label: 'Assessment included', ok: hasQuiz },
    ];
  }, [course]);

  const ready = checks.every((c) => c.ok);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className={FINELY_OS_ENTITY_VALUE}>Publish checklist</div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? 'text-emerald-300' : 'text-amber-300'}`}>
          {ready ? 'Ready' : 'Incomplete'}
        </span>
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-2 ${FINELY_OS_ENTITY_BODY}`}>
            {c.ok ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-white/35 shrink-0" />}
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>Publish when all checks pass for a professional learner experience.</p>
    </div>
  );
}
