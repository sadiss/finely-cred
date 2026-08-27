import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Route, UserRound } from 'lucide-react';
import type { Partner } from '../../../../domain/partners';
import { listPartnerNotesByPartner } from '../../../../data/partnerNotesRepo';
import { PartnerOnboardingProgress } from '../../../../components/onboarding/PartnerOnboardingProgress';
import { PartnerOnboardingRelationshipCard } from '../../../../components/onboarding/PartnerOnboardingRelationshipCard';
import { PartnerLaneSpecialistStrip } from '../../../../components/partner/PartnerLaneSpecialistStrip';
import { PartnerCreditLanesPanel } from '../../../../components/partner/PartnerCreditLanesPanel';
import { PartnerActivityTimeline, partnerNoteToTimelineItem } from '../../../../components/partner/PartnerActivityTimeline';
import { ProductSectionHeader } from '../components/ProductUi';
import { resolveWorkspaceProductPath } from '../workspaceProductNav';
import './partnerDashboardPartnerFileStrip.css';

type PartnerDashboardPartnerFileStripProps = {
  partner: Partner;
  reportCount: number;
  letterCount: number;
  onRefresh?: () => void;
};

export function PartnerDashboardPartnerFileStrip({
  partner,
}: PartnerDashboardPartnerFileStripProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';

  const staffNotes = useMemo(() => {
    return listPartnerNotesByPartner(partner.id)
      .filter((note) => note.visibility === 'partner')
      .slice()
      .sort(
        (a, b) =>
          Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt),
      )
      .slice(0, 4);
  }, [partner.id]);

  const go = (target: string) => navigate(resolveWorkspaceProductPath('partner', target, navigationMode));

  return (
    <section className="fc-partner-file-rooms" aria-label="Your file" data-fc-dashboard-file-strip="1">
      <ProductSectionHeader
        eyebrow="Your file"
        title="Setup, specialist, and lanes"
        description="Onboarding, your specialist, and the services already on this file."
      />
      <div className="fc-partner-file-rooms-grid">
        <article className="fc-partner-file-room" data-accent="emerald">
          <header className="fc-partner-file-room-head">
            <span className="fc-partner-file-room-icon" aria-hidden>
              <UserRound size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="fc-partner-file-room-kicker">Onboarding</p>
              <h3>Setup</h3>
            </div>
          </header>
          <PartnerOnboardingRelationshipCard partner={partner} />
          <PartnerOnboardingProgress partner={partner} />
        </article>

        <article className="fc-partner-file-room" data-accent="violet">
          <header className="fc-partner-file-room-head">
            <span className="fc-partner-file-room-icon" aria-hidden>
              <HeartHandshake size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="fc-partner-file-room-kicker">Your credit specialist</p>
              <h3>Specialist</h3>
            </div>
          </header>
          <PartnerLaneSpecialistStrip partnerId={partner.id} />
          {staffNotes.length ? (
            <PartnerActivityTimeline
              items={staffNotes.map(partnerNoteToTimelineItem)}
              emptyMessage="No specialist notes yet."
              accent="violet"
            />
          ) : (
            <p className="fc-partner-file-room-empty">Notes from your specialist will show here.</p>
          )}
          <button type="button" className="fc-partner-file-room-link" onClick={() => go('/portal/messages')}>
            Open messages <ArrowRight size={14} />
          </button>
        </article>

        <article className="fc-partner-file-room" data-accent="sky">
          <header className="fc-partner-file-room-head">
            <span className="fc-partner-file-room-icon" aria-hidden>
              <Route size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="fc-partner-file-room-kicker">Services on file</p>
              <h3>Lanes</h3>
            </div>
          </header>
          <PartnerCreditLanesPanel partnerId={partner.id} lane={partner.lane} />
          <div className="fc-partner-file-room-jumps">
            <button type="button" className="fc-partner-file-room-link" onClick={() => go('/portal/billing')}>
              Billing and financing <ArrowRight size={14} />
            </button>
            <button type="button" className="fc-partner-file-room-link" data-accent="rose" onClick={() => go('/portal/wealth-paths')}>
              Goals and readiness <ArrowRight size={14} />
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
