import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Expand,
  MessageCircle,
  Minimize2,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  HUB_TABS,
  normalizeHubTab,
  OPEN_HUB_EVENT,
  type HubTab,
} from './communicationHubModel';
import { PORTAL_COMMS_PATHS } from '../comms/commsWorkspaceModel';
import { HubAiCoachPanel } from './HubAiCoachPanel';
import { HubTeamChatPanel } from './HubTeamChatPanel';
import { HubMeetingsPanel } from './HubMeetingsPanel';
import { HubGuidePanel } from './HubGuidePanel';
import { CommsProactiveNudges } from '../comms/CommsProactiveNudges';
import type { SupportTopic } from '../../domain/support';
import {
  FINELY_OS_COMMS_HEADER,
  FINELY_OS_COMMS_HEADER_INNER,
  FINELY_OS_COMMS_ICON,
  FINELY_OS_COMMS_LABEL,
  FINELY_OS_COMMS_LAUNCHER,
  FINELY_OS_COMMS_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  finelyOsCommsTab,
} from '../../features/os/finelyOsLightUi';

export type FinelyCommunicationHubProps = {
  mode?: 'floating' | 'page';
  partnerId?: string;
  partnerDisplayName?: string;
  lane?: string;
  journeyStage?: string;
  initialTab?: HubTab;
  initialThreadId?: string;
  initialTopic?: SupportTopic;
  /** Show full staff roster (admin ops) instead of lane-filtered agents. */
  showAllAgents?: boolean;
  /** Admin workspace — team tab links to support inbox instead of requiring a partner file. */
  adminMode?: boolean;
  /** Product review keeps hub navigation inside the redesigned workspace. */
  navigationMode?: 'preview' | 'live';
  /** Review mode can demonstrate the complete hub even before feature flags are configured. */
  forceEnabled?: boolean;
  /** Keeps shared hub behavior while matching the redesigned workspace presentation. */
  visualVariant?: 'default' | 'product';
  /** Hide the hub's own tab strip when an outer layout already owns the tabs. */
  hideTabstrip?: boolean;
};

