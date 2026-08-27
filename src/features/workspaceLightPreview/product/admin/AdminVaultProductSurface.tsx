import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Lock,
  Search,
  Shield,
  Trash2,
  Upload,
  Vault,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { SecretVaultOpsHub } from '../../../../components/vault/SecretVaultOpsHub';
import {
  canAccessVault,
  getMembershipByUserAndTenant,
  getTenant,
  isPlatformAdmin,
  listMemberships,
  updateMembership,
} from '../../../../data/tenantsRepo';
import {
  createSecretVaultFileItem,
  createSecretVaultUrlItem,
  deleteSecretVaultItem,
  listSecretVaultItemsByTenant,
} from '../../../../data/secretVaultRepo';
import type { SecretVaultItem } from '../../../../domain/secretVault';
import { SECRET_VAULT_MEDIA_LABELS } from '../../../../domain/secretVault';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { getBlobStore } from '../../../../storage/getBlobStore';
import { getBlobUrl } from '../../../../storage/getBlobUrl';
import { downloadBlob, openUrlInNewTab } from '../../../../utils/download';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type VaultZone = 'archive' | 'ops' | 'access';

const MOSAIC_ZONES: Array<{
  id: VaultZone;
  title: string;
  detail: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'archive', title: 'Secrets archive', detail: 'Files, URLs, and search', icon: <Vault size={22} />, accent: 'rose' },
  { id: 'ops', title: 'Intel operations', detail: 'ML bundles and Nora feed', icon: <Shield size={22} />, accent: 'violet' },
  { id: 'access', title: 'Access control', detail: 'Who can open the vault', icon: <Lock size={22} />, accent: 'emerald' },
];

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

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

