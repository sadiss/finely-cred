import React, { useState } from 'react';
import { GrokAskHero } from './GrokAskHero';
import { DESK_HELPERS, detectVertical } from './marketingDeskModel';
import { FC_PAGE_SECTION, FC_SURFACE_CARD } from '../../styles/layoutSurfaces';

function draftFromAsk(ask: string): string {
  const v = detectVertical(ask).vertical;
  const opener =
    v === 'bhph'
      ? 'Thanks for the lot tour — Finely Cred partners with BHPH operators on file-accuracy education (no deletion hype).'
      : v === 'tax'
        ? 'Appreciate the consult lane — we keep tax prep and credit restore messaging separate so your clients get honest timelines.'
        : 'Appreciate the conversation — Finely Cred is a restore-wealth partner desk (educational, compliance-first).';

  return `${opener}

From your note: “${ask.trim()}”

Suggested next step: offer the Finely partner one-sheet + optional warm intro to our consultation flow (manual send — paste into Comms Studio).

— Finely partner desk`;
}

export function MarketingDeskDraftPanel() {
  const def = DESK_HELPERS.find((h) => h.id === 'draft')!;
  const [ask, setAsk] = useState('');
  const [out, setOut] = useState<string | null>(null);

  return (
    <div className={FC_PAGE_SECTION}>
      <GrokAskHero
        title={def.label}
        tagline={def.tagline}
        placeholder={def.placeholder}
        value={ask}
        onChange={setAsk}
        onSubmit={() => setOut(draftFromAsk(ask))}
        exampleChips={def.exampleChips}
      />
      {out ? (
        <details className={FC_SURFACE_CARD} open>
          <summary className="cursor-pointer select-none text-white font-semibold">Draft preview — expand to copy</summary>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-white/75 font-sans leading-relaxed">{out}</pre>
        </details>
      ) : null}
    </div>
  );
}
