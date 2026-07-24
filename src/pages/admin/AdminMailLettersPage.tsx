import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Search, Send } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import { listLettersByPartner, upsertLetter } from '../../data/lettersRepo';
import type { Partner } from '../../domain/partners';
import type { LetterRecord } from '../../domain/letters';
import { BatchMailWizard, type BatchMailItemResult } from '../../components/letters/BatchMailWizard';
import { MailProviderStatusBanner } from '../../components/mailing/MailProviderStatusBanner';
import { LetterStreamStatusCard } from '../../components/letters/LetterStreamStatusCard';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';

/**
 * Admin-as-mailer: pick partner → pick letters → Confirm address → Mail → Track.
 * Owner path for mailing partner letters via LetterStream / Finely Mail today.
 */
export default function AdminMailLettersPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetPartnerId = (params.get('partnerId') || '').trim();
  const mailingOn = isFeatureEnabled('letterMailing');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [partnerId, setPartnerId] = useState(presetPartnerId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAllPartnersAsAdmin()
      .then((list) => {
        setPartners(list);
        if (presetPartnerId && list.some((p) => p.id === presetPartnerId)) {
          setPartnerId(presetPartnerId);
        }
      })
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, [presetPartnerId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) => {
      const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.id}`.toLowerCase();
      return hay.includes(query);
    });
  }, [partners, q]);

  const partner = partners.find((p) => p.id === partnerId) || null;
  const letters: LetterRecord[] = useMemo(
    () => (partner ? listLettersByPartner(partner.id).filter((l) => !l.archivedAt) : []),
    [partner],
  );
  const pdfReady = letters.filter((l) => Boolean(l.pdfBlobRef));

  const fromDefaults = useMemo(() => {
    if (!partner) return undefined;
    const route: any = partner.primaryRoute ? (partner.routes as any)?.[partner.primaryRoute] : null;
    const p = route?.personal ?? null;
    if (!p) return undefined;
    return {
      addressLine1: p.address1 ?? '',
      addressLine2: p.address2 ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      zip: p.postalCode ?? '',
    };
  }, [partner]);

  const onBatchComplete = (results: BatchMailItemResult[]) => {
    if (!partner) return;
    let okN = 0;
    let failN = 0;
    for (const r of results) {
      const letter = letters.find((l) => l.id === r.letterId);
      if (!letter) continue;
      const addr = {
        to: r.to || letter.mailing?.to || { name: '', addressLine1: '', city: '', state: '', zip: '' },
        from: r.from || letter.mailing?.from || { name: '', addressLine1: '', city: '', state: '', zip: '' },
      };
      if (r.ok) {
        okN += 1;
        upsertLetter({
          ...letter,
          status: 'mailed',
          mailing: {
            provider: 'finely',
            providerId: r.providerId || letter.mailing?.providerId || 'batch',
            createdAt: new Date().toISOString(),
            status: 'mailed',
            ...addr,
          },
        });
      } else {
        failN += 1;
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: r.error || 'Mailing failed',
            ...addr,
          },
        });
      }
    }
    setNotice(`Mailed ${okN} · failed ${failN}. Open partner Letters tab or vault to track.`);
  };

  return (
    <PageShell
      badge="Admin"
      title="Mail letters for partners"
      subtitle={`${FINELY_MAIL_COPY.serviceName}: pick a partner, select PDF-ready letters, confirm address, mail, track.`}
    >
      <div className={`${FINELY_OS_COMPACT_PAGE} max-w-5xl space-y-3`}>
        <button type="button" className={FINELY_OS_BACK_LINK} onClick={() => navigate('/admin/partners')}>
          <ArrowLeft size={14} /> Partner directory
        </button>

        <FinelyNowDoThisStrip currentIndex={0} />

        {!mailingOn ? (
          <FinelyOsAlertBanner
            tone="warning"
            message="letterMailing feature flag is off. Enable it in Admin Settings before live sends."
          />
        ) : null}

        <MailProviderStatusBanner letterCount={pdfReady.length || 1} />
        <LetterStreamStatusCard compact />

        {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

        <div className={`${finelyOsCatalogCardCompact('amber')} !p-4 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 1 · Pick partner</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Search the directory — same list as Admin Partners.</p>
            </div>
            <Mail size={16} className="text-amber-300" />
          </div>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search partners…"
              className={`${FINELY_OS_ENTITY_INPUT} !mt-0 flex-1`}
            />
          </div>
          {loading ? (
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Loading partners…</p>
          ) : (
            <FinelyOsPaginatedStack
              items={filtered}
              pageSize={8}
              itemSpacingClassName="grid sm:grid-cols-2 gap-2"
              emptyMessage="No partners match."
              renderItem={(p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPartnerId(p.id);
                    setNotice(null);
                  }}
                  className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                    partnerId === p.id
                      ? 'border-amber-400/50 bg-amber-500/15'
                      : 'border-white/10 bg-black/30 hover:border-white/25'
                  }`}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{p.profile.fullName || 'Partner'}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{p.profile.email || p.id}</div>
                </button>
              )}
            />
          )}
        </div>

        {partner ? (
          <div className={`${finelyOsCatalogCardCompact('violet')} !p-4 space-y-3`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 2 · Letters for {partner.profile.fullName}</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                  {pdfReady.length} PDF-ready · {letters.length} total in vault (this browser / synced store).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => navigate(`/admin/partners/${partner.id}?tab=letters`)}
                >
                  Open partner letters
                </button>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  disabled={!mailingOn || pdfReady.length === 0}
                  onClick={() => setWizardOpen(true)}
                >
                  <Send size={14} /> Mail selected letters
                </button>
              </div>
            </div>
            {pdfReady.length === 0 ? (
              <FinelyOsAlertBanner
                tone="warning"
                message="No PDF-ready letters on this device store. Open the partner profile → Letters / Letter Studio, generate PDFs, then return here."
              />
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                {pdfReady.slice(0, 40).map((l) => (
                  <li key={l.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/85">
                    {l.title} · <span className="text-white/45">{l.status || 'generated'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <FinelyOsAlertBanner tone="info" message="Select a partner above to load their vault letters and mail." />
        )}

        {partner && wizardOpen ? (
          <BatchMailWizard
            open={wizardOpen}
            partnerId={partner.id}
            letters={letters}
            defaultFromName={partner.profile.fullName || 'Partner'}
            defaultFromAddress={fromDefaults}
            onClose={() => setWizardOpen(false)}
            onComplete={onBatchComplete}
          />
        ) : null}
      </div>
    </PageShell>
  );
}
