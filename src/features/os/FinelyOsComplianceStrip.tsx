import React from 'react';
import { FINELY_OS_COMPLIANCE_FOOTNOTE } from './finelyOsLightUi';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function FinelyOsComplianceStrip({ className = '', children }: Props) {
  return (
    <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} ${className}`}>
      {children ?? 'Results vary · not legal advice · illustrative examples may not reflect your outcome.'}
    </p>
  );
}
