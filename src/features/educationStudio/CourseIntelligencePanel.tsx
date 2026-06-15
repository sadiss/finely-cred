import React, { useMemo } from 'react';
import { Brain, Sparkles, Wrench, Zap } from 'lucide-react';
import type { Course } from '../../domain/courses';
import {
  analyzeCourseIntelligence,
  autoFixCourseBlocks,
  suggestCourseTags,
} from './courseIntelligenceEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

type Props = {
  course: Course;
  onApplyCourse: (next: Course) => void;
  onRunBulkNarration?: () => void;
  bulkBusy?: boolean;
};

export function CourseIntelligencePanel({ course, onApplyCourse, onRunBulkNarration, bulkBusy }: Props) {
  const report = useMemo(() => analyzeCourseIntelligence(course), [course]);

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-violet-300">
            <Brain size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Course intelligence engine</span>
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1 max-w-2xl`}>
            ML-style publish scoring, quiz normalization, block auto-fix, and tag suggestions — automation to the 200th power.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{report.score}%</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Publish readiness</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className={finelyOsStatusChip('ok')}>{report.lessonCount} lessons</span>
        <span className={finelyOsStatusChip('ok')}>{report.quizCount} quizzes</span>
        {report.blocksNeedingRender ? (
          <span className={finelyOsStatusChip('warn')}>{report.blocksNeedingRender} blocks need fix</span>
        ) : (
          <span className={finelyOsStatusChip('ok')}>Portal-ready blocks</span>
        )}
      </div>

      {report.issues.length ? (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {report.issues.slice(0, 8).map((i, idx) => (
            <div key={idx} className={`${FINELY_OS_ENTITY_BODY} text-xs ${i.severity === 'error' ? 'text-rose-200' : 'text-amber-100/90'}`}>
              {i.severity === 'error' ? '✗' : '○'} {i.message}
            </div>
          ))}
        </div>
      ) : null}

      {report.suggestions.length ? (
        <ul className="space-y-1">
          {report.suggestions.map((s) => (
            <li key={s} className={`${FINELY_OS_ENTITY_BODY} text-xs flex gap-2`}>
              <Sparkles size={12} className="text-violet-300 shrink-0 mt-0.5" />
              {s}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApplyCourse(autoFixCourseBlocks(course))}
          className={FINELY_OS_SUCCESS_BTN}
        >
          <Wrench size={14} /> Auto-fix all blocks & quizzes
        </button>
        <button
          type="button"
          onClick={() => onApplyCourse({ ...course, tags: suggestCourseTags(course) })}
          className={FINELY_OS_PRIMARY_BTN}
        >
          <Zap size={14} /> Smart tags
        </button>
        {onRunBulkNarration ? (
          <button type="button" disabled={bulkBusy} onClick={onRunBulkNarration} className={FINELY_OS_PRIMARY_BTN}>
            {bulkBusy ? 'Narrating…' : 'Bulk voice narration'}
          </button>
        ) : null}
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-3 ${FINELY_OS_ENTITY_BODY} text-xs`}>
        <div className={FINELY_OS_ENTITY_VALUE}>Preview unpublished courses</div>
        Open <span className="font-mono">/portal/courses/{course.id}?preview=admin</span> while logged in as admin — no publish required.
      </div>
    </div>
  );
}
