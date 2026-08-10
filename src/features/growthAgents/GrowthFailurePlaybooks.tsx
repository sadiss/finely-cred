import React from 'react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsCatalogCardCompact } from '../os/finelyOsLightUi';

type CardDef = { id: string; title: string; body: string };

function buildCards(replies7d: number): CardDef[] {
  return [
    {
      id: 'zero_search',
      title: '0 from search',
      body: 'Run Test search on Caleb. If it fails, add SERPER_API_KEY on lead-intel. If it works but Find saves 0, open Review people — filters may have skipped rows.',
    },
    {
      id: 'zero_replies',
      title: replies7d === 0 ? 'Replies (7d): 0' : `Replies (7d): ${replies7d}`,
      body:
        replies7d === 0
          ? 'The Replies (7d) tile is at zero — change the opening line using the draft’s “why this company” note. Try Hannah’s guide link instead of only “book a call.” Esther can switch city or lane next week.'
          : 'If Replies (7d) stalls, change the opening line using the draft’s “why this company” note. Try Hannah’s guide link instead of only “book a call.” Esther can switch city or lane next week.',
    },
    {
      id: 'signups_no_book',
      title: 'Signups but no booked calls',
      body: 'Open Board and move people to Talking. Use mail sequences and a clear book-session link in follow-up.',
    },
  ];
}

export function GrowthFailurePlaybooks({ replies7d }: { replies7d: number }) {
  const cards = buildCards(replies7d);
  return (
    <div className="space-y-2">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>If results are stuck</div>
      <div className="grid md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.id} className={finelyOsCatalogCardCompact('rose')}>
            <div className="text-sm font-bold text-white">{c.title}</div>
            <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
