/**
 * Scheduled session — cinematic video stage + runway sidebar.
 * REAL TOOLS: Jitsi External API, MeetingControlBar, StartVideoCallButton, copy link, calendar notes.
 */
import React, { useEffect, useMemo } from 'react';
import { Calendar, Clock, Copy, Users, Video } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { useAuth } from '../../../../auth/AuthProvider';
import { listCalendarEvents, setEventPostMeetingIntel } from '../../../../data/calendarRepo';
import { buildFinelyMeetingEmbedUrl, meetingRoomName } from '../../../../lib/meetingUrls';
import { isAdminEmail } from '../../../../auth/admin';
import { MeetingControlBar } from '../../../../components/video/MeetingControlBar';
import { StartVideoCallButton } from '../../../../components/video/StartVideoCallButton';
import { useJitsiMeetingApi } from '../../../../hooks/useJitsiMeetingApi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { ProductHubScaffold } from '../components/ProductHubScaffold';
import { ProductEmptyState } from '../components/ProductUi';
import { FINELY_OS_SECONDARY_BTN } from '../../../os/finelyOsLightUi';
import './partnerVideoProductSurface.css';
import './partnerVideoMeetingSurface.css';

export default function PartnerVideoMeetingProductSurface(_props: WorkspaceProductSurfaceProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
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
  const title = event?.title ?? 'Session room';
  const embedSrc = eventId
    ? buildFinelyMeetingEmbedUrl({
        roomName: room,
        displayName,
        email,
        subject: event?.title,
      })
    : '';
  const participantLabels = useMemo(
    () => [displayName, partner ? 'Finely team' : 'Finely Cred team'].filter(Boolean),
    [displayName, partner],
  );

  const canAccess = isAdmin || (partner && event && event.partnerId === partner.id);

  useEffect(() => {
    document.title = event?.title ? `${event.title} — Finely Meeting` : 'Finely Video Meeting';
  }, [event?.title]);

  const jitsiContainerId = `finely-jitsi-meeting-${eventId ?? 'room'}`;
  const { controls: jitsi, error: jitsiErr } = useJitsiMeetingApi({
    roomName: room,
    displayName,
    email,
    subject: title,
    containerId: jitsiContainerId,
    enabled: Boolean(room && canAccess),
  });

  const copyLink = async () => {
    if (!eventId) return;
    const url = `${window.location.origin}${mapPortalHref(`/portal/meeting/${eventId}`)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  const saveNotes = (notes: string) => {
    if (!eventId || !notes.trim()) return;
    setEventPostMeetingIntel(eventId, { meetingNotes: notes.trim() });
    window.dispatchEvent(new Event('finely:store'));
  };

  if (!eventId) {
    return (
      <ProductEmptyState
        title="Invalid meeting link"
        description="This session URL is missing a meeting id. Open Calendar or Communication hub to join a scheduled room."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/calendar'))}>
            Open calendar
          </button>
        }
      />
    );
  }

  if (!event) {
    return (
      <ProductEmptyState
        title="Meeting not found"
        description="This scheduled room may have been removed or the link expired."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/messages?hub=meetings'))}>
            Open meetings hub
          </button>
        }
      />
    );
  }

  if (!canAccess) {
    return (
      <ProductEmptyState
        title="Not linked to your profile"
        description="This meeting belongs to another partner account. Sign in with the invited profile or ask staff for a new invite."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/calendar'))}>
            Open calendar
          </button>
        }
      />
    );
  }

  const partnerIdForCall = partner?.id ?? event.partnerId;
  const scheduledAt = event.startAt
    ? new Date(event.startAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Scheduled session';

  return (
    <div className="fc-wlp-video-product-surface" data-surface-kind="video-meeting">
      <ProductHubScaffold
        role="partner"
        eyebrow="Scheduled session"
        title={title}
        description="Your session stage — mic, camera, screen share, and invite link. Notes save back to your calendar event."
        accent="violet"
        surfaceMode="studio"
        archetype="focus"
        metricsVariant="inline"
        pageId="video-meeting"
        primaryAction={
          partnerIdForCall && !partnerIdForCall.startsWith('public:') ? (
            <StartVideoCallButton
              partnerId={partnerIdForCall}
              displayName={displayName}
              userRole={isAdmin ? 'finely_staff' : 'partner'}
              defaultTitle={title}
            />
          ) : undefined
        }
        secondaryAction={
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => navigate(mapPortalHref(isAdmin ? '/admin/calendar' : '/portal/calendar'))}
          >
            <Calendar size={14} /> Calendar
          </button>
        }
      >
        <section className="fc-video-meeting-stage" data-surface-layout="video-stage">
          <aside className="fc-video-meeting-runway" aria-label="Session runway">
            <div className="fc-video-meeting-runway-label inline-flex items-center gap-2">
              <Video size={14} /> Session runway
            </div>
            <h2 className="fc-video-meeting-runway-title">{title}</h2>
            <div className="fc-video-meeting-runway-chip">
              <Clock size={16} className="text-violet-300 shrink-0" />
              <span>{scheduledAt}</span>
            </div>
            <div className="space-y-2">
              <div className="fc-video-meeting-runway-label">In this room</div>
              {participantLabels.map((label) => (
                <div key={label} className="fc-video-meeting-runway-chip">
                  <Users size={14} className="text-sky-300 shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto space-y-3 pt-2">
              <div className="text-xs font-bold text-white/50 font-mono break-all">{room}</div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyLink()}>
                <Copy size={14} /> Copy invite link
              </button>
            </div>
          </aside>

          <div className="fc-video-meeting-proscenium">
            <div className="fc-wlp-video-product-body fc-wlp-video-room-root flex-1 min-h-0">
              <MeetingControlBar
                title={title}
                room={room}
                participants={participantLabels}
                onCopyLink={copyLink}
                jitsi={jitsi}
                notes={event.meetingNotes || ''}
                onNotesSave={saveNotes}
              >
                {jitsiErr ? (
                  <iframe
                    title={title}
                    src={embedSrc}
                    data-meeting-frame
                    allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                    className="fc-video-meeting-frame w-full h-[calc(100vh-300px)] min-h-[420px] border border-violet-500/25 bg-black"
                  />
                ) : (
                  <div
                    id={jitsiContainerId}
                    data-meeting-frame
                    className="fc-video-meeting-frame w-full h-[calc(100vh-300px)] min-h-[420px] border border-violet-500/25 bg-black"
                  />
                )}
              </MeetingControlBar>
            </div>
          </div>
        </section>

        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Secure browser video · Room {room} · Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </div>
  );
}
