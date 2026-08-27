/**
 * Instant video — command deck layout (distinct from scheduled meeting stage).
 * REAL TOOLS: Jitsi External API, MeetingControlBar, StartVideoCallButton, copy link, end call, calendar fallback.
 */
import React, { useEffect, useMemo } from 'react';
import { MessageSquare, Phone, Shield, Video, Zap } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { useAuth } from '../../../../auth/AuthProvider';
import { buildJoinUrl, endVideoCall, getVideoCall } from '../../../../data/videoCallsRepo';
import { listCalendarEvents } from '../../../../data/calendarRepo';
import { buildFinelyMeetingEmbedUrl, meetingRoomName } from '../../../../lib/meetingUrls';
import { isAdminEmail } from '../../../../auth/admin';
import { MeetingControlBar } from '../../../../components/video/MeetingControlBar';
import { StartVideoCallButton } from '../../../../components/video/StartVideoCallButton';
import { useJitsiMeetingApi } from '../../../../hooks/useJitsiMeetingApi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { ProductHubScaffold } from '../components/ProductHubScaffold';
import { ProductEmptyState } from '../components/ProductUi';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE, finelyOsCatalogCard } from '../../../os/finelyOsLightUi';
import './partnerVideoProductSurface.css';
import './partnerVideoCallSurface.css';

