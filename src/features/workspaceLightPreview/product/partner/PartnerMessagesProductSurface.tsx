import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CircleHelp,
  Compass,
  Inbox,
  Mail,
  MessageSquare,
  PlayCircle,
  Send,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPartner } from '../../../../data/partnersRepo';
import { listMessagesByThread, listThreadsByPartner } from '../../../../data/supportRepo';
import { listEventsByPartner } from '../../../../data/calendarRepo';
import { normalizeHubTab, openCommunicationHub, SUPPORT_TOPICS, type HubTab } from '../../../../components/chat/communicationHubModel';
import type { Partner } from '../../../../domain/partners';
import type { CalendarEvent } from '../../../../domain/calendar';
import type { SupportThreadStatus, SupportTopic } from '../../../../domain/support';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductCommandHeader, ProductDashboardSkeleton, ProductEmptyState } from '../components/ProductUi';
import { ProductCommsStage } from '../components/ProductCommsStage';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerMessagesInboxSurface.css';
import '../components/productCommsStage.css';

type InboxFilter = 'all' | 'action' | 'open';

type ThreadRow = {
  id: string;
  subject: string;
  preview: string;
  when: string;
  whenShort: string;
  status: SupportThreadStatus;
  topic: SupportTopic;
  unread: boolean;
};

type ReachChannel = {
  id: HubTab;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const REACH_CHANNELS: ReachChannel[] = [
  { id: 'ai', label: 'Ask Finely', hint: 'Credit coach', accent: 'emerald', icon: Sparkles },
  { id: 'team', label: 'Specialist', hint: 'Team chat', accent: 'violet', icon: Users },
  { id: 'meetings', label: 'Meetings', hint: 'Book a session', accent: 'sky', icon: Video },
  { id: 'guide', label: 'Guide', hint: 'What to do here', accent: 'rose', icon: Compass },
];

function formatMeetingWhen(event: CalendarEvent | null): { value: string; hint: string } {
  if (!event) return { value: '—', hint: 'Book a session to add one' };
  const start = new Date(event.startAt);
  const value = start.toLocaleDateString(undefined, { weekday: 'short' });
  const hint = start.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return { value, hint };
}

function fmtRelative(iso: string): { short: string; full: string } {
  try {
    const date = new Date(iso);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return { short: 'Now', full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) };
    if (diffMin < 60) return { short: `${diffMin}m`, full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) };
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return { short: `${diffHr}h`, full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) };
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return { short: `${diffDay}d`, full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) };
    return {
      short: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    };
  } catch {
    return { short: iso, full: iso };
  }
}

