import React, { useEffect, useRef, useState } from 'react';
import type { MeetingVideoPrefs } from '../../lib/meetingVideoQuality';
import { hasLobbyVisualEffects } from '../../lib/meetingVideoQuality';
import { joinJitsiLibConference } from '../../lib/jitsiLibConference';
import { useJitsiMeetingApi } from '../../hooks/useJitsiMeetingApi';

export function FinelyJitsiMeetingRoom({
  roomName,
  displayName,
  subject,
  email,
  prefs,
  outboundStream,
  onLeave,
}: {
  roomName: string;
  displayName: string;
  subject?: string;
  email?: string;
  prefs: MeetingVideoPrefs;
  outboundStream: MediaStream | null;
  onLeave?: () => void;
}) {
  const useProcessed = hasLobbyVisualEffects(prefs) && outboundStream != null;
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [waitingStream, setWaitingStream] = useState(false);
  const { join, loading, error } = useJitsiMeetingApi();
  const libHandle = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    if (useProcessed && !outboundStream) {
      setWaitingStream(true);
      return;
    }
    setWaitingStream(false);
  }, [useProcessed, outboundStream]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (useProcessed && !outboundStream) return;
      if (useProcessed && outboundStream && remoteRef.current) {
        try {
          libHandle.current = await joinJitsiLibConference({
            roomName,
            displayName,
            outboundStream,
            remoteContainer: remoteRef.current,
            localContainer: localRef.current ?? undefined,
          });
        } catch (e: unknown) {
          if (!cancelled) setErr((e as Error)?.message || 'Processed video join failed');
        }
        return;
      }
      await join({
        roomName,
        displayName,
        subject,
        email,
        prefs,
        containerId: 'finely-jitsi-iframe-slot',
        onLeave,
      });
    };
    void run();
    return () => {
      cancelled = true;
      libHandle.current?.dispose();
      libHandle.current = null;
    };
  }, [useProcessed, roomName, displayName, subject, email, prefs, outboundStream, join, onLeave]);

  return (
    <div className="space-y-3">
      {useProcessed ? (
        <p className="text-emerald-300/90 text-xs">
          Outbound video uses your lobby touch-up / background (canvas stream). Audio uses your mic.
        </p>
      ) : (
        <p className="text-white/45 text-xs">Standard camera — no lobby touch-up applied.</p>
      )}
      {waitingStream ? (
        <p className="text-white/50 text-sm">Starting processed video pipeline…</p>
      ) : null}
      {loading ? <p className="text-white/50 text-sm">Connecting…</p> : null}
      {error || err ? <p className="text-rose-200 text-sm">{error || err}</p> : null}
      {useProcessed ? (
        <div className="grid md:grid-cols-[1fr_240px] gap-3 min-h-[70vh]">
          <div ref={remoteRef} className="rounded-2xl border border-white/10 bg-black p-2 grid gap-2 min-h-[50vh]" />
          <div ref={localRef} className="rounded-2xl border border-white/10 bg-black aspect-video" />
        </div>
      ) : (
        <div id="finely-jitsi-iframe-slot" className="rounded-2xl overflow-hidden border border-white/10 min-h-[70vh] bg-black" />
      )}
    </div>
  );
}
