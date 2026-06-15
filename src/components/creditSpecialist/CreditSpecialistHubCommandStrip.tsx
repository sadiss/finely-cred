import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CS } from '../../config/creditSpecialistProgram';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

type Props = {
  clientCount?: number;
  openTasks?: number;
};

export function CreditSpecialistHubCommandStrip({ clientCount = 0, openTasks = 0 }: Props) {
  const navigate = useNavigate();

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Credit Specialist · Role OS 2.0"
      headline="Specialist command center"
      subline="Clients · growth · training · partnership line — one strip for daily ops."
      tiles={[
        { id: 'clients', label: 'Clients', value: String(clientCount), accent: 'violet', onClick: () => navigate('/admin/partners') },
        { id: 'tasks', label: 'Open tasks', value: String(openTasks), accent: 'amber', onClick: () => navigate('/portal/projects') },
        { id: 'growth', label: 'Growth', value: 'Pitch', accent: 'emerald', onClick: () => navigate(`${CS.hubPath}?tab=growth`) },
        { id: 'line', label: 'Partnership', value: 'Line', accent: 'sky', onClick: () => navigate(CS.messagesDeepLink) },
      ]}
      primaryAction={{ label: 'Partnership line', onClick: () => navigate(CS.messagesDeepLink) }}
      secondaryAction={{ label: 'Training', onClick: () => navigate(`${CS.hubPath}?tab=training`) }}
    />
  );
}
