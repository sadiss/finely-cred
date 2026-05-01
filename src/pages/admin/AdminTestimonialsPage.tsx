import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Plus, Search, Trash2, Video, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import type { Testimonial, TextTestimonial, VideoTestimonial } from '../../domain/testimonials';
import {
  createTextTestimonial,
  createVideoTestimonial,
  deleteTestimonial,
  listTestimonialsByTenant,
  upsertTestimonial,
} from '../../data/testimonialsRepo';
import { getMembershipByUserAndTenant, isPlatformAdmin } from '../../data/tenantsRepo';

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export default function AdminTestimonialsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const items = useMemo(() => {
    const tenantId = getActiveTenantId();
    const all = listTestimonialsByTenant(tenantId);
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((t) => JSON.stringify(t).toLowerCase().includes(query));
  }, [q, version]);

  const selected: Testimonial | null = useMemo(
    () => (selectedId ? items.find((t) => t.id === selectedId) ?? null : items[0] ?? null),
    [items, selectedId],
  );

  const update = (patch: Partial<Testimonial>) => {
    if (!selected) return;
    if (!canEdit) return;
    upsertTestimonial({ ...(selected as any), ...(patch as any) } as any);
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  const tenantId = getActiveTenantId();
  const canEdit = useMemo(() => {
    const u = auth.user;
    if (!u) return false;
    if (isAdminEmail(u.email)) return true;
    const m = getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    return m?.status === 'active' && (isPlatformAdmin(m) || m.role === 'tenant_owner');
  }, [auth.user, tenantId, version]);

  return (
    <PageShell badge="Admin" title="Testimonials" subtitle="Edit video + text testimonials. Publish/unpublish instantly.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const t = createVideoTestimonial(tenantId);
                window.dispatchEvent(new Event('finely:store'));
                setSelectedId(t.id);
              }}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={14} /> New video
            </button>
            <button
              type="button"
              onClick={() => {
                const t = createTextTestimonial(tenantId);
                window.dispatchEvent(new Event('finely:store'));
                setSelectedId(t.id);
              }}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              <Plus size={14} /> New text
            </button>
          </div>
        </div>

        {!canEdit && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-white/70 text-sm">
            Restricted: only tenant owners / platform admins can edit testimonials for this tenant.
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-white/60">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none w-full text-white/80 placeholder:text-white/20"
                placeholder="Search testimonials…"
              />
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {items.map((t) => {
                const active = t.id === selected?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      active ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">
                          {t.kind === 'video' ? (t as VideoTestimonial).title : (t as TextTestimonial).name}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {t.kind} • {t.visibility} • {t.service}
                        </div>
                      </div>
                      <div className="text-white/30">{t.kind === 'video' ? <Video size={16} /> : <Trophy size={16} />}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            {!selected ? (
              <div className="text-white/60">Select a testimonial.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{selected.kind === 'video' ? 'Video testimonial' : 'Text testimonial'}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">{selected.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => update({ visibility: selected.visibility === 'published' ? 'draft' : 'published' } as any)}
                      disabled={!canEdit}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        selected.visibility === 'published'
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                          : 'border-white/10 bg-black/30 text-white/70 hover:bg-white/[0.03]'
                      }`}
                    >
                      {selected.visibility === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                      {selected.visibility === 'published' ? 'Published' : 'Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteTestimonial(selected.id);
                        window.dispatchEvent(new Event('finely:store'));
                        setSelectedId(null);
                        setVersion((v) => v + 1);
                      }}
                      disabled={!canEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Service</div>
                    <input
                      value={selected.service}
                      onChange={(e) => update({ service: e.target.value } as any)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    />
                  </label>

                  {selected.kind === 'video' ? (
                    <>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</div>
                        <input
                          value={(selected as VideoTestimonial).title}
                          onChange={(e) => update({ title: e.target.value } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Embed URL (YouTube/Vimeo)</div>
                        <input
                          value={(selected as VideoTestimonial).embedUrl ?? ''}
                          onChange={(e) => update({ embedUrl: e.target.value || undefined } as any)}
                          placeholder="https://www.youtube.com/embed/…"
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Video src (MP4 URL)</div>
                        <input
                          value={(selected as VideoTestimonial).videoSrc ?? ''}
                          onChange={(e) => update({ videoSrc: e.target.value || undefined } as any)}
                          placeholder="/testimonials/my-video.mp4"
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Poster src (optional)</div>
                        <input
                          value={(selected as VideoTestimonial).posterSrc ?? ''}
                          onChange={(e) => update({ posterSrc: e.target.value || undefined } as any)}
                          placeholder="/testimonials/my-video.jpg"
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Start time (seconds)</div>
                        <input
                          type="number"
                          min={0}
                          value={String((selected as VideoTestimonial).startAtSeconds ?? 0)}
                          onChange={(e) => update({ startAtSeconds: clampInt(Number(e.target.value || 0), 0, 60 * 60) } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Caption (public)</div>
                        <input
                          value={(selected as VideoTestimonial).caption ?? ''}
                          onChange={(e) => update({ caption: e.target.value || undefined } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Internal note (admin-only)</div>
                        <textarea
                          value={(selected as VideoTestimonial).internalNote ?? ''}
                          onChange={(e) => update({ internalNote: e.target.value || undefined } as any)}
                          className="mt-2 w-full min-h-[90px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</div>
                        <input
                          value={(selected as TextTestimonial).name}
                          onChange={(e) => update({ name: e.target.value } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Review</div>
                        <textarea
                          value={(selected as TextTestimonial).review}
                          onChange={(e) => update({ review: e.target.value } as any)}
                          className="mt-2 w-full min-h-[120px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Milestone</div>
                        <input
                          value={(selected as TextTestimonial).milestone ?? ''}
                          onChange={(e) => update({ milestone: e.target.value || undefined } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="block">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Amount</div>
                        <input
                          value={(selected as TextTestimonial).amount ?? ''}
                          onChange={(e) => update({ amount: e.target.value || undefined } as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        />
                      </label>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

