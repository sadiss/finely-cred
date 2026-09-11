import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { openPublicChat, type PublicChatGoal } from '../../lib/publicChatEvents';
import './publicAuthorityPages.css';

const ROOMS: Array<{ id: string; title: string; body: string; goal: PublicChatGoal; accent: 'emerald' | 'violet' | 'sky' | 'rose' }> = [
  { id: 'restore', title: 'Restore', body: 'Disputes, evidence, and the next letter.', goal: 'personal', accent: 'emerald' },
  { id: 'debt', title: 'Debt', body: 'Validation, summons dates, collector paper.', goal: 'debt', accent: 'rose' },
  { id: 'business', title: 'Business', body: 'Entity, vendors, and fundability order.', goal: 'business', accent: 'violet' },
  { id: 'tradelines', title: 'Tradelines', body: 'Authorized-user education, no hype.', goal: 'tradelines', accent: 'sky' },
];

export default function CreditLabPage() {
  usePublicSeoMeta({
    title: 'Credit Lab',
    description: 'Ask Finely in the room that matches your file. The site chat captures the conversation — no second messenger.',
    path: '/credit-lab',
    faqs: [
      { q: 'Is this WhatsApp or Telegram?', a: 'No. Credit Lab opens Ask Finely on this site so the conversation is captured here.' },
      { q: 'Is this legal advice?', a: 'No. Education only. Results vary. Funding subject to underwriting.' },
    ],
  });

  return (
    <PageShell hideHero contentWidth="full" title="Credit Lab" subtitle="Pick a room. Ask Finely. No second app.">
      <article className="fc-viewport-floor pb-16">
        <div className="fc-lab-hearth">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Credit Lab</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white">Ask in the room that matches your file.</h1>
          <p className="mt-4 text-lg text-white/80">
            Guests stay in site chat until they become partners. We do not move this conversation to WhatsApp or Telegram.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openPublicChat({ goal: 'not_sure' })}>
              Ask Finely
            </button>
            <Link className={FINELY_OS_SECONDARY_BTN} to="/free-guide">Start free guide</Link>
          </div>
        </div>
        <div className="fc-lab-rooms mt-10">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`fc-lab-room ${finelyOsCatalogCard(room.accent)}`}
              onClick={() => openPublicChat({ goal: room.goal })}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Room</p>
              <h2 className="mt-2 text-2xl font-extrabold">{room.title}</h2>
              <p className="mt-2 text-base text-white/75">{room.body}</p>
              <p className="mt-4 text-sm font-extrabold">Open this room</p>
            </button>
          ))}
        </div>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
