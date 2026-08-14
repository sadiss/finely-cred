import React from 'react';
import { usePartnerSession } from '../../../auth/PartnerSessionContext';
import WorkTasksProjectsHub from './WorkTasksProjectsHub';

/** Partner projects hub — delegates to unified tasks/projects board. */
export function WorkPartnerProjectsHub() {
  const { partner } = usePartnerSession();

  if (!partner) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55 text-center">
        Sign in with a partner profile to view projects.
      </div>
    );
  }

  return (
    <WorkTasksProjectsHub
      role="partner"
      partnerId={partner.id}
      partner={partner}
      partnerById={new Map([[partner.id, partner]])}
      workspaceBasePath="/portal/projects"
      compactHero
    />
  );
}

export default WorkPartnerProjectsHub;
