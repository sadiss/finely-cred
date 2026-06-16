import { useEffect, useRef, useState, useCallback } from 'react';

export type JitsiMeetingControls = {
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleShare: () => void;
  toggleTileView: () => void;
  hangup: () => void;
  audioMuted: boolean;
  videoMuted: boolean;
  ready: boolean;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => {
      executeCommand: (command: string, ...args: unknown[]) => void;
      addListener: (event: string, handler: (...args: unknown[]) => void) => void;
      dispose: () => void;
    };
  }
}

const JITSI_SCRIPT = 'https://meet.jit.si/external_api.js';

function loadJitsiScript(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JITSI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Jitsi script failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = JITSI_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Jitsi script failed'));
    document.head.appendChild(s);
  });
}

/** Mount Jitsi with External API for real mic/cam/layout control (replaces passive iframe). */
export function useJitsiMeetingApi(args: {
  roomName: string;
  displayName: string;
  email?: string;
  subject?: string;
  containerId: string;
  enabled: boolean;
}) {
  const apiRef = useRef<InstanceType<NonNullable<typeof window.JitsiMeetExternalAPI>> | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!args.enabled || !args.roomName) return;
    let disposed = false;

    void (async () => {
      try {
        await loadJitsiScript();
        if (disposed || !window.JitsiMeetExternalAPI) return;

        const parentNode = document.getElementById(args.containerId);
        if (!parentNode) return;

        apiRef.current?.dispose();
        parentNode.innerHTML = '';

        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: args.roomName,
          parentNode,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: args.displayName,
            email: args.email ?? '',
          },
          configOverwrite: {
            prejoinPageEnabled: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            defaultLanguage: 'en',
            subject: args.subject ?? 'Finely Cred meeting',
            resolution: 720,
            constraints: {
              video: {
                height: { ideal: 720, max: 1080, min: 360 },
                width: { ideal: 1280, max: 1920, min: 640 },
                frameRate: { ideal: 30, max: 30 },
              },
            },
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'tileview',
              'hangup',
              'chat',
              'raisehand',
              'videoquality',
              'settings',
            ],
            SHOW_JITSI_WATERMARK: false,
          },
        });

        api.addListener('audioMuteStatusChanged', (p: any) => setAudioMuted(Boolean(p?.muted)));
        api.addListener('videoMuteStatusChanged', (p: any) => setVideoMuted(Boolean(p?.muted)));
        api.addListener('videoConferenceJoined', () => setReady(true));

        apiRef.current = api;
        setReady(true);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to start meeting');
      }
    })();

    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
      setReady(false);
    };
  }, [args.enabled, args.roomName, args.displayName, args.email, args.subject, args.containerId]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const toggleShare = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
  }, []);

  const toggleTileView = useCallback(() => {
    apiRef.current?.executeCommand('toggleTileView');
  }, []);

  const hangup = useCallback(() => {
    apiRef.current?.executeCommand('hangup');
  }, []);

  const controls: JitsiMeetingControls = {
    toggleAudio,
    toggleVideo,
    toggleShare,
    toggleTileView,
    hangup,
    audioMuted,
    videoMuted,
    ready,
  };

  return { controls, error };
}
