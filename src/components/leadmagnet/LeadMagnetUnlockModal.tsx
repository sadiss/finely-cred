import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Download } from 'lucide-react';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';
import type { LeadMagnetUnlockIntent } from '../../lib/useLeadMagnetUnlockFlow';
import { PremiumLeadMagnetCaptureForm } from './PremiumLeadMagnetCaptureForm';
import './leadMagnetLuxuryStage.css';
import './leadMagnetUnlockModal.css';

const COMPLIANCE = 'Results vary · not legal advice · funding subject to underwriting';

export type LeadMagnetUnlockResult = {
  intent: LeadMagnetUnlockIntent;
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  funnelConfig: LeadMagnetFunnelConfig;
  intent?: LeadMagnetUnlockIntent;
  onUnlocked: (result: LeadMagnetUnlockResult) => void;
  readLabel?: string;
  downloadLabel?: string;
  showRead?: boolean;
  showDownload?: boolean;
};

export function LeadMagnetUnlockModal({
  open,
  onClose,
  funnelConfig,
  intent = 'continue',
  onUnlocked,
  readLabel = 'Read on page',
  downloadLabel = 'Download PDF',
  showRead = true,
  showDownload = true,
}: Props) {
  const [captured, setCaptured] = useState<{
    leadId: string;
    fullName: string;
    email: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setCaptured(null);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const headline =
    intent === 'download'
      ? 'Enter your details to download'
      : intent === 'read'
        ? 'Enter your details to keep reading'
        : 'Enter your details to open the rest';

  const finish = (nextIntent: LeadMagnetUnlockIntent) => {
    if (!captured) return;
    onUnlocked({ intent: nextIntent, ...captured });
    onClose();
  };

  return createPortal(
    <div className="lm-unlock-overlay" role="presentation" onClick={onClose}>
      <div
        className="lm-unlock-modal lm-convert-keep-dark"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lm-unlock-title"
        onClick={(event) => event.stopPropagation()}
      >
        <FinelyOsModalCloseButton onClick={onClose} className="absolute right-3 top-3 sm:right-4 sm:top-4" />
        <p className="lm-unlock-kicker">Free guide</p>
        <h2 id="lm-unlock-title" className="lm-unlock-title">
          {captured ? 'You are in' : headline}
        </h2>
        <p className="lm-unlock-lede">
          {captured
            ? 'Read the rest on this page, or download the playbook. Both are free after this step.'
            : 'First name, last name, email, and phone unlock the full guide. Page 1 stays a preview until then.'}
        </p>

        {captured ? (
          <div className="lm-unlock-actions">
            {showRead ? (
              <button
                type="button"
                className="lm-unlock-btn lm-unlock-btn--primary"
                onClick={() => finish(intent === 'download' ? 'read' : intent)}
              >
                <BookOpen size={16} /> {intent === 'continue' ? 'Continue reading' : readLabel}
              </button>
            ) : null}
            {showDownload ? (
              <button type="button" className="lm-unlock-btn lm-unlock-btn--secondary" onClick={() => finish('download')}>
                <Download size={16} /> {downloadLabel}
              </button>
            ) : null}
          </div>
        ) : (
          <PremiumLeadMagnetCaptureForm
            funnelConfig={funnelConfig}
            submitLabel="Unlock the guide"
            successMode="callback"
            onCaptured={(result) => setCaptured(result)}
            buttonClass="lm-unlock-submit relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl px-7 text-[12px] font-black uppercase tracking-[0.12em]"
          />
        )}

        <p className="lm-unlock-compliance">{COMPLIANCE}</p>
      </div>
    </div>,
    document.body,
  );
}
