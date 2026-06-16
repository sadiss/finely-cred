import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, FileText, Link as LinkIcon, Lock, Plus, Search, Shield, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getTenant, getMembershipByUserAndTenant, listMemberships, updateMembership, canAccessVault, isPlatformAdmin } from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { downloadBlob, openUrlInNewTab } from '../../utils/download';
import { createSecretVaultFileItem,
  createSecretVaultUrlItem,
  deleteSecretVaultItem,
  listSecretVaultItemsByTenant,
} from '../../data/secretVaultRepo';
import type { SecretVaultItem } from '../../domain/secretVault';
import { SECRET_VAULT_MEDIA_LABELS } from '../../domain/secretVault';
import { SecretVaultOpsHub } from '../../components/vault/SecretVaultOpsHub';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsInlineListItem,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function fmtBytes(n?: number) {
  const v = Math.max(0, Math.round(n ?? 0));
  if (!v) return '—';
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (v >= gb) return `${(v / gb).toFixed(2)} GB`;
  if (v >= mb) return `${(v / mb).toFixed(2)} MB`;
  if (v >= kb) return `${(v / kb).toFixed(1)} KB`;
  return `${v} B`;
}

export default function AdminSecretVaultPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = useMemo(() => getActiveTenantId(), [version]);
  const tenant = useMemo(() => getTenant(tenantId), [tenantId, version]);

  const membership = useMemo(() => {
    const u = auth.user;
    if (!u) return null;
    return getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
  }, [auth.user, tenantId, version]);

  const allowed = useMemo(() => isAdminEmail(auth.user?.email) || canAccessVault(membership), [auth.user?.email, membership]);
  const canManageAccess = useMemo(() => {
    if (isAdminEmail(auth.user?.email)) return true;
    if (!membership || membership.status !== 'active') return false;
    return isPlatformAdmin(membership) || membership.role === 'tenant_owner' || Boolean(membership.permissions?.canManageTeam);
  }, [auth.user?.email, membership]);

  const items = useMemo(() => {
    const all = listSecretVaultItemsByTenant(tenantId);
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((i) => `${i.title} ${i.type} ${i.filename ?? ''} ${i.sourceUrl ?? ''} ${(i.tags ?? []).join(' ')}`.toLowerCase().includes(query));
  }, [q, tenantId, version]);

  const selected: SecretVaultItem | null = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : items[0] ?? null),
    [items, selectedId],
  );

  const accessMembers = useMemo(() => {
    const all = listMemberships(tenantId)
      .slice()
      .sort((a, b) => a.email.localeCompare(b.email));
    return all;
  }, [tenantId, version]);

  const toggleVaultAccess = (memberId: string) => {
    const cur = accessMembers.find((m) => m.id === memberId);
    if (!cur) return;
    const perms: any = { ...(cur.permissions ?? {}) };
    perms.canAccessVault = !Boolean(perms.canAccessVault);
    updateMembership(memberId, { permissions: perms });
    window.dispatchEvent(new Event('finely:store'));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const store = getBlobStore();
      for (const f of Array.from(files).slice(0, 25)) {
        const blob = f as unknown as Blob;
        const put = await store.put(blob, { partnerId: `vault_${tenantId}`, kind: 'secret_vault', filename: f.name, mimeType: f.type });
        createSecretVaultFileItem({
          tenantId,
          title: f.name,
          notes: undefined,
          tags: [],
          blobRef: put.ref,
          filename: f.name,
          mimeType: f.type || 'application/octet-stream',
          sizeBytes: f.size,
          sha256: put.sha256,
          createdByUserId: auth.user?.id ?? undefined,
        });
      }
      setNotice('Uploaded.');
      window.dispatchEvent(new Event('finely:store'));
      window.setTimeout(() => setNotice(null), 2000);
    } catch (e: any) {
      setErr(e?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const addUrl = () => {
    setErr(null);
    const u = urlValue.trim();
    if (!u) return;
    try {
      // basic validation
      // eslint-disable-next-line no-new
      new URL(u);
    } catch {
      setErr('Invalid URL.');
      return;
    }
    createSecretVaultUrlItem({
      tenantId,
      title: (urlTitle.trim() || u).slice(0, 140),
      sourceUrl: u,
      notes: 'URL saved. (Optional) Add a server-side URL scraper later to capture snapshots.',
      tags: ['url'],
      createdByUserId: auth.user?.id ?? undefined,
    });
    setUrlTitle('');
    setUrlValue('');
    window.dispatchEvent(new Event('finely:store'));
  };

  const openItem = async (item: SecretVaultItem) => {
    if (item.type === 'url' && item.sourceUrl) {
      window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.type === 'file' && item.blobRef) {
      const res = await getBlobUrl(item.blobRef, {});
      if (!res?.url) return;
      openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
    }
  };

  const downloadItem = async (item: SecretVaultItem) => {
    if (item.type !== 'file' || !item.blobRef) return;
    const blob = await getBlobStore().get(item.blobRef);
    if (!blob) return;
    downloadBlob({ blob, filename: item.filename ?? item.title ?? 'vault_file' });
  };

  const removeItem = async (item: SecretVaultItem) => {
    setBusy(true);
    try {
      if (item.type === 'file' && item.blobRef) {
        await getBlobStore().delete(item.blobRef);
      }
    } catch {
      // ignore blob delete failures in demo mode
    } finally {
      deleteSecretVaultItem(item.id);
      window.dispatchEvent(new Event('finely:store'));
      setSelectedId(null);
      setBusy(false);
    }
  };

  if (!auth.user) {
    return (
      <PageShell badge="Admin" title="Secret Vault" subtitle="Sign in to continue.">
        <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>Not signed in.</div>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell badge="Admin" title="Secret Vault" subtitle="Restricted.">
        <div className="space-y-4">
          <div className={FINELY_OS_NOTICE_WARN}>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Lock size={18} />
              Access denied
            </div>
            <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              You don’t have Secret Vault access in this tenant. An owner/admin must grant it.
            </div>
          </div>
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={16} /> Back to Admin
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="Admin" title="Secret Vault" subtitle="Top‑secret operations archive. Access is monitored and easy to revoke.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
            tenant: {tenant?.name ?? tenantId}
          </div>
        </div>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}
        {err && <div className={FINELY_OS_NOTICE_ERROR}>{err}</div>}

        <div className={FINELY_OS_BANNER}>
          <Shield size={18} className="text-violet-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Owner vault · multi-media + ML intelligence</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} leading-relaxed max-w-3xl`}>
              Store e-books, docs, videos, YouTube, audio, and web research. ML generates secret intel bundles; Nora Capital pulls shared items via{' '}
              <span className="font-mono text-violet-200">vault.intel_feed</span>. Blobs sync to encrypted storage when Supabase is configured.
            </p>
          </div>
        </div>

        <SecretVaultOpsHub
          tenantId={tenantId}
          userId={auth.user?.id}
          userEmail={auth.user?.email}
          membershipRole={membership?.role ?? null}
          isAdmin={isAdminEmail(auth.user?.email)}
          items={items}
          selected={selected}
          onSelect={setSelectedId}
          onRefresh={() => setVersion((v) => v + 1)}
          onError={setErr}
          onNotice={setNotice}
          busy={busy}
          setBusy={setBusy}
        />

        <div className="grid lg:grid-cols-12 gap-6 mt-6">
          <div className={`lg:col-span-4 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Vault items</div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{items.length}</div>
            </div>

            <div className={`${FINELY_OS_TOOLBAR} py-2`}>
              <Search size={14} className="text-violet-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`bg-transparent outline-none text-sm w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                placeholder="Search vault…"
              />
            </div>

            <FinelyOsPaginatedStack
              items={items}
              pageSize={10}
              emptyMessage="No items yet."
              renderItem={(i) => {
                const active = i.id === selected?.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setSelectedId(i.id)}
                    className={finelyOsListItem(active, 'amber')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{i.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {SECRET_VAULT_MEDIA_LABELS[i.mediaKind] ?? i.type} • {fmtWhen(i.createdAt)}
                        </div>
                      </div>
                      <span className={`shrink-0 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        {i.type === 'file' ? <FileText size={14} /> : <LinkIcon size={14} />}
                      </span>
                    </div>
                  </button>
                );
              }}
            />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick URL (legacy panel)</div>
              <div className="grid md:grid-cols-3 gap-3">
                <input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} className={`md:col-span-1 ${FINELY_OS_ENTITY_INPUT}`} placeholder="Title (optional)" />
                <input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className={`md:col-span-2 ${FINELY_OS_ENTITY_INPUT}`} placeholder="https://…" />
              </div>
              <button type="button" onClick={addUrl} disabled={!urlValue.trim()} className={FINELY_OS_SUCCESS_BTN}>
                <LinkIcon size={14} /> Save URL
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className="flex items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_VALUE}>Selected</div>
                {selected ? <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{selected.id}</div> : null}
              </div>

              {!selected ? (
                <div className={FINELY_OS_ENTITY_BODY}>Select an item.</div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Type</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{selected.type}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>Created: {fmtWhen(selected.createdAt)}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Size</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{fmtBytes(selected.sizeBytes)}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs font-mono truncate`}>{selected.mimeType ?? '—'}</div>
                    </div>
                  </div>

                  {selected.notes ? <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{selected.notes}</div> : null}
                  {selected.type === 'url' && selected.sourceUrl ? (
                    <div className={`${FINELY_OS_ENTITY_BODY} font-mono break-all`}>{selected.sourceUrl}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void openItem(selected)} className={FINELY_OS_PRIMARY_BTN}>
                      <ExternalLink size={14} /> Open
                    </button>
                    {selected.type === 'file' ? (
                      <button type="button" onClick={() => void downloadItem(selected)} className={FINELY_OS_SECONDARY_BTN}>
                        <Download size={14} /> Download
                      </button>
                    ) : null}
                    <button type="button" disabled={busy} onClick={() => void removeItem(selected)} className={FINELY_OS_DANGER_BTN}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Lock size={18} />
                  Access control
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{accessMembers.length} members</div>
              </div>

              {!canManageAccess ? (
                <div className={FINELY_OS_ENTITY_BODY}>You don’t have permission to manage vault access.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={accessMembers}
                  pageSize={10}
                  emptyMessage="No team members."
                  renderItem={(m) => {
                    const isCore = m.role === 'platform_admin' || m.role === 'tenant_owner';
                    const has = canAccessVault(m);
                    return (
                      <div key={m.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex items-center justify-between gap-3`}>
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{m.email}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                            {m.role} • {m.status} • {m.id}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isCore}
                          onClick={() => toggleVaultAccess(m.id)}
                          className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            has
                              ? FINELY_OS_ACTIVE_CHIP
                              : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
                          } ${isCore ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isCore ? 'Owners always have access.' : 'Toggle vault access'}
                        >
                          {has ? 'Access: on' : 'Access: off'}
                        </button>
                      </div>
                    );
                  }}
                />
              )}
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                Removing vault access takes effect immediately. Owners always retain access.
              </div>
            </div>
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

