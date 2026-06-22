import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfileMeta } from '../../auth/userProfile';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyCommunicationHub } from '../../components/chat/FinelyCommunicationHub';
import { CommunicationWorkspaceNav } from '../../components/comms/CommunicationWorkspaceNav';
import type { HubTab } from '../../components/chat/communicationHubModel';
import type { SupportTopic } from '../../domain/support';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildMessagesNoticedItems } from '../../lib/finelyProactiveSignals';
import { CS } from '../../config/creditSpecialistProgram';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

export default function PartnerMessagesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const meta = getUserProfileMeta(auth.user);
  const role = (meta.role || partner?.lane || '').toLowerCase();
  const isSpecialist = role === 'agent' || role === 'credit_specialist' || (partner?.lane || '').toLowerCase().includes('agent');

  const hubTab = (searchParams.get('hub') as HubTab | null) ?? (isSpecialist ? 'team' : 'team');
  const threadId = searchParams.get('thread') ?? undefined;
  const topic = (searchParams.get('topic') as SupportTopic | null) ?? (isSpecialist ? 'credit_specialist_program' : undefined);

  useEffect(() => {
    if (!isSpecialist || !partner) return;
    if (searchParams.get('topic') === 'credit_specialist_program') return;
    if (searchParams.get('hub') && searchParams.get('topic')) return;
    const next = new URLSearchParams(searchParams);
    next.set('hub', 'team');
    next.set('topic', 'credit_specialist_program');
    setSearchParams(next, { replace: true });
  }, [isSpecialist, partner?.id, searchParams, setSearchParams]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Communication Hub"
      subtitle="AI coach, team threads, and meetings preview — paired with Calendar for booking and video sessions."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you&apos;re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.messages]}>
          <div className={FINELY_OS_PAGE}>
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
                <ArrowLeft size={16} /> Partner Dashboard
              </button>

            <div className="fc-sticky-tabs -mt-2">
              <CommunicationWorkspaceNav active="hub" compact showExplainer={false} />
            </div>

            <FinelyNoticedStrip
              items={buildMessagesNoticedItems({
                hubTab,
                journeyStage: partner.journeyStage,
                isSpecialist,
              })}
            />

            <FinelyNowDoThisStrip currentIndex={hubTab === 'ai' ? 1 : hubTab === 'meetings' ? 2 : 0} />

            <FinelyUnifiedHubLayout
              eyebrow="Communication hub"
              title="AI coach, team threads & meetings"
              subtitle="Paired with Calendar for booking and video sessions."
              accent="fuchsia"
              kpis={[
                { label: 'Lane', value: (partner.lane ?? 'client').replace(/_/g, ' '), hint: 'Your path', accent: 'violet' },
                { label: 'Stage', value: partner.journeyStage ?? 'intake', hint: 'Journey', accent: 'emerald' },
                { label: 'Mode', value: isSpecialist ? 'Specialist' : 'Customer', hint: 'Portal role', accent: 'amber' },
                { label: 'Tab', value: hubTab, hint: 'Active panel', accent: 'sky' },
              ]}
              tabs={[
                { id: 'ai', label: 'AI coach' },
                { id: 'team', label: 'Team chat' },
                { id: 'meetings', label: 'Meetings' },
                { id: 'guide', label: 'Guide' },
              ]}
              activeTab={hubTab}
              onTabChange={(id) => {
                const next = new URLSearchParams(searchParams);
                next.set('hub', id);
                setSearchParams(next, { replace: true });
              }}
              primaryAction={{ label: 'Book session', onClick: () => navigate('/portal/calendar') }}
              secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
            >
            {isSpecialist ? (
              <FinelyOsAlertBanner
                tone="info"
                message={`${CS.supportThreadSubject} — pinned for Credit Specialists. Customer threads stay separate in Team chat.`}
              />
            ) : null}

            <FinelyCommunicationHub
              mode="page"
              partnerId={partner.id}
              partnerDisplayName={partner.profile.fullName}
              lane={(partner as { lane?: string }).lane}
              journeyStage={(partner as { journeyStage?: string }).journeyStage}
              initialTab={hubTab}
              initialThreadId={threadId}
              initialTopic={topic}
            />
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
