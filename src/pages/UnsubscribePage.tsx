import React, { useMemo, useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { unsubscribeMarketingByEmail } from '../lib/marketingUnsubscribe';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
} from '../features/os/finelyOsLightUi';

export default function UnsubscribePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = (searchParams.get('email') || '').trim();
  const [email, setEmail] = useState(initialEmail);
  const [result, setResult] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  usePublicSeoMeta({
    title: 'Unsubscribe from marketing',
    description: 'Opt out of Finely Cred promotional email and SMS.',
    path: '/unsubscribe',
  });

  const canSubmit = useMemo(() => email.trim().includes('@'), [email]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = unsubscribeMarketingByEmail(email);
    setDone(res.ok);
    setResult(res.message);
  };

  return (
    <PageShell badge="Legal" title="Unsubscribe" subtitle="Opt out of promotional email and SMS. Service messages about your account may still be sent.">
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Home
        </button>

        <div className={`mt-6 max-w-lg ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          {done && result ? (
            <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Preferences updated</div>
                <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{result}</div>
              </div>
            </div>
          ) : (
            <>
              <p className={FINELY_OS_ENTITY_BODY}>
                Enter the email you used on a lead magnet or consultation form. This updates marketing preferences stored on this platform instance.
              </p>
              <form onSubmit={onSubmit} className="space-y-3">
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Email</span>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${FINELY_OS_ENTITY_INPUT} pl-10`}
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                </label>
                <button type="submit" disabled={!canSubmit} className={FINELY_OS_PRIMARY_BTN}>
                  Unsubscribe
                </button>
              </form>
            </>
          )}
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
