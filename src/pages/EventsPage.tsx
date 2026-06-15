import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Link as LinkIcon, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { listCalendarEvents } from '../data/calendarRepo';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { getActiveTenantId } from '../tenancy/activeTenant';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,

  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function EventsPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Events & workshops',
    description: 'Live Finely Cred workshops, webinars, and community sessions for credit restore and funding education.',
    path: '/events',
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const events = useMemo(() => {
    const tenantId = getActiveTenantId();
    const publicKey = `public:${tenantId}`;
    const now = Date.now();
    return listCalendarEvents()
      .filter((e) => e.partnerId === publicKey && e.type === 'ops' && e.status !== 'cancelled')
      .filter((e) => Date.parse(e.endAt) >= now)
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [version]);

  return (
    <PageShell
      badge="Public"
      title="Events & Webinars"
      subtitle="Live trainings, Q&A, and walkthroughs — designed to help you pick the right lane and move with precision."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Community"
          title="Events & Webinars"
          subtitle="Live trainings, Q&A, and walkthroughs — designed to help you pick the right lane and move with precision."
          accent="amber"
          kpis={[
            { label: 'Upcoming', value: String(events.length), accent: 'amber' },
            { label: 'Format', value: 'Live', accent: 'emerald' },
            { label: '1:1 option', value: 'Free session', accent: 'sky' },
          ]}
          tabs={[{ id: 'schedule', label: 'Schedule' }]}
          activeTab="schedule"
          primaryAction={{ label: 'Book strategy call', onClick: () => navigate('/consultation') }}
          secondaryAction={{ label: 'Back', onClick: () => navigate(-1) }}
        >
        {events.length === 0 ? (
          <div className={FINELY_OS_LUXURY_EMPTY}>
            No upcoming public events are scheduled right now. Book a free strategy call and we’ll get you into the right lane.
          </div>
        ) : (
          <FinelyOsPaginatedStack
            items={events}
            pageSize={6}
            itemSpacingClassName="grid md:grid-cols-2 gap-6"
            renderItem={(e, idx) => {
              const durationMin = (() => {
                const s = Date.parse(e.startAt);
                const en = Date.parse(e.endAt);
                if (!Number.isFinite(s) || !Number.isFinite(en)) return null;
                const m = Math.max(0, Math.round((en - s) / 60000));
                return m || null;
              })();
              const accent = (['emerald', 'sky', 'violet', 'amber'] as const)[idx % 4];
              return (
                <div key={e.id} className={`space-y-5 ${finelyOsCatalogCard(accent)} !p-6`} data-fc-accent={accent}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-xl`}>{e.title}</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{e.description || 'Live event'}</div>
                    </div>
                    <span className={finelyOsStatusChip('warn')}>
                      <Video size={14} className="mr-1" />
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                      <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        <Calendar size={14} /> When
                      </div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{fmtWhen(e.startAt)}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                      <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        <Clock size={14} /> Duration
                      </div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{durationMin ? `${durationMin} min` : '—'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {e.meetingUrl ? (
                      <button type="button" onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')} className={FINELY_OS_PRIMARY_BTN}>
                        Open event link <LinkIcon size={16} />
                      </button>
                    ) : (
                      <button type="button" onClick={() => navigate('/consultation')} className={FINELY_OS_PRIMARY_BTN}>
                        Book a free strategy call <ArrowRight size={16} />
                      </button>
                    )}
                    <button type="button" onClick={() => navigate('/tradelines')} className={FINELY_OS_SECONDARY_BTN}>
                      Explore Premium Tradelines
                    </button>
                  </div>

                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    Schedules can change. No guarantees, outcomes vary, and educational content is not legal advice.
                  </p>
                </div>
              );
            }}
          />
        )}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="appointment_setter"
          goal="not_sure"
          roleLabel="session coordinator"
          subline="Questions about an upcoming event or booking a free strategy call?"
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
