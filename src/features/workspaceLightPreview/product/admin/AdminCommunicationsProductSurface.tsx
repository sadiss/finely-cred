import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Network,
  PenLine,
  Share2,
  Sparkles,
  Video,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { fetchAllPartnersAsAdmin } from '../../../../data/partnersRepo';
import { listAllThreads, listMessagesByThread } from '../../../../data/supportRepo';
import { listCalendarEvents } from '../../../../data/calendarRepo';
import { computeSupportSlaStatus } from '../../../../lib/supportInboxOs';
import { openCommunicationHub } from '../../../../components/chat/communicationHubModel';
import { loadSettings, updateSiteSettings } from '../../../../data/settingsRepo';
import { listCommsTemplates } from '../../../../data/commsRepo';
import { listMetaInboxThreadSummaries } from '../../../../lib/socialHubCommsBridge';
import { useAuth } from '../../../../auth/AuthProvider';
import { WelcomeExperienceEditor } from '../../../../components/comms/WelcomeExperienceEditor';
import { AdminMetaInboxWidget } from '../../../comms/AdminMetaInboxWidget';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { Partner } from '../../../../domain/partners';
import type { SupportMessage, SupportThread } from '../../../../domain/support';
import type { CalendarEvent } from '../../../../domain/calendar';
import type { PlatformSettings, PostLoginWelcomeSettings } from '../../../../domain/settings';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductCommsStage } from '../components/ProductCommsStage';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import type { ProductMetric } from '../components/ProductUi';
import { CommsStudioDepartmentPage } from '../../../studioCommandOs/CommsStudioDepartmentPage';

type CommsChannel =
  | 'inbox'
  | 'needs_reply'
  | 'chat'
  | 'meetings'
  | 'ai'
  | 'meta'
  | 'studio'
  | 'welcome';

function isSameLocalDay(iso: string, date = new Date()): boolean {
  const value = new Date(iso);
  return (
    value.getFullYear() === date.getFullYear() &&
    value.getMonth() === date.getMonth() &&
    value.getDate() === date.getDate()
  );
}

const SAMPLE_DEMO_PARTNERS: Partner[] = [
  {
    id: 'demo_p_marcus_vance',
    tenantId: 'finely_cred',
    status: 'active',
    profile: { fullName: 'Marcus Vance (Sample)', email: 'marcus.vance.demo@finelycred.com' },
    primaryRoute: 'personal_restore',
    lane: 'funding_readiness',
    journeyStage: 'analysis',
    fundingStage: 'ready',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: { personal_restore: { goal: 'Restore personal credit', fundingTarget: 150000, score: 642 } },
  },
  {
    id: 'demo_p_elena_rostova',
    tenantId: 'finely_cred',
    status: 'active',
    profile: { fullName: 'Elena Rostova (Sample)', email: 'elena.rostova.demo@finelycred.com' },
    primaryRoute: 'business_build',
    lane: 'business_credit',
    journeyStage: 'evidence',
    fundingStage: 'in_review',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: { business_build: { goal: 'Business credit build', fundingTarget: 100000 } },
  },
  {
    id: 'demo_p_devon_sterling',
    tenantId: 'finely_cred',
    status: 'active',
    profile: { fullName: 'Devon Sterling (Sample)', email: 'devon.sterling.demo@finelycred.com' },
    primaryRoute: 'personal_restore',
    lane: 'funding_readiness',
    journeyStage: 'intake',
    fundingStage: 'not_ready',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: { personal_restore: { goal: 'First restore step', fundingTarget: 75000, score: 618 } },
  },
];

const SAMPLE_DEMO_THREADS: SupportThread[] = [
  {
    id: 'demo_thread_marcus',
    partnerId: 'demo_p_marcus_vance',
    topic: 'disputes',
    subject: 'Question about the next bureau response',
    status: 'waiting_on_team',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 70 * 60000).toISOString(),
    lastMessageAt: new Date(Date.now() - 70 * 60000).toISOString(),
    slaDueAt: new Date(Date.now() + 50 * 60000).toISOString(),
  },
  {
    id: 'demo_thread_elena',
    partnerId: 'demo_p_elena_rostova',
    topic: 'documents',
    subject: 'Business address document received',
    status: 'waiting_on_partner',
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    lastMessageAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    firstResponseAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    slaDueAt: new Date(Date.now() - 20 * 3600000).toISOString(),
  },
  {
    id: 'demo_thread_devon',
    partnerId: 'demo_p_devon_sterling',
    topic: 'general',
    subject: 'Help with the first restore step',
    status: 'new',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    lastMessageAt: new Date(Date.now() - 25 * 60000).toISOString(),
    slaDueAt: new Date(Date.now() + 3 * 3600000).toISOString(),
  },
];

