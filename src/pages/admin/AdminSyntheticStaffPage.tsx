import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { SyntheticStaffFloor } from '../../features/overnight50/SyntheticStaffFloor';

export default function AdminSyntheticStaffPage() {
  return <PageShell badge="Admin" title="Synthetic Staff" subtitle="20 digital staff agents with roles, shifts, KPIs, blockers, and compliance boundaries."><SyntheticStaffFloor /></PageShell>;
}
