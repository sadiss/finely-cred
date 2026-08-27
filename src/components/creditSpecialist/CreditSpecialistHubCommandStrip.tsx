import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CS } from '../../config/creditSpecialistProgram';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

type Props = {
  /** Assigned partner caseload count (prop name kept for call-site stability). */
  clientCount?: number;
  partnerCount?: number;
  openTasks?: number;
};

export function CreditSpecialistHubCommandStrip({ clientCount, partnerCount, openTasks = 0 }: Props) {
  const navigate = useNavigate();
  const partners = partnerCount ?? clientCount ?? 0;

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Credit Specialist"
      headline="Your caseload today"
      subline="Open a partner file, clear a task, or grow leads."
      tiles={[
        { id: 'partners', label: 'Partners', value: String(partners), accent: 'violet', onClick: () => navigate('/admin/partners') },
        { id: 'tasks', label: 'Open tasks', value: String(openTasks), accent: 'rose', onClick: () => navigate('/portal/my-tasks') },
        { id: 'growth', label: 'Growth', value: 'Pitch', accent: 'emerald', onClick: () => navigate(`${CS.hubPath}?tab=growth`) },
        { id: 'line', label: 'Partnership', value: 'Line', accent: 'sky', onClick: () => navigate(CS.messagesDeepLink) },
      ]}
      alert={
        partners === 0
          ? { tone: 'info', message: 'No partners assigned yet — open Growth to capture leads, or wait for admin assignment.' }
          : openTasks > 0
            ? { tone: 'warning', message: `${openTasks} open task${openTasks === 1 ? '' : 's'} on your caseload — clear blockers first.` }
            : undefined
      }
      primaryAction={{
        label: partners === 0 ? 'Open growth' : openTasks > 0 ? 'Open partner files' : 'Partnership line',
        onClick: () =>
          navigate(partners === 0 ? `${CS.hubPath}?tab=growth` : openTasks > 0 ? '/admin/partners' : CS.messagesDeepLink),
      }}
      secondaryAction={{ label: 'Letter studio', onClick: () => navigate('/portal/letters') }}
    />
  );
}