export function FinelyCommunicationHub({
  mode = 'floating',
  partnerId,
  partnerDisplayName,
  lane,
  journeyStage,
  initialTab,
  initialThreadId,
  initialTopic,
  showAllAgents,
  adminMode,
  navigationMode = 'live',
  forceEnabled = false,
  visualVariant = 'default',
  hideTabstrip = false,
}: FinelyCommunicationHubProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatEnabled = forceEnabled || isFeatureEnabled('portalChat') || isFeatureEnabled('aiGateway');
  const messagingEnabled = forceEnabled || isFeatureEnabled('inAppMessaging');
  const hubTabs = useMemo(
    () => (messagingEnabled ? HUB_TABS : HUB_TABS.filter((t) => t.id !== 'team')),
    [messagingEnabled],
  );

  const urlTabRaw = searchParams.get('hub');
  const urlTab = normalizeHubTab(urlTabRaw ?? initialTab ?? 'ai');
  const urlThread = searchParams.get('thread') ?? undefined;
  const urlTopic = (searchParams.get('topic') as SupportTopic | null) ?? undefined;
  const explicitOpen = searchParams.get('openHub') === '1' || searchParams.get('openHub') === 'true';

  const [open, setOpen] = useState(() => mode === 'page');
  const [expanded, setExpanded] = useState(mode === 'page');
  const [tab, setTab] = useState<HubTab>(normalizeHubTab(initialTab ?? urlTab));
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId ?? urlThread ?? undefined);
  const [topic, setTopic] = useState<SupportTopic | undefined>(initialTopic ?? urlTopic ?? undefined);
  const [focusPartner, setFocusPartner] = useState<{
    id: string;
    displayName?: string;
    lane?: string;
  } | null>(null);
  const [coachDraft, setCoachDraft] = useState<{
    prompt: string;
    contextLabel?: string;
    key: number;
  } | null>(null);
  const [coachContextLabel, setCoachContextLabel] = useState<string | undefined>();

  const effectivePartnerId = focusPartner?.id ?? partnerId;
  const effectivePartnerName = focusPartner?.displayName ?? partnerDisplayName;
  const effectiveLane = focusPartner?.lane ?? lane;

  const unreadHint = useMemo(() => {
    if (tab === 'team') return 'Team messages';
    if (tab === 'ai') return 'AI coach';
    if (tab === 'meetings') return 'Meetings';
    if (tab === 'guide') return 'Guide';
    return 'Calendar';
  }, [tab]);

  useEffect(() => {
    setTab(normalizeHubTab(urlTabRaw ?? initialTab ?? 'ai'));
    if (urlThread) setThreadId(urlThread);
    if (urlTopic) setTopic(urlTopic);
  }, [urlTabRaw, urlThread, urlTopic, initialTab]);

  useEffect(() => {
    if (mode !== 'floating' || !explicitOpen) return;
    setOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('openHub');
        return next;
      },
      { replace: true },
    );
  }, [mode, explicitOpen, setSearchParams]);

  const switchTab = useCallback((next: HubTab) => {
    const normalized = normalizeHubTab(next);
    setTab(normalized);
    if (mode === 'page') {
      const p = new URLSearchParams(searchParams);
      p.set('hub', normalized === 'chat' ? 'ai' : normalized);
      navigate({ pathname: location.pathname, search: p.toString() }, { replace: true });
    }
  }, [mode, searchParams, navigate, location.pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        tab?: HubTab;
        threadId?: string;
        topic?: SupportTopic;
        expanded?: boolean;
        partnerId?: string;
        partnerDisplayName?: string;
        lane?: string;
        prompt?: string;
        contextLabel?: string;
      };
      setOpen(true);
      if (detail.tab) setTab(normalizeHubTab(detail.tab));
      if (detail.threadId) setThreadId(detail.threadId);
      if (detail.topic) setTopic(detail.topic);
      if (detail.expanded) setExpanded(true);
      if (detail.partnerId) {
        setFocusPartner({
          id: detail.partnerId,
          displayName: detail.partnerDisplayName,
          lane: detail.lane,
        });
      }
      if (detail.prompt) {
        setCoachDraft({
          prompt: detail.prompt,
          contextLabel: detail.contextLabel,
          key: Date.now(),
        });
      }
      if (detail.contextLabel) setCoachContextLabel(detail.contextLabel);
    };
    const onStaffDm = () => {
      setOpen(true);
      switchTab('team');
      setExpanded(true);
    };
    window.addEventListener(OPEN_HUB_EVENT, handler as EventListener);
    window.addEventListener('finely:staff-direct-message', onStaffDm as EventListener);
    return () => {
      window.removeEventListener(OPEN_HUB_EVENT, handler as EventListener);
      window.removeEventListener('finely:staff-direct-message', onStaffDm as EventListener);
    };
  }, [switchTab]);

  useEffect(() => {
    const onSwitch = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: HubTab }>).detail?.tab;
      if (tab) switchTab(tab);
    };
    window.addEventListener('finely:hub-switch-tab', onSwitch as EventListener);
    return () => window.removeEventListener('finely:hub-switch-tab', onSwitch as EventListener);
  }, [switchTab]);

  if (!chatEnabled && mode === 'floating') return null;

  const calendarPath =
    navigationMode === 'preview'
      ? adminMode
        ? '/preview/workspace-light/admin/calendar'
        : '/preview/workspace-light/portal/calendar'
      : adminMode
        ? '/admin/calendar'
        : PORTAL_COMMS_PATHS.calendar;
  const messagesPath =
    navigationMode === 'preview'
      ? adminMode
        ? '/preview/workspace-light/admin/communications'
        : '/preview/workspace-light/portal/messages'
      : adminMode
        ? '/admin/comms'
        : '/portal/messages';

  const panelContent = (
    <>
      <div className={FINELY_OS_COMMS_HEADER}>
          <div className={`${FINELY_OS_COMMS_HEADER_INNER} ${!expanded && mode === 'floating' ? '!p-3' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={FINELY_OS_COMMS_ICON}>
              <MessageCircle size={20} className="text-fuchsia-300" />
            </div>
            <div className="min-w-0">
              <div className={FINELY_OS_COMMS_LABEL}>Communication Hub</div>
              <div className={`text-[11px] truncate ${FINELY_OS_ENTITY_BODY}`}>{unreadHint}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (mode === 'page') {
                  switchTab('meetings');
                  return;
                }
                navigate(calendarPath);
              }}
              className="p-2 rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
              title={mode === 'page' ? 'Open meetings in Communication Hub' : adminMode ? 'Open admin calendar' : 'Open calendar & video meetings'}
              aria-label={mode === 'page' ? 'Open meetings in Communication Hub' : adminMode ? 'Open admin calendar' : 'Open calendar and video meetings'}
            >
              <Calendar size={14} />
            </button>
            {mode === 'floating' && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !p-2`}
                  title={expanded ? 'Compact' : 'Expand'}
                  aria-label={expanded ? 'Compact communication hub' : 'Expand communication hub'}
                >
                  {expanded ? <Minimize2 size={14} /> : <Expand size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`${messagesPath}?hub=${tab}${topic ? `&topic=${topic}` : ''}`)}
                  className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !p-2 text-[10px] font-black uppercase`}
                  title="Open full page"
                  aria-label="Open communication hub full page"
                >
                  ↗
                </button>
                <button type="button" onClick={() => setOpen(false)} className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !p-2`} aria-label="Close communication hub">
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {hideTabstrip ? null : (
        <div className={`fc-comms-tabstrip flex overflow-x-auto ${!expanded && mode === 'floating' ? '[&_.fc-comms-tab]:!py-2' : ''}`}>
          {hubTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={finelyOsCommsTab(tab === t.id)}
              data-active={tab === t.id ? 'true' : undefined}
            >
              <span className="mr-1">{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
        )}
      </div>

      {effectivePartnerId ? <CommsProactiveNudges partnerId={effectivePartnerId} /> : null}

      <div
        className={`flex-1 min-h-0 overflow-hidden ${
          expanded || mode === 'page' ? 'min-h-[420px]' : ''
        }`}
      >
        {(tab === 'ai' || tab === 'chat') && (
          <HubAiCoachPanel
            partnerId={effectivePartnerId}
            lane={effectiveLane}
            journeyStage={journeyStage}
            userName={effectivePartnerName}
            compact={!expanded && mode === 'floating'}
            showAllAgents={showAllAgents}
            navigationMode={navigationMode}
            workspaceRole={adminMode ? 'admin' : 'partner'}
            draftPrompt={coachDraft?.prompt}
            draftPromptKey={coachDraft?.key}
            contextLabel={coachDraft?.contextLabel ?? coachContextLabel}
          />
        )}
        {(tab === 'team') && (
          messagingEnabled ? (
            <HubTeamChatPanel
              partnerId={effectivePartnerId}
              partnerDisplayName={effectivePartnerName}
              compact={!expanded && mode === 'floating'}
              initialThreadId={threadId}
              initialTopic={topic}
              lane={effectiveLane}
              adminMode={adminMode}
              navigationMode={navigationMode}
            />
          ) : (
            <div className={`p-6 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              In-app messaging is disabled. Enable <span className="font-mono">inAppMessaging</span> in Admin Settings → Features.
            </div>
          )
        )}
        {tab === 'meetings' && (
          <HubMeetingsPanel
            partnerId={effectivePartnerId}
            partnerDisplayName={effectivePartnerName}
            compact={!expanded && mode === 'floating'}
            adminMode={adminMode}
            calendarPath={calendarPath}
          />
        )}
        {tab === 'guide' && (
          <HubGuidePanel
            compact={!expanded && mode === 'floating'}
            onSwitchTab={switchTab}
            partnerId={effectivePartnerId}
            navigationMode={navigationMode}
            workspaceRole={adminMode ? 'admin' : 'partner'}
          />
        )}
      </div>
    </>
  );

  if (mode === 'page') {
    return (
      <div
        data-fc-comms-shell="1"
        data-fc-communication-hub="page"
        data-fc-obsidian-chat="1"
        data-visual-variant={visualVariant}
        className={`${FINELY_OS_COMMS_SHELL} min-h-[640px]`}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <div
      data-fc-communication-hub="floating"
      data-fc-obsidian-chat="1"
      data-open={open ? 'true' : 'false'}
      data-visual-variant={visualVariant}
      className="fixed z-[150] bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] left-auto w-fit max-w-[calc(100vw-2rem)] bg-transparent shadow-none border-0"
    >
      {open ? (
        <div
          data-fc-comms-shell="1"
          role="dialog"
          aria-label="Communication Hub"
          className={`${FINELY_OS_COMMS_SHELL} transition-all max-lg:fixed max-lg:inset-0 max-lg:w-full max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:rounded-none ${
            expanded
              ? 'lg:w-[min(920px,calc(100vw-40px))] lg:h-[min(780px,calc(100vh-80px))]'
              : 'lg:w-[min(520px,calc(100vw-40px))] lg:h-[min(720px,calc(100vh-80px))]'
          }`}
        >
          {panelContent}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${FINELY_OS_COMMS_LAUNCHER} max-w-[calc(100vw-2rem)]`}
          title="Open chat"
          aria-label="Open chat"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative ${FINELY_OS_COMMS_ICON} w-12 h-12 shrink-0`}>
              <MessageCircle size={20} className="text-fuchsia-300" />
              <Sparkles size={10} className="absolute -top-1 -right-1 text-sky-300" />
            </div>
            <div className="text-left min-w-0">
              <div className={FINELY_OS_COMMS_LABEL}>Chat</div>
              <div className="text-white/90 text-sm font-semibold truncate">Ask Finely</div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
