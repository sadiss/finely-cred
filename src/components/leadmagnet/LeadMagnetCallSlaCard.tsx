import React from 'react';
import { Calendar, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { leadMagnetCallSlaLabel, leadMagnetCallSlaLabelHt } from '../../lib/leadMagnetCallSla';

type Props = {
  bookingUrl?: string;
  /** Use Haitian / Kreyòl SLA copy. */
  kreyol?: boolean;
  className?: string;
};

export function LeadMagnetCallSlaCard({ bookingUrl = '/enlightenment-session', kreyol = false, className }: Props) {
  const sla = kreyol ? leadMagnetCallSlaLabelHt() : leadMagnetCallSlaLabel();
  const body = kreyol
    ? 'Yon espesyalis pral rele nimewo ou te bay la. Ou ka rezève yon sesyon eklèresman kounye a si w pito chwazi yon lè.'
    : 'A specialist will call the number you provided. You can also book an enlightenment session now if you prefer a set time.';
  const cta = kreyol ? 'Rezève sesyon eklèresman' : 'Book an enlightenment session';

  return (
    <div
      id="lm-call-sla"
      className={
        className ??
        'rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-left text-sm text-white/85'
      }
    >
      <div className="flex items-start gap-3">
        <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div className="min-w-0">
          <p className="font-black text-amber-100">{sla}.</p>
          <p className="mt-1 leading-relaxed text-white/70">{body}</p>
          {bookingUrl ? (
            <Link
              to={bookingUrl}
              className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-100 hover:text-white"
            >
              <Calendar className="h-3.5 w-3.5" />
              {cta}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
