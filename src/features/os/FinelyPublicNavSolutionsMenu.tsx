import React from 'react';
import { PUBLIC_SOLUTIONS_SECTIONS, matchSolutionsPath } from '../../config/siteWayfinderLanes';
import { FinelyPublicNavDropdown } from './FinelyPublicNavDropdown';

export function FinelyPublicNavSolutionsMenu({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <FinelyPublicNavDropdown
      label="Solutions"
      wide
      luxury
      isActive={matchSolutionsPath(pathname)}
      sections={PUBLIC_SOLUTIONS_SECTIONS}
      onNavigate={onNavigate}
    />
  );
}
