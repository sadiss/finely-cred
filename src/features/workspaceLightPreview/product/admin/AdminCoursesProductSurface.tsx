import React from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { AdminCoursesWorkspace } from '../../../../pages/admin/AdminCoursesPage';
import { AdminCourseEditorWorkspace } from '../../../../pages/admin/AdminCourseEditorPage';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { AdminStageShell } from '../components/ProductAdminStage';

/**
 * Course library + enhanced editor sheet.
 * Selecting a course keeps the library and opens the editor in an inspector overlay
 * (same GLOBAL card→enhanced inspector rule as partners).
 */
export default function AdminCoursesProductSurface({ entityId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: routeCourseId } = useParams<{ id: string }>();
  const courseId = searchParams.get('courseId') || entityId || routeCourseId || undefined;
  const coursesPath = pathname.startsWith('/preview/workspace-light')
    ? '/preview/workspace-light/admin/courses'
    : '/admin/courses';

  const closeCourseSheet = () => {
    navigate(coursesPath);
  };

  return (
    <AdminStageShell family="department-suite" signature="education-production-studio" accent="violet">
      <span hidden data-surface-kind="real" data-surface-key="admin:courses" />
      <AdminCoursesWorkspace embedded />

      {courseId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Course editor inspector"
          onClick={closeCourseSheet}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-course-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-violet-300 m-0">Enhanced course inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">Course editor</h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeCourseSheet}
                aria-label="Close course inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <AdminCourseEditorWorkspace courseId={courseId} embedded />
            </div>
          </div>
        </div>
      ) : null}
    </AdminStageShell>
  );
}
