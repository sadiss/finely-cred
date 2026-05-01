import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { addAuditEvent } from '../../data/auditRepo';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { processUploadedDocument } from '../../docIntel/processUploadedDocument';
import { listProcessedDocumentsByPartner } from '../../data/documentsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { KpiCard } from '../../components/ui/KpiCards';

export default function PartnerDocumentsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const email = auth.user?.email || '';
  const [version, setVersion] = useState(0);
  const [docVersion, setDocVersion] = useState(0);
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'screenshot' | 'upload'>('all');

  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, version]);
  const processed = useMemo(() => (partner ? listProcessedDocumentsByPartner(partner.id) : []), [partner, docVersion]);

  const filteredEvidence = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence.filter((e) => {
      if (kind !== 'all' && e.type !== kind) return false;
      if (!q) return true;
      const hay = `${e.filename || ''} ${e.caption || ''} ${e.creditorName || ''} ${e.sectionKey || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [evidence, kind, query]);

  const evidenceCounts = useMemo(() => {
    const screenshots = evidence.filter((e) => e.type === 'screenshot').length;
    const uploads = evidence.filter((e) => e.type === 'upload').length;
    return { total: evidence.length, screenshots, uploads };
  }, [evidence]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Documents Vault"
      subtitle="Upload bureau mail responses, IDs, proof of address, creditor letters, and supporting evidence. Everything here can be used for disputes."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="fc-panel p-6 text-white/60">
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="fc-button-brand"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.documents]}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                title="Back to Partner Dashboard"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                title="Back to Finely Cred Dashboard"
              >
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Files" value={evidenceCounts.total} hint="Total in vault" tone="amber" />
              <KpiCard label="Screenshots" value={evidenceCounts.screenshots} hint="Captured from reports" tone="violet" />
              <KpiCard label="Uploads" value={evidenceCounts.uploads} hint="PDFs, images, docs" tone="sky" />
              <KpiCard label="Processed" value={processed.length} hint="Doc Intel results" tone="emerald" />
            </div>
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <EvidenceUploader
                  partnerId={partner.id}
                  onCreated={async (item, file) => {
                    upsertEvidence(item);
                    addAuditEvent({
                      partnerId: partner.id,
                      actorType: 'partner',
                      actorEmail: email || undefined,
                      action: 'evidence.uploaded',
                      entityType: 'evidence',
                      entityId: item.id,
                      meta: { filename: item.filename, mimeType: item.mimeType, sizeBytes: item.sizeBytes, source: item.source },
                    });
                    setVersion((v) => v + 1);

                    // Document Intelligence: classify + extract entities, then auto-fill where appropriate.
                    if (file && isFeatureEnabled('docIntel')) {
                      try {
                        setDocNotice('Analyzing document…');
                        const res = await processUploadedDocument({
                          partnerId: partner.id,
                          evidenceId: item.id,
                          blobRef: item.blobRef,
                          file,
                          caption: item.caption,
                        });
                        setDocNotice(
                          `Document analyzed: ${res.docType}${Object.keys(res.entities || {}).length ? ` • extracted ${Object.keys(res.entities).length} field(s)` : ''}`,
                        );
                        setDocVersion((v) => v + 1);
                      } catch (e: any) {
                        setDocNotice(`Document analysis failed: ${e?.message || 'unknown error'}`);
                      }
                    }
                  }}
                />
              </div>

            <div className="lg:col-span-6 fc-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">How to use this vault</p>
                  <p className="mt-2 text-white/60 text-sm">
                    Upload any document that supports your dispute items: screenshots, PDFs, letters, and responses. Your screenshots captured
                    from tradelines/sections are also stored here automatically.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <FolderOpen size={18} />
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
                Tip: When a bureau response arrives, upload it the same day and mark your follow-up task as “in progress.”
              </div>

              <button
                onClick={() => navigate('/portal/tasks')}
                className="fc-button-soft"
              >
                Go to Tasks <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="fc-card p-6">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Your files</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'screenshot', 'upload'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      kind === k
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {filteredEvidence.length} shown / {evidence.length} total
                </div>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files…"
                className="w-full sm:w-[320px] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>
            <div className="mt-4">
              <EvidenceList
                items={filteredEvidence}
                onDelete={(id) => {
                  deleteEvidence(id);
                  addAuditEvent({
                    partnerId: partner.id,
                    actorType: 'partner',
                    actorEmail: email || undefined,
                    action: 'evidence.deleted',
                    entityType: 'evidence',
                    entityId: id,
                  });
                  setVersion((v) => v + 1);
                }}
                onUpsert={(item) => {
                  upsertEvidence(item);
                  addAuditEvent({
                    partnerId: partner.id,
                    actorType: 'partner',
                    actorEmail: email || undefined,
                    action: 'evidence.categorized',
                    entityType: 'evidence',
                    entityId: item.id,
                    meta: { sectionKey: item.sectionKey ?? null },
                  });
                  setVersion((v) => v + 1);
                }}
              />
            </div>
          </div>

          {isFeatureEnabled('docIntel') ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Document Intelligence</p>
                  <p className="mt-2 text-white/60 text-sm">
                    Uploaded PDFs/images can be classified and key fields extracted (EIN, legal name, address). Extracted fields can auto-fill your profile.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/business/profile')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Open Business Profile <ArrowRight size={14} />
                </button>
              </div>

              {docNotice ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/70">{docNotice}</div>
              ) : null}

              {processed.length === 0 ? (
                <div className="text-white/50 text-sm">No processed documents yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {processed.slice(0, 6).map((d) => (
                    <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                      <div className="text-white font-semibold truncate">{d.filename}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {d.docType} • {new Date(d.createdAt).toLocaleString()}
                      </div>
                      {d.summary ? <div className="text-white/60 text-sm">{d.summary}</div> : null}
                      {Object.keys(d.entities || {}).length ? (
                        <div className="mt-2 space-y-1">
                          {Object.entries(d.entities).slice(0, 6).map(([k, v]) => (
                            <div key={k} className="text-[11px] text-white/60">
                              <span className="text-white/40 font-mono">{k}</span>: <span className="text-white/80 font-mono">{v}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-white/45">No entities extracted.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}

