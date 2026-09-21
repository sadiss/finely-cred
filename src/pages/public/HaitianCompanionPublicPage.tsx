import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { submitLeadCapture } from '../../data/leadsRepo';
import { HAITIAN_KIT_PATH } from '../../lib/haitianCompanionDesk';

/** Live `/haitian` and `/kreyol` — community desk + chat/lead capture. */
export default function HaitianCompanionPublicPage() {
  const [params] = useSearchParams();
  const ht = params.get('lang') === 'ht' || params.get('lang') === 'kreyol';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = ht ? 'Biwo Kreyòl — Finely Cred' : 'Haitian Desk — Finely Cred';
  }, [ht]);

  const capture = async () => {
    if (!email.includes('@') || fullName.trim().length < 2) return;
    await submitLeadCapture({
      source: 'chat',
      offer: 'free_1h_consult',
      interest: ht ? 'haitian_desk_kreyol_chat' : 'haitian_desk_en_chat',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      consentToContact: true,
    });
    setSent(true);
  };

  return (
    <PageShell
        badge={ht ? 'Kominote Ayisyen' : 'Haitian community'}
        title={ht ? 'Biwo Kreyòl Finely Cred' : 'Finely Cred Haitian Desk'}
        subtitle={
          ht
            ? 'Eksplikasyon kredi ak lèt an Kreyòl — lèt biwo yo an Angle lè sa nesesè.'
            : 'Kreyòl-first explanations — bureau letters stay in English when citing templates.'
        }
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-white/70 text-sm leading-relaxed">
            {ht
              ? 'Pale ak ekip nou — oswa itilize chat anba a pou pran randevou edikasyon. Pa gen pwomès nòt oswa apwobasyon prè.'
              : 'Talk with our team — or use the chat widget to request an educational session. No score or loan guarantees.'}
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
            <div className="text-white font-semibold flex items-center gap-2">
              <MessageCircle className="text-amber-400" size={18} />
              {ht ? 'Kaptire demann (chat / fòm)' : 'Capture inquiry (chat / form)'}
            </div>
            {sent ? (
              <p className="text-emerald-300 text-sm">{ht ? 'Mèsi — nou pral kontakte w.' : 'Thank you — we will follow up.'}</p>
            ) : (
              <>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
                  placeholder={ht ? 'Non' : 'Name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white text-sm"
                  placeholder={ht ? 'Telefòn' : 'Phone'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void capture()}
                  className="px-4 py-2 rounded-xl bg-[#fbbf24] text-[#060908] text-xs font-black uppercase tracking-widest"
                >
                  {ht ? 'Voye' : 'Submit'}
                </button>
              </>
            )}
          </div>

          <Link to={HAITIAN_KIT_PATH} className="text-amber-300 text-sm underline">
            {ht ? '← Kat kit Kreyòl gratis' : '← Free Kreyòl credit kits'}
          </Link>

          <p className="text-white/45 text-xs flex items-start gap-2">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" />
            Educational only. Not legal advice.
          </p>
        </div>
    </PageShell>
  );
}
