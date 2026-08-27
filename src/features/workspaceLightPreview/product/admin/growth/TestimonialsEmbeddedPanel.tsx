import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, Search, Trash2, Trophy, Video } from 'lucide-react';
import { useAuth } from '../../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../../auth/admin';
import { getActiveTenantId } from '../../../../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../../../../domain/tenants';
import type { Testimonial, TextTestimonial, VideoTestimonial } from '../../../../../domain/testimonials';
import {
  createTextTestimonial,
  createVideoTestimonial,
  deleteTestimonial,
  listTestimonialsByTenant,
  upsertTestimonial,
} from '../../../../../data/testimonialsRepo';
import { getMembershipByUserAndTenant, isPlatformAdmin } from '../../../../../data/tenantsRepo';
import { FinelyOsPaginatedStack } from '../../../../os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../../../../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_LUXURY_EMPTY,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../../../os/finelyOsLightUi';
import { FinelyOsTypedDeleteDialog } from '../../../../os/FinelyOsTypedDeleteDialog';

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Testimonials editor without PageShell — for growth workstation embed. */
export function TestimonialsEmbeddedPanel() {
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = getActiveTenantId();

  const items = useMemo(() => {
    const all = listTestimonialsByTenant(tenantId);
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((t) => JSON.stringify(t).toLowerCase().includes(query));
  }, [q, tenantId, version]);

  const selected: Testimonial | null = useMemo(
    () => (selectedId ? items.find((t) => t.id === selectedId) ?? null : items[0] ?? null),
    [items, selectedId],
  );

  const canEdit = useMemo(() => {
    const u = auth.user;
    if (!u) return false;
    if (isAdminEmail(u.email)) return true;
    const m = getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    return m?.status === 'active' && (isPlatformAdmin(m) || m.role === 'tenant_owner');
  }, [auth.user, tenantId, version]);

  const update = (patch: Partial<Testimonial>) => {
    if (!selected || !canEdit) return;
    upsertTestimonial({ ...(selected as Testimonial), ...(patch as Partial<Testimonial>) } as Testimonial);
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  const publishedCount = items.filter((t) => t.visibility === 'published').length;
  const videoCount = items.filter((t) => t.kind === 'video').length;
  const textCount = items.filter((t) => t.kind === 'text').length;

  return (
    <div className="fc-wlp-growth-testimonials-embed">
      {!canEdit ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Restricted: only tenant owners / platform admins can edit testimonials for this tenant.
        </div>
      ) : null}

      <div className="fc-wlp-growth-testimonials-stats">
        <FinelyOsOverviewStatTile icon={Trophy} label="Total" value={items.length} accent="emerald" iconAccent="emerald" />
        <FinelyOsOverviewStatTile icon={Eye} label="Published" value={publishedCount} accent="violet" iconAccent="violet" />
        <FinelyOsOverviewStatTile icon={Video} label="Video" value={videoCount} accent="sky" iconAccent="sky" />
        <FinelyOsOverviewStatTile icon={Trophy} label="Text" value={textCount} accent="rose" iconAccent="rose" />
      </div>

      <div className="fc-wlp-growth-testimonials-grid">
        <aside className="fc-wlp-growth-testimonials-queue" data-fcm-accent="emerald">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = createVideoTestimonial(tenantId);
                  window.dispatchEvent(new Event('finely:store'));
                  setSelectedId(t.id);
                  setVersion((v) => v + 1);
                }}
                disabled={!canEdit}
                className={FINELY_OS_SUCCESS_BTN}
              >
                <Plus size={14} aria-hidden /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = createTextTestimonial(tenantId);
                  window.dispatchEvent(new Event('finely:store'));
                  setSelectedId(t.id);
                  setVersion((v) => v + 1);
                }}
                disabled={!canEdit}
                className={FINELY_OS_SECONDARY_BTN}
              >
                <Plus size={14} aria-hidden /> Text
              </button>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
            <Search size={16} className="text-emerald-300 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`bg-transparent outline-none w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
              placeholder="Search testimonials…"
            />
          </div>
          <FinelyOsPaginatedStack
            items={items}
            pageSize={10}
            emptyMessage="No testimonials match your search."
            renderItem={(t) => {
              const active = t.id === selected?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={finelyOsListItem(active, 'emerald')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>
                        {t.kind === 'video' ? (t as VideoTestimonial).title : (t as TextTestimonial).name}
                      </div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                        {t.kind} · {t.visibility} · {t.service}
                      </div>
                    </div>
                    <div className="text-emerald-300">
                      {t.kind === 'video' ? <Video size={16} aria-hidden /> : <Trophy size={16} aria-hidden />}
                    </div>
                  </div>
                </button>
              );
            }}
          />
        </aside>

        <div className="fc-wlp-growth-testimonials-inspector" data-fcm-accent="violet">
          {!selected ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>Select a testimonial.</div>
          ) : (
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>
                    {selected.kind === 'video' ? 'Video testimonial' : 'Text testimonial'}
                  </div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{selected.id}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      update({ visibility: selected.visibility === 'published' ? 'draft' : 'published' } as Partial<Testimonial>)
                    }
                    disabled={!canEdit}
                    className={selected.visibility === 'published' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                  >
                    {selected.visibility === 'published' ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                    {selected.visibility === 'published' ? 'Published' : 'Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    disabled={!canEdit}
                    className={FINELY_OS_DANGER_BTN}
                  >
                    <Trash2 size={14} aria-hidden /> Delete…
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <div className={FINELY_OS_ENTITY_LABEL}>Service</div>
                  <input
                    value={selected.service}
                    onChange={(e) => update({ service: e.target.value } as Partial<Testimonial>)}
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </label>

                {selected.kind === 'video' ? (
                  <>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                      <input
                        value={(selected as VideoTestimonial).title}
                        onChange={(e) => update({ title: e.target.value } as Partial<VideoTestimonial>)}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Embed URL (YouTube/Vimeo)</div>
                      <input
                        value={(selected as VideoTestimonial).embedUrl ?? ''}
                        onChange={(e) => update({ embedUrl: e.target.value || undefined } as Partial<VideoTestimonial>)}
                        placeholder="https://www.youtube.com/embed/…"
                        className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Video src (MP4 URL)</div>
                      <input
                        value={(selected as VideoTestimonial).videoSrc ?? ''}
                        onChange={(e) => update({ videoSrc: e.target.value || undefined } as Partial<VideoTestimonial>)}
                        placeholder="/testimonials/my-video.mp4"
                        className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Poster src (optional)</div>
                      <input
                        value={(selected as VideoTestimonial).posterSrc ?? ''}
                        onChange={(e) => update({ posterSrc: e.target.value || undefined } as Partial<VideoTestimonial>)}
                        placeholder="/testimonials/my-video.jpg"
                        className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      />
                    </label>
                    <label className="block">
                      <div className={FINELY_OS_ENTITY_LABEL}>Start time (seconds)</div>
                      <input
                        type="number"
                        min={0}
                        value={String((selected as VideoTestimonial).startAtSeconds ?? 0)}
                        onChange={(e) =>
                          update({
                            startAtSeconds: clampInt(Number(e.target.value || 0), 0, 60 * 60),
                          } as Partial<VideoTestimonial>)
                        }
                        className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Caption (public)</div>
                      <input
                        value={(selected as VideoTestimonial).caption ?? ''}
                        onChange={(e) => update({ caption: e.target.value || undefined } as Partial<VideoTestimonial>)}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Internal note (admin-only)</div>
                      <textarea
                        value={(selected as VideoTestimonial).internalNote ?? ''}
                        onChange={(e) => update({ internalNote: e.target.value || undefined } as Partial<VideoTestimonial>)}
                        className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px]`}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
                      <input
                        value={(selected as TextTestimonial).name}
                        onChange={(e) => update({ name: e.target.value } as Partial<TextTestimonial>)}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Review</div>
                      <textarea
                        value={(selected as TextTestimonial).review}
                        onChange={(e) => update({ review: e.target.value } as Partial<TextTestimonial>)}
                        className={`${FINELY_OS_ENTITY_INPUT} min-h-[120px]`}
                      />
                    </label>
                    <label className="block">
                      <div className={FINELY_OS_ENTITY_LABEL}>Milestone</div>
                      <input
                        value={(selected as TextTestimonial).milestone ?? ''}
                        onChange={(e) => update({ milestone: e.target.value || undefined } as Partial<TextTestimonial>)}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                    <label className="block">
                      <div className={FINELY_OS_ENTITY_LABEL}>Amount</div>
                      <input
                        value={(selected as TextTestimonial).amount ?? ''}
                        onChange={(e) => update({ amount: e.target.value || undefined } as Partial<TextTestimonial>)}
                        className={FINELY_OS_ENTITY_INPUT}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <FinelyOsTypedDeleteDialog
        open={deleteOpen && Boolean(selected)}
        title="Delete testimonial?"
        description="This removes the testimonial from the public site immediately. Published cards will disappear from the homepage and testimonials page."
        entityLabel={
          selected ? (selected.kind === 'video' ? (selected as VideoTestimonial).title : (selected as TextTestimonial).name) : undefined
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!selected) return;
          deleteTestimonial(selected.id);
          window.dispatchEvent(new Event('finely:store'));
          setSelectedId(null);
          setDeleteOpen(false);
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}
