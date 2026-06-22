import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyCommunicationHub } from '../../components/chat/FinelyCommunicationHub';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PAGE, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { useNavigate } from 'react-router-dom';

/** Admin-facing Communication Hub — pick any agent on the roster and chat live. */
export default function AdminMessagesPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Admin"
      title="Communication Hub"
      subtitle="Talk to any agent or specialist on your roster — same main hub as the portal, without a customer file attached."
    >
      <div className={`${FINELY_OS_PAGE} space-y-4`}>
        <div className={`${FINELY_OS_ENTITY_BODY} text-sm flex flex-wrap items-center justify-between gap-3`}>
          <span>
            Use <span className="font-semibold text-white/90">AI Coach</span> to switch agents from the roster. Partner inbox threads
            still live in Support Inbox.
          </span>
          <button type="button" onClick={() => navigate('/admin/support')} className={FINELY_OS_SECONDARY_BTN}>
            Partner support inbox <ArrowRight size={14} />
          </button>
        </div>

        <FinelyCommunicationHub mode="page" initialTab="ai" showAllAgents adminMode />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
