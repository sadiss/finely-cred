import React from 'react';
import { ExternalLink, MessageSquareText, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_CHANNELS, SUPPORT_TOPICS, openCommunicationHub } from './communicationHubModel';
import { COMMS_SURFACE_GUIDE } from '../comms/commsWorkspaceModel';
import { shareGuideToChat } from '../../lib/creditAnalysisChatSharing';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import { resolveWorkspaceProductPath } from '../../features/workspaceLightPreview/product/workspaceProductNav';

type Props = {
  compact?: boolean;
  onSwitchTab?: (tab: 'team' | 'ai' | 'meetings') => void;
  partnerId?: string;
  navigationMode?: 'preview' | 'live';
  workspaceRole?: 'partner' | 'admin';
};

export function HubGuidePanel({
  compact,
  onSwitchTab,
  partnerId,
  navigationMode = 'live',
  workspaceRole = 'partner',
}: Props) {
  const navigate = useNavigate();
  const navigateTo = (target: string) =>
    navigate(
      resolveWorkspaceProductPath(
        target.startsWith('/admin') ? 'admin' : workspaceRole,
        target,
        navigationMode,
      ),
    );

  const shareGuide = (guide: { title: string; summary: string; path?: string }) => {
    if (!partnerId || !guide.path) return;
    const res = shareGuideToChat({
      partnerId,
      title: guide.title,
      summary: guide.summary,
      url: guide.path,
      actorRole: 'partner',
    });
    if (onSwitchTab) onSwitchTab('team');
    openCommunicationHub({ tab: 'team', threadId: res.threadId, topic: 'documents', expanded: true, partnerId });
  };

  return (
    <div className={`space-y-4 overflow-y-auto ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`${FINELY_OS_BANNER} !p-4`}>
        <div className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-300 font-black">🧭 One hub for everything</div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
          AI coach, team threads, and a meetings preview live here. Book and join video sessions on Calendar — not in chat. Admin template sends (Comms Studio) appear as messages in your threads.
        </p>
      </div>

      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Which tool when?</div>
        <div className="space-y-2">
          {COMMS_SURFACE_GUIDE.filter((s) => s.audience !== 'admin').map((surface) => (
            <div
              key={surface.id}
              className={`w-full ${finelyOsInlineListItem()} hover:border-fuchsia-500/25`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{surface.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm">{surface.title}</div>
                  <div className="text-xs text-white/55 mt-1">{surface.summary}</div>
                  <div className="text-[11px] text-white/40 mt-1">{surface.when}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {surface.path ? (
                      <button
                        type="button"
                        onClick={() => navigateTo(surface.path!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/75 hover:bg-white/[0.08]"
                      >
                        <ExternalLink size={11} /> Open
                      </button>
                    ) : null}
                    {partnerId && surface.path ? (
                      <button
                        type="button"
                        onClick={() => shareGuide(surface)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/20"
                      >
                        <MessageSquareText size={11} /> Share in chat
                      </button>
                    ) : null}
                  </div>
                </div>
                <ExternalLink size={14} className="text-white/30 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
        <p className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
          Comms Studio is admin-only outbound messaging — partners see those posts here in Team chat, not in a separate inbox.
        </p>
      </div>

      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Role channels</div>
        <div className="space-y-2">
          {ROLE_CHANNELS.map((ch) => (
            <button
              key={ch.role}
              type="button"
              onClick={() => {
                if (ch.path.startsWith('/admin')) {
                  navigateTo(ch.path);
                  return;
                }
                if (onSwitchTab) {
                  onSwitchTab('team');
                  openCommunicationHub({ tab: 'team', topic: ch.path.includes('topic=') ? (new URLSearchParams(ch.path.split('?')[1]).get('topic') as any) : undefined });
                } else {
                  navigateTo(ch.path);
                }
              }}
              className={`w-full text-left ${finelyOsInlineListItem()} hover:border-fuchsia-500/25`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ch.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm">{ch.label}</div>
                  <div className="text-xs text-white/50 mt-0.5">{ch.desc}</div>
                </div>
                <ExternalLink size={14} className="text-white/30 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Thread topics</div>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_TOPICS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                if (onSwitchTab) {
                  onSwitchTab('team');
                  openCommunicationHub({ tab: 'team', topic: t.value });
                } else {
                  navigateTo(`/portal/messages?hub=team&topic=${t.value}`);
                }
              }}
              className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_CHIP} hover:bg-white/[0.06] text-xs`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex items-start gap-3`}>
        <Shield size={18} className="text-fuchsia-400 shrink-0 mt-0.5" />
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Attachments upload to your Documents vault and link to threads. GIF search uses Tenor when configured in admin settings. Escalations and disputes still deep-link here for continuity.
        </div>
      </div>
    </div>
  );
}
