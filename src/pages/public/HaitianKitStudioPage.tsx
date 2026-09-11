import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { resolveHaitianKitRedirect } from '../../lib/haitianCompanionDesk';
import { resolveCreditSpecialistHubAccess } from '../../lib/roleHubAccess';

/** Kits are internal. Guests never browse a public catalog. */
export default function HaitianKitStudioPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-base font-bold text-slate-700">Opening Haitian community…</p>
      </div>
    );
  }

  const isAdmin = isAdminEmail(auth.user?.email);
  const specialist = resolveCreditSpecialistHubAccess(auth.user);

  return (
    <Navigate
      to={resolveHaitianKitRedirect({
        isAdmin,
        isAuthed: Boolean(auth.user),
        isSpecialist: Boolean(auth.user) && specialist.allowed && !isAdmin,
      })}
      replace
    />
  );
}
