import type { MeetingVideoPrefs } from './meetingVideoQuality';
import { outboundVideoFps } from './meetingVideoQuality';

/** Composite outbound stream: canvas.captureStream() video + mic audio tracks. */
export function buildOutboundStreamFromCanvas(
  canvas: HTMLCanvasElement,
  micStream: MediaStream,
  prefs: MeetingVideoPrefs,
): MediaStream {
  const fps = outboundVideoFps(prefs);
  const canvasStream = canvas.captureStream(fps);
  const tracks = [...canvasStream.getVideoTracks(), ...micStream.getAudioTracks()];
  return new MediaStream(tracks);
}
