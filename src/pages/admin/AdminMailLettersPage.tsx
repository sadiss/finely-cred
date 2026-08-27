import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Search, Send } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { notifyLetterMailed } from '../../lib/letterMailedNotify';
import { backfillPartnerLettersMailTo } from '../../lib/letterMailToBackfill';
import { useAuth } from '../../auth/AuthProvider';
import { isLetterPhysicallyMailed } from '../../lib/letterMailState';

function AdminMailLettersFrame({
  embedded,
  children,
}: {
  embedded: boolean;
  children: React.ReactNode;
}) {
  if (embedded) return <>{children}</>;
  return (
    <PageShell
      badge="Admin"
      title="Mail letters for partners"
      subtitle={`${FINELY_MAIL_COPY.serviceName}: Pick → Confirm → Mail → Email notify.`}
    >
      {children}
    </PageShell>
  );
}

/**
 * Admin-as-mailer: Pick partner → Confirm letters → Mail → Email notify.
 * Owner path for mailing partner letters via LetterStream / Finely Mail today.
 */
export default function AdminMailLettersPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [params] = useSearchParams();
  const presetPartnerId = (params.get('partnerId') || '').trim();
  const mailingOn = isFeatureEnabled('letterMailing');
  const inWorkspacePreview = location.pathname.startsWith('/preview/workspace-light');
  const mailPath = inWorkspacePreview ? '/preview/workspace-light/admin/mail' : '/admin/mail';
  const partnersPath = inWorkspacePreview ? '/preview/workspace-light/admin/partners' : '/admin/partners';

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [partnerId, setPartnerId] = useState(presetPartnerId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mailedDone, setMailedDone] = useState(false);

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
  const pdfReady = useMemo(
    () => letters.filter((l) => Boolean(l.pdfBlobRef) && !isLetterPhysicallyMailed(l)),
    [letters],
  );

  useEffect(() => {
    if (!partner) {
      setSelectedIds(new Set());
      setMailedDone(false);
      return;
    }
    backfillPartnerLettersMailTo(partner.id);
    setSelectedIds(new Set(pdfReady.map((l) => l.id)));
    setMailedDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id]);

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

  const selectedReady = pdfReady.filter((l) => selectedIds.has(l.id));

  const pathStep = !partner ? 0 : mailedDone ? 3 : wizardOpen ? 2 : 1;

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
      if (r.ok && r.providerId) {
        okN += 1;
        upsertLetter({
          ...letter,
          status: 'mailed',
          mailing: {
            provider: 'finely',
            providerId: r.providerId,
            createdAt: new Date().toISOString(),
            status: 'mailed',
            ...addr,
          },
        });
      } else if (r.ok) {
        failN += 1;
        upsertLetter({
          ...letter,
          status: 'mail_failed',
          mailing: {
            provider: 'finely',
            providerId: letter.mailing?.providerId,
            createdAt: letter.mailing?.createdAt ?? new Date().toISOString(),
            status: 'failed',
            lastError: 'Mail provider did not return a job reference — do not resend until status is confirmed.',
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
    const ok = results.filter((r) => r.ok);
    if (ok.length && partner) {
      void notifyLetterMailed({
        partnerId: partner.id,
        partner,
        letterIds: ok.map((r) => r.letterId),
        letterTitles: ok.map((r) => letters.find((l) => l.id === r.letterId)?.title || r.letterId),
        providerIds: ok.map((r) => r.providerId || ''),
        to: ok[0]?.to,
        from: ok[0]?.from,
        actorEmail: auth.user?.email || undefined,
        actorRole: 'admin',
      });
    }
    setMailedDone(true);
    setNotice(
      `Mailed ${okN} · failed ${failN}. Partner email notification ${
        okN > 0 ? 'queued when commsDelivery is on' : 'skipped'
      }. Admin copy sent when you mail on their behalf. Track in partner Letters tab.`,
    );
  };

  const toggleLetter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminMailLettersFrame embedded={embedded}>
      <div className={`${FINELY_OS_COMPACT_PAGE} ${embedded ? 'w-full max-w-none' : 'max-w-5xl'} space-y-3`}>
        {!embedded ? (
          <button type="button" className={FINELY_OS_BACK_LINK} onClick={() => navigate(partnersPath)}>
            <ArrowLeft size={14} /> Partner directory
          </button>
        ) : (
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Live mailing workspace</div>
            <p className={`${FINELY_OS_ENTITY_BODY} mt-1 text-sm`}>
              Pick a partner, confirm PDF-ready letters and addresses, then dispatch through {FINELY_MAIL_COPY.serviceName}.
            </p>
          </div>
        )}

        <FinelyNowDoThisStrip
          title="Admin mail easy path"
          currentIndex={pathStep}
          items={[
            { label: 'Pick partner', detail: 'Search directory and select who you are mailing for', to: mailPath },
            { label: 'Confirm letters', detail: 'Check PDF-ready letters, then open Confirm address', to: mailPath },
            { label: 'Mail', detail: 'Confirm To/From → one tap Mail via Finely Mail', to: mailPath },
            { label: 'Email notify', detail: 'Partner gets Finely Mail confirmation (commsDelivery on)', to: mailPath },
          ]}
        />

        <div className="grid grid-cols-4 gap-1.5">
          {[
            ['1', 'Pick partner'],
            ['2', 'Confirm letters'],
            ['3', 'Mail'],
            ['4', 'Email notify'],
          ].map(([n, label], idx) => {
            const on = pathStep === idx;
            const done = pathStep > idx || (idx === 3 && mailedDone);
            return (
              <div
                key={n}
                className={`rounded-xl border px-2 py-2 text-center ${
                  on
                    ? 'border-violet-400/50 bg-violet-500/15'
                    : done
                      ? 'border-emerald-400/35 bg-emerald-500/10'
                      : 'border-white/10 bg-black/25'
                }`}
              >
                <div className="text-[10px] font-black text-violet-200/90">{n}</div>
                <div className="text-[10px] font-semibold text-white/85 leading-tight">{label}</div>
              </div>
            );
          })}
        </div>

        {!mailingOn ? (
          <FinelyOsAlertBanner
            tone="warning"
            message="letterMailing feature flag is off. Enable it in Admin Settings before live sends."
          />
        ) : null}

        <MailProviderStatusBanner letterCount={selectedReady.length || pdfReady.length || 1} />
        <LetterStreamStatusCard compact />

        {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

        <div className={`${finelyOsCatalogCard('emerald')} space-y-4`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 1 · Pick partner</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Search the directory — same list as Admin Partners.</p>
            </div>
            <Mail size={16} className="text-sky-300" />
          </div>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-white/40" />
            <input
              aria-label="Search partners"
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
                    setMailedDone(false);
                  }}
                  className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                    partnerId === p.id
                      ? 'border-sky-400/50 bg-sky-500/15'
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
          <div className={`${finelyOsCatalogCard('violet')} space-y-4`} data-fc-accent="violet">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Step 2 · Confirm letters for {partner.profile.fullName}</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                  {selectedReady.length} selected · {pdfReady.length} PDF-ready · {letters.length} total in vault.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => navigate(`${partnersPath}/${partner.id}?tab=letters`)}
                >
                  Open partner letters
                </button>
                <button
                  type="button"
                  className={`${embedded ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN} disabled:opacity-60 !min-h-[3rem] !text-sm !font-extrabold !px-5`}
                  disabled={!mailingOn || selectedReady.length === 0}
                  onClick={() => setWizardOpen(true)}
                >
                  <Send size={16} /> Confirm address &amp; Mail ({selectedReady.length})
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
                  <li key={l.id}>
                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/85 cursor-pointer hover:border-white/25">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleLetter(l.id)}
                      />
                      <span className="min-w-0">
                        <span className="font-semibold text-white/90">{l.title}</span>
                        {' · '}
                        <span className="text-white/45">{l.status || 'generated'}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
              Steps 3–4 in the wizard: Confirm To/From → Mail → partner gets Finely Mail email notify (admin copy when you mail on their behalf).
            </p>
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
            defaultSelectedIds={[...selectedIds]}
            onClose={() => setWizardOpen(false)}
            onComplete={onBatchComplete}
          />
        ) : null}
      </div>
    </AdminMailLettersFrame>
  );
}
