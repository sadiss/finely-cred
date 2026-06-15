import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FinelyOwnersGuidePanel } from '../components/guide/FinelyOwnersGuidePanel';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FINELY_OS_BACK_LINK, FINELY_OS_PAGE } from '../features/os/finelyOsLightUi';

export default function OwnersGuidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const backTo = isAdmin ? '/dashboard' : '/portal/dashboard';
  const backLabel = isAdmin ? 'Back to dashboard' : 'Back to partner portal';

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <PageShell
      badge="Partner manual"
      title="Partner access manual"
      subtitle="What your partner account includes — portal tools, Communication Hub, Work OS, education, and how each route connects. Admin-only sections appear for Finely staff."
      back={{ to: backTo, label: backLabel }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl`}>
        <button type="button" onClick={() => navigate(backTo)} className={`${FINELY_OS_BACK_LINK} md:hidden`}>
          <ArrowLeft size={16} /> {isAdmin ? 'Dashboard' : 'Portal'}
        </button>
        <FinelyOwnersGuidePanel isAdmin={isAdmin} />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
