import { Navigate } from 'react-router-dom';
import { CS_OFFER } from '../../config/creditSpecialistOffer';

/** Legacy `/credit-specialist-apply` → guided join (leads system + 3-lead commitment). */
export default function SpecialistApplyFunnelPage() {
  return <Navigate to={CS_OFFER.joinPath} replace />;
}
