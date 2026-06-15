import React, { useState } from 'react';
import { ArrowRight, BookOpen, Calendar, ChevronDown, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FlashyIcon } from '../../components/ui';
import { FinelyOsPaginatedStack } from './FinelyOsPaginatedStack';
import { finelyOsCatalogCard, finelyOsLandingContrastSection, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from './finelyOsLightUi';

type Tile = {
  id: string;
  label: string;
  hint: string;
  path: string;
  accent: 'violet' | 'emerald' | 'amber' | 'fuchsia' | 'sky';
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const PRIMARY_TILES: Tile[] = [
  { id: 'guide', label: 'Free guide', hint: 'Dispute letter kit + DIY trial', path: '/free-guide', accent: 'emerald', icon: BookOpen },
  { id: 'pricing', label: 'See pricing', hint: 'DIY, DFY, and wealth paths', path: '/pricing', accent: 'amber', icon: DollarSign },
  { id: 'session', label: 'Book a strategy call', hint: 'Free 60-minute call', path: '/enlightenment-session', accent: 'violet', icon: Calendar },
  { id: 'specialists', label: 'Credit specialists', hint: 'Done-for-you partner program', path: '/credit-specialists', accent: 'sky', icon: Users },
];

const FUNNEL_TILES: Tile[] = [
  { id: 'debt', label: 'Debt guide', hint: 'Collections validation playbook', path: '/free-debt-guide', accent: 'fuchsia', icon: BookOpen },
  { id: 'business', label: 'Business credit', hint: 'Entity + vendor credit jumpstart', path: '/free-business-guide', accent: 'violet', icon: BookOpen },
  { id: 'tradeline', label: 'Tradeline guide', hint: 'AU vs primary education', path: '/free-tradeline-guide', accent: 'emerald', icon: BookOpen },
  { id: 'score', label: 'Score roadmap', hint: '5-step recovery sequence', path: '/free-score-roadmap', accent: 'sky', icon: BookOpen },
  { id: 'agency', label: 'Agency kit', hint: 'White-label partner OS', path: '/free-agency-guide', accent: 'amber', icon: BookOpen },
  { id: 'specialist', label: 'Specialist apply', hint: 'Join the specialist network', path: '/credit-specialist-apply', accent: 'violet', icon: Users },
  { id: 'affiliate', label: 'Affiliate toolkit', hint: 'Referral + promo templates', path: '/affiliate-toolkit', accent: 'fuchsia', icon: Users },
];

export function FinelyOsPublicCommandStrip() {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  return (
    <section className={`relative z-10 -mt-2 pb-8 ${finelyOsLandingContrastSection('fc-band-emerald')}`} data-fc-contrast-band="1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6">
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Your next step</div>
              <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Four clear paths — expand only if you need more</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/free-guide')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 transition-all"
            >
              Start free guide <ArrowRight size={16} />
            </button>
          </div>
          <FinelyOsPaginatedStack
            items={PRIMARY_TILES}
            pageSize={4}
            itemSpacingClassName="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
            renderItem={(t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(t.path)}
                className={`text-left ${finelyOsCatalogCard(t.accent)} !p-4`}
                data-fc-accent={t.accent}
              >
                <FlashyIcon icon={t.icon} color={t.accent} size="sm" className="mb-3" />
                <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
                <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{t.hint}</div>
              </button>
            )}
          />

          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="fc-wayfinder-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              {showMore ? 'Hide' : 'Show'} more free guides ({FUNNEL_TILES.length})
              <ChevronDown size={14} className={showMore ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {showMore ? (
              <div className="mt-3">
                <FinelyOsPaginatedStack
                  items={FUNNEL_TILES}
                  pageSize={4}
                  itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  renderItem={(t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => navigate(t.path)}
                      className={`text-left ${finelyOsCatalogCard(t.accent)} !p-3`}
                      data-fc-accent={t.accent}
                    >
                      <FlashyIcon icon={t.icon} color={t.accent} size="xs" className="mb-2" />
                      <div className={`text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
                      <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{t.hint}</div>
                    </button>
                  )}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
