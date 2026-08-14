/**
 * Shared shell for C1's public, SEO-indexable doctrine articles under `/resources/*`.
 *
 * Every article sourced from `debtLitigationDoctrineRepo.ts`, `businessCreditDoctrineRepo.ts`, or
 * `internationalAndNonCitizenCreditRepo.ts` uses this shell so the hero, compliance footnote,
 * staff-chat strip, and footer stay consistent (compact-luxury-ui) without re-implementing the
 * chrome on every page — the individual article pages only supply content + a doctrine-source note.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import type { PublicChatGoal } from '../../lib/publicChatEvents';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

const ACCENT_HERO: Record<FinelyOsPublicAccent, { border: string; wash: string; kicker: string }> = {
  rose: { border: 'border-rose-400/25', wash: 'rgba(244,63,94,0.16)', kicker: 'text-rose-300' },
  amber: { border: 'border-amber-400/25', wash: 'rgba(245,158,11,0.16)', kicker: 'text-amber-300' },
  emerald: { border: 'border-emerald-400/25', wash: 'rgba(16,185,129,0.16)', kicker: 'text-emerald-300' },
  violet: { border: 'border-violet-400/25', wash: 'rgba(139,92,246,0.16)', kicker: 'text-violet-300' },
  sky: { border: 'border-sky-400/25', wash: 'rgba(14,165,233,0.16)', kicker: 'text-sky-300' },
  fuchsia: { border: 'border-fuchsia-400/25', wash: 'rgba(217,70,239,0.16)', kicker: 'text-fuchsia-300' },
};

export type DoctrineArticleRelatedLink = { label: string; to: string };

export function DoctrineArticleShell({
  seo,
  badge,
  kicker,
  title,
  accentWord,
  subtitle,
  accent = 'violet',
  sourceNote,
  children,
  relatedLinks,
  chatRoleId,
  chatGoal,
  chatRoleLabel,
  chatSubline,
  complianceNote,
  primaryCta,
}: {
  seo: { title: string; description: string; path: string };
  badge: string;
  kicker: string;
  title: string;
  accentWord?: string;
  subtitle: string;
  accent?: FinelyOsPublicAccent;
  /** One line naming the exact doctrine repo(s) this article's claims are sourced from. */
  sourceNote: string;
  children: React.ReactNode;
  relatedLinks: DoctrineArticleRelatedLink[];
  chatRoleId: AgentPersonaId;
  chatGoal: PublicChatGoal;
  chatRoleLabel: string;
  chatSubline?: string;
  complianceNote?: string;
  primaryCta?: { label: string; to: string };
}) {
  const navigate = useNavigate();
  usePublicSeoMeta(seo);
  const tone = ACCENT_HERO[accent];

  return (
    <PageShell hideHero badge={badge} title={seo.title} subtitle={subtitle}>
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <section
          className={`relative overflow-hidden rounded-[1.5rem] border ${tone.border} bg-gradient-to-br from-[#141013]/95 via-[#0d0e12]/95 to-[#0a0b0f]/98`}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 60% 50% at 0% 0%, ${tone.wash}, transparent 60%)` }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-3 p-6 lg:p-8">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] ${tone.kicker}`}>
              {kicker}
            </div>
            <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              {accentWord ? (
                <>
                  {title} <span className={tone.kicker}>{accentWord}</span>
                </>
              ) : (
                title
              )}
            </h1>
            <p className={`max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} max-w-3xl`}>{sourceNote}</p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => navigate(primaryCta?.to ?? '/enlightenment-session')}
                className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
              >
                {primaryCta?.label ?? 'Book a strategy call'} <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
                See pricing &amp; packages
              </button>
            </div>
          </div>
        </section>

        {children}

        {relatedLinks.length ? (
          <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
            <h2 className="text-base font-bold text-white">Related reading</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => navigate(link.to)}
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-1.5`}
                >
                  {link.label} <ArrowRight size={12} />
                </button>
              ))}
              <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
                All resources
              </button>
            </div>
          </section>
        ) : null}

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          {complianceNote ||
            'Results vary · not legal, tax, or financial advice · individual eligibility, procedure, and outcomes depend on your own circumstances, lender/bureau/court policy, and current law — all of which change over time. Consult a licensed attorney for your specific situation.'}
        </p>

        <MarketingStaffChatStrip roleId={chatRoleId} goal={chatGoal} roleLabel={chatRoleLabel} subline={chatSubline} />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
