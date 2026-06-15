import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { isAdminEmail } from '../../auth/admin';

type Props = {
  userEmail?: string | null;
  userRole?: string;
  partnerId?: string | null;
  reportsCount?: number;
  openTasksCount?: number;
  openCasesCount?: number;
};

export function DashboardDoNextStrip({
  userEmail,
  userRole,
  partnerId,
  reportsCount = 0,
  openTasksCount = 0,
  openCasesCount = 0,
}: Props) {
  const navigate = useNavigate();
  const isAdmin = userEmail ? isAdminEmail(userEmail) : false;
  const role = (userRole || '').toLowerCase();

  const config = useMemo(() => {
    if (isAdmin) {
      return {
        roleLabel: 'Admin · Do next',
        headline: 'Launch ops priority',
        subline: 'Triage partners missing reports, open cases, and SLA tasks.',
        tiles: [
          { id: 'partners', label: 'Partners', value: 'Manage', accent: 'violet' as const, onClick: () => navigate('/admin/partners') },
          { id: 'workflow', label: 'Ops queue', value: 'Open', accent: 'amber' as const, onClick: () => navigate('/admin/workflow') },
          { id: 'support', label: 'Support', value: 'Inbox', accent: 'sky' as const, onClick: () => navigate('/admin/support') },
          { id: 'nora', label: 'Funding', value: 'Nora', accent: 'emerald' as const, onClick: () => navigate('/admin/nora-capital') },
        ],
        primary: { label: 'Open partner management', onClick: () => navigate('/admin/partners') },
        secondary: { label: 'Admin dashboard', onClick: () => navigate('/admin') },
      };
    }
    if (role === 'agent' || role === 'credit_specialist') {
      return {
        roleLabel: 'Credit Specialist · Do next',
        headline: 'Run your client pipeline',
        subline: 'Check partnership line, open disputes, and growth tools.',
        tiles: [
          { id: 'hub', label: 'Hub', value: 'Open', accent: 'violet' as const, onClick: () => navigate('/credit-specialist/hub') },
          { id: 'disputes', label: 'Disputes', value: String(openCasesCount), accent: 'fuchsia' as const, onClick: () => navigate('/portal/disputes') },
          { id: 'messages', label: 'Partnership', value: 'Line', accent: 'sky' as const, onClick: () => navigate('/portal/messages?hub=team&topic=credit_specialist_program') },
          { id: 'clients', label: 'Clients', value: 'CRM', accent: 'emerald' as const, onClick: () => navigate('/admin/partners') },
        ],
        primary: { label: 'Specialist hub', onClick: () => navigate('/credit-specialist/hub') },
        secondary: { label: 'Letter studio', onClick: () => navigate('/portal/letters') },
      };
    }
    return {
      roleLabel: 'Partner · Do next',
      headline: reportsCount ? 'Keep your file moving' : 'Start with your credit report',
      subline: partnerId
        ? reportsCount
          ? 'Upload → evidence → dispute letters → follow bureau responses.'
          : 'Get a monitoring account (same links as Resources), then upload your HTML export.'
        : 'Complete onboarding to link your partner profile.',
      tiles: [
        { id: 'reports', label: 'Reports', value: String(reportsCount), accent: 'violet' as const, onClick: () => navigate('/portal/reports') },
        { id: 'monitoring', label: 'Monitoring', value: 'Links', accent: 'sky' as const, onClick: () => navigate('/resources#monitoring') },
        { id: 'tasks', label: 'Tasks', value: String(openTasksCount), accent: 'amber' as const, onClick: () => navigate('/portal/projects') },
        { id: 'disputes', label: 'Cases', value: String(openCasesCount), accent: 'fuchsia' as const, onClick: () => navigate('/portal/disputes') },
      ],
      primary: reportsCount
        ? { label: 'Partner dashboard', onClick: () => navigate('/portal/partner') }
        : { label: 'Upload report', onClick: () => navigate('/portal/reports') },
      secondary: reportsCount
        ? { label: 'Free guide', onClick: () => navigate('/free-guide') }
        : { label: 'Monitoring partners', onClick: () => navigate('/resources#monitoring') },
    };
  }, [isAdmin, role, reportsCount, openTasksCount, openCasesCount, partnerId, navigate]);

  return (
    <FinelyOsRoleCommandCenter
      roleLabel={config.roleLabel}
      headline={config.headline}
      subline={config.subline}
      tiles={config.tiles}
      primaryAction={config.primary}
      secondaryAction={config.secondary}
    />
  );
}
