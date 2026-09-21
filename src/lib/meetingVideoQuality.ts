/**
 * Meeting video defaults — WebRTC constraints + Jitsi config overlays.
 * Touch-up v1: center-weighted matte + filters (not ML segmentation). See meetingBeautyPipeline.ts.
 */

export type MeetingVideoMode = 'hd' | 'smooth';

export type VirtualBackgroundId =
  | 'none'
  | 'blur'
  | 'finely_executive'
  | 'finely_soft_office'
  | 'finely_gradient';

export type MeetingVideoPrefs = {
  videoMode: MeetingVideoMode;
  beautyEnabled: boolean;
  /** 0–100 subtle skin softening */
  beautyStrength: number;
  virtualBackground: VirtualBackgroundId;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
};

export const LOUNGE_HOST_VIDEO_DEFAULTS: MeetingVideoPrefs = {
  videoMode: 'hd',
  beautyEnabled: true,
  beautyStrength: 35,
  virtualBackground: 'finely_executive',
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const ACADEMY_HUDDLE_VIDEO_DEFAULTS: MeetingVideoPrefs = {
  ...LOUNGE_HOST_VIDEO_DEFAULTS,
  virtualBackground: 'finely_soft_office',
};

export function hasLobbyVisualEffects(prefs: MeetingVideoPrefs): boolean {
  return prefs.beautyEnabled || prefs.virtualBackground !== 'none';
}

export function outboundVideoFps(prefs: MeetingVideoPrefs): number {
  return prefs.videoMode === 'hd' ? 30 : 24;
}

export function buildVideoConstraints(mode: MeetingVideoMode): MediaTrackConstraints {
  const hd = mode === 'hd';
  return {
    width: { ideal: hd ? 1280 : 960, max: 1920 },
    height: { ideal: hd ? 720 : 540, max: 1080 },
    frameRate: { ideal: hd ? 30 : 24, max: hd ? 60 : 30 },
    facingMode: 'user',
  };
}

export function buildAudioConstraints(prefs: Pick<MeetingVideoPrefs, 'noiseSuppression' | 'echoCancellation' | 'autoGainControl'>) {
  return {
    echoCancellation: prefs.echoCancellation,
    noiseSuppression: prefs.noiseSuppression,
    autoGainControl: prefs.autoGainControl,
  };
}

export function jitsiConfigOverwrite(prefs: MeetingVideoPrefs) {
  const hd = prefs.videoMode === 'hd';
  return {
    constraints: {
      video: {
        height: { ideal: hd ? 720 : 540, max: 1080 },
        width: { ideal: hd ? 1280 : 960, max: 1920 },
        frameRate: { ideal: hd ? 30 : 24, max: hd ? 60 : 30 },
      },
    },
    disableSimulcast: false,
    enableLayerSuspension: true,
    enableNoisyMicDetection: true,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: false,
    enableWelcomePage: false,
    p2p: { enabled: false },
    analytics: { disabled: true },
    disableVirtualBackground: false,
  };
}

export const VIRTUAL_BACKGROUNDS: { id: VirtualBackgroundId; label: string; labelHt: string }[] = [
  { id: 'none', label: 'No background', labelHt: 'San fon' },
  { id: 'blur', label: 'Background blur', labelHt: 'Flou dèyè' },
  { id: 'finely_executive', label: 'Finely executive', labelHt: 'Finely egzekitif' },
  { id: 'finely_soft_office', label: 'Pro office', labelHt: 'Biwo pwofesyonèl' },
  { id: 'finely_gradient', label: 'Brand gradient', labelHt: 'Gradyan mak' },
];
