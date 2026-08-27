import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listEventsByPartner } from '../../data/calendarRepo';
import { runMeetingReminderAutomation } from '../../lib/meetingReminderAutomation';
import { CommunicationWorkspaceNav } from '../../components/comms/CommunicationWorkspaceNav';
import { PartnerCalendarWorkspace, type PartnerCalendarView } from '../../components/calendar/PartnerCalendarWorkspace';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildCalendarNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
} from '../../features/os/finelyOsLightUi';

export default function PartnerCalendarPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<PartnerCalendarView>('book');
  const [settings] = useState(() => getCalendarBookingSettings());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    void runMeetingReminderAutomation({ withinHours: 24 });
  }, [version]);

  const events = useMemo(() => (partner ? listEventsByPartner(partner.id) : []), [partner, version]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Calendar & video meetings"
      subtitle="Book a free strategy call with your specialist, join your video room when it's time, and see due dates tied to your restore plan."
    >
      {!partner ? (
        <FinelyOsEmptyState
          icon={Calendar}
          title="No partner profile"
          description="Sign in with a partner account to book sessions and view your calendar."
          primaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
        />
      ) : (
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Partner Dashboard
          </button>

          <CommunicationWorkspaceNav active="calendar" />

          <FinelyNoticedStrip items={buildCalendarNoticedItems({ upcomingCount: upcoming.length })} />
          <FinelyNowDoThisStrip currentIndex={view === 'sessions' ? 2 : view === 'calendar' ? 1 : 0} />

          <FinelyUnifiedHubLayout
            eyebrow="Calendar & meetings"
            title="Book strategy calls"
            subtitle="Pick a time slot, join video rooms, and export calendar invites for your restore plan."
            accent="emerald"
            kpis={[
              { label: 'Upcoming', value: String(upcoming.length), hint: 'Scheduled', accent: 'emerald' },
              { label: 'All events', value: String(events.length), hint: 'On calendar', accent: 'violet' },
              { label: 'Duration', value: `${settings.defaultDuration ?? 30}m`, hint: 'Default slot', accent: 'sky' },
            ]}
            tabs={[
              { id: 'book', label: 'Book session' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'sessions', label: 'My sessions', badge: upcoming.length || undefined },
              { id: 'settings', label: 'Settings' },
            ]}
            activeTab={view}
            onTabChange={(id) => setView(id as PartnerCalendarView)}
            primaryAction={{ label: 'Book a strategy call', onClick: () => setView('book') }}
            secondaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/dashboard') }}
          >
            <PartnerCalendarWorkspace partnerId={partner.id} view={view} />
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
