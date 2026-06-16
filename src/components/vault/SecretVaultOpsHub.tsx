import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  Camera,
  Film,
  Headphones,
  Link as LinkIcon,
  Mic,
  Share2,
  Sparkles,
  Upload,
  Youtube,
} from 'lucide-react';
import { CameraCaptureModal } from '../evidence/CameraCaptureModal';
import type { SecretVaultItem, SecretVaultMediaKind, SecretVaultShareRole } from '../../domain/secretVault';
import { SECRET_VAULT_MEDIA_LABELS, SECRET_VAULT_SHARE_ROLES } from '../../domain/secretVault';
import {
  createSecretVaultFileItem,
  createSecretVaultIntelItem,
  createSecretVaultUrlItem,
  pullSecretVaultFromSupabase,
  updateSecretVaultSharing,
  upsertSecretVaultItem,
} from '../../data/secretVaultRepo';
import { enrichVaultItemWithIntel, generateVaultSecretsBundle } from '../../lib/secretVaultIntel';
import { classifyMediaFromUrl, vaultAcceptString, youtubeEmbedUrl, youtubeThumbnail } from '../../lib/secretVaultMedia';
import { resolveCrossRoleIdentity } from '../../lib/roleCrossRecognition';
import { getBlobStore } from '../../storage/getBlobStore';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Tab = 'library' | 'capture' | 'intel' | 'sharing';

type Props = {
  tenantId: string;
  userId?: string;
  userEmail?: string | null;
  membershipRole?: string | null;
  isAdmin?: boolean;
  items: SecretVaultItem[];
  selected: SecretVaultItem | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onError: (msg: string | null) => void;
  onNotice: (msg: string | null) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
};

const MEDIA_FILTERS: Array<{ id: SecretVaultMediaKind | 'all'; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'All', icon: null },
  { id: 'document', label: 'Docs', icon: <BookOpen size={12} /> },
  { id: 'ebook', label: 'E-books', icon: <BookOpen size={12} /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={12} /> },
  { id: 'video_upload', label: 'Videos', icon: <Film size={12} /> },
  { id: 'audio', label: 'Audio', icon: <Headphones size={12} /> },
  { id: 'url', label: 'Links', icon: <LinkIcon size={12} /> },
];

