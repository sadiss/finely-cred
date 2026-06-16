import React from 'react';
import { PUBLIC_CAREER_PATHS, matchCareersPath } from '../../config/siteWayfinderLanes';
import { FinelyPublicNavDropdown } from './FinelyPublicNavDropdown';

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
      links={PUBLIC_CAREER_PATHS}
      onNavigate={onNavigate}
    />
  );
}