function topicLabel(topic: SupportTopic): string {
  return SUPPORT_TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

function partnerStatusMeta(status: SupportThreadStatus): { label: string; tone: 'action' | 'waiting' | 'done' } {
  switch (status) {
    case 'waiting_on_partner':
      return { label: 'Reply needed', tone: 'action' };
    case 'new':
    case 'triaged':
      return { label: 'New update', tone: 'action' };
    case 'waiting_on_team':
      return { label: 'Specialist reviewing', tone: 'waiting' };
    case 'resolved':
      return { label: 'Resolved', tone: 'done' };
    case 'closed':
      return { label: 'Closed', tone: 'done' };
    default:
      return { label: status, tone: 'waiting' };
  }
}

function threadRowsFromPartner(partnerId: string): ThreadRow[] {
  return listThreadsByPartner(partnerId).map((thread) => {
    const messages = listMessagesByThread(thread.id);
    const last = messages[messages.length - 1];
    const when = fmtRelative(thread.lastMessageAt);
    return {
      id: thread.id,
      subject: thread.subject,
      preview: last?.body?.slice(0, 160) || 'No messages yet',
      when: when.full,
      whenShort: when.short,
      status: thread.status,
      topic: thread.topic,
      unread: thread.status === 'waiting_on_partner' || thread.status === 'new',
    };
  });
}

function demoThreadRows(): ThreadRow[] {
  const spec = getWorkspaceProductPageSpec('partner', 'messages');
  return (spec?.items ?? []).slice(0, 6).map((item, index) => ({
    id: `demo-${index}`,
    subject: item.title,
    preview: item.description,
    when: item.meta,
    whenShort: item.meta.split('·')[0]?.trim() || item.meta,
    status: item.status === 'needs_action' ? 'waiting_on_partner' : item.status === 'waiting' ? 'waiting_on_team' : 'triaged',
    topic: 'general' as SupportTopic,
    unread: item.status === 'needs_action',
  }));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      partner: Partner | null;
      threadCount: number;
      unreadCount: number;
      openThreadsCount: number;
      filesSharedCount: number;
      nextMeeting: CalendarEvent | null;
      threads: ThreadRow[];
    };

function InboxSignalStrip({
  unreadCount,
  openThreadsCount,
  meetingSummary,
  filesSharedCount,
  onOpen,
}: {
  unreadCount: number;
  openThreadsCount: number;
  meetingSummary: { value: string; hint: string };
  filesSharedCount: number;
  onOpen: (tab: HubTab) => void;
}) {
  const tiles = [
    { label: 'Unread', value: unreadCount, hint: unreadCount ? 'Needs your reply' : 'All caught up', accent: 'emerald' as const, tab: 'team' as const },
    { label: 'Open threads', value: openThreadsCount, hint: 'Active conversations', accent: 'violet' as const, tab: 'team' as const },
    { label: 'Next session', value: meetingSummary.value, hint: meetingSummary.hint, accent: 'sky' as const, tab: 'meetings' as const },
    { label: 'Files shared', value: filesSharedCount, hint: 'Secure attachments', accent: 'rose' as const, tab: 'team' as const },
  ];

  return (
    <div className="fc-partner-inbox-signals">
      {tiles.map((tile) => (
        <button
          key={tile.label}
          type="button"
          className={`fc-partner-inbox-signal ${finelyOsCatalogCard(tile.accent)}`}
          data-fc-accent={tile.accent}
          onClick={() => onOpen(tile.tab)}
        >
          <strong>{tile.value}</strong>
          <span>{tile.label}</span>
          <em>{tile.hint}</em>
        </button>
      ))}
    </div>
  );
}

function InboxThreadRail({
  threads,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  composeDraft,
  onComposeChange,
  onComposeSend,
  onOpenChannel,
}: {
  threads: ThreadRow[];
  filter: InboxFilter;
  onFilterChange: (next: InboxFilter) => void;
  selectedId: string | null;
  onSelect: (thread: ThreadRow) => void;
  composeDraft: string;
  onComposeChange: (value: string) => void;
  onComposeSend: () => void;
  onOpenChannel: (tab: HubTab) => void;
}) {
  const filtered = useMemo(() => {
    if (filter === 'action') return threads.filter((t) => t.unread);
    if (filter === 'open') return threads.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
    return threads;
  }, [filter, threads]);

  return (
    <aside className="fc-partner-inbox-rail" aria-label="Conversation threads">
      <span className="fc-partner-inbox-rail-label">
        <Inbox size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
        Your inbox
      </span>

      <div className="fc-partner-inbox-compose" data-fc-accent="emerald">
        <div className="fc-partner-inbox-rail-label">Write to your specialist</div>
        <textarea
          value={composeDraft}
          onChange={(e) => onComposeChange(e.target.value)}
          placeholder="Ask a question or share an update…"
          rows={4}
          aria-label="Message to your specialist"
        />
        <div className="fc-partner-inbox-compose-actions">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onComposeSend} disabled={!composeDraft.trim()}>
            <Send size={15} /> Send message
          </button>
        </div>
      </div>

      <div className="fc-partner-inbox-filters" role="tablist" aria-label="Filter conversations">
        {(
          [
            { id: 'all' as const, label: 'All', accent: 'violet' as const },
            { id: 'action' as const, label: 'Needs reply', accent: 'emerald' as const },
            { id: 'open' as const, label: 'Open', accent: 'sky' as const },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={filter === chip.id}
            className="fc-partner-inbox-filter"
            data-active={filter === chip.id ? 'true' : undefined}
            data-accent={chip.accent}
            onClick={() => onFilterChange(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="fc-partner-inbox-thread-list">
        {filtered.length === 0 ? (
          <div className="fc-partner-inbox-empty-threads">No conversations in this view yet.</div>
        ) : (
          filtered.map((thread) => {
            const meta = partnerStatusMeta(thread.status);
            return (
              <button
                key={thread.id}
                type="button"
                className="fc-partner-inbox-thread"
                data-active={selectedId === thread.id ? 'true' : undefined}
                data-unread={thread.unread ? 'true' : undefined}
                onClick={() => onSelect(thread)}
              >
                <div className="fc-partner-inbox-thread-head">
                  <span className="fc-partner-inbox-thread-subject">{thread.subject}</span>
                  <span className="fc-partner-inbox-thread-when" title={thread.when}>
                    {thread.whenShort}
                  </span>
                </div>
                <p className="fc-partner-inbox-thread-preview">{thread.preview}</p>
                <div className="fc-partner-inbox-thread-meta">
                  <span className="fc-partner-inbox-thread-badge" data-tone={meta.tone}>
                    {meta.label}
                  </span>
                  <span className="fc-partner-inbox-thread-topic">{topicLabel(thread.topic)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="fc-partner-inbox-reach">
        {REACH_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <button key={channel.id} type="button" className="fc-partner-inbox-reach-btn" onClick={() => onOpenChannel(channel.id)}>
              <Icon size={16} strokeWidth={2.2} />
              <span>
                <strong>{channel.label}</strong>
                {channel.hint}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function PartnerMessagesProductSurface({ partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeDraft, setComposeDraft] = useState('');
  const [hubTab, setHubTab] = useState<HubTab>('ai');

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    getPartner(partnerId!)
      .then((partner) => {
        if (cancelled) return;
        const threads = listThreadsByPartner(partnerId!);
        const events = listEventsByPartner(partnerId!);
        const now = Date.now();
        const unreadCount = threads.filter((t) => t.status === 'waiting_on_partner').length;
        const openThreadsCount = threads.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
        const nextMeeting =
          events
            .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
            .sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;
        let filesSharedCount = 0;
        for (const thread of threads) {
          for (const message of listMessagesByThread(thread.id)) {
            filesSharedCount += message.attachments?.length ?? 0;
          }
        }
        const rows = threadRowsFromPartner(partnerId!);
        setState({
          status: 'ready',
          partner,
          threadCount: threads.length,
          unreadCount,
          openThreadsCount,
          filesSharedCount,
          nextMeeting,
          threads: rows,
        });
        setSelectedThreadId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: (err as Error)?.message || 'Could not load your messages.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', 'messages'), []);
  const demoThreads = useMemo(() => demoThreadRows(), []);
  const loadedPartner = state.status === 'ready' ? state.partner : null;
  const partnerName = loadedPartner?.profile?.fullName;
  const partnerLane = loadedPartner?.lane;

  const openHub = (tab: HubTab, opts?: { threadId?: string; prompt?: string }) => {
    setHubTab(tab);
    openCommunicationHub({
      tab,
      threadId: opts?.threadId,
      prompt: opts?.prompt,
      partnerId,
      partnerDisplayName: partnerName,
      lane: partnerLane,
      expanded: true,
    });
  };

  useEffect(() => {
    const raw = searchParams.get('hub');
    if (!raw) return;
    const tab = normalizeHubTab(raw);
    setHubTab(tab);
    openCommunicationHub({
      tab,
      partnerId,
      partnerDisplayName: partnerName,
      lane: partnerLane,
      expanded: true,
    });
    const next = new URLSearchParams(searchParams);
    next.delete('hub');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, partnerId, partnerName, partnerLane]);

  const handleSelectThread = (thread: ThreadRow) => {
    setSelectedThreadId(thread.id);
    if (!thread.id.startsWith('demo-')) {
      openHub('team', { threadId: thread.id });
    } else {
      openHub('team');
    }
  };

  const handleComposeSend = () => {
    const draft = composeDraft.trim();
    if (!draft) return;
    openHub('team', { prompt: draft });
    setComposeDraft('');
  };

  const askFinelyPrompt = 'What should I ask my specialist about right now?';

  const inboxLayout = (threads: ThreadRow[], metrics: {
    unreadCount: number;
    openThreadsCount: number;
    filesSharedCount: number;
    meetingSummary: { value: string; hint: string };
    threadCount: number;
    isEmpty: boolean;
  }) => (
    <>
      {metrics.isEmpty ? (
        <FinelyOsAlertBanner
          surface="light"
          tone="info"
          message="You do not have any conversations yet — write your specialist below to get started."
        />
      ) : null}

      <div className="fc-partner-inbox-stage">
        <InboxSignalStrip
          unreadCount={metrics.unreadCount}
          openThreadsCount={metrics.openThreadsCount}
          meetingSummary={metrics.meetingSummary}
          filesSharedCount={metrics.filesSharedCount}
          onOpen={openHub}
        />
        <ProductCommsStage
          accent="violet"
          partnerId={partnerId}
          partnerDisplayName={partnerName}
          lane={partnerLane}
          journeyStage={loadedPartner?.journeyStage}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Messages' })}>
            <CircleHelp size={14} /> Ask Finely
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources#presenter-demo')}>
            <PlayCircle size={14} /> Watch how
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/portal/calendar')}>
            <CalendarClock size={14} /> Book a session
          </button>
        </div>
      </div>

      <p className={`text-center text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </>
  );

  if (isDemo) {
    return (
      <div className="fc-partner-inbox-studio" data-surface-layout="partner-inbox">
        <ProductCommandHeader
          roleLabel={demoSpec?.eyebrow ?? 'Partner inbox'}
          title="Messages with your specialist, Ask Finely, and meetings."
          description="Every reply stays tied to the report, letter, document, or task you are working on."
          status={`${demoSpec?.status ?? '1 unread update'} · demo data`}
          freshness="demo snapshot"
          primaryAction={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => openHub('team')}>
              <Mail size={15} /> Message specialist
            </button>
          }
          secondaryAction={
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => openHub('meetings')}>
              <Video size={15} /> Book a session
            </button>
          }
        />
        {inboxLayout(demoThreads, {
          unreadCount: 1,
          openThreadsCount: 2,
          filesSharedCount: 3,
          meetingSummary: { value: 'Tue', hint: '11:30 AM session' },
          threadCount: demoThreads.length,
          isEmpty: false,
        })}
      </div>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your messages" />;
  }

  if (state.status === 'error') {
    return (
      <ProductEmptyState
        title="We couldn't load your messages"
        description={state.message}
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
            Try again
          </button>
        }
      />
    );
  }

  const { threadCount, unreadCount, openThreadsCount, filesSharedCount, nextMeeting, threads } = state;
  const meetingSummary = formatMeetingWhen(nextMeeting);
  const statusHeadline = unreadCount > 0
    ? `${unreadCount} update${unreadCount === 1 ? '' : 's'} waiting on you`
    : openThreadsCount > 0
      ? `${openThreadsCount} open conversation${openThreadsCount === 1 ? '' : 's'}`
      : 'No open conversations right now';

  return (
    <div className="fc-partner-inbox-studio" data-surface-layout="partner-inbox">
      <ProductCommandHeader
        roleLabel="Partner inbox"
        title="Messages with your specialist, Ask Finely, and meetings."
        description="Write your specialist, Ask Finely, or book a session — replies stay tied to the report, letter, or task you are discussing."
        status={`${statusHeadline} · live data`}
        freshness="just now"
        primaryAction={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => openHub('team')}>
            <Mail size={15} /> Message specialist
          </button>
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/portal/calendar')}>
            <CalendarClock size={15} /> Book a session
          </button>
        }
      />
      {inboxLayout(threads, {
        unreadCount,
        openThreadsCount,
        filesSharedCount,
        meetingSummary,
        threadCount,
        isEmpty: threadCount === 0,
      })}
    </div>
  );
}