export function SecretVaultOpsHub(props: Props) {
  const [tab, setTab] = useState<Tab>('library');
  const [mediaFilter, setMediaFilter] = useState<SecretVaultMediaKind | 'all'>('all');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [bundleIntel, setBundleIntel] = useState<any>(null);

  const crossRole = useMemo(
    () =>
      resolveCrossRoleIdentity({
        membershipRole: props.membershipRole as any,
        email: props.userEmail,
        isAdmin: props.isAdmin,
        ncgTenant: false,
      }),
    [props.membershipRole, props.userEmail, props.isAdmin],
  );

  useEffect(() => {
    void pullSecretVaultFromSupabase(props.tenantId).then(() => props.onRefresh());
  }, [props.tenantId]);

  const filtered = useMemo(() => {
    if (mediaFilter === 'all') return props.items;
    return props.items.filter((i) => i.mediaKind === mediaFilter);
  }, [props.items, mediaFilter]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    props.setBusy(true);
    props.onError(null);
    try {
      const store = getBlobStore();
      for (const f of Array.from(files).slice(0, 30)) {
        const put = await store.put(f as Blob, {
          partnerId: `vault_${props.tenantId}`,
          kind: 'secret_vault',
          filename: f.name,
          mimeType: f.type,
        });
        createSecretVaultFileItem({
          tenantId: props.tenantId,
          title: f.name,
          tags: ['upload'],
          blobRef: put.ref,
          filename: f.name,
          mimeType: f.type || 'application/octet-stream',
          sizeBytes: f.size,
          sha256: put.sha256,
          createdByUserId: props.userId,
        });
      }
      props.onNotice(`Saved ${Math.min(files.length, 30)} file(s).`);
      props.onRefresh();
    } catch (e: any) {
      props.onError(e?.message || 'Upload failed.');
    } finally {
      props.setBusy(false);
    }
  };

  const addUrl = () => {
    props.onError(null);
    const u = urlValue.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      props.onError('Invalid URL.');
      return;
    }
    const classified = classifyMediaFromUrl(u);
    createSecretVaultUrlItem({
      tenantId: props.tenantId,
      title: (urlTitle.trim() || u).slice(0, 140),
      sourceUrl: u,
      mediaKind: classified.mediaKind,
      tags: classified.youtubeId ? ['youtube', 'video'] : ['url'],
      notes: classified.youtubeId ? 'YouTube — embed + ML intel available.' : 'Web resource — run intelligence scan.',
      createdByUserId: props.userId,
    });
    setUrlTitle('');
    setUrlValue('');
    props.onNotice('URL saved.');
    props.onRefresh();
  };

  const runIntel = async (item: SecretVaultItem) => {
    props.setBusy(true);
    props.onError(null);
    try {
      const intel = await enrichVaultItemWithIntel(item);
      upsertSecretVaultItem({ ...item, intel, tags: [...new Set([...(item.tags ?? []), ...(intel.suggestedTags ?? [])])] });
      props.onNotice('Intelligence generated.');
      props.onRefresh();
    } catch (e: any) {
      props.onError(e?.message || 'Intelligence failed.');
    } finally {
      props.setBusy(false);
    }
  };

  const runBundleIntel = async () => {
    props.setBusy(true);
    try {
      const intel = await generateVaultSecretsBundle({ tenantId: props.tenantId, items: props.items });
      setBundleIntel(intel);
      createSecretVaultIntelItem({
        tenantId: props.tenantId,
        title: `Vault intel bundle · ${new Date().toLocaleDateString()}`,
        intel,
        tags: ['intel', 'bundle', 'ncg-share'],
        shareWithNcg: true,
        sharedWithRoles: ['tenant_owner', 'ncg_ops', 'ncg_underwriter'],
        createdByUserId: props.userId,
      });
      props.onNotice('Secret intelligence bundle created.');
      props.onRefresh();
    } catch (e: any) {
      props.onError(e?.message || 'Bundle intel failed.');
    } finally {
      props.setBusy(false);
    }
  };

  const toggleShareRole = (role: SecretVaultShareRole) => {
    if (!props.selected) return;
    const cur = props.selected.sharedWithRoles ?? [];
    const next = cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role];
    updateSecretVaultSharing(props.selected.id, { sharedWithRoles: next });
    props.onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['library', 'capture', 'intel', 'sharing'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              tab === t ? 'bg-violet-500/20 border-violet-400/40 text-violet-100' : 'border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
        <span className={`ml-auto ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
          Recognized as: <strong className="text-violet-200">{crossRole.recognitionLabel}</strong>
        </span>
      </div>

      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MEDIA_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMediaFilter(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                  mediaFilter === f.id ? 'bg-amber-500/15 border-amber-400/35 text-amber-100' : 'border-white/10 text-white/45'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
          <div className={`${finelyOsCatalogCard('violet')} !p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3`}>
            {filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => props.onSelect(i.id)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  props.selected?.id === i.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                {i.youtubeId ? (
                  <img src={youtubeThumbnail(i.youtubeId)} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                ) : null}
                <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{i.title}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>
                  {SECRET_VAULT_MEDIA_LABELS[i.mediaKind]} {i.intel ? '· ML' : ''}
                </div>
              </button>
            ))}
            {!filtered.length ? <div className={FINELY_OS_ENTITY_BODY}>No items in this filter.</div> : null}
          </div>
        </div>
      )}

      {tab === 'capture' && (
        <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} data-fc-accent="sky">
          <p className={FINELY_OS_ENTITY_BODY}>
            Save e-books, PDFs, docs, uploaded videos, audio, images, and YouTube links. Use the document scanner for high-fidelity capture.
          </p>
          <div className="flex flex-wrap gap-2">
            <label className={`${FINELY_OS_PRIMARY_BTN} cursor-pointer`}>
              <Upload size={14} /> Upload any file
              <input type="file" multiple accept={vaultAcceptString()} onChange={(e) => void uploadFiles(e.target.files)} className="hidden" />
            </label>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setCameraOpen(true)}>
              <Camera size={14} /> Document scanner
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Title (YouTube, PDF link, etc.)" />
            <input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className={`md:col-span-2 ${FINELY_OS_ENTITY_INPUT}`} placeholder="https://youtube.com/… or any URL" />
          </div>
          <button type="button" disabled={!urlValue.trim()} onClick={addUrl} className={FINELY_OS_SUCCESS_BTN}>
            <LinkIcon size={14} /> Save link / YouTube
          </button>
        </div>
      )}

      {tab === 'intel' && (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className="flex items-center gap-2 text-violet-200">
            <Brain size={18} />
            <span className={FINELY_OS_ENTITY_VALUE}>Vault intelligence (ML)</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Analyze assets, extract vital ops intel, and generate research queries for credit, funding, and compliance. Shared items sync to Nora Capital via API.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={props.busy || !props.selected} onClick={() => props.selected && void runIntel(props.selected)} className={FINELY_OS_PRIMARY_BTN}>
              <Sparkles size={14} /> Analyze selected
            </button>
            <button type="button" disabled={props.busy || !props.items.length} onClick={() => void runBundleIntel()} className={FINELY_OS_SECONDARY_BTN}>
              <Mic size={14} /> Generate secret bundle
            </button>
          </div>
          {(props.selected?.intel || bundleIntel) && (
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4 space-y-2 text-sm text-white/85">
              <p>{(props.selected?.intel ?? bundleIntel)?.summary}</p>
              <ul className="list-disc pl-5 space-y-1">
                {((props.selected?.intel ?? bundleIntel)?.keyPoints ?? []).map((k: string) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
              {((props.selected?.intel ?? bundleIntel)?.researchQueries ?? []).length ? (
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2`}>Research queries</div>
              ) : null}
              <div className="flex flex-wrap gap-1">
                {((props.selected?.intel ?? bundleIntel)?.researchQueries ?? []).map((q: string) => (
                  <span key={q} className="text-[10px] px-2 py-1 rounded-md bg-black/30 border border-white/10">{q}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sharing' && props.selected && (
        <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`}>
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-amber-300" />
            <span className={FINELY_OS_ENTITY_VALUE}>Cross-role sharing · {props.selected.title}</span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>Roles recognize each other across Finely + Nora Capital. Toggle who receives this asset and intel.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SECRET_VAULT_SHARE_ROLES.map((r) => {
              const on = (props.selected?.sharedWithRoles ?? []).includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleShareRole(r.id)}
                  className={`text-left rounded-xl border px-3 py-2 ${on ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02]'}`}
                >
                  <div className="text-sm font-bold text-white">{r.label}</div>
                  <div className="text-[10px] text-white/45">{r.hint}</div>
                </button>
              );
            })}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={Boolean(props.selected.shareWithNcg)}
              onChange={() => updateSecretVaultSharing(props.selected!.id, { shareWithNcg: !props.selected!.shareWithNcg })}
            />
            Share intelligence with Nora Capital Group API (`vault.intel_feed`)
          </label>
        </div>
      )}

      {props.selected?.youtubeId && (
        <div className={`${finelyOsCatalogCard('sky')} !p-4`}>
          <iframe
            title={props.selected.title}
            src={youtubeEmbedUrl(props.selected.youtubeId)}
            className="w-full aspect-video rounded-xl border border-white/10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Vault document scanner"
        subtitle="High-resolution capture for owner vault — PDF or images."
        onSaveFiles={async ({ files }) => {
          const dt = new DataTransfer();
          files.forEach((f) => dt.items.add(f));
          await uploadFiles(dt.files);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}
