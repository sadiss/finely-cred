import React, { useEffect, useMemo } from 'react';
import { Copy, Users, Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { buildJoinUrl, endVideoCall, getVideoCall } from '../../data/videoCallsRepo';
import { listCalendarEvents } from '../../data/calendarRepo';
import { buildFinelyMeetingEmbedUrl, meetingRoomName } from '../../lib/meetingUrls';
import { isAdminEmail } from '../../auth/admin';
import { MeetingControlBar } from '../../components/video/MeetingControlBar';
import { useJitsiMeetingApi } from '../../hooks/useJitsiMeetingApi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

export default function InstantVideoCallPage() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const isAdmin = isAdminEmail(auth.user?.email);

  const instantCall = useMemo(() => (callId ? getVideoCall(callId) : null), [callId]);

  const calendarEvent = useMemo(() => {
    if (!callId || instantCall) return null;
    return listCalendarEvents().find((e) => e.id === callId) ?? null;
  }, [callId, instantCall]);

  const displayName = partner?.profile?.fullName || auth.user?.email || 'Guest';
  const email = partner?.profile?.email || auth.user?.email || undefined;

  const { title, embedSrc, room, canAccess, joinPath, participantLabels } = useMemo(() => {
    if (instantCall) {
      const path = `/portal/video/${instantCall.id}`;
      const access = isAdmin || (partner && instantCall.partnerId === partner.id);
      return {
        title: instantCall.title,
        embedSrc: buildJoinUrl(instantCall, displayName, email),
        room: instantCall.roomName,
        canAccess: access,
        joinPath: path,
        participantLabels: instantCall.participants?.map((p) => p.label) ?? [displayName],
      };
    }
    if (calendarEvent && callId) {
      const roomN = meetingRoomName(callId);
      const access = isAdmin || (partner && calendarEvent.partnerId === partner.id);
      return {
        title: calendarEvent.title,
        embedSrc: buildFinelyMeetingEmbedUrl({
          roomName: roomN,
          displayName,
          email,
          subject: calendarEvent.title,
        }),
        room: roomN,
        canAccess: access,
        joinPath: `/portal/meeting/${callId}`,
        participantLabels: [displayName, 'Finely team'],
      };
    }
    return { title: 'Video call', embedSrc: '', room: '', canAccess: false, joinPath: '', participantLabels: [] as string[] };
  }, [instantCall, calendarEvent, callId, displayName, email, isAdmin, partner]);

  useEffect(() => {
    document.title = title ? `${title} — Finely Video` : 'Finely Video';
  }, [title]);

  const jitsiContainerId = `finely-jitsi-${callId ?? 'room'}`;
  const useExternalApi = Boolean(room);
  const { controls: jitsi, error: jitsiErr } = useJitsiMeetingApi({
    roomName: room,
    displayName,
    email,
    subject: title,
    containerId: jitsiContainerId,
    enabled: useExternalApi && Boolean(canAccess),
  });

  const copyLink = async () => {
    const url = `${window.location.origin}${joinPath}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  if (!callId) {
    return (
      <div className="min-h-screen bg-[#0a1210] p-8 text-white/60">
        Invalid call id.{' '}
        <button type="button" onClick={() => navigate(-1)} className="text-sky-300 underline">
          Go back
        </button>
      </div>
    );
  }

  if (!instantCall && !calendarEvent) {
    return (
      <div className="min-h-screen bg-[#0a1210] p-8 text-white/60">
        Video room not found.{' '}
        <button type="button" onClick={() => navigate('/portal/messages?hub=meetings')} className="text-sky-300 underline">
          Open meetings
        </button>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-[#0a1210] p-8 text-white/60">
        This video room is not linked to your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1210] flex flex-col">
      <div className="shrink-0 border-b border-white/[0.08] bg-fc-input px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300 inline-flex items-center gap-2`}>
            <Video size={14} /> {instantCall ? 'Instant video call' : 'Scheduled meeting'}
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{title}</div>
          {participantLabels.length ? (
            <div className={`${FINELY_OS_ENTITY_BODY} text-[10px] mt-0.5 inline-flex items-center gap-1`}>
              <Users size={10} /> {participantLabels.join(' · ')}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void copyLink()} className={FINELY_OS_SECONDARY_BTN}>
            <Copy size={12} /> Copy link
          </button>
          <button type="button" onClick={() => navigate('/portal/messages?hub=meetings')} className={FINELY_OS_SECONDARY_BTN}>
            Hub
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <MeetingControlBar
          title={title}
          room={room}
          participants={participantLabels}
          onCopyLink={copyLink}
          jitsi={jitsi}
          showEndCall={Boolean(instantCall)}
          onEndCall={
            instantCall
              ? () => {
                  jitsi?.hangup();
                  endVideoCall(instantCall.id);
                  navigate('/portal/messages?hub=meetings');
                }
              : undefined
          }
        >
          {jitsiErr ? (
            <iframe
              title={title}
              src={embedSrc}
              data-meeting-frame
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className="w-full h-[calc(100vh-200px)] min-h-[420px] rounded-2xl border border-sky-500/20 bg-black shadow-[0_0_60px_rgba(14,165,233,0.08)]"
            />
          ) : (
            <div
              id={jitsiContainerId}
              data-meeting-frame
              className="w-full h-[calc(100vh-200px)] min-h-[420px] rounded-2xl border border-sky-500/20 bg-black overflow-hidden shadow-[0_0_60px_rgba(14,165,233,0.08)]"
            />
          )}
        </MeetingControlBar>
      </div>

      <div className={`shrink-0 px-4 py-2 text-[10px] ${FINELY_OS_ENTITY_BODY} text-center`}>
        Secure in-browser video · Grid, spotlight & sidebar layouts · Meeting notes · {room}
        {instantCall?.roomPin ? ` · PIN ${instantCall.roomPin}` : ''}
      </div>
    </div>
  );
}
