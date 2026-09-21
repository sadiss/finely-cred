import { useEffect, useRef, useState } from 'react';
import { jitsiConfigOverwrite, type MeetingVideoPrefs } from '../lib/meetingVideoQuality';
import { jitsiMeetDomain } from '../lib/meetingUrls';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => {
      dispose: () => void;
      executeCommand: (cmd: string, ...args: unknown[]) => void;
      addListener: (event: string, fn: (...args: unknown[]) => void) => void;
    };
  }
}

const SCRIPT_ID = 'finely-jitsi-external-api';

function loadJitsiScript(domain: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Jitsi script failed')));
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = `https://${domain}/external_api.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Jitsi External API'));
    document.head.appendChild(s);
  });
}

export type JitsiMeetingArgs = {
  roomName: string;
  displayName: string;
  subject?: string;
  email?: string;
  prefs: MeetingVideoPrefs;
  containerId: string;
  onLeave?: () => void;
};

type JitsiApi = {
  dispose: () => void;
  executeCommand: (cmd: string, ...args: unknown[]) => void;
  addListener: (event: string, fn: (...args: unknown[]) => void) => void;
};

export function useJitsiMeetingApi() {
  const apiRef = useRef<JitsiApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispose = () => {
    apiRef.current?.dispose();
    apiRef.current = null;
  };

  useEffect(() => () => dispose(), []);

  const join = async (args: JitsiMeetingArgs) => {
    setLoading(true);
    setError(null);
    dispose();
    const domain = jitsiMeetDomain();
    try {
      await loadJitsiScript(domain);
      const Api = window.JitsiMeetExternalAPI;
      if (!Api) throw new Error('Jitsi API unavailable');

      const config = jitsiConfigOverwrite(args.prefs);
      apiRef.current = new Api(domain, {
        roomName: args.roomName,
        parentNode: document.getElementById(args.containerId),
        userInfo: {
          displayName: args.displayName,
          email: args.email,
        },
        configOverwrite: {
          ...config,
          subject: args.subject,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'hangup',
            'chat',
            'raisehand',
            'tileview',
            'settings',
          ],
        },
      });

      apiRef.current.addListener('readyToClose', () => {
        args.onLeave?.();
        dispose();
      });
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Meeting failed to load');
    } finally {
      setLoading(false);
    }
  };

  return { join, dispose, loading, error };
}