export default function PartnerVideoCallProductSurface(_props: WorkspaceProductSurfaceProps) {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const isAdmin = isAdminEmail(auth.user?.email);
  const displayName = partner?.profile?.fullName || auth.user?.email || 'Partner';
  const email = partner?.profile?.email || auth.user?.email || undefined;

  const instantCall = useMemo(() => (callId ? getVideoCall(callId) : null), [callId]);

  const calendarEvent = useMemo(() => {
    if (!callId || instantCall) return null;
    return listCalendarEvents().find((e) => e.id === callId) ?? null;
  }, [callId, instantCall]);

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

  const jitsiContainerId = `finely-jitsi-call-${callId ?? 'room'}`;
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
    if (!joinPath) return;
    const url = `${window.location.origin}${mapPortalHref(joinPath)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  };

  if (!callId) {
    return (
      <div className="fc-wlp-video-product-surface" data-surface-kind="video-call">
        <ProductHubScaffold
          role="partner"
          eyebrow="Live session"
          title="Instant video room"
          description="Start a secure in-browser call with mic, camera, screen share, and invite link."
          accent="sky"
          surfaceMode="studio"
          archetype="focus"
          metricsVariant="inline"
          pageId="video-call"
          primaryAction={
            partner ? (
              <StartVideoCallButton
                partnerId={partner.id}
                displayName={displayName}
                userRole="partner"
                defaultTitle="Finely partner session"
              />
            ) : undefined
          }
          secondaryAction={
            <button
              type="button"
              className="fc-wlp-btn-secondary"
              onClick={() => navigate(mapPortalHref('/portal/messages?hub=meetings'))}
            >
              <MessageSquare size={14} /> Meetings hub
            </button>
          }
        >
          <section className="fc-video-call-lobby" data-surface-layout="command-deck">
            <div className={`fc-video-call-lobby-hero space-y-5`}>
              <div className="inline-flex items-center gap-2 text-sky-300 text-sm font-extrabold uppercase tracking-widest">
                <Zap size={16} /> Command deck
              </div>
              <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Start an instant video session</h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Launch a live room for your partner file — specialists can join from the invite link you share.
              </p>
              {partner ? (
                <StartVideoCallButton
                  partnerId={partner.id}
                  displayName={displayName}
                  userRole="partner"
                  defaultTitle="Finely partner session"
                />
              ) : null}
            </div>
            <div className="space-y-4">
              {[
                { label: 'Ready', value: 'In-browser', hint: 'No app install', accent: 'sky' as const, icon: Video },
                { label: 'Secure', value: 'Encrypted', hint: 'Partner-only rooms', accent: 'emerald' as const, icon: Shield },
                { label: 'Controls', value: 'Full deck', hint: 'Mic · cam · share', accent: 'rose' as const, icon: Phone },
              ].map((cell) => {
                const Icon = cell.icon;
                return (
                  <div key={cell.label} className="fc-video-call-status-cell" data-accent={cell.accent}>
                    <div className="fc-video-call-status-label inline-flex items-center gap-2">
                      <Icon size={14} /> {cell.label}
                    </div>
                    <div className="fc-video-call-status-value">{cell.value}</div>
                    <div className="text-sm font-bold text-white/55">{cell.hint}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </ProductHubScaffold>
      </div>
    );
  }

  if (!instantCall && !calendarEvent) {
    return (
      <ProductEmptyState
        title="Video room not found"
        description="This call may have ended or the link expired."
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
        description="This video room belongs to another partner account."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/messages?hub=meetings'))}>
            Open meetings hub
          </button>
        }
      />
    );
  }

  return (
    <div className="fc-wlp-video-product-surface" data-surface-kind="video-call">
      <ProductHubScaffold
        role="partner"
        eyebrow={instantCall ? 'Live call' : 'Scheduled fallback'}
        title={title}
        description="Command deck — mic, camera, screen share, invite link, and end call controls."
        accent="sky"
        surfaceMode="studio"
        archetype="focus"
        metricsVariant="inline"
        pageId="video-call"
        primaryAction={
          partner ? (
            <StartVideoCallButton
              partnerId={partner.id}
              displayName={displayName}
              userRole="partner"
              defaultTitle="Finely partner session"
            />
          ) : undefined
        }
        secondaryAction={
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => navigate(mapPortalHref('/portal/messages?hub=meetings'))}
          >
            <MessageSquare size={14} /> Meetings hub
          </button>
        }
      >
        <section className="fc-video-call-deck" data-surface-layout="command-deck">
          <div className="fc-video-call-status-rail">
            <div className="fc-video-call-status-cell" data-accent="sky">
              <div className="fc-video-call-status-label">Status</div>
              <div className="fc-video-call-status-value">{instantCall ? 'Live' : 'Joined'}</div>
              <div className="text-sm font-bold text-white/55">{instantCall ? 'Instant call' : 'Calendar room'}</div>
            </div>
            <div className="fc-video-call-status-cell" data-accent="emerald">
              <div className="fc-video-call-status-label">Participants</div>
              <div className="fc-video-call-status-value">{participantLabels.length}</div>
              <div className="text-sm font-bold text-white/55 truncate">{participantLabels.join(' · ')}</div>
            </div>
            <div className="fc-video-call-status-cell" data-accent="rose">
              <div className="fc-video-call-status-label">Room</div>
              <div className="fc-video-call-status-value text-lg font-mono">{room.slice(0, 12)}…</div>
              <div className="text-sm font-bold text-white/55">
                {instantCall?.roomPin ? `PIN ${instantCall.roomPin}` : 'Secure link'}
              </div>
            </div>
          </div>

          <div className={`fc-video-call-viewport ${finelyOsCatalogCard('sky')} !p-3 !border-sky-500/25`}>
            <div className="fc-wlp-video-room-root flex-1 min-h-0 flex flex-col">
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
                        navigate(mapPortalHref('/portal/messages?hub=meetings'));
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
                    className="fc-video-call-frame w-full h-[calc(100vh-340px)] min-h-[420px] border border-sky-500/20 bg-black"
                  />
                ) : (
                  <div
                    id={jitsiContainerId}
                    data-meeting-frame
                    className="fc-video-call-frame w-full h-[calc(100vh-340px)] min-h-[420px] border border-sky-500/20 bg-black"
                  />
                )}
              </MeetingControlBar>
            </div>
          </div>
        </section>

        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Secure in-browser video · {room}
          {instantCall?.roomPin ? ` · PIN ${instantCall.roomPin}` : ''} · Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </div>
  );
}
