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
}: FinelyCommunicationHubProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatEnabled = isFeatureEnabled('portalChat') || isFeatureEnabled('aiGateway');
  const messagingEnabled = isFeatureEnabled('inAppMessaging');
  const hubTabs = useMemo(
    () => (messagingEnabled ? HUB_TABS : HUB_TABS.filter((t) => t.id !== 'team')),
    [messagingEnabled],
  );

  const urlTabRaw = searchParams.get('hub');
  const urlTab = normalizeHubTab(urlTabRaw ?? initialTab ?? 'ai');
  const urlThread = searchParams.get('thread') ?? undefined;
  const urlTopic = (searchParams.get('topic') as SupportTopic | null) ?? undefined;
  const explicitOpen = searchParams.get('openHub') === '1' || searchParams.get('openHub') === 'true';

  const [open, setOpen] = useState(() => mode === 'page' || (mode === 'floating' && explicitOpen));
  const [expanded, setExpanded] = useState(mode === 'page');
  const [tab, setTab] = useState<HubTab>(normalizeHubTab(initialTab ?? urlTab));
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId ?? urlThread ?? undefined);
  const [topic, setTopic] = useState<SupportTopic | undefined>(initialTopic ?? urlTopic ?? undefined);

  const unreadHint = useMemo(() => {
    if (tab === 'team') return 'Team threads — AI suggests who to message';
    if (tab === 'ai') return 'AI coach — smart routing to the right specialist';
    return 'Meetings · Guide · Calendar';
  }, [tab]);

  useEffect(() => {
    setTab(normalizeHubTab(urlTabRaw ?? initialTab ?? 'ai'));
    if (urlThread) setThreadId(urlThread);
    if (urlTopic) setTopic(urlTopic);
    if (mode === 'floating' && (explicitOpen || urlTabRaw)) {
      setOpen(true);
    }
  }, [urlTabRaw, urlThread, urlTopic, mode, explicitOpen, initialTab]);

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
      };
      setOpen(true);
      if (detail.tab) setTab(normalizeHubTab(detail.tab));
      if (detail.threadId) setThreadId(detail.threadId);
      if (detail.topic) setTopic(detail.topic);
      if (detail.expanded) setExpanded(true);
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

  const panelContent = (
    <>
      <div className={FINELY_OS_COMMS_HEADER}>
        <div className={FINELY_OS_COMMS_HEADER_INNER}>
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
              onClick={() => navigate(PORTAL_COMMS_PATHS.calendar)}
              className="p-2 rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
              title="Open calendar & video meetings"
              aria-label="Open calendar and video meetings"
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
                  onClick={() => navigate(`/portal/messages?hub=${tab}${topic ? `&topic=${topic}` : ''}`)}
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

        <div className="flex border-b border-white/[0.08] overflow-x-auto bg-fc-chrome/98">
          {hubTabs.map((t) => (
            <button key={t.id} type="button" onClick={() => switchTab(t.id)} className={finelyOsCommsTab(tab === t.id)}>
              <span className="mr-1">{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {partnerId ? <CommsProactiveNudges partnerId={partnerId} /> : null}

      <div
        className={`flex-1 min-h-0 overflow-hidden ${
          expanded || mode === 'page' ? 'min-h-[420px]' : 'max-h-[52vh]'
        }`}
      >
        {(tab === 'ai' || tab === 'chat') && (
          <HubAiCoachPanel
            partnerId={partnerId}
            lane={lane}
            journeyStage={journeyStage}
            userName={partnerDisplayName}
            compact={!expanded && mode === 'floating'}
            showAllAgents={showAllAgents}
          />
        )}
        {(tab === 'team') && (
          messagingEnabled ? (
            <HubTeamChatPanel
              partnerId={partnerId}
              partnerDisplayName={partnerDisplayName}
              compact={!expanded && mode === 'floating'}
              initialThreadId={threadId}
              initialTopic={topic}
              lane={lane}
              adminMode={adminMode}
            />
          ) : (
            <div className={`p-6 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              In-app messaging is disabled. Enable <span className="font-mono">inAppMessaging</span> in Admin Settings → Features.
            </div>
          )
        )}
        {tab === 'meetings' && (
          <HubMeetingsPanel partnerId={partnerId} partnerDisplayName={partnerDisplayName} compact={!expanded && mode === 'floating'} />
        )}
        {tab === 'guide' && <HubGuidePanel compact={!expanded && mode === 'floating'} onSwitchTab={switchTab} />}
      </div>
    </>
  );

  if (mode === 'page') {
    return (
      <div data-fc-comms-shell="1" data-fc-communication-hub="page" className={`${FINELY_OS_COMMS_SHELL} min-h-[640px]`}>
        {panelContent}
      </div>
    );
  }

  return (
    <div data-fc-communication-hub="floating" className="fixed bottom-5 right-5 z-[150]">
      {open ? (
        <div
          data-fc-comms-shell="1"
          className={`${FINELY_OS_COMMS_SHELL} transition-all ${
            expanded ? 'w-[min(920px,calc(100vw-40px))] h-[min(780px,calc(100vh-80px))]' : 'w-[min(520px,calc(100vw-40px))]'
          }`}
        >
          {panelContent}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={FINELY_OS_COMMS_LAUNCHER} title="Open Communication Hub">
          <div className="flex items-center gap-3">
            <div className={`relative ${FINELY_OS_COMMS_ICON} w-12 h-12`}>
              <MessageCircle size={20} className="text-fuchsia-300" />
              <Sparkles size={10} className="absolute -top-1 -right-1 text-sky-300" />
            </div>
            <div className="text-left">
              <div className={FINELY_OS_COMMS_LABEL}>Communication Hub</div>
              <div className="text-white/90 text-sm font-semibold">One chat — AI + team</div>
              <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Talk naturally · smart routing · no dropdowns</div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
