import React from 'react';
import { ExternalLink, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  countConnectedSocialAccounts,
  listRecruitingSocialStaff,
  socialPresenceStatusLabel,
  STAFF_SOCIAL_PRESENCE,
  type StaffSocialAccountStatus,
  type StaffSocialPresence,
} from './staffSocialPresence';
import { findStaff } from './staffRoster';
import { StaffAvatar } from './StaffAvatar';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { STAFF_ROSTER_PROFILES } from './staffRosterProfiles';

function SocialPresenceAvatar({ p }: { p: StaffSocialPresence }) {
  const staff = findStaff(p.staffId);
  if (staff) return <StaffAvatar staff={staff} size="sm" />;
  const seed = STAFF_ROSTER_PROFILES[p.staffId];
  const parts = p.displayName.trim().split(/\s+/);
  return (
    <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/15">
      <StaffPortraitImg
        staff={{
          id: p.staffId,
          firstName: seed?.firstName ?? parts[0] ?? p.displayName,
          lastName: seed?.lastName ?? parts.slice(1).join(' ') ?? '',
          portraitGender: seed?.portraitGender ?? 'neutral',
          avatarPath: `staff-portrait://${p.staffId}`,
        }}
        className="h-full w-full"
        alt={p.displayName}
      />
    </div>
  );
}

function PresenceCard({ p, onOpen }: { p: StaffSocialPresence; onOpen: () => void }) {
  const platforms = Object.entries(p.platforms);
  const statusOrder: StaffSocialAccountStatus[] = ['recruiting', 'posting', 'connected', 'page_requested', 'profile_drafted', 'not_started'];
  const bestStatus = platforms.reduce<StaffSocialAccountStatus>(
    (best, [, slot]) => {
      const status = slot?.status ?? 'not_started';
      return statusOrder.indexOf(status) < statusOrder.indexOf(best) ? status : best;
    },
    'not_started',
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left rounded-2xl border border-white/10 bg-black/25 p-3 hover:border-violet-400/30 hover:bg-violet-500/5 transition-colors"
    >
      <div className="flex items-start gap-2">
        <SocialPresenceAvatar p={p} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{p.displayName}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40 truncate">{p.mission}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-white/55 line-clamp-2">{p.bioLine}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {platforms.slice(0, 3).map(([plat, slot]) => (
          <span key={plat} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/50">
            {plat}
          </span>
        ))}
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-200/90">
          {socialPresenceStatusLabel(bestStatus)}
        </span>
      </div>
    </button>
  );
}

type Props = {
  compact?: boolean;
};

export function StaffSocialPresenceStrip({ compact = false }: Props) {
  const navigate = useNavigate();
  const recruiting = listRecruitingSocialStaff();
  const connected = countConnectedSocialAccounts();

  if (compact) {
    return (
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-black/40 to-black/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15">
              <Share2 size={16} className="text-violet-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Staff social presence</p>
              <p className="text-xs text-white/50">
                {STAFF_SOCIAL_PRESENCE.length} agents mapped · {connected} live account(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="fc-button-soft text-xs" onClick={() => navigate('/admin/staff')}>
              Roster
            </button>
            <button type="button" className="fc-button-brand text-xs" onClick={() => navigate('/admin/social-hub')}>
              Social Hub <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300/80">Social presence</p>
          <h3 className="text-lg font-black text-white">Lead & recruit agents on social</h3>
          <p className="mt-1 text-sm text-white/55 max-w-2xl">
            Profiles are drafted per agent. Live posting flows through Social Hub (Meta OAuth) with compliance review — AI agents sign posts; human executives can post with disclosure.
          </p>
        </div>
        <button type="button" className="fc-button-brand" onClick={() => navigate('/admin/social-hub?tab=autopilot')}>
          Open Social Hub
        </button>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {recruiting.map((p) => (
          <PresenceCard key={p.staffId} p={p} onOpen={() => navigate(`/admin/staff?staff=${p.staffId}&view=workroom`)} />
        ))}
      </div>
    </div>
  );
}
