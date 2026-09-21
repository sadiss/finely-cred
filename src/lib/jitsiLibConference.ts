/**
 * Jitsi lib-jitsi-meet join with custom MediaStream (canvas touch-up video).
 * Used when lobby visual effects are on — iframe API cannot inject tracks cross-origin.
 */

import { jitsiMeetDomain } from './meetingUrls';

type JitsiMeetJSGlobal = {
  init: (o: Record<string, unknown>) => void;
  setLogLevel: (n: number) => void;
  logLevels: { ERROR: number };
  events: {
    connection: { CONNECTION_ESTABLISHED: string; CONNECTION_FAILED: string };
    conference: { CONFERENCE_JOINED: string; TRACK_ADDED: string; TRACK_REMOVED: string };
  };
  JitsiConnection: new (a: null, b: null, c: Record<string, unknown>) => {
    addEventListener: (e: string, fn: () => void) => void;
    initJitsiConference: (room: string, o: Record<string, unknown>) => JitsiConference;
    connect: () => void;
    disconnect: () => void;
  };
  createLocalTracks: (o: Record<string, unknown>) => Promise<JitsiLocalTrack[]>;
  createLocalTracksFromMediaStreams: (
    streams: Array<{ stream: MediaStream; videoType?: string; mediaType?: string }>,
  ) => Promise<JitsiLocalTrack[]>;
};

type JitsiLocalTrack = {
  getType: () => string;
  isLocal: () => boolean;
  attach: (el: HTMLElement) => void;
  detach: (el: HTMLElement) => void;
};

type JitsiConference = {
  on: (e: string, fn: (t?: JitsiLocalTrack) => void) => void;
  join: () => void;
  leave: () => void;
  setDisplayName: (n: string) => void;
  addTrack: (t: JitsiLocalTrack) => Promise<void>;
};

const LIB_ID = 'finely-lib-jitsi-meet';

function loadLibJitsiMeet(domain: string): Promise<JitsiMeetJSGlobal> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { JitsiMeetJS?: JitsiMeetJSGlobal };
    if (w.JitsiMeetJS) return resolve(w.JitsiMeetJS);
    const existing = document.getElementById(LIB_ID);
    if (existing) {
      existing.addEventListener('load', () => (w.JitsiMeetJS ? resolve(w.JitsiMeetJS) : reject(new Error('JitsiMeetJS missing'))));
      return;
    }
    const s = document.createElement('script');
    s.id = LIB_ID;
    s.src = `https://${domain}/libs/lib-jitsi-meet.min.js`;
    s.async = true;
    s.onload = () => (w.JitsiMeetJS ? resolve(w.JitsiMeetJS) : reject(new Error('JitsiMeetJS failed to load')));
    s.onerror = () => reject(new Error('Could not load lib-jitsi-meet'));
    document.head.appendChild(s);
  });
}

export type JitsiLibConferenceHandle = {
  dispose: () => void;
};

export async function joinJitsiLibConference(args: {
  roomName: string;
  displayName: string;
  outboundStream: MediaStream;
  remoteContainer: HTMLElement;
  localContainer?: HTMLElement;
}): Promise<JitsiLibConferenceHandle> {
  const domain = jitsiMeetDomain();
  const JitsiMeetJS = await loadLibJitsiMeet(domain);
  JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
  JitsiMeetJS.init({
    disableAudioLevels: true,
    disableThirdPartyRequests: true,
  });

  const connection = new JitsiMeetJS.JitsiConnection(null, null, {
    hosts: { domain, muc: `conference.${domain}` },
    serviceUrl: `https://${domain}/http-bind`,
    websocket: `wss://${domain}/xmpp-websocket`,
    clientNode: 'http://jitsi.org/jitsimeet',
  });

  let conference: JitsiConference | null = null;
  const remoteNodes: HTMLElement[] = [];

  await new Promise<void>((resolve, reject) => {
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, () => {
      reject(new Error('Jitsi connection failed'));
    });
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, () => {
      conference = connection.initJitsiConference(args.roomName, {});
      conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, async () => {
        try {
          conference?.setDisplayName(args.displayName);
          const localTracks = await JitsiMeetJS.createLocalTracksFromMediaStreams([
            { stream: args.outboundStream, videoType: 'camera', mediaType: 'video' },
            { stream: args.outboundStream, mediaType: 'audio' },
          ]);
          for (const t of localTracks) {
            await conference?.addTrack(t);
            if (t.getType() === 'video' && args.localContainer) t.attach(args.localContainer);
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => {
        if (!track || track.isLocal()) return;
        const wrap = document.createElement('div');
        wrap.className = 'rounded-xl overflow-hidden bg-black aspect-video';
        args.remoteContainer.appendChild(wrap);
        remoteNodes.push(wrap);
        track.attach(wrap);
      });
      conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track) => {
        if (!track) return;
        for (const el of remoteNodes) track.detach(el);
      });
      conference.join();
    });
    connection.connect();
  });

  return {
    dispose: () => {
      try {
        conference?.leave();
        connection.disconnect();
      } catch {
        /* ignore */
      }
      args.remoteContainer.innerHTML = '';
    },
  };
}
