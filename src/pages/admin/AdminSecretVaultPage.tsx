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
import {
  createSecretVaultFileItem,
  createSecretVaultUrlItem,
  deleteSecretVaultItem,
  listSecretVaultItemsByTenant,
} from '../../data/secretVaultRepo';
import type { SecretVaultItem } from '../../domain/secretVault';

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
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">Not signed in.</div>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell badge="Admin" title="Secret Vault" subtitle="Restricted.">
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-7">
            <div className="flex items-center gap-2 text-amber-300">
              <Lock size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Access denied</span>
            </div>
            <div className="mt-2 text-white/70 text-sm">
              You don’t have Secret Vault access in this tenant. An owner/admin must grant it.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={16} /> Back to Admin
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="Admin" title="Secret Vault" subtitle="Top‑secret operations archive. Access is monitored and easy to revoke.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
            tenant: {tenant?.name ?? tenantId}
          </div>
        </div>

        {notice && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">{notice}</div>}
        {err && <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}

        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(255,215,0,0.18)_0%,rgba(0,0,0,0.65)_55%,rgba(0,0,0,0.85)_100%)] p-7 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Shield size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Vault protocol</span>
              </div>
              <div className="mt-2 text-white/70 text-sm max-w-3xl">
                This space is for internal-only documents, playbooks, and sensitive operational assets. Do not share externally.
              </div>
              <div className="mt-3 text-white/40 text-xs font-mono">
                Tip: revoke access instantly from this page (Access control panel) or from Team & Roles.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all cursor-pointer">
                <Upload size={14} /> Upload files
                <input
                  type="file"
                  multiple
                  onChange={(e) => void uploadFiles(e.target.files)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Vault items</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{items.length}</div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <Search size={14} className="text-white/30" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none text-white/80 placeholder:text-white/20 text-sm w-full"
                placeholder="Search vault…"
              />
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-white/60 text-sm">No items yet.</div>
              ) : (
                items.slice(0, 200).map((i) => {
                  const active = i.id === selected?.id;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setSelectedId(i.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        active ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{i.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                            {i.type} • {fmtWhen(i.createdAt)}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-white/40">
                          {i.type === 'file' ? <FileText size={14} /> : <LinkIcon size={14} />}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-amber-300">
                  <Plus size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Add URL</span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  className="md:col-span-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                  placeholder="Title (optional)"
                />
                <input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  className="md:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                  placeholder="https://…"
                />
              </div>
              <button
                type="button"
                onClick={addUrl}
                disabled={!urlValue.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
              >
                <LinkIcon size={14} /> Save URL
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-semibold">Selected</div>
                {selected ? (
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{selected.id}</div>
                ) : null}
              </div>

              {!selected ? (
                <div className="text-white/60 text-sm">Select an item.</div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Type</div>
                      <div className="mt-1 text-white font-semibold">{selected.type}</div>
                      <div className="mt-1 text-white/50 text-xs">Created: {fmtWhen(selected.createdAt)}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Size</div>
                      <div className="mt-1 text-white font-semibold">{fmtBytes(selected.sizeBytes)}</div>
                      <div className="mt-1 text-white/50 text-xs font-mono truncate">{selected.mimeType ?? '—'}</div>
                    </div>
                  </div>

                  {selected.notes ? <div className="text-white/70 text-sm whitespace-pre-wrap">{selected.notes}</div> : null}
                  {selected.type === 'url' && selected.sourceUrl ? (
                    <div className="text-white/60 text-sm font-mono break-all">{selected.sourceUrl}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openItem(selected)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      <ExternalLink size={14} /> Open
                    </button>
                    {selected.type === 'file' ? (
                      <button
                        type="button"
                        onClick={() => void downloadItem(selected)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        <Download size={14} /> Download
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeItem(selected)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all disabled:opacity-60"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-amber-300">
                  <Lock size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Access control</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{accessMembers.length} members</div>
              </div>

              {!canManageAccess ? (
                <div className="text-white/60 text-sm">You don’t have permission to manage vault access.</div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {accessMembers.map((m) => {
                    const isCore = m.role === 'platform_admin' || m.role === 'tenant_owner';
                    const has = canAccessVault(m);
                    return (
                      <div key={m.id} className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{m.email}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                            {m.role} • {m.status} • {m.id}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isCore}
                          onClick={() => toggleVaultAccess(m.id)}
                          className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            has
                              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                              : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                          } ${isCore ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isCore ? 'Owners always have access.' : 'Toggle vault access'}
                        >
                          {has ? 'Access: on' : 'Access: off'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-white/35 text-xs">
                Removing vault access takes effect immediately. Owners always retain access.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

