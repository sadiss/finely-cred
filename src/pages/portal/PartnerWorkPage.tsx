import { Navigate } from 'react-router-dom';

/** All work is unified under Projects & Tasks — redirect legacy route. */
export default function PartnerWorkPage() {
  return <Navigate to="/portal/projects" replace />;
}
