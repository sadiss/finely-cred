import React from 'react';
import { PageShell } from '../../../../components/layout/PageShell';

export type PartnerEmbeddablePageProps = {
  embedded?: boolean;
};

export function PartnerWorkstationFrame({
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
    return (
      <section className="fc-wlp-embed-scope" data-surface-kind={kind}>
        {children}
      </section>
    );
  }
  return (
    <PageShell badge={badge} title={title} subtitle={subtitle} back={back}>
      {children}
    </PageShell>
  );
}
