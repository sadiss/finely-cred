import React from 'react';
import { PageShell } from '../components/layout/PageShell';

export default function PlaceholderPage({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return <PageShell title={title} subtitle={subtitle} badge={badge} />;
}

