import React from 'react';
import { PUBLIC_CAREER_PATHS, matchCareersPath } from '../../config/siteWayfinderLanes';
import { FinelyPublicNavDropdown } from './FinelyPublicNavDropdown';

const CAREER_LINKS = [
  ...PUBLIC_CAREER_PATHS,
  {
    id: 'cs-join',
    label: 'Join as Credit Specialist',
    path: '/credit-specialist/join',
    hint: 'Apply / onboarding',
  },
];

export function FinelyPublicNavCareerMenu({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <FinelyPublicNavDropdown
      label="Careers"
      isActive={matchCareersPath(pathname)}
      links={CAREER_LINKS}
      onNavigate={onNavigate}
    />
  );
}
