/** Renders one `DebtLitigationPlaybook` entry as an accordion card — shared across every C1 debt-defense article. */
import React from 'react';
import type { DebtLitigationPlaybook } from '../../data/debtLitigationDoctrineRepo';
import { DEBT_TYPE_LABELS, ACTION_TYPE_LABELS } from '../../lib/debtLitigationLabels';
import { DoctrineAccordionCard, DoctrineFieldList, DoctrineProseBlock } from './DoctrineArticleParts';
import type { FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

export function DebtLitigationPlaybookCard({
  playbook,
  accent = 'rose',
  defaultOpen = false,
}: {
  playbook: DebtLitigationPlaybook;
  accent?: FinelyOsPublicAccent;
  defaultOpen?: boolean;
}) {
  const { remedyAction } = playbook;
  return (
    <DoctrineAccordionCard
      accent={accent}
      eyebrow={DEBT_TYPE_LABELS[playbook.debtType]}
      title={playbook.title}
      chips={[ACTION_TYPE_LABELS[remedyAction.actionType]]}
      defaultOpen={defaultOpen}
    >
      <DoctrineProseBlock text={playbook.overview} />
      <DoctrineFieldList label="Statutory basis" items={playbook.statutoryBasis} tone="cite" />
      {playbook.caseLawPrecedents.length ? (
        <DoctrineFieldList label="Case-law precedent" items={playbook.caseLawPrecedents} tone="cite" />
      ) : null}
      <DoctrineFieldList label="Legal requirements" items={remedyAction.legalRequirements} />
      {remedyAction.exemptFundTypes?.length ? (
        <DoctrineFieldList label="Commonly exempt income/funds" items={remedyAction.exemptFundTypes} tone="ok" />
      ) : null}
      <DoctrineFieldList label="Step-by-step (general education, not legal advice)" items={remedyAction.executionSteps} />
      <DoctrineFieldList label="Practical warnings" items={playbook.practicalWarnings} tone="warn" />
      <p className="text-[10px] leading-relaxed text-white/40">{playbook.disclaimer}</p>
    </DoctrineAccordionCard>
  );
}
