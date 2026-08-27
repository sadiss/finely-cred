import React from 'react';

export function WlSectionHeader({
  eyebrow,
  title,
  hint,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        {eyebrow ? <div className="fc-wl-section-header-eyebrow">{eyebrow}</div> : null}
        <h2 className="fc-wl-section-header-title">{title}</h2>
      </div>
      {hint ? <span className="fc-wl-section-header-hint">{hint}</span> : null}
    </div>
  );
}
