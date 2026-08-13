import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, MessageSquare, X } from 'lucide-react';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { listMarketingDisplayStaff } from '../../data/staffRoster';
import { openPublicChat, type PublicChatGoal } from '../../lib/publicChatEvents';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  roleId: AgentPersonaId;
  goal: PublicChatGoal;
  roleLabel: string;
  subline?: string;
  /** @deprecated styling is unified in the staff grid */
  buttonTone?: 'success' | 'secondary';
  /** `ivory` = clean paper cards on wealthy public shells (no dark glass wash). */
  surface?: 'default' | 'ivory' | 'violet-solid' | 'restore-emerald';
  /** Optional extra class on the strip shell (page-specific styling). */
  stripClassName?: string;
  /** When set, renders a collapsed trigger button that opens the staff grid in a modal. */
  modalLaunch?: { triggerLabel?: string };
};

export function MarketingStaffChatStrip({
  roleId,
  goal,
  roleLabel,
  subline,
  surface = 'default',
  stripClassName = '',
  modalLaunch,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const staffPool = useMemo(() => listMarketingDisplayStaff(roleId), [roleId]);
  if (!staffPool.length) return null;

  const ivory = surface === 'ivory';
  const violetSolid = surface === 'violet-solid';
  const restoreEmerald = surface === 'restore-emerald';
  const triggerLabel = modalLaunch?.triggerLabel ?? `Ask ${roleLabel}`;

  const stripShellClass = ivory
    ? 'rounded-2xl border border-[#0a1628]/12 bg-white/95 shadow-[0_16px_40px_-28px_rgba(10,22,40,0.22)] !p-5'
    : restoreEmerald
      ? 'rounded-2xl border border-emerald-400/45 bg-gradient-to-br from-[#0f4a38] via-[#062a20] to-[#083328] shadow-[0_16px_40px_-16px_rgba(6,78,59,0.55)] !p-5'
      : violetSolid
        ? 'rounded-2xl border border-violet-400/35 bg-gradient-to-br from-[#2a1848] via-[#1e1238] to-[#261a42] shadow-[0_20px_48px_-24px_rgba(109,40,217,0.45)] !p-5'
        : finelyOsCatalogCard('violet');

  const stripBody = (
    <div
      className={`${stripShellClass} ${stripClassName} space-y-4`}
      data-fc-marketing-staff-strip={restoreEmerald ? 'restore-emerald' : violetSolid ? 'violet-solid' : '1'}
    >
      <div className="min-w-0">
        <div
          className={`${
            ivory
              ? 'text-sm font-semibold tracking-tight text-[#0a1628]'
              : restoreEmerald || violetSolid
                ? 'text-sm font-semibold tracking-tight text-white'
                : `${FINELY_OS_ENTITY_VALUE} text-sm`
          }`}
        >
          Meet part of our {roleLabel} team
        </div>
        {subline ? (
          <p
            className={`${
              ivory
                ? 'text-xs mt-0.5 text-[#0a1628]/70'
                : restoreEmerald || violetSolid
                  ? 'text-xs mt-0.5 text-white/75'
                  : `${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`
            }`}
          >
            {subline}
          </p>
        ) : null}
        <p
          className={`${
            ivory
              ? 'text-[10px] mt-1 font-semibold uppercase tracking-[0.12em] text-[#0a1628]/50'
              : restoreEmerald || violetSolid
                ? 'text-[10px] mt-1 font-semibold uppercase tracking-[0.12em] text-white/50'
                : `${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`
          }`}
        >
          Tap a specialist below — our AI guide can help in chat if you are not sure where to start. Direct messages unlock after you sign up or log in.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {staffPool.map((staff) => (
          <div
            key={staff.id}
            className={`${
              ivory
                ? 'rounded-2xl border border-[#0a1628]/10 bg-[#faf6ee] !p-3 shadow-sm'
                : restoreEmerald
                  ? 'rounded-2xl border border-emerald-300/30 bg-black/25 !p-3 shadow-sm'
                  : violetSolid
                    ? 'rounded-2xl border border-violet-300/20 bg-violet-950/40 !p-3 shadow-sm'
                    : finelyOsCatalogCard('emerald')
            } flex flex-col gap-2`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <StaffPortraitImg
                staff={staff}
                className={`w-11 h-11 rounded-full shrink-0 border ${ivory ? 'border-emerald-700/25' : 'border-emerald-400/30'}`}
              />
              <div className="min-w-0">
                <div
                  className={`${
                    ivory
                      ? 'text-xs font-semibold text-[#0a1628] truncate'
                      : restoreEmerald || violetSolid
                        ? 'text-xs font-semibold text-white truncate'
                        : `${FINELY_OS_ENTITY_VALUE} text-xs truncate`
                  }`}
                >
                  {staff.firstName}
                </div>
                <div
                  className={`${
                    ivory
                      ? 'text-[9px] text-[#0a1628]/60 line-clamp-2'
                      : restoreEmerald || violetSolid
                        ? 'text-[9px] text-white/60 line-clamp-2'
                        : `${FINELY_OS_ENTITY_SUBLABEL} text-[9px] line-clamp-2`
                  }`}
                >
                  {staff.bioLine}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                openPublicChat({
                  goal,
                  personaId: roleId,
                })
              }
              className={
                ivory || restoreEmerald
                  ? 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-700/35 bg-emerald-600 text-[9px] font-black uppercase text-white hover:bg-emerald-700'
                  : 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20'
              }
            >
              <MessageCircle size={10} /> Chat with {staff.firstName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (modalLaunch) {
    return (
      <>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-violet-100 hover:bg-violet-500/15 transition-all"
          onClick={() => setModalOpen(true)}
        >
          <MessageSquare size={14} />
          {triggerLabel}
        </button>

        {modalOpen
          ? createPortal(
              <div className={`${FINELY_OS_FIXED_OVERLAY} z-[9100] flex items-center justify-center p-3 sm:p-4`}>
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)} aria-hidden />
                <div
                  className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-3xl border-violet-400/20`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="marketing-staff-chat-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Credit specialist team</div>
                      <div id="marketing-staff-chat-title" className="text-lg font-bold text-white">
                        {triggerLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className={`${FINELY_OS_SECONDARY_BTN} !p-2`}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-4 max-h-[72vh] overflow-y-auto">{stripBody}</div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return stripBody;
}
