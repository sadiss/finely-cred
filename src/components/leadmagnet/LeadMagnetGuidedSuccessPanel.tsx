import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Check, Download, Loader2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { findFreeGuideById } from '../../resources/freeGuides';
import { downloadFreeGuidePdf } from '../../resources/downloadGuidePdf';
import { downloadScoreRoadmapPdf } from '../../resources/buildScoreRoadmapPdf';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { getAgentPersona } from '../../domain/agentPersonas';
import { saveAgentHandoff } from '../../lib/agentHandoffBridge';
import { goalFromFunnelConfig, openPublicChat } from '../../lib/publicChatEvents';
import { FunnelFreeToolkitRouter } from './funnelFreeTools/FunnelFreeToolkitRouter';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';

type Props = {
  funnelConfig: LeadMagnetFunnelConfig;
  leadId: string;
  fullName: string;
  email: string;
  phone?: string;
  className?: string;
};

export function LeadMagnetGuidedSuccessPanel({ funnelConfig, leadId, fullName, email, phone, className }: Props) {
  const navigate = useNavigate();
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);

  const guide = useMemo(() => findFreeGuideById(funnelConfig.guideId), [funnelConfig.guideId]);
  const premiumProfile = getLeadMagnetPremiumProfile(funnelConfig);
  const assignedStaff = useMemo(() => resolveStaffOnDuty(funnelConfig.agentPersonaId), [funnelConfig.agentPersonaId]);
  const staffName = assignedStaff ? staffMemberFullName(assignedStaff) : funnelConfig.agentDisplayName;
  const staffTitle = getAgentPersona(funnelConfig.agentPersonaId)?.displayTitle ?? funnelConfig.agentRole;

  const onboardingUrl = useMemo(() => {
    const attr = getLeadAttribution();
    const params = new URLSearchParams();
    params.set('lane', funnelConfig.onboardingLane);
    if (email) params.set('email', email);
    if (leadId) params.set('leadId', leadId);
    if (attr?.referralCode) params.set('ref', attr.referralCode);
    params.set('next', '/portal/dashboard');
    return `/onboarding?${params.toString()}`;
  }, [funnelConfig.onboardingLane, email, leadId]);

  const bookingUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (fullName) params.set('name', fullName);
    if (phone) params.set('phone', phone);
    if (leadId) params.set('leadId', leadId);
    if (funnelConfig.id === 'debt') params.set('focus', 'debt');
    else if (funnelConfig.id === 'business' || funnelConfig.id === 'agency') params.set('focus', 'business');
    else if (funnelConfig.id === 'tradeline') params.set('focus', 'tradelines');
    else params.set('focus', 'personal');
    const path = funnelConfig.bookingPath ?? '/enlightenment-session';
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }, [funnelConfig, email, fullName, leadId, phone]);

  const portalLaneLabel = useMemo(() => {
    const lane = funnelConfig.onboardingLane;
    if (lane === 'debt_relief') return 'Debt lane portal';
    if (lane === 'business_credit') return 'Business credit portal';
    if (lane === 'personal_restore') return 'Personal restore portal';
    return 'Partner portal preview';
  }, [funnelConfig.onboardingLane]);

  const downloadGuide = async () => {
    if (!guide && funnelConfig.id !== 'score_roadmap') return;
    setDownloadBusy(true);
    setDownloadErr(null);
    try {
      if (funnelConfig.id === 'score_roadmap') {
        await downloadScoreRoadmapPdf({ fullName, leadId, email });
      } else if (guide) {
        await downloadFreeGuidePdf({ guide, leadId, fullName, email });
      }
    } catch (e: unknown) {
      setDownloadErr((e as Error)?.message || 'Download failed.');
    } finally {
      setDownloadBusy(false);
    }
  };

  return (
    <div className={className ?? 'mt-4 space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5'}>
      <div className="flex items-start gap-3">
        <Check className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" />
        <div>
          <h3 className="text-lg font-black text-white">{premiumProfile?.successHeadline ?? "You're in — here's your path"}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            Reference <span className="font-mono text-emerald-200/90">{leadId.slice(0, 8)}</span>. {staffName} ({staffTitle}) can follow up.
            Your {LEAD_MAGNET_TRIAL_DAYS}-day {portalLaneLabel} preview is active — matches what you saw on this page.
          </p>
        </div>
      </div>

      <ol className="space-y-2 text-sm text-white/75">
        <li className="flex gap-2"><span className="font-black text-emerald-300">1.</span> Download your free PDF guide</li>
        <li className="flex gap-2"><span className="font-black text-emerald-300">2.</span> Open portal preview — upload a report when ready</li>
        <li className="flex gap-2"><span className="font-black text-emerald-300">3.</span> Book a strategist session or chat if you want help</li>
      </ol>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={downloadBusy}
          onClick={() => void downloadGuide()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white hover:bg-emerald-500/30 disabled:opacity-60"
        >
          {downloadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </button>
        <button
          type="button"
          onClick={() => navigate(onboardingUrl)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white hover:bg-white/15"
        >
          {portalLaneLabel} <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate(bookingUrl)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/85"
        >
          <Calendar className="h-4 w-4" /> Book session
        </button>
        <button
          type="button"
          onClick={() => {
            saveAgentHandoff({ leadId, personaId: funnelConfig.agentPersonaId, surface: 'lead_magnet', goal: funnelConfig.onboardingLane });
            openPublicChat({ goal: goalFromFunnelConfig(funnelConfig), personaId: funnelConfig.agentPersonaId, leadId });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/85"
        >
          <MessageCircle className="h-4 w-4" /> Chat with {staffName.split(' ')[0]}
        </button>
      </div>

      {downloadErr ? <div className="text-sm text-rose-300">{downloadErr}</div> : null}

      {funnelConfig.id !== 'credit' ? (
        <div id="fg-free-toolkit" className="rounded-xl border border-white/10 bg-black/20 p-3">
          <FunnelFreeToolkitRouter funnelId={funnelConfig.id} leadId={leadId} email={email} />
        </div>
      ) : null}

      <p className="text-[10px] leading-relaxed text-white/45">
        Educational use only — not legal advice. No outcome guarantees. Portal trial features lock after {LEAD_MAGNET_TRIAL_DAYS} days unless you upgrade.
      </p>
    </div>
  );
}
