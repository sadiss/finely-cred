import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MarketingHqShell } from '../../features/marketingHq/MarketingHqShell';
import {
  MarketingChannelRoom,
  MarketingCommandFloor,
  MarketingDepartmentFloor,
} from '../../features/marketingHq/MarketingHqViews';

export default function MarketingHqPage() {
  return (
    <MarketingHqShell>
      <Routes>
        <Route index element={<MarketingCommandFloor />} />
        <Route path=":deptId" element={<MarketingDepartmentFloor />} />
        <Route path=":deptId/:channelId" element={<MarketingChannelRoom />} />
        <Route path="*" element={<Navigate to="/admin/marketing" replace />} />
      </Routes>
    </MarketingHqShell>
  );
}
