import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsIconBadge } from '../../features/os/FinelyOsIconBadge';
import { LeadIntelHub } from '../../features/leadIntel/LeadIntelHub';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { Overnight50AdminNav } from '../../components/overnight50/Overnight50AdminNav';
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
      title="Lead Intelligence Agent"
      subtitle="Discover → stage → import — CRM-grade prospecting with AI copilot, staging board, and intel library."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/leads?tab=intel')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Leads OS
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/crm?smartList=lead_intel_imports')} className={FINELY_OS_SECONDARY_BTN}>
              CRM imports <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_PRIMARY_BTN}>
              Open CRM <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <Overnight50AdminNav className="mb-4" />

        <div className={FINELY_OS_BANNER}>
          <FinelyOsIconBadge icon={Sparkles} accent="fuchsia" size={18} className="p-2.5 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Lead Intel discovers prospects from compliant search APIs, enriches public pages, stages them on a kanban board, and saves qualified records into{' '}
            <strong className="text-fuchsia-200">CRM → Prospects</strong>. Pair with sequences and playbooks for outbound.
          </p>
        </div>

        <LeadIntelSwarmDashboard />

        <LeadIntelHub />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
