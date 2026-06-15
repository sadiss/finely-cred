import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FINELY_OS_BACK_LINK, FINELY_OS_PAGE } from './finelyOsLightUi';
import { FinelyOsPageFooter } from './FinelyOsPageFooter';
import type { FinelyOsPageFooterVariant } from './finelyOsPageFooterConfig';

type Props = {
  children: ReactNode;
  footerVariant?: FinelyOsPageFooterVariant;
  backLabel?: string;
  onBack?: () => void;
  showBack?: boolean;
  actions?: ReactNode;
};

export function FinelyOsWorkspaceShell({
  children,
  footerVariant,
  backLabel = 'Admin Dashboard',
  onBack,
  showBack = false,
  actions,
}: Props) {
  return (
    <div className={FINELY_OS_PAGE}>
      {showBack || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showBack && onBack ? (
            <button type="button" onClick={onBack} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> {backLabel}
            </button>
          ) : (
            <span />
          )}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
      <FinelyOsPageFooter variant={footerVariant} />
    </div>
  );
}
