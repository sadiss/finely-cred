import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Handshake, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';

/** Public `/partners` hub — agencies, affiliates, and client portal entry. */
export default function PublicPartnersHubPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <PageShell
      badge="Partners"
      title="Partner & client hub"
      subtitle="Agencies, referral partners, and existing clients — pick the right door."
    >
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Building2,
            title: 'Agency white-label',
            body: 'Scale restore and business credit with compliant workflows.',
            cta: 'Agency signup',
            path: '/services/agencies',
          },
          {
            icon: Handshake,
            title: 'Referral partners',
            body: 'Warm intros and affiliate links with Finely brand kits.',
            cta: 'Refer someone',
            path: '/refer',
          },
          {
            icon: ShieldCheck,
            title: 'Client portal',
            body: 'Disputes, documents, tasks, and billing for active partners.',
            cta: auth.user ? 'Open portal' : 'Login',
            path: auth.user ? '/portal/dashboard' : '/login?next=/portal/dashboard',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 flex flex-col">
              <Icon className="text-[#fbbf24]" size={24} />
              <div className="mt-3 font-semibold text-white">{card.title}</div>
              <p className="mt-2 text-white/65 text-sm flex-1">{card.body}</p>
              <button type="button" onClick={() => navigate(card.path)} className="mt-4 fc-button-brand text-xs w-full justify-center">
                {card.cta} <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/70">
        <p>
          Staff manage partner records in the admin workspace. Clients claim profiles via{' '}
          <Link to="/claim" className="text-[#fbbf24] underline">/claim</Link> when invited.
        </p>
      </div>
    </PageShell>
  );
}
