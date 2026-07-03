import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FullPageLoader } from '../../components/ui/FullPageLoader';

/** Legacy route — partner human roster lives in Staff Command Center. */
export default function AdminAgentStaffPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/staff?view=partner', { replace: true });
  }, [navigate]);
  return <FullPageLoader label="Opening Staff Command Center…" />;
}
