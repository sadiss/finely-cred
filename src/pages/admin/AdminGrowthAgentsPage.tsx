import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FINELY_OS_BACK_LINK, FINELY_OS_COMPACT_PAGE } from '../../features/os/finelyOsLightUi';
import { GrowthAgentsRoster } from '../../features/growthAgents/GrowthAgentsRoster';
import { GrowthResultsScoreboard } from '../../features/growthAgents/GrowthResultsScoreboard';
import { GrowthAgentWorkspaceView } from '../../features/growthAgents/GrowthAgentWorkspaceView';
import { GrowthAgentBreadcrumb } from '../../features/growthAgents/GrowthAgentWorkspaceShell';
import { getGrowthAgent } from '../../features/growthAgents/growthAgentRegistry';

export default function AdminGrowthAgentsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();

  if (agentId === 'results') {
    return (
      <PageShell badge="Admin" title="Growth Agents" subtitle="Results and specialists.">
        <GrowthResultsScoreboard />
      </PageShell>
    );
  }

  if (agentId) {
    const agent = getGrowthAgent(agentId);
    return (
      <PageShell
        badge="Admin"
        title={agent ? agent.name : 'Growth Agents'}
        subtitle={agent ? agent.roleTitle : 'Specialist'}
      >
        <div className={FINELY_OS_COMPACT_PAGE}>
          <button type="button" onClick={() => navigate('/admin/growth-agents')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> All specialists
          </button>
          <div className="mt-2">
            <GrowthAgentBreadcrumb agentName={agent?.name} />
          </div>
          <GrowthAgentWorkspaceView agentId={agentId} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="Admin" title="Growth Agents" subtitle="Find people, share links, see results — plain English.">
      <GrowthAgentsRoster />
    </PageShell>
  );
}
