import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsIconBadge } from '../../features/os/FinelyOsIconBadge';
import { LeadIntelHub } from '../../features/leadIntel/LeadIntelHub';
import { LeadEngineOneButton } from '../../features/leadIntel/LeadEngineOneButton';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { LeadIntelStaffRosterPanel } from '../../features/staffCommandCenter/LeadIntelStaffRosterPanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_BACK_LINK,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

export default function AdminLeadIntelPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Admin"
      title="Lead Intelligence"
      subtitle="Swarm discovery and staging — operated by your Lead Intel department staff from Staff Command Center."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/staff')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Staff Command Center
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/staff?view=roster')} className={FINELY_OS_SECONDARY_BTN}>
              Edit staff roster
            </button>
            <button type="button" onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')} className={FINELY_OS_SECONDARY_BTN}>
              CRM imports <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_PRIMARY_BTN}>
              Open CRM <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <FinelyOsIconBadge icon={Sparkles} accent="fuchsia" size={18} className="p-2.5 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            <strong className="text-fuchsia-200">Lead Intel is not a separate agent list.</strong> The swarm below is run by named staff from Staff Command Center
            (Pipeline Titan, Scout Supreme, Night Owl, Switchboard, etc.). Discovery → enrich → stage → import into{' '}
            <strong className="text-fuchsia-200">CRM → Prospects</strong>.
          </p>
        </div>

        <div className="space-y-8">
          <LeadEngineOneButton />
          <LeadIntelStaffRosterPanel compact />
          <LeadIntelSwarmDashboard />
          <LeadIntelHub />
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
