import React from 'react';
import { PageShell } from '../../../../components/layout/PageShell';

export type AdminEmbeddablePageProps = {
  embedded?: boolean;
};

export function AdminWorkstationFrame({
  embedded = false,
  kind,
  badge,
  title,
  subtitle,
  back,
  children,
}: {
  embedded?: boolean;
  kind: string;
  badge: string;
  title: string;
  subtitle: string;
  back?: { to?: string | number; label?: string; title?: string };
  children?: React.ReactNode;
}) {
  if (embedded) {
    return <section data-surface-kind={kind}>{children}</section>;
  }
  return (
    <PageShell badge={badge} title={title} subtitle={subtitle} back={back}>
      {children}
    </PageShell>
  );
}
