import React from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { AdminCoursesWorkspace } from '../../../../pages/admin/AdminCoursesPage';
import { AdminCourseEditorWorkspace } from '../../../../pages/admin/AdminCourseEditorPage';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { AdminStageShell } from '../components/ProductAdminStage';

/**
 * Course library. Opening a course replaces this list with the editor.
 */
export default function AdminCoursesProductSurface({ entityId }: WorkspaceProductSurfaceProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: routeCourseId } = useParams<{ id: string }>();
  const courseId = searchParams.get('courseId') || entityId || routeCourseId || undefined;
  const embedded = pathname.startsWith('/admin') || pathname.startsWith('/preview/workspace-light');

  return (
    <AdminStageShell family="department-suite" signature="course-library" accent="violet">
      <span hidden data-surface-kind="real" data-surface-key="admin:courses" />
      {courseId ? (
        <AdminCourseEditorWorkspace courseId={courseId} embedded={embedded} />
      ) : (
        <AdminCoursesWorkspace embedded={embedded} />
      )}
    </AdminStageShell>
  );
}
