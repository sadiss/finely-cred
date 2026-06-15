import React from 'react';
import { Palette, Sun, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinelyThemeToggle } from './FinelyThemeToggle';
import { useFinelySiteTheme } from './FinelySiteThemeProvider';
import { isLightThemePublicEnabled } from '../../lib/finelyThemeAccess';
import { LightThemeGoLivePanel } from './LightThemeGoLivePanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from './finelyOsLightUi';

/** Admin-only light theme preview + go-live control link. */
export function FinelyAdminAppearancePanel({
  onTogglePublicLight,
  lightThemePublic,
}: {
  lightThemePublic: boolean;
  onTogglePublicLight?: (next: boolean) => void;
}) {
  const navigate = useNavigate();
  const { effective, preference } = useFinelySiteTheme();
  const publicOn = isLightThemePublicEnabled();

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-5`} data-fc-accent="violet">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <Palette size={16} /> Appearance · Light theme (admin preview)
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
            Light theme is hidden from partners and public visitors until you enable it platform-wide. As an admin you can
            preview Light here while polishing frosted-glass surfaces.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={finelyOsStatusChip(publicOn ? 'ok' : 'warn')}>
            Public light: {publicOn ? 'ON' : 'OFF (admin only)'}
          </span>
          <span className={finelyOsStatusChip('ok')}>Preview: {effective}</span>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Admin theme preview</div>
        <FinelyThemeToggle adminPreview />
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Current preference: <strong>{preference}</strong> · effective: <strong>{effective}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {onTogglePublicLight ? (
          <button
            type="button"
            className={lightThemePublic ? FINELY_OS_SECONDARY_BTN : FINELY_OS_PRIMARY_BTN}
            onClick={() => onTogglePublicLight(!lightThemePublic)}
          >
            <Sun size={14} /> {lightThemePublic ? 'Hide light theme from public' : 'Enable light theme for everyone'}
          </button>
        ) : null}
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings?tab=features')}>
          Feature flags <ExternalLink size={12} />
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/portal/dashboard')}>
          Preview portal (dark default)
        </button>
      </div>

      <LightThemeGoLivePanel lightThemePublic={lightThemePublic} onTogglePublicLight={onTogglePublicLight} />
    </div>
  );
}
