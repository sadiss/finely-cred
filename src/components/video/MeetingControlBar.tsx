import React, { useState } from 'react';
import type { JitsiMeetingControls } from '../../hooks/useJitsiMeetingApi';
import {
  Camera,
  CameraOff,
  Copy,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PanelRight,
  Sparkles,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';

export type MeetingLayout = 'grid' | 'spotlight' | 'sidebar';

type Props = {
  title: string;
  room: string;
  participants: string[];
  onCopyLink: () => void;
  onEndCall?: () => void;
  showEndCall?: boolean;
  /** When set, mic/cam/share control the live Jitsi session. */
  jitsi?: JitsiMeetingControls | null;
  children: React.ReactNode;
};

export function MeetingControlBar({
  title,
  room,
  participants,
  onCopyLink,
  onEndCall,
  showEndCall,
  jitsi,
  children,
}: Props) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [layout, setLayout] = useState<MeetingLayout>('grid');
  const [panel, setPanel] = useState<'none' | 'chat' | 'people'>('none');
  const [notes, setNotes] = useState('');
  const [virtualBg, setVirtualBg] = useState(false);

  const layoutBtn = (mode: MeetingLayout, label: string, Icon: typeof Grid3X3) => (
    <button
      type="button"
      onClick={() => setLayout(mode)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
        layout === mode ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200' : 'border border-white/[0.08] text-white/50 hover:text-white/80'
      }`}
      title={`${label} layout`}
    >
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-0 xl:gap-3 min-h-0 flex-1">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 flex flex-wrap items-center justify-center gap-2 px-3 py-3 border-b border-white/[0.08] bg-fc-chrome/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              if (jitsi?.ready) jitsi.toggleAudio();
              else setMicOn((v) => !v);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              (jitsi?.ready ? !jitsi.audioMuted : micOn) ? 'bg-white/10 border border-white/15 text-white' : 'bg-red-500/20 border border-red-500/30 text-red-200'
            }`}
            title={jitsi?.ready ? 'Toggle microphone' : 'Toggle microphone (use Jitsi toolbar if iframe mode)'}
          >
            {(jitsi?.ready ? !jitsi.audioMuted : micOn) ? <Mic size={14} /> : <MicOff size={14} />} {(jitsi?.ready ? !jitsi.audioMuted : micOn) ? 'Mic' : 'Muted'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (jitsi?.ready) jitsi.toggleVideo();
              else setCamOn((v) => !v);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              (jitsi?.ready ? !jitsi.videoMuted : camOn) ? 'bg-white/10 border border-white/15 text-white' : 'bg-red-500/20 border border-red-500/30 text-red-200'
            }`}
            title={jitsi?.ready ? 'Toggle camera' : 'Toggle camera (use Jitsi toolbar if iframe mode)'}
          >
            {(jitsi?.ready ? !jitsi.videoMuted : camOn) ? <Camera size={14} /> : <CameraOff size={14} />} {(jitsi?.ready ? !jitsi.videoMuted : camOn) ? 'Cam' : 'Off'}
          </button>
          {jitsi?.ready ? (
            <button type="button" onClick={() => jitsi.toggleShare()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase text-white/70 hover:bg-white/5">
              <MonitorUp size={14} /> Share
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setVirtualBg((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              virtualBg ? 'bg-violet-500/20 border-violet-500/30 text-violet-200' : 'border-white/[0.08] text-white/60 hover:text-white'
            }`}
            title="Virtual background hint — enable in Jitsi ⋯ menu"
          >
            <Sparkles size={14} /> Blur
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'people' ? 'none' : 'people'))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              panel === 'people' ? 'bg-sky-500/20 border-sky-500/30 text-sky-200' : 'border-white/[0.08] text-white/60 hover:text-white'
            }`}
          >
            <Users size={14} /> People
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === 'chat' ? 'none' : 'chat'))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
              panel === 'chat' ? 'bg-sky-500/20 border-sky-500/30 text-sky-200' : 'border-white/[0.08] text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare size={14} /> Notes
          </button>
          <button
            type="button"
            onClick={() => void onCopyLink()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase text-white/70 hover:bg-white/5"
          >
            <Copy size={14} /> Invite
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('[data-meeting-frame]') as HTMLElement | null;
              el?.requestFullscreen?.();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase text-white/70 hover:bg-white/5"
            title="Fullscreen video"
          >
            <Maximize2 size={14} />
          </button>
          {showEndCall && onEndCall ? (
            <button
              type="button"
              onClick={onEndCall}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/15 text-[10px] font-black uppercase text-red-200"
            >
              <VideoOff size={14} /> End
            </button>
          ) : null}
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.07]">
          <span className="text-[9px] uppercase tracking-widest text-white/35 mr-1">Layout</span>
          {layoutBtn('grid', 'Grid', LayoutGrid)}
          {layoutBtn('spotlight', 'Spotlight', MonitorUp)}
          {layoutBtn('sidebar', 'Sidebar', PanelRight)}
          <span className="ml-auto text-[9px] text-white/30 truncate max-w-[200px]">{room}</span>
        </div>

        <div className="flex-1 min-h-0 p-2 md:p-3" data-meeting-layout={layout}>
          {children}
        </div>
      </div>

      {panel !== 'none' ? (
        <aside className="w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-white/[0.08] bg-fc-input flex flex-col max-h-[280px] xl:max-h-none">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              {panel === 'people' ? 'In this meeting' : 'Meeting notes'}
            </span>
            <button type="button" onClick={() => setPanel('none')} className="text-white/40 hover:text-white text-xs">
              ✕
            </button>
          </div>
          {panel === 'people' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-xs text-white/45 mb-2">{title}</p>
              {participants.length ? (
                participants.map((p) => (
                  <div key={p} className="flex items-center gap-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sm">
                      {p.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{p}</p>
                      <p className="text-[9px] uppercase text-white/35">Participant</p>
                    </div>
                    <Video size={12} className="ml-auto text-emerald-400 shrink-0" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/45">Share the invite link — guests appear in Jitsi when they join.</p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-3 min-h-0">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Action items, follow-ups, dispute notes…"
                className="flex-1 min-h-[120px] w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm resize-none"
              />
              <p className="mt-2 text-[9px] text-white/35">Notes stay on this device for the session.</p>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
