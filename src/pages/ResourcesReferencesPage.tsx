import React from 'react';
import { FileText, GitBranch, Scale, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

const QUICK_REFS = [
  {
    title: 'Dispute workflow overview',
    desc: 'How evidence, reasons, letters, rounds, and follow-ups connect.',
    icon: Scale,
    badge: 'Workflow',
    iconTone: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  },
  {
    title: 'Document discipline',
    desc: 'What to upload, when, and how to label it for clean execution.',
    icon: FileText,
    badge: 'Vault',
    iconTone: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  },
  {
    title: 'Score model cheat sheet',
    desc: 'FICO vs VantageScore, and why lenders differ by product.',
    icon: TrendingUp,
    badge: 'Scores',
    iconTone: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  },
  {
    title: 'Funding readiness sequencing',
    desc: 'Avoidable denials: timing, utilization, and profile structure.',
    icon: Target,
    badge: 'Funding',
    iconTone: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
  },
] as const;

export default function ResourcesReferencesPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: 'Quick references',
    description: 'Finely Cred quick-reference cards for dispute workflow, vault discipline, score models, and funding readiness.',
    path: '/resources/references',
  });

  return (
    <PageShell
      badge="Public"
      title="Quick references"
      subtitle="Short cheat sheets for restore execution, vault hygiene, scores, and funding prep."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <PublicLaneTitle
          lane="resources"
          eyebrow="Reference cards"
          text="Cheat sheets for every stage."
          highlight="every stage."
        />
        <FinelyUnifiedHubLayout
          eyebrow="Reference cards"
          title="Quick references"
          subtitle="Educational snapshots — use with free guides and your partner portal for full workflows."
          accent="violet"
          kpis={[{ label: 'Cards', value: String(QUICK_REFS.length), accent: 'violet' }]}
          primaryAction={{ label: 'Free guides', onClick: () => navigate('/resources/guides') }}
          secondaryAction={{ label: 'Resource hub', onClick: () => navigate('/resources') }}
        >
          <div className={`space-y-3 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/15">
                <GitBranch size={18} className="text-violet-700" />
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Reference cards</span>
                <div className={`text-xs font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_BODY}`}>Quick references</div>
              </div>
            </div>
            <FinelyOsPaginatedStack
              items={[...QUICK_REFS]}
              pageSize={6}
              itemSpacingClassName="grid md:grid-cols-2 gap-3"
              renderItem={(x, idx) => {
                const Icon = x.icon;
                const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                return (
                  <div key={x.title} className={`${finelyOsCatalogCard(accent)}`} data-fc-accent={accent}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${x.iconTone}`}>
                        <Icon size={18} />
                      </div>
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-800">
                        {x.badge}
                      </span>
                    </div>
                    <div className={`mt-3 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{x.title}</div>
                    <div className={`mt-2 text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{x.desc}</div>
                  </div>
                );
              }}
            />
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>Results vary · not legal advice · educational only.</p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Want these references mapped to your next portal step?"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
