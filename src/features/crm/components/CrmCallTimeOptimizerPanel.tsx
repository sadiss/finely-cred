import React, { useMemo } from 'react';
import { Clock, Copy, Phone } from 'lucide-react';
import type { CrmRecord } from '../../../domain/crmRecords';
import { buildCallTimeOptimizer } from '../intelligence/buildCallTimeOptimizer';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_NOTICE_WARN,
  finelyOsKpiTile,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

export function CrmCallTimeOptimizerPanel({ record }: { record: CrmRecord }) {
  const result = useMemo(() => buildCallTimeOptimizer(record), [record]);

  if (!result.bestSlots.length) {
    return (
      <div className={FINELY_OS_NOTICE_WARN}>
        Contact consent is off — use email-only outreach until consent is updated.
      </div>
    );
  }

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
      <div className="flex items-center gap-2 text-sky-300">
        <Phone size={16} />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Call-time optimizer</span>
      </div>
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{result.timezoneHint}</p>
      <div className="grid sm:grid-cols-3 gap-2">
        {result.bestSlots.map((slot, i) => (
          <div key={slot.id} className={`p-3 ${finelyOsKpiTile(i)}`}>
            <div className="flex items-center justify-between gap-1">
              <span className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{slot.label}</span>
              <span className={`text-[10px] font-bold text-sky-300`}>{slot.score}% fit</span>
            </div>
            <div className="mt-1 text-[11px] text-sky-200/80 font-medium flex items-center gap-1">
              <Clock size={11} /> {slot.window}
            </div>
            <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{slot.reason}</p>
          </div>
        ))}
      </div>
      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>Avoid</div>
        <ul className={`text-xs space-y-0.5 ${FINELY_OS_ENTITY_BODY}`}>
          {result.avoidWindows.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      </div>
      <div className={`${finelyOsCatalogCard('violet')} !p-5 p-3`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Opener script</span>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(result.scriptOpener)}
            className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !p-1`}
            title="Copy"
          >
            <Copy size={14} />
          </button>
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{result.scriptOpener}</p>
      </div>
    </div>
  );
}