const SAMPLE_DEMO_MESSAGES: SupportMessage[] = [
  {
    id: 'demo_message_marcus_1',
    threadId: 'demo_thread_marcus',
    partnerId: 'demo_p_marcus_vance',
    topic: 'disputes',
    fromPartner: true,
    createdAt: new Date(Date.now() - 70 * 60000).toISOString(),
    body: 'The bureau response arrived today. Which factual result should I log before the next round?',
  },
  {
    id: 'demo_message_elena_1',
    threadId: 'demo_thread_elena',
    partnerId: 'demo_p_elena_rostova',
    topic: 'documents',
    fromPartner: false,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    body: 'We received the address document. Please confirm the business phone listing when it is live.',
  },
  {
    id: 'demo_message_devon_1',
    threadId: 'demo_thread_devon',
    partnerId: 'demo_p_devon_sterling',
    topic: 'general',
    fromPartner: true,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    body: 'I uploaded my reports. What should I review first?',
  },
];

const SAMPLE_DEMO_MEETINGS: CalendarEvent[] = [
  {
    id: 'demo_meeting_marcus',
    partnerId: 'demo_p_marcus_vance',
    type: 'follow_up',
    status: 'confirmed',
    title: 'Bureau response review',
    startAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    endAt: new Date(Date.now() + 2.5 * 3600000).toISOString(),
    hostDisplayName: 'Maya Chen',
    hostRoleLabel: 'Credit Specialist',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_meeting_elena',
    partnerId: 'demo_p_elena_rostova',
    type: 'consultation',
    status: 'confirmed',
    title: 'Business credit milestone review',
    startAt: new Date(Date.now() + 5 * 3600000).toISOString(),
    endAt: new Date(Date.now() + 5.5 * 3600000).toISOString(),
    hostDisplayName: 'Andre Brooks',
    hostRoleLabel: 'Case Specialist',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

type ChannelTile = {
  id: CommsChannel;
  label: string;
  purpose: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  count?: number;
  status: 'live' | 'attention' | 'idle';
  statusLabel: string;
  icon: typeof MessageSquare;
};

export default function AdminCommunicationsProductSurface({ role, pageId, dataMode }: WorkspaceProductSurfaceProps) {
  const isDemo = dataMode === 'demo';
  const auth = useAuth();
  const { search: locationSearch } = useLocation();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? MessageSquare;

  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<CommsChannel>(() =>
    new URLSearchParams(locationSearch).get('workspaceRoom') === 'studio' ? 'studio' : 'inbox',
  );
  const [showEmbeddedHub, setShowEmbeddedHub] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>(() => loadSettings());
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(locationSearch).get('workspaceRoom') === 'studio') {
      setSelectedChannel('studio');
    }
  }, [locationSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (isDemo) {
      setThreads(SAMPLE_DEMO_THREADS);
      setPartners(SAMPLE_DEMO_PARTNERS);
      setMeetings(SAMPLE_DEMO_MEETINGS);
      setSelectedThreadId(SAMPLE_DEMO_THREADS[0]?.id ?? null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    Promise.resolve()
      .then(async () => {
        const [partnerRows] = await Promise.all([fetchAllPartnersAsAdmin()]);
        const threadRows = listAllThreads();
        const meetingRows = listCalendarEvents().filter(
          (event) => event.status !== 'cancelled' && isSameLocalDay(event.startAt),
        );
        if (cancelled) return;
        setPartners(partnerRows);
        setThreads(threadRows);
        setMeetings(meetingRows);
        setSelectedThreadId(threadRows[0]?.id ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  const needsReplyCount = threads.filter((t) => t.status === 'waiting_on_team').length;
  const meetingsToday = meetings.length;
  const metaThreadCount = useMemo(() => listMetaInboxThreadSummaries().length, [settingsVersion]);
  const templateCount = useMemo(() => listCommsTemplates().length, [settingsVersion]);

  const partnersById = useMemo(() => new Map(partners.map((partner) => [partner.id, partner] as const)), [partners]);

  const visibleThreads = useMemo(() => {
    if (selectedChannel === 'meetings' || selectedChannel === 'ai' || selectedChannel === 'meta' || selectedChannel === 'studio' || selectedChannel === 'welcome') {
      return [];
    }
    if (selectedChannel === 'needs_reply') return threads.filter((thread) => thread.status === 'waiting_on_team');
    if (selectedChannel === 'chat') return threads;
    return threads;
  }, [selectedChannel, threads]);

  const selectedThread = visibleThreads.find((t) => t.id === selectedThreadId) ?? visibleThreads[0];
  const selectedMessages = selectedThread
    ? isDemo
      ? SAMPLE_DEMO_MESSAGES.filter((message) => message.threadId === selectedThread.id)
      : listMessagesByThread(selectedThread.id)
    : [];
  const selectedPartner = selectedThread ? partnersById.get(selectedThread.partnerId) : undefined;

  const channelTiles: ChannelTile[] = [
    {
      id: 'inbox',
      label: 'Partner inbox',
      purpose: 'All signed-in partner threads',
      accent: 'sky',
      count: threads.length,
      status: needsReplyCount ? 'attention' : 'live',
      statusLabel: needsReplyCount ? `${needsReplyCount} need reply` : 'Current',
      icon: Network,
    },
    {
      id: 'needs_reply',
      label: 'Needs reply',
      purpose: 'Conversations waiting on your team',
      accent: 'rose',
      count: needsReplyCount,
      status: needsReplyCount ? 'attention' : 'live',
      statusLabel: needsReplyCount ? 'Action now' : 'Clear',
      icon: MessageSquare,
    },
    {
      id: 'chat',
      label: 'Chat threads',
      purpose: 'Portal message history',
      accent: 'violet',
      count: threads.length,
      status: 'live',
      statusLabel: 'Portal',
      icon: MessageSquare,
    },
    {
      id: 'meetings',
      label: 'Meetings today',
      purpose: 'Confirmed partner sessions',
      accent: 'emerald',
      count: meetingsToday,
      status: meetingsToday ? 'live' : 'idle',
      statusLabel: meetingsToday ? 'On calendar' : 'None today',
      icon: Video,
    },
    {
      id: 'ai',
      label: 'Ask Finely desk',
      purpose: 'AI assist and staff routing',
      accent: 'violet',
      status: 'live',
      statusLabel: 'Coach on',
      icon: Sparkles,
    },
    {
      id: 'meta',
      label: 'Meta inbox',
      purpose: 'Messenger and Instagram leads',
      accent: 'rose',
      count: metaThreadCount,
      status: metaThreadCount ? 'attention' : 'idle',
      statusLabel: metaThreadCount ? `${metaThreadCount} threads` : 'No threads',
      icon: Share2,
    },
    {
      id: 'studio',
      label: 'Compose & campaigns',
      purpose: 'Templates, sequences, and sends',
      accent: 'sky',
      count: templateCount,
      status: 'live',
      statusLabel: `${templateCount} templates`,
      icon: PenLine,
    },
    {
      id: 'welcome',
      label: 'Welcome experience',
      purpose: 'Post-login banner and intro email',
      accent: 'emerald',
      status: settings.site.postLoginWelcome?.enabled === false ? 'idle' : 'live',
      statusLabel: settings.site.postLoginWelcome?.enabled === false ? 'Off' : 'Active',
      icon: Calendar,
    },
  ];

  const metrics: ProductMetric[] = [
    { label: 'Needs reply', value: needsReplyCount, hint: 'Waiting on team', accent: 'rose', icon: MessageSquare },
    { label: 'Threads', value: threads.length, hint: 'Partner conversations', accent: 'sky', icon: Network },
    { label: 'Meetings', value: meetingsToday, hint: 'Today on calendar', accent: 'violet', icon: Video },
    { label: 'Templates', value: templateCount, hint: 'Comms studio library', accent: 'emerald', icon: PenLine },
  ];

  const onWelcomeChange = (patch: Partial<PostLoginWelcomeSettings>) => {
    updateSiteSettings({
      postLoginWelcome: { ...(settings.site.postLoginWelcome ?? {}), ...patch },
    });
    setSettings(loadSettings());
    setSettingsVersion((v) => v + 1);
  };

  if (loading) {
    return <ProductDashboardSkeleton label="Loading communications control room" />;
  }

  const activeTile = channelTiles.find((t) => t.id === selectedChannel) ?? channelTiles[0]!;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Partner communications control room"
      description="Scan every channel from the status grid — open one inspector to reply, compose, or tune welcome and Meta."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Channel pulse"
      metricDescription="Tiles rotate color by family — attention states surface when partners are waiting."
      primaryAction={
        <ProductPagePrimaryAction
          label="New message"
          onClick={() => openCommunicationHub({ tab: 'team', expanded: true })}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setSelectedChannel('studio')}>
          Open compose studio
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-12 items-start">
        <aside className="xl:col-span-5 space-y-4">
          <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6`} data-fc-accent="violet">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Control room pulse</p>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {needsReplyCount > 0
                ? `${needsReplyCount} conversation${needsReplyCount === 1 ? '' : 's'} waiting on your team — pick a channel to respond.`
                : 'Inbox is current. Review threads, meetings, or open compose & campaigns.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {channelTiles.map((tile) => {
              const Icon = tile.icon;
              const selected = selectedChannel === tile.id;
              const chipTone = tile.status === 'attention' ? 'warn' : tile.status === 'live' ? 'ok' : 'warn';
              return (
                <button
                  key={tile.id}
                  type="button"
                  data-selected={selected ? 'true' : undefined}
                  className={`text-left ${finelyOsCatalogCard(tile.accent)} p-4 lg:p-5 transition-all ${
                    selected ? 'ring-2 ring-white/30' : ''
                  }`}
                  data-fc-accent={tile.accent}
                  onClick={() => {
                    setSelectedChannel(tile.id);
                    setShowEmbeddedHub(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon size={20} className="shrink-0 opacity-90" />
                    <span className={finelyOsStatusChip(chipTone)}>{tile.statusLabel}</span>
                  </div>
                  <div className={`mt-3 text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                  <p className={`mt-1 text-sm font-bold leading-snug ${FINELY_OS_ENTITY_BODY}`}>{tile.purpose}</p>
                  {tile.count !== undefined ? (
                    <div className="mt-3 text-2xl font-extrabold">{tile.count}</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="xl:col-span-7 space-y-4 min-w-0">
          <div className={`${finelyOsCatalogCard(activeTile.accent)} p-5 lg:p-6`} data-fc-accent={activeTile.accent}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Channel inspector</p>
                <h2 className="mt-1 text-2xl font-extrabold">{activeTile.label}</h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeTile.purpose}</p>
              </div>
              {selectedChannel === 'inbox' || selectedChannel === 'needs_reply' || selectedChannel === 'chat' ? (
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => setShowEmbeddedHub((v) => !v)}
                >
                  {showEmbeddedHub ? 'Hide reply' : 'Reply'} <ArrowRight size={13} />
                </button>
              ) : null}
            </div>
          </div>

          {selectedChannel === 'studio' ? (
            <div className={`${finelyOsCatalogCard('sky')} p-4 lg:p-5 overflow-hidden`} data-fc-accent="sky">
              <CommsStudioDepartmentPage />
            </div>
          ) : null}

          {selectedChannel === 'welcome' ? (
            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-8`} data-fc-accent="emerald">
              <WelcomeExperienceEditor
                value={settings.site.postLoginWelcome ?? {}}
                onChange={onWelcomeChange}
                previewUser={auth.user}
              />
            </div>
          ) : null}

          {selectedChannel === 'meta' ? (
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
              <AdminMetaInboxWidget />
            </div>
          ) : null}

          {selectedChannel === 'ai' ? (
            <ProductCommsStage adminMode accent="violet" showAllAgents />
          ) : null}

          {selectedChannel === 'meetings' ? (
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5 text-center`} data-fc-accent="emerald">
              <Calendar size={32} className="mx-auto text-emerald-400" />
              <h3 className="text-2xl font-extrabold">Meeting desk</h3>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Review agendas, hosts, and join links in the meeting workspace.
              </p>
              <FinelyOsPaginatedStack
                items={meetings}
                pageSize={8}
                emptyMessage="No confirmed partner meetings are scheduled today."
                renderItem={(meeting) => (
                  <button
                    key={meeting.id}
                    type="button"
                    className="w-full text-left rounded-xl border border-white/10 bg-black/25 px-4 py-3 hover:border-white/25"
                    onClick={() => openCommunicationHub({ tab: 'meetings', expanded: true })}
                  >
                    <div className="flex items-center justify-between text-sm font-bold opacity-70">
                      <span className="text-violet-300">
                        {new Date(meeting.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span>{meeting.status}</span>
                    </div>
                    <div className="font-extrabold mt-1">{meeting.title}</div>
                    <div className={`text-sm font-bold truncate ${FINELY_OS_ENTITY_BODY}`}>
                      {partnersById.get(meeting.partnerId)?.profile?.fullName ?? 'Partner'}
                    </div>
                  </button>
                )}
              />
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => openCommunicationHub({ tab: 'meetings', expanded: true })}
              >
                Open meetings <ArrowRight size={13} />
              </button>
            </div>
          ) : null}

          {selectedChannel === 'inbox' || selectedChannel === 'needs_reply' || selectedChannel === 'chat' ? (
            <div className="grid gap-4 lg:grid-cols-5 items-start">
              <div className={`lg:col-span-2 ${finelyOsCatalogCard('sky')} p-4 space-y-3`} data-fc-accent="sky">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-extrabold">
                    {selectedChannel === 'needs_reply' ? 'Waiting on team' : 'Partner threads'}
                  </strong>
                  <span className="text-sm font-bold">{visibleThreads.length}</span>
                </div>
                <FinelyOsPaginatedStack
                  items={visibleThreads}
                  pageSize={10}
                  emptyMessage={
                    selectedChannel === 'needs_reply'
                      ? 'No partner conversations are waiting on the team.'
                      : 'No partner conversations have been started yet.'
                  }
                  renderItem={(thread) => {
                    const isSelected = selectedThread?.id === thread.id;
                    const sla = computeSupportSlaStatus(thread);
                    const partnerName = partnersById.get(thread.partnerId)?.profile?.fullName ?? 'Partner';
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        className={`w-full text-left rounded-xl border px-3 py-3 ${
                          isSelected ? 'border-sky-400/50 bg-sky-500/15' : 'border-white/10 bg-black/25 hover:border-white/25'
                        }`}
                        onClick={() => {
                          setSelectedThreadId(thread.id);
                          setShowEmbeddedHub(false);
                        }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold opacity-70">
                          <span className="text-sky-400">{partnerName}</span>
                          <span>{sla.label}</span>
                        </div>
                        <div className="font-extrabold text-sm mt-1">{thread.subject}</div>
                        <div className={`text-xs font-bold truncate ${FINELY_OS_ENTITY_BODY}`}>
                          {thread.topic.replace(/_/g, ' ')} · {thread.status.replace(/_/g, ' ')}
                        </div>
                      </button>
                    );
                  }}
                />
              </div>

              <div className={`lg:col-span-3 space-y-4`}>
                {selectedThread ? (
                  <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-4`} data-fc-accent="violet">
                    <div>
                      <h3 className="text-xl font-extrabold">{selectedThread.subject}</h3>
                      <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {selectedPartner?.profile?.fullName ?? 'Partner'} · {selectedThread.topic.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedMessages.map((msg, i) => (
                        <div
                          key={msg.id ?? i}
                          className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                            msg.fromPartner ? 'border-sky-400/30 bg-sky-500/10' : 'border-violet-400/30 bg-violet-500/10'
                          }`}
                        >
                          <strong>{msg.fromPartner ? 'Partner' : 'Finely Team'}: </strong>
                          <span>{msg.body}</span>
                        </div>
                      ))}
                      {selectedMessages.length === 0 ? (
                        <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No messages on this thread yet.</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className={`${finelyOsCatalogCard('violet')} p-8 text-center`} data-fc-accent="violet">
                    <MessageSquare size={28} className="mx-auto opacity-60" />
                    <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Select a thread to read the conversation.</p>
                  </div>
                )}

                {showEmbeddedHub ? (
                  <ProductCommsStage
                    adminMode
                    accent="sky"
                    showAllAgents
                    partnerId={selectedPartner?.id}
                    partnerDisplayName={selectedPartner?.profile?.fullName}
                    lane={selectedPartner?.lane}
                    journeyStage={selectedPartner?.journeyStage}
                  />
                ) : selectedThread ? (
                  <div className={`${finelyOsCatalogCard('emerald')} p-5 text-center space-y-3`} data-fc-accent="emerald">
                    <PenLine size={22} className="mx-auto text-emerald-400" />
                    <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      Open reply to load the communication stage with partner context, AI assist, and send controls.
                    </p>
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setShowEmbeddedHub(true)}>
                      Open reply stage <ArrowRight size={13} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
