import React, { useState } from 'react';
import { Loader2, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createInstantVideoCall,
  formatVideoCallInviteMessage,
} from '../../data/videoCallsRepo';
import type { VideoCallParticipant, VideoParticipantRole } from '../../domain/videoCalls';
import { addThreadMessage, listThreadsByPartner } from '../../data/supportRepo';

type Props = {
  partnerId: string;
  threadId?: string;
  displayName: string;
  userRole?: VideoParticipantRole;
  compact?: boolean;
  defaultTitle?: string;
  invitees?: VideoCallParticipant[];
};

export function StartVideoCallButton({
  partnerId,
  threadId,
  displayName,
  userRole = 'partner',
  compact,
  defaultTitle = 'Finely video session',
  invitees,
}: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const startCall = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const participants: VideoCallParticipant[] = invitees?.length
        ? [{ role: userRole, label: displayName || 'You' }, ...invitees]
        : [
            { role: userRole, label: displayName || 'You' },
            { role: 'finely_staff', label: 'Finely Cred team' },
            ...(userRole === 'specialist'
              ? [{ role: 'client' as const, label: 'Client (invite via link)' }]
              : userRole === 'affiliate'
                ? [{ role: 'affiliate' as const, label: 'Affiliate partner' }]
                : [{ role: 'specialist' as const, label: 'Your credit specialist' }]),
          ];

      const call = createInstantVideoCall({
        partnerId,
        threadId,
        title: defaultTitle,
        createdBy: { displayName, role: userRole },
        participants,
      });

      const joinPath = `/portal/video/${call.id}`;
      if (threadId) {
        const thread = listThreadsByPartner(partnerId).find((t) => t.id === threadId);
        if (thread) {
          addThreadMessage({
            threadId,
            partnerId,
            topic: thread.topic,
            fromPartner: true,
            body: formatVideoCallInviteMessage(call, joinPath),
          });
        }
      }

      navigate(joinPath);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void startCall()}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl bg-sky-500 text-black font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all ${
        compact ? 'px-3 py-2 text-[9px]' : 'px-4 py-2.5 text-[10px]'
      }`}
      title="Start instant video — share link in thread"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
      {busy ? 'Starting…' : compact ? 'Video' : 'Start video call'}
    </button>
  );
}
