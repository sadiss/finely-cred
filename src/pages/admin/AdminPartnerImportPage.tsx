import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileJson, Link, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { LegacyPartnerExportV1 } from '../../domain/imports';
import { importLegacyPartners, listImportBatches } from '../../data/importsRepo';
import { getPartner, listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { createInvite, getInvite, listInvitesByPartner, upsertInvite } from '../../data/invitesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { sendInviteEmail, sendInviteSms } from '../../lib/inviteDeliveryClient';

function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asExportV1(obj: any): LegacyPartnerExportV1 | null {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.version !== 1) return null;
  if (!Array.isArray(obj.partners)) return null;
  return obj as LegacyPartnerExportV1;
}

export default function AdminPartnerImportPage() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastInviteIds, setLastInviteIds] = useState<string[]>([]);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);
  const [invitePartnerById, setInvitePartnerById] = useState<Map<string, Partner>>(new Map());

  const [claimBaseUrl, setClaimBaseUrl] = useState<string>(() => {
    try {
      return `${window.location.origin}/claim`;
    } catch {
      return '/claim';
    }
  });

  const parsed = useMemo(() => asExportV1(safeParseJson(raw)), [raw]);

  const preview = useMemo(() => {
    const partners = parsed?.partners ?? [];
    return partners.slice(0, 8);
  }, [parsed]);

  const [existingByExternalId, setExistingByExternalId] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    // No need to pre-check existing partners; import handles deduplication via Supabase
    setExistingByExternalId(new Map());
  }, [raw]);

  const batches = useMemo(() => listImportBatches().slice(0, 6), [notice]);

  const generateInvitesForPartnerIds = async (partnerIds: string[]) => {
    const created: string[] = [];
    for (const id of partnerIds) {
      const p = await getPartner(id);
      if (!p) continue;
      const existing = listInvitesByPartner(p.id);
      if (existing.length) continue; // don’t spam duplicates by default
      const inv = createInvite({
        partnerId: p.id,
        claimUrl: claimBaseUrl,
        toEmail: p.profile.email,
        toPhone: p.profile.phone,
      });
      created.push(inv.id);
    }
    return created;
  };

  const lastInvites = useMemo(() => lastInviteIds.map((id) => getInvite(id)).filter(Boolean) as any[], [lastInviteIds, notice]);

  return (
    <PageShell
      badge="Admin"
      title="Import Partners (Legacy Resume)"
      subtitle="Upload a JSON export from your legacy system and import partners + tasks without restarting their journey. Then generate claim links so each partner can connect their profile after signup."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin/partners')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Partner Management"
          >
            <ArrowLeft size={16} /> Partner Management
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">import_v1</div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 text-sm">{err}</div>
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-emerald-100 text-sm">{notice}</div>
        ) : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <FileJson size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Legacy JSON upload</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/70 text-sm space-y-2">
              <div className="text-white/85 font-semibold">Expected schema (v1)</div>
              <div className="text-[11px] text-white/55 font-mono whitespace-pre-wrap">
                {`{\n  "version": 1,\n  "source": "laravel",\n  "exportedAt": "ISO",\n  "partners": [\n    {\n      "externalId": "string",\n      "fullName": "string",\n      "email": "string? (optional)",\n      "phone": "string? (optional)",\n      "lane": "funding_readiness|business_credit|... (optional)",\n      "journeyStage": "intake|report_upload|... (optional)",\n      "tasks": [ { "title": "...", "kind": "...", "status": "...", "stage": "...", "dueAt": "ISO?" } ]\n    }\n  ]\n}`}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Claim base URL</div>
                <input
                  value={claimBaseUrl}
                  onChange={(e) => setClaimBaseUrl(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
                  placeholder="https://app.yourdomain.com/claim"
                />
                <div className="mt-2 text-[11px] text-white/45">Invite links will be generated as `{claimBaseUrl}?token=...`</div>
              </label>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Upload file</div>
                <label className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all cursor-pointer">
                  <Upload size={14} /> Choose JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setErr(null);
                      setNotice(null);
                      setFilename(f.name);
                      const text = await f.text();
                      setRaw(text);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {filename ? <div className="mt-2 text-[11px] text-white/60 font-mono truncate">{filename}</div> : null}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">Raw JSON (optional)</div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={10}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors font-mono text-xs"
                placeholder="Paste JSON export here…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!parsed || busy}
                onClick={async () => {
                  setErr(null);
                  setNotice(null);
                  setLastInviteIds([]);
                  if (!parsed) {
                    setErr('Invalid export. Ensure version=1 and partners[] is present.');
                    return;
                  }
                  setBusy(true);
                  try {
                    const batch = await importLegacyPartners({ exportData: parsed, claimBaseUrl, filename });
                    const inviteIds = await generateInvitesForPartnerIds(batch.createdPartnerIds);
                    setLastInviteIds(inviteIds);
                    const loaded = await Promise.all(inviteIds.map((id) => getInvite(id)).filter(Boolean).map(async (inv: any) => getPartner(inv.partnerId)));
                    const pmap = new Map<string, Partner>();
                    for (const p of loaded) { if (p) pmap.set(p.id, p); }
                    setInvitePartnerById(pmap);
                    setNotice(
                      `Imported ${batch.createdPartnerIds.length}/${batch.partnerCount} partners. ` +
                        `${inviteIds.length} claim link(s) generated. ` +
                        `${batch.errors.length ? `Errors: ${batch.errors.length}.` : ''}`,
                    );
                  } catch (e: any) {
                    setErr(e?.message || 'Import failed.');
                  } finally {
                    setBusy(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Import now <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRaw('');
                  setFilename('');
                  setErr(null);
                  setNotice(null);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Link size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Preview & duplicates</span>
              </div>
              {!parsed ? (
                <div className="text-white/60 text-sm">Upload/paste a JSON export to preview.</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-white/60 text-sm">
                    Partners in file: <span className="text-white font-mono">{parsed.partners.length}</span>
                  </div>
                  <div className="space-y-2">
                    {preview.map((p) => {
                      const ext = String(p.externalId || '');
                      const dupId = existingByExternalId.get(ext);
                      return (
                        <div key={ext} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="text-white font-semibold truncate">{p.fullName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            ext:{ext} {dupId ? `• already imported (${dupId})` : ''}
                          </div>
                          <div className="mt-2 text-white/60 text-sm">
                            lane: <span className="font-mono">{p.lane ?? '—'}</span> • stage:{' '}
                            <span className="font-mono">{p.journeyStage ?? '—'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {parsed.partners.length > preview.length ? (
                    <div className="text-[11px] text-white/45">Showing {preview.length} of {parsed.partners.length}.</div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Recent import batches</div>
              {batches.length === 0 ? (
                <div className="text-white/60 text-sm">No imports yet.</div>
              ) : (
                <div className="space-y-2">
                  {batches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-white/80 font-semibold">Batch {b.id}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {new Date(b.createdAt).toLocaleString()} • partners:{b.createdPartnerIds.length}/{b.partnerCount} • errors:{b.errors.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lastInvites.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Generated claim links</div>
                <div className="text-white/60 text-sm">
                  Partners claim their imported profile via these links. Sending is gated by the <span className="font-mono">Invite Delivery</span> feature flag.
                </div>
                <div className="space-y-2">
                  {lastInvites.map((inv) => {
                    const p = invitePartnerById.get(inv.partnerId);
                    const email = inv.channels?.email?.to;
                    const phone = inv.channels?.sms?.to;
                    return (
                      <div key={inv.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{p?.profile.fullName ?? inv.partnerId}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              invite:{inv.id} • {new Date(inv.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(inv.claimUrl);
                                setNotice('Claim link copied.');
                              } catch {
                                window.prompt('Copy claim link:', inv.claimUrl);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            Copy link <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="text-[11px] text-white/70 font-mono break-all">{inv.claimUrl}</div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || !email || Boolean(sendBusyId)}
                            onClick={async () => {
                              if (!email) return;
                              setErr(null);
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteEmail({ toEmail: email, toName: p?.profile.fullName, claimUrl: inv.claimUrl });
                                upsertInvite({
                                  ...inv,
                                  sentAt: new Date().toISOString(),
                                  sentBy: 'admin',
                                  channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'sent' } },
                                });
                                setNotice(`Invite email sent to ${email}.`);
                              } catch (e: any) {
                                upsertInvite({
                                  ...inv,
                                  channels: { ...(inv.channels ?? {}), email: { ...(inv.channels?.email ?? {}), status: 'error', lastError: e?.message || 'send failed' } },
                                });
                                setErr(e?.message || 'Email send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            title={isFeatureEnabled('inviteDelivery') ? 'Send invite email' : 'Enable Invite Delivery in Admin Settings'}
                          >
                            Email {email ? `→ ${email}` : ''}
                          </button>
                          <button
                            type="button"
                            disabled={!isFeatureEnabled('inviteDelivery') || !phone || Boolean(sendBusyId)}
                            onClick={async () => {
                              if (!phone) return;
                              setErr(null);
                              setSendBusyId(inv.id);
                              try {
                                await sendInviteSms({ toPhone: phone, claimUrl: inv.claimUrl });
                                upsertInvite({
                                  ...inv,
                                  sentAt: new Date().toISOString(),
                                  sentBy: 'admin',
                                  channels: { ...(inv.channels ?? {}), sms: { ...(inv.channels?.sms ?? {}), status: 'sent' } },
                                });
                                setNotice(`Invite SMS sent to ${phone}.`);
                              } catch (e: any) {
                                upsertInvite({
                                  ...inv,
                                  channels: { ...(inv.channels ?? {}), sms: { ...(inv.channels?.sms ?? {}), status: 'error', lastError: e?.message || 'send failed' } },
                                });
                                setErr(e?.message || 'SMS send failed.');
                              } finally {
                                setSendBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            title={isFeatureEnabled('inviteDelivery') ? 'Send invite SMS' : 'Enable Invite Delivery in Admin Settings'}
                          >
                            SMS {phone ? `→ ${phone}` : ''}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