export default function AdminVaultProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [zone, setZone] = useState<VaultZone>('archive');
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');

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
    return all.filter((i) =>
      `${i.title} ${i.type} ${i.filename ?? ''} ${i.sourceUrl ?? ''} ${(i.tags ?? []).join(' ')}`.toLowerCase().includes(query),
    );
  }, [q, tenantId, version]);

  const selected: SecretVaultItem | null = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : items[0] ?? null),
    [items, selectedId],
  );

  const accessMembers = useMemo(() => {
    return listMemberships(tenantId).slice().sort((a, b) => a.email.localeCompare(b.email));
  }, [tenantId, version]);

  const fileCount = items.filter((i) => i.type === 'file').length;
  const urlCount = items.filter((i) => i.type === 'url').length;
  const accessOnCount = accessMembers.filter((m) => canAccessVault(m)).length;

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

  const addUrl = () => {
    setErr(null);
    const u = urlValue.trim();
    if (!u) return;
    try {
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
      notes: 'URL saved. Add a server-side scraper later to capture snapshots.',
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
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Platform"
        title="Secret vault"
        description="Sign in to manage sensitive files and vault access."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'light'}
        archetype={archetype}
        icon={navItem?.icon}
      >
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`}>Not signed in.</div>
      </ProductHubScaffold>
    );
  }

  if (!allowed) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Platform"
        title="Secret vault"
        description="Restricted — an owner must grant vault access."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'light'}
        archetype={archetype}
        icon={navItem?.icon}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/access')}>
            Access center
          </button>
        }
      >
        <div className={FINELY_OS_NOTICE_WARN}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Lock size={18} />
            Access denied
          </div>
          <div className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            You do not have Secret Vault access in this tenant. An owner or admin must grant it.
          </div>
        </div>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Secret vault"
      description="Sensitive files and URLs in a catalog mosaic — inspect, upload, and control access."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label="Upload files"
          onClick={() => {
            setZone('archive');
            document.getElementById('fc-vault-upload-input')?.click();
          }}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setZone('access')}>
          Manage access
        </button>
      }
      metrics={[
        { label: 'Items', value: String(items.length), hint: 'In this tenant', accent: 'rose', onClick: () => setZone('archive') },
        { label: 'Files', value: String(fileCount), hint: 'Uploaded blobs', accent: 'violet', onClick: () => setZone('archive') },
        { label: 'URLs', value: String(urlCount), hint: 'Saved links', accent: 'sky', onClick: () => setZone('archive') },
        { label: 'Access on', value: String(accessOnCount), hint: `${accessMembers.length} members`, accent: 'emerald', onClick: () => setZone('access') },
      ]}
      metricTitle="Vault snapshot"
      metricDescription="Browse the secrets mosaic, run intel ops, or revoke access immediately."
    >
      <input
        id="fc-vault-upload-input"
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files)}
      />

      <div className={FINELY_OS_PAGE} data-surface-layout="catalog-mosaic">
        {/* Tenant status band */}
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
            tenant: {tenant?.name ?? tenantId}
          </div>
          {notice ? <div className={`mt-3 ${FINELY_OS_NOTICE_SUCCESS}`}>{notice}</div> : null}
          {err ? <div className={`mt-3 ${FINELY_OS_NOTICE_ERROR}`}>{err}</div> : null}
        </div>

        {/* Zone mosaic selector */}
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Vault size={16} />
            <span>Vault zones</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MOSAIC_ZONES.map((tile, idx) => {
              const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
              const active = zone === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setZone(tile.id)}
                  className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[160px] flex flex-col gap-3 transition hover:shadow-lg ${
                    active ? 'ring-2 ring-white/25' : ''
                  }`}
                  data-fc-accent={tileAccent}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.06]">{tile.icon}</span>
                    <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {tile.id === 'archive' ? items.length : tile.id === 'access' ? accessOnCount : 'ML'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold">{tile.title}</div>
                    <p className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{tile.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {zone === 'ops' ? (
          <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`} data-fc-accent="violet">
            <div>
              <h2 className="text-3xl font-extrabold">Intel operations</h2>
              <p className={`mt-2 max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Store e-books, docs, videos, and web research. ML generates intel bundles; Nora Capital pulls shared items via{' '}
                <span className="font-mono">vault.intel_feed</span>.
              </p>
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
          </section>
        ) : null}

        {zone === 'archive' ? (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Catalog mosaic */}
            <section className={`lg:col-span-7 ${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-5`} data-fc-accent="rose">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-extrabold">Secrets mosaic</h2>
                <label className={`${FINELY_OS_PRIMARY_BTN} cursor-pointer`}>
                  <Upload size={14} /> Upload
                  <input type="file" multiple className="hidden" onChange={(e) => void uploadFiles(e.target.files)} />
                </label>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3">
                <Search size={16} className="text-violet-400 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={`bg-transparent outline-none text-base w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                  placeholder="Search vault…"
                />
              </div>

              {items.length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No items yet. Upload a file or save a URL in the inspector.</p>
              ) : (
                <FinelyOsPaginatedStack
                  items={items}
                  pageSize={12}
                  itemSpacingClassName="grid sm:grid-cols-2 gap-4"
                  emptyMessage="No items yet."
                  renderItem={(i, idx) => {
                    const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
                    const active = i.id === selected?.id;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setSelectedId(i.id)}
                        className={`${finelyOsCatalogCard(tileAccent)} p-5 lg:p-6 text-left transition hover:shadow-lg ${
                          active ? 'ring-2 ring-white/30' : ''
                        }`}
                        data-fc-accent={tileAccent}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.06]">
                            {i.type === 'file' ? <FileText size={18} /> : <LinkIcon size={18} />}
                          </span>
                          <span className={`text-xs font-bold uppercase ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            {SECRET_VAULT_MEDIA_LABELS[i.mediaKind] ?? i.type}
                          </span>
                        </div>
                        <div className={`mt-3 text-lg font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{i.title}</div>
                        <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(i.createdAt)}</div>
                        {i.type === 'file' ? (
                          <div className={`mt-2 text-sm font-mono ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>{fmtBytes(i.sizeBytes)}</div>
                        ) : null}
                      </button>
                    );
                  }}
                />
              )}
            </section>

            {/* Inspector rail */}
            <div className="lg:col-span-5 space-y-6">
              <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
                <h2 className="text-2xl font-extrabold">Save URL</h2>
                <div className="grid gap-3">
                  <input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Title (optional)" />
                  <input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="https://…" />
                </div>
                <button type="button" onClick={addUrl} disabled={!urlValue.trim()} className={FINELY_OS_SUCCESS_BTN}>
                  <LinkIcon size={14} /> Save URL
                </button>
              </section>

              <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-extrabold">Inspector</h2>
                  {selected ? <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{selected.id}</div> : null}
                </div>
                {!selected ? (
                  <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Select a secret from the mosaic.</p>
                ) : (
                  <>
                    <div className="grid gap-4">
                      <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-5`} data-fc-accent="violet">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Type</div>
                        <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selected.type}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm font-semibold`}>Created: {fmtWhen(selected.createdAt)}</div>
                      </div>
                      <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-5`} data-fc-accent="sky">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Size</div>
                        <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtBytes(selected.sizeBytes)}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm font-mono truncate`}>{selected.mimeType ?? '—'}</div>
                      </div>
                    </div>
                    {selected.notes ? <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap text-base font-semibold`}>{selected.notes}</div> : null}
                    {selected.type === 'url' && selected.sourceUrl ? (
                      <div className={`${FINELY_OS_ENTITY_BODY} font-mono break-all text-sm`}>{selected.sourceUrl}</div>
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
              </section>
            </div>
          </div>
        ) : null}

        {zone === 'access' ? (
          <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold">Access control</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Removing vault access takes effect immediately. Owners always retain access.</p>
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>{accessMembers.length} members</div>
            </div>
            {!canManageAccess ? (
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>You do not have permission to manage vault access.</p>
            ) : (
              <FinelyOsPaginatedStack
                items={accessMembers}
                pageSize={10}
                emptyMessage="No team members."
                renderItem={(m, idx) => {
                  const isCore = m.role === 'platform_admin' || m.role === 'tenant_owner';
                  const has = canAccessVault(m);
                  const rowAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
                  return (
                    <div key={m.id} className={`${finelyOsCatalogCard(rowAccent)} fc-surface-harmony flex items-center justify-between gap-3 p-5 lg:p-6`} data-fc-accent={rowAccent}>
                      <div className="min-w-0">
                        <div className={`text-lg font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{m.email}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {m.role} • {m.status} • {m.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isCore}
                        onClick={() => toggleVaultAccess(m.id)}
                        className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                          has ? FINELY_OS_ACTIVE_CHIP : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
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
          </section>
        ) : null}
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
