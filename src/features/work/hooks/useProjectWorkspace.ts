import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export type WorkspaceView = 'overview' | 'list' | 'board' | 'calendar';

export function useProjectWorkspace(opts?: { listPath?: string }) {
  const listPath = opts?.listPath ?? '/admin/projects';
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const view = (searchParams.get('view') as WorkspaceView) || 'overview';
  const taskId = searchParams.get('task') || null;

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const setView = useCallback(
    (next: WorkspaceView) => {
      const params = new URLSearchParams(searchParams);
      params.set('view', next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openTask = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('task', id);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const closeTask = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('task');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const goToProjects = useCallback(() => navigate(listPath), [navigate, listPath]);

  return useMemo(
    () => ({
      projectId,
      view,
      taskId,
      version,
      setView,
      openTask,
      closeTask,
      goToProjects,
    }),
    [projectId, view, taskId, version, setView, openTask, closeTask, goToProjects, listPath],
  );
}
