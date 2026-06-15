import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { listCalendarEvents } from '../../data/calendarRepo';
import { buildFinelyMeetingEmbedUrl, meetingRoomName } from '../../lib/meetingUrls';
import { isAdminEmail } from '../../auth/admin';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

export default function VideoMeetingRoomPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const isAdmin = isAdminEmail(auth.user?.email);

  const event = useMemo(() => {
    if (!eventId) return null;
    return listCalendarEvents().find((e) => e.id === eventId) ?? null;
  }, [eventId]);

  const displayName = partner?.profile?.fullName || auth.user?.email || 'Guest';
  const email = partner?.profile?.email || auth.user?.email || undefined;
  const room = eventId ? meetingRoomName(eventId) : '';
  const embedSrc = eventId
    ? buildFinelyMeetingEmbedUrl({
        roomName: room,
        displayName,
        email,
        subject: event?.title,
      })
    : '';

  useEffect(() => {
    document.title = event?.title ? `${event.title} — Finely Meeting` : 'Finely Video Meeting';
  }, [event?.title]);

  if (!eventId) {
    return (
      <PageShell badge="Meeting" title="Invalid meeting" subtitle="No meeting id provided.">
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={14} /> Go back
          </button>
        </div>
      </PageShell>
    );
  }

  const canAccess = isAdmin || (partner && event && event.partnerId === partner.id);

  if (event && !canAccess) {
    return (
      <PageShell badge="Meeting" title="Not authorized" subtitle="This meeting is not linked to your profile.">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_LUXURY_EMPTY}>This meeting is not linked to your profile.</div>
          <button type="button" onClick={() => navigate('/portal/calendar')} className={FINELY_OS_SUCCESS_BTN}>
            Open calendar
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1210] flex flex-col">
      <div className="shrink-0 border-b border-white/[0.08] bg-fc-input px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300 inline-flex items-center gap-2`}>
            <Video size={14} /> Finely video meeting
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{event?.title ?? 'Session room'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(isAdmin ? '/admin/calendar' : '/portal/calendar')}
            className={FINELY_OS_SECONDARY_BTN}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal/messages?hub=meetings')}
            className={FINELY_OS_SECONDARY_BTN}
          >
            Communication hub
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-2 md:p-4">
        <iframe
          title={event?.title ?? 'Video meeting'}
          src={embedSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-[calc(100vh-88px)] min-h-[480px] rounded-2xl border border-sky-500/20 bg-black"
        />
      </div>
      <div className="shrink-0 px-4 py-2 text-[10px] text-white/40 text-center">
        Secure browser-based video · Admin, specialist, and client rooms · Room: {room}
      </div>
    </div>
  );
}
