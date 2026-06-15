import { Navigate, useLocation } from 'react-router-dom';

/** Admin tasks unified under Projects workspace — preserve query (e.g. ?create=1). */
export default function AdminTasksPage() {
  const location = useLocation();
  return <Navigate to={`/admin/projects${location.search}`} replace />;
}
