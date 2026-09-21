import React, { useEffect } from 'react';
import { useMeetingLocalPreview } from '../../hooks/useMeetingLocalPreview';
import type { MeetingVideoPrefs } from '../../lib/meetingVideoQuality';
import { hasLobbyVisualEffects } from '../../lib/meetingVideoQuality';

/** Keeps canvas RAF alive in-call so `captureStream()` touch-up video keeps updating (avoid `display:none`). */
export function MeetingPipelineKeepAlive({
  prefs,
  onStream,
}: {
  prefs: MeetingVideoPrefs;
  onStream: (stream: MediaStream | null) => void;
}) {
  const { videoRef, canvasRef, start, getOutboundStream, ready } = useMeetingLocalPreview(prefs);

  useEffect(() => {
    void start();
  }, [start, prefs.videoMode, prefs.beautyEnabled, prefs.beautyStrength, prefs.virtualBackground]);

  useEffect(() => {
    if (!ready) return;
    if (!hasLobbyVisualEffects(prefs)) {
      onStream(null);
      return;
    }
    onStream(getOutboundStream());
  }, [ready, prefs, getOutboundStream, onStream]);

  return (
    <div
      className="fixed -left-[2400px] top-0 w-[1280px] h-[720px] opacity-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full" />
    </div>
  );
}
