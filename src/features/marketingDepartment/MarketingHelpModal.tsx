import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
} from '../os/finelyOsLightUi';
import { getMarketingMetricHelp } from './marketingMetricHelp';

export function MarketingHelpButton({
  helpId,
  className = '',
}: {
  helpId: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const help = getMarketingMetricHelp(helpId);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-full border border-white/25 bg-white/15 w-6 h-6 text-[11px] font-black text-white hover:bg-white/25 hover:scale-110 transition-transform ${className}`}
        aria-label={`Explain: ${help.title}`}
        title="What's this?"
      >
        <HelpCircle size={13} />
      </button>
      {open ? (
        <MarketingHelpModal helpId={helpId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

export function MarketingHelpModal({ helpId, onClose }: { helpId: string; onClose: () => void }) {
  const help = getMarketingMetricHelp(helpId);

  return (
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[80] flex items-center justify-center p-4`} role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={onClose} />
      <div className={`${FINELY_OS_MODAL_SHELL} relative z-10 w-full max-w-md !p-0`}>
        <div className={FINELY_OS_MODAL_HEADER}>
          <h3 className={FINELY_OS_ENTITY_TITLE}>{help.title}</h3>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{help.body}</p>
          {help.steps?.length ? (
            <ol className={`list-decimal list-inside text-sm space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
              {help.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          ) : null}
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
