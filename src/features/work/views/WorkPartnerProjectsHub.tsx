import React from 'react';
import { FolderKanban } from 'lucide-react';
import { usePartnerSession } from '../../../auth/PartnerSessionContext';
import { FINELY_OS_ENTITY_EMPTY, FINELY_OS_ENTITY_TITLE, finelyOsCatalogCardCompact } from '../../os/finelyOsLightUi';
import WorkTasksProjectsHub from './WorkTasksProjectsHub';

/** Partner projects hub — delegates to unified tasks/projects board. */
export function WorkPartnerProjectsHub() {
  const { partner } = usePartnerSession();

  if (!partner) {
    return (
      <div className={`${finelyOsCatalogCardCompact('emerald')} text-center`}>
        <FolderKanban className="mx-auto mb-2 text-emerald-300/70" size={28} />
        <p className={FINELY_OS_ENTITY_TITLE}>Partner workspace</p>
        <p className={`mt-2 ${FINELY_OS_ENTITY_EMPTY} !py-4`}>Sign in with a partner profile to view your projects and tasks.</p>
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
