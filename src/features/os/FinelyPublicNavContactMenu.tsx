import React from 'react';
import { PUBLIC_CONTACT_LINKS, matchContactPath } from '../../config/siteWayfinderLanes';
import { FinelyPublicNavDropdown } from './FinelyPublicNavDropdown';

export function FinelyPublicNavContactMenu({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <FinelyPublicNavDropdown
      label="Contact"
      isActive={matchContactPath(pathname)}
      links={PUBLIC_CONTACT_LINKS}
      onNavigate={onNavigate}
    />
  );
}
