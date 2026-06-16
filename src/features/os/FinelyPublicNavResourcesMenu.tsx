import React from 'react';
import { PUBLIC_RESOURCES_SECTIONS, matchResourcesPath } from '../../config/siteWayfinderLanes';
import { FinelyPublicNavDropdown } from './FinelyPublicNavDropdown';

export function FinelyPublicNavResourcesMenu({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <FinelyPublicNavDropdown
      label="Resources"
      wide
      isActive={matchResourcesPath(pathname)}
      sections={PUBLIC_RESOURCES_SECTIONS}
      onNavigate={onNavigate}
    />
  );
}
