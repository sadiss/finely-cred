import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { resolveHaitianKitRedirect } from '../../lib/haitianCompanionDesk';
import { resolveCreditSpecialistHubAccess } from '../../lib/roleHubAccess';

const KreyolGuideFunnelPage = React.lazy(() => import('../leadmagnet/KreyolGuideFunnelPage'));

function KitGatePending({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-base font-bold text-slate-700">{label}</p>
    </div>
  );
}

/** Guests get the public unlock funnel. Signed-in people keep their Haitian desk. */
export default function HaitianKitStudioPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <KitGatePending label="Opening credit kits…" />;
  }

  const isAdmin = isAdminEmail(auth.user?.email);
  const specialist = resolveCreditSpecialistHubAccess(auth.user);
  const dest = resolveHaitianKitRedirect({
    isAdmin,
    isAuthed: Boolean(auth.user),
    isSpecialist: Boolean(auth.user) && specialist.allowed && !isAdmin,
  });

  if (dest) {
    return <Navigate to={dest} replace />;
  }

  return (
    <Suspense fallback={<KitGatePending label="Opening credit kits…" />}>
      <KreyolGuideFunnelPage />
    </Suspense>
  );
}
