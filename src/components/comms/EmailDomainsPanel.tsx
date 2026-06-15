import React, { useMemo, useState } from 'react';
import { Globe, Mail, Plus, Save, Star, Trash2, UserCircle } from 'lucide-react';
import {
  createEmailDomainDraft,
  defaultSignatureHtml,
  deleteEmailDomain,
  deleteEmailSignature,
  ensureDefaultEmailDomainsOnce,
  listEmailDomains,
  listEmailSignatures,
  upsertEmailDomain,
  upsertEmailSignature,
} from '../../data/emailDomainsRepo';
import type { EmailDomain, EmailSignature } from '../../domain/emailDomains';
import { newId } from '../../utils/ids';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

function nowIso() {
  return new Date().toISOString();
}

export function EmailDomainsPanel(props: { version: number; onChanged: () => void }) {
  ensureDefaultEmailDomainsOnce();
  const domains = useMemo(() => listEmailDomains(), [props.version]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(() => domains[0]?.id ?? '');
  const selectedDomain = domains.find((d) => d.id === selectedDomainId) ?? domains[0] ?? null;
  const signatures = useMemo(
    () => (selectedDomain ? listEmailSignatures(selectedDomain.id) : []),
    [props.version, selectedDomain?.id],
  );
  const [selectedSigId, setSelectedSigId] = useState<string>(() => signatures[0]?.id ?? '');
  const selectedSig = signatures.find((s) => s.id === selectedSigId) ?? signatures[0] ?? null;
  const [notice, setNotice] = useState<string | null>(null);

  const [domainDraft, setDomainDraft] = useState<EmailDomain | null>(null);
  const [sigDraft, setSigDraft] = useState<EmailSignature | null>(null);

  const activeDomain = domainDraft ?? selectedDomain;
  const activeSig = sigDraft ?? selectedSig;

  function flash(msg: string) {
    setNotice(msg);
    props.onChanged();
  }

  function startNewDomain() {
    const d = createEmailDomainDraft();
    setDomainDraft(d);
    setSelectedDomainId(d.id);
  }

  function saveDomain() {
    if (!activeDomain) return;
    upsertEmailDomain(activeDomain);
    setDomainDraft(null);
    flash('Sending domain saved.');
  }

  function startNewSignature() {
    if (!selectedDomain) return;
    const ts = nowIso();
    const sig: EmailSignature = {
      id: newId('email_sig'),
      domainId: selectedDomain.id,
      label: 'New signature',
      personaName: 'Advisor Name',
      title: 'Credit Strategy Advisor',
      htmlBlock: defaultSignatureHtml('Advisor Name', 'Credit Strategy Advisor'),
      createdAt: ts,
      updatedAt: ts,
    };
    setSigDraft(sig);
    setSelectedSigId(sig.id);
  }

  function saveSignature() {
    if (!activeSig) return;
    upsertEmailSignature(activeSig);
    setSigDraft(null);
    flash('Email signature saved.');
  }

  return (
    <div className="space-y-6">
      {notice ? <div className={FINELY_OS_NOTICE}>{notice}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={finelyOsCatalogCard('emerald')}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <h3 className={FINELY_OS_ENTITY_TITLE}>Sending domains</h3>
            </div>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={startNewDomain}>
              <Plus className="h-4 w-4" /> Add domain
            </button>
          </div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-4`}>
            Configure multiple from-addresses (e.g. hello@, partners@). Authenticate each domain in SendGrid before live sends.
          </p>
          <div className="space-y-2 mb-4">
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                className={finelyOsInlineListItem(selectedDomainId === d.id && !domainDraft)}
                onClick={() => {
                  setDomainDraft(null);
                  setSelectedDomainId(d.id);
                  setSigDraft(null);
                }}
              >
                <div className="flex items-center gap-2">
                  {d.isDefault ? <Star className="h-4 w-4 text-amber-500" /> : <Mail className="h-4 w-4 text-slate-400" />}
                  <span className="font-medium">{d.label}</span>
                </div>
                <span className="text-xs text-slate-500">{d.fromEmail}</span>
              </button>
            ))}
          </div>

          {activeDomain ? (
            <div className={`${FINELY_OS_ENTITY_BODY} space-y-3`}>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Label</span>
                <input
                  className={FINELY_OS_ENTITY_INPUT}
                  value={activeDomain.label}
                  onChange={(e) =>
                    setDomainDraft({ ...activeDomain, label: e.target.value, updatedAt: nowIso() })
                  }
                />
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>DNS domain</span>
                <input
                  className={FINELY_OS_ENTITY_INPUT}
                  value={activeDomain.domain}
                  onChange={(e) =>
                    setDomainDraft({ ...activeDomain, domain: e.target.value, updatedAt: nowIso() })
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>From email</span>
                  <input
                    className={FINELY_OS_ENTITY_INPUT}
                    value={activeDomain.fromEmail}
                    onChange={(e) =>
                      setDomainDraft({ ...activeDomain, fromEmail: e.target.value, updatedAt: nowIso() })
                    }
                  />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>From name</span>
                  <input
                    className={FINELY_OS_ENTITY_INPUT}
                    value={activeDomain.fromName}
                    onChange={(e) =>
                      setDomainDraft({ ...activeDomain, fromName: e.target.value, updatedAt: nowIso() })
                      }
                  />
                </label>
              </div>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Reply-to email</span>
                <input
                  className={FINELY_OS_ENTITY_INPUT}
                  value={activeDomain.replyToEmail ?? ''}
                  onChange={(e) =>
                    setDomainDraft({ ...activeDomain, replyToEmail: e.target.value, updatedAt: nowIso() })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!activeDomain.isDefault}
                  onChange={(e) =>
                    setDomainDraft({ ...activeDomain, isDefault: e.target.checked, updatedAt: nowIso() })
                  }
                />
                Default sending domain
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={saveDomain}>
                  <Save className="h-4 w-4" /> Save domain
                </button>
                {!activeDomain.isDefault && domains.some((d) => d.id === activeDomain.id) ? (
                  <button
                    type="button"
                    className={FINELY_OS_DANGER_BTN}
                    onClick={() => {
                      deleteEmailDomain(activeDomain.id);
                      setDomainDraft(null);
                      flash('Domain removed.');
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className={finelyOsCatalogCard('violet')}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-violet-600" />
              <h3 className={FINELY_OS_ENTITY_TITLE}>Email signatures</h3>
            </div>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={startNewSignature} disabled={!selectedDomain}>
              <Plus className="h-4 w-4" /> Add signature
            </button>
          </div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-4`}>
            HTML signature blocks appended to outbound emails. Use inline styles for email client compatibility.
          </p>
          <div className="space-y-2 mb-4">
            {signatures.map((s) => (
              <button
                key={s.id}
                type="button"
                className={finelyOsInlineListItem(selectedSigId === s.id && !sigDraft)}
                onClick={() => {
                  setSigDraft(null);
                  setSelectedSigId(s.id);
                }}
              >
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-slate-500">{s.personaName}</span>
              </button>
            ))}
            {!signatures.length ? (
              <p className="text-sm text-slate-500">No signatures for this domain yet.</p>
            ) : null}
          </div>

          {activeSig ? (
            <div className={`${FINELY_OS_ENTITY_BODY} space-y-3`}>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Label</span>
                <input
                  className={FINELY_OS_ENTITY_INPUT}
                  value={activeSig.label}
                  onChange={(e) => setSigDraft({ ...activeSig, label: e.target.value, updatedAt: nowIso() })}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Persona name</span>
                  <input
                    className={FINELY_OS_ENTITY_INPUT}
                    value={activeSig.personaName}
                    onChange={(e) => {
                      const personaName = e.target.value;
                      setSigDraft({
                        ...activeSig,
                        personaName,
                        htmlBlock: defaultSignatureHtml(personaName, activeSig.title ?? '', activeSig.phone),
                        updatedAt: nowIso(),
                      });
                    }}
                  />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Title</span>
                  <input
                    className={FINELY_OS_ENTITY_INPUT}
                    value={activeSig.title ?? ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      setSigDraft({
                        ...activeSig,
                        title,
                        htmlBlock: defaultSignatureHtml(activeSig.personaName, title, activeSig.phone),
                        updatedAt: nowIso(),
                      });
                    }}
                  />
                </label>
              </div>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Phone</span>
                <input
                  className={FINELY_OS_ENTITY_INPUT}
                  value={activeSig.phone ?? ''}
                  onChange={(e) => {
                    const phone = e.target.value;
                    setSigDraft({
                      ...activeSig,
                      phone,
                      htmlBlock: defaultSignatureHtml(activeSig.personaName, activeSig.title ?? '', phone),
                      updatedAt: nowIso(),
                    });
                  }}
                />
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>HTML preview</span>
                <div
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: activeSig.htmlBlock }}
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={saveSignature}>
                  <Save className="h-4 w-4" /> Save signature
                </button>
                <button
                  type="button"
                  className={FINELY_OS_DANGER_BTN}
                  onClick={() => {
                    deleteEmailSignature(activeSig.id);
                    setSigDraft(null);
                    flash('Signature removed.');
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
