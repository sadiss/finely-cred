import React from 'react';
import { ArrowLeft, ArrowRight, Layout, Library, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

function ModuleCard({
  label,
  title,
  description,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  title: string;
  description: string;
  icon: typeof Library;
  accent: 'amber' | 'violet' | 'emerald';
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`${finelyOsCatalogCard(accent)} !p-5 w-full text-left transition-all hover:brightness-[1.02]`} data-fc-accent={accent}>
      <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE} inline-flex items-center gap-2`}>
        <Icon size={16} className="text-violet-600" /> {title}
      </div>
      <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{description}</div>
      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-700/70">
        Open <ArrowRight size={12} />
      </div>
    </button>
  );
}

export default function AdminCmsPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Admin"
      title="CMS"
      subtitle="Content operations hub. This is the staging area for landing copy, guides, and reusable messaging."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <div className={FINELY_OS_BANNER}>
          <Layout size={18} className="text-violet-700 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            The full CMS editor is a Phase-2 build. Use the live modules below to manage the most important content surfaces today.
          </p>
        </div>

        <FinelyOsGlassPanel icon={Layout} title="Content modules" subtitle="Jump into the editors that power public and partner-facing pages." accent="amber">
          <div className="grid md:grid-cols-3 gap-4">
            <ModuleCard
              label="Module"
              title="Resources"
              description="Edit public guides and partner-facing resources."
              icon={Library}
              accent="amber"
              onClick={() => navigate('/admin/resources')}
            />
            <ModuleCard
              label="Module"
              title="Comms Studio"
              description="Templates and delivery logic for partner communication."
              icon={Mail}
              accent="violet"
              onClick={() => navigate('/admin/comms')}
            />
            <ModuleCard
              label="Surface"
              title="Public pricing"
              description="Audit what customers see (DIY vs DFY, categories, rails)."
              icon={Layout}
              accent="emerald"
              onClick={() => navigate('/pricing')}
            />
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
