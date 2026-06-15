import { Navigate, useLocation } from 'react-router-dom';

/** Tasks are unified under Projects & Tasks — redirect legacy route. */
export default function PartnerTasksPage() {
  const location = useLocation();
  return <Navigate to={`/portal/projects${location.search}`} replace />;
}
