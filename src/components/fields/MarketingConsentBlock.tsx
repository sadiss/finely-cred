import React from 'react';

export type MarketingConsentValue = {
  email: boolean;
  sms: boolean;
};

export function MarketingConsentBlock({
  value,
  onChange,
  phone,
  className = '',
}: {
  value: MarketingConsentValue;
  onChange: (next: MarketingConsentValue) => void;
  /** Used to enable/disable SMS consent. */
  phone?: string;
  className?: string;
}) {
  const hasPhone = (phone || '').trim().length > 0;

  return (
    <div className={`fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3 ${className}`}>
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Optional marketing opt-in</div>

      <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.checked })}
        />
        <span>
          Yes — you may email me updates, offers, and educational content.{' '}
          <a href="/unsubscribe" className="text-white/50 underline hover:text-white/70">
            Unsubscribe anytime.
          </a>
        </span>
      </label>

      <label className={`flex items-start gap-3 text-white/70 text-sm ${hasPhone ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
        <input
          type="checkbox"
          className="mt-1"
          checked={value.sms && hasPhone}
          disabled={!hasPhone}
          onChange={(e) => onChange({ ...value, sms: e.target.checked })}
        />
        <span>
          Yes — you may text me marketing messages. <span className="text-white/50">Msg/data rates may apply.</span>{' '}
          <span className="text-white/50">Reply STOP to opt out.</span>
          {!hasPhone && <span className="block text-white/45 text-xs mt-1">Add a phone number above to enable SMS opt-in.</span>}
        </span>
      </label>

      <div className="text-white/45 text-xs">
        Marketing opt-in is optional. We may still contact you about this request. See our{' '}
        <a href="/privacy" className="text-amber-200 hover:text-amber-100 underline underline-offset-4">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}

