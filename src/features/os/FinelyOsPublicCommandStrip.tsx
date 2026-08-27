import React, { useState } from 'react';
import { ArrowRight, BookOpen, Calendar, ChevronDown, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { FlashyIcon } from '../../components/ui';
import { FinelyMarketingWowStrip } from '../../components/marketing/FinelyMarketingWowStrip';
import { FinelyOsPaginatedStack } from './FinelyOsPaginatedStack';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import {
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from './finelyOsLightUi';

type Tile = {
  id: string;
  label: string;
  hint: string;
  path: string;
  accent: 'violet' | 'emerald' | 'fuchsia' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const PRIMARY_TILES: Tile[] = [
  {
    id: 'trial',
    label: 'Start free guide',
    hint: 'Dispute letters, checklist, and your portal workspace',
    path: '/free-guide',
    accent: 'emerald',
    icon: BookOpen,
  },
  {
    id: 'pricing',
    label: 'See pricing',
    hint: 'Personal restore, business credit, and debt paths',
    path: '/pricing',
    accent: 'violet',
    icon: DollarSign,
  },
  {
    id: 'session',
    label: 'Book a strategy call',
    hint: 'Free 15-minute call — pick a time',
    path: '/enlightenment-session',
    accent: 'sky',
    icon: Calendar,
  },
  {
    id: 'specialists',
    label: 'Credit Specialist program',
    hint: 'Earn while you help partners restore credit',
    path: '/credit-specialist',
    accent: 'rose',
    icon: Users,
  },
];

const FUNNEL_TILES: Tile[] = [
  { id: 'debt', label: 'Debt guide', hint: 'Validation and summons response', path: '/free-debt-guide', accent: 'fuchsia', icon: BookOpen },
  { id: 'business', label: 'Business credit', hint: 'Entity setup and vendor depth', path: '/free-business-guide', accent: 'violet', icon: BookOpen },
  { id: 'tradeline', label: 'Tradeline guide', hint: 'Authorized-user education', path: '/free-tradeline-guide', accent: 'emerald', icon: BookOpen },
  { id: 'score', label: 'Score roadmap', hint: 'Five-step recovery sequence', path: '/free-score-roadmap', accent: 'sky', icon: BookOpen },
  { id: 'agency', label: 'Agency kit', hint: 'White-label partner resources', path: '/free-agency-guide', accent: 'rose', icon: BookOpen },
  { id: 'specialist', label: 'Specialist join', hint: 'Join the specialist network', path: '/credit-specialist', accent: 'violet', icon: Users },
  { id: 'affiliate', label: 'Affiliate toolkit', hint: 'Referral and promo templates', path: '/affiliate-toolkit', accent: 'fuchsia', icon: Users },
];

export function FinelyOsPublicCommandStrip() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showMore, setShowMore] = useState(false);
  const resolveTilePath = (path: string) => path;

  return (
    <section className={`relative z-10 -mt-2 pb-10 ${finelyOsLandingContrastSection('fc-band-emerald')}`} data-fc-contrast-band="1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
          {/* Command deck — headline rail */}
          <div className={`${finelyOsCatalogCard('emerald')} space-y-5 lg:sticky lg:top-24`} data-fc-accent="emerald">
            <div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Your next step</div>
              <h2 className={`mt-2 text-2xl sm:text-3xl font-extrabold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>
                Pick one path to begin
              </h2>
              <p className={`mt-3 text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
                Personal restore, business credit, debt help, or a free strategy call — each tile opens its own lane.
              </p>
            </div>
            <button
              type="button"
              onClick={() => finelyCtaNavigate(navigate, 'personal_free_guide', { isAuthed: Boolean(auth.user) })}
              className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center !py-3.5 !text-base`}
            >
              Start free guide <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/start-here')}
              className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center !py-3 !text-sm`}
            >
              Not sure? Start here
            </button>
            <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>

          {/* Path mosaic */}
          <div className="space-y-4">
            <FinelyOsPaginatedStack
              items={PRIMARY_TILES}
              pageSize={4}
              itemSpacingClassName="grid sm:grid-cols-2 gap-4"
              renderItem={(t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(resolveTilePath(t.path))}
                  className={`text-left ${finelyOsCatalogCard(t.accent)} !p-5 lg:!p-6 transition-all hover:brightness-110`}
                  data-fc-accent={t.accent}
                >
                  <FlashyIcon icon={t.icon} color={t.accent} size="sm" className="mb-4" />
                  <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
                  <div className={`text-sm mt-1.5 leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{t.hint}</div>
                </button>
              )}
            />

            <div className="pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="fc-wayfinder-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              >
                {showMore ? 'Hide' : 'More'} free guides ({FUNNEL_TILES.length})
                <ChevronDown size={16} className={showMore ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {showMore ? (
                <div className="mt-4">
                  <FinelyOsPaginatedStack
                    items={FUNNEL_TILES}
                    pageSize={4}
                    itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    renderItem={(t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(t.path)}
                        className={`text-left ${finelyOsCatalogCard(t.accent)} !p-4 transition-all hover:brightness-110`}
                        data-fc-accent={t.accent}
                      >
                        <FlashyIcon icon={t.icon} color={t.accent} size="xs" className="mb-2" />
                        <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{t.label}</div>
                        <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{t.hint}</div>
                      </button>
                    )}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <FinelyMarketingWowStrip compact className="!p-4 border-emerald-400/15 mt-6" />
      </div>
    </section>
  );
}
