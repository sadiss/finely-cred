import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_CHANNELS, SUPPORT_TOPICS, openCommunicationHub } from './communicationHubModel';
import { COMMS_SURFACE_GUIDE } from '../comms/commsWorkspaceModel';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type Props = {
  compact?: boolean;
  onSwitchTab?: (tab: 'team' | 'ai' | 'meetings') => void;
};

export function HubGuidePanel({ compact, onSwitchTab }: Props) {
  const navigate = useNavigate();

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
            <button
              key={surface.id}
              type="button"
              onClick={() => {
                if (surface.path) navigate(surface.path);
              }}
              className={`w-full text-left ${finelyOsInlineListItem()} hover:border-fuchsia-500/25`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{surface.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm">{surface.title}</div>
                  <div className="text-xs text-white/55 mt-1">{surface.summary}</div>
                  <div className="text-[11px] text-white/40 mt-1">{surface.when}</div>
                </div>
                <ExternalLink size={14} className="text-white/30 shrink-0 mt-1" />
              </div>
            </button>
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
                  navigate(ch.path);
                  return;
                }
                if (onSwitchTab) {
                  onSwitchTab('team');
                  openCommunicationHub({ tab: 'team', topic: ch.path.includes('topic=') ? (new URLSearchParams(ch.path.split('?')[1]).get('topic') as any) : undefined });
                } else {
                  navigate(ch.path);
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
                  navigate(`/portal/messages?hub=team&topic=${t.value}`);
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
