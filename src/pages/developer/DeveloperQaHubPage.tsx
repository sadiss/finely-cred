import React from 'react';
import { Navigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isDeveloperQaOnly } from '../../auth/staffIdentity';
import { isAdminEmail } from '../../auth/admin';
import { DeveloperQaCommandCenter } from '../../features/developer/DeveloperQaCommandCenter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

export default function DeveloperQaHubPage() {
  const { user } = useAuth();
  const email = (user?.email || '').trim();

  if (!email) return <Navigate to="/onboarding" replace />;

  const isAdmin = isAdminEmail(email);
  const isDeveloper = isDeveloperQaOnly(email);

  if (!isAdmin && !isDeveloper) {
    return (
      <PageShell badge="Developer" title="Not authorized" subtitle="This hub is for developer QA allowlist accounts.">
        <p className="text-white/60 text-base">
          Ask an owner to add your email to `VITE_DEVELOPER_EMAILS` and `EDGE_DEVELOPER_EMAILS`.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge={isAdmin ? 'Admin preview' : 'Developer QA'}
      title="AI launch command center"
      subtitle={
        isAdmin
          ? 'Owner view — same bench Sadiss uses for full-stack launch QA.'
          : 'Full-stack QA with sandbox guardrails — partners, letters, mail, comms, marketing, AI.'
      }
    >
      {isAdmin ? (
        <FinelyOsAlertBanner
          tone="info"
          message="You are previewing the developer QA hub as an admin. Sadiss lands here automatically after sign-in."
        />
      ) : null}
      <DeveloperQaCommandCenter />
    </PageShell>
  );
}
