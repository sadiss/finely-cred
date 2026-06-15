import React from 'react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from './finelyOsLightUi';

type Props = {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
};

export function FinelyOsEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}: Props) {
  return (
    <div className={`fc-soft-surface-lg p-8 text-center space-y-4 ${className}`}>
      {Icon ? (
        <div className="inline-flex items-center justify-center w-12 h-12 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-violet-300 mx-auto">
          <Icon size={22} />
        </div>
      ) : null}
      <div>
        <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{title}</div>
        <p className={`mt-2 text-sm max-w-md mx-auto ${FINELY_OS_ENTITY_BODY}`}>{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {primaryAction ? (
            <button type="button" onClick={primaryAction.onClick} className={FINELY_OS_PRIMARY_BTN}>
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button type="button" onClick={secondaryAction.onClick} className={FINELY_OS_SECONDARY_BTN}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
