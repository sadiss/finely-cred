import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, FileText, Paperclip } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { EvidencePickerModal } from '../../components/evidence/EvidencePickerModal';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { newId } from '../../utils/ids';
import { upsertLetter } from '../../data/lettersRepo';
import { getBusinessDispute, upsertBusinessDispute } from '../../data/businessCreditRepo';
import type { BusinessBureau, BusinessNegativeItem } from '../../domain/businessCredit';

function bureauLabel(b: BusinessBureau) {
  if (b === 'dnb') return 'Dun & Bradstreet (D&B)';
  if (b === 'experian_business') return 'Experian Business';
  return 'Equifax Business';
}

function moneyLabel(cents?: number) {
  if (!cents || !Number.isFinite(cents)) return '—';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function buildLetterText(args: {
  businessName: string;
  bureau: BusinessBureau;
  representativeName: string;
  disputeTitle: string;
  items: BusinessNegativeItem[];
}) {
  const lines: string[] = [];
  lines.push(`[Date: ${new Date().toISOString().slice(0, 10)}]`);
  lines.push('');
  lines.push(`RE: Business Credit File Dispute — ${args.businessName}`);
  lines.push(`Bureau: ${bureauLabel(args.bureau)}`);
  lines.push('');
  lines.push('To Whom It May Concern:');
  lines.push('');
  lines.push(
    `I am writing to dispute inaccurate and/or unverifiable information on the business credit file for ${args.businessName}. ` +
      `Please investigate and correct/remove any information that cannot be verified as accurate and complete.`,
  );
  lines.push('');
  lines.push(`Dispute summary: ${args.disputeTitle}`);
  lines.push('');
  lines.push('Items in dispute:');
  if (!args.items.length) {
    lines.push('- [Add items here]');
  } else {
    args.items.forEach((it, idx) => {
      const parts = [
        `#${idx + 1}`,
        it.category || 'Negative item',
        it.description || '',
        it.amountCents ? `amount: ${moneyLabel(it.amountCents)}` : null,
        it.date ? `date: ${it.date}` : null,
      ].filter(Boolean);
      lines.push(`- ${parts.join(' • ')}`);
    });
  }
  lines.push('');
  lines.push('Enclosures:');
  lines.push('- See attached documents supporting this dispute.');
  lines.push('');
  lines.push('Sincerely,');
  lines.push(args.representativeName);
  return lines.join('\n');
}

export default function BusinessDisputeDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const disputeId = String(params.id || '').trim();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [version, setVersion] = useState(0);
  const dispute = useMemo(() => {
    if (!partner?.id || !disputeId) return null;
    return getBusinessDispute(partner.id, disputeId);
  }, [partner?.id, disputeId, version]);

  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner?.id, version]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const businessName = useMemo(() => {
    const r: any = partner?.routes?.business_build ?? {};
    return String(r?.business?.businessName || '').trim() || 'Your Business Legal Name';
  }, [partner?.id]);
  const repName = String(partner?.profile?.fullName || '').trim() || 'Authorized Representative';

  const [newCat, setNewCat] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');

  if (!partner) {
    return (
      <PageShell badge="Business Portal" title="Business dispute" subtitle="">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">Sign in to view disputes.</div>
      </PageShell>
    );
  }

  if (!disputeId || !dispute) {
    return (
      <PageShell badge="Business Portal" title="Dispute not found" subtitle="">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
            This dispute does not exist or you don’t have access to it.
          </div>
          <button onClick={() => navigate('/business/disputes')} className="fc-button-brand">
            Back to disputes <ArrowRight size={14} />
          </button>
        </div>
      </PageShell>
    );
  }

  const attached = (dispute.evidenceIds ?? []).map((id) => evidence.find((e) => e.id === id)).filter(Boolean) as any[];

  return (
    <PageShell badge="Business Portal" title={dispute.title} subtitle={`${bureauLabel(dispute.bureau)} • ${dispute.status}`}>
      <EvidencePickerModal
        open={pickerOpen}
        title="Attach evidence"
        subtitle="Pick files from your Evidence Vault (or upload new)."
        partnerId={partner.id}
        items={evidence}
        selectedEvidenceId={undefined}
        pickLabel="Attach"
        onPick={(evidenceId) => {
          const next = upsertBusinessDispute({
            ...dispute,
            evidenceIds: Array.from(new Set([...(dispute.evidenceIds ?? []), evidenceId])),
          });
          setVersion((v) => v + 1);
          setPickerOpen(false);
          setNotice(`Attached evidence to dispute: ${next.title}`);
        }}
        onUpsert={(item) => {
          upsertEvidence(item);
          setVersion((v) => v + 1);
        }}
        onDelete={(eId) => {
          deleteEvidence(eId);
          setVersion((v) => v + 1);
        }}
        onClose={() => setPickerOpen(false)}
        autoPickOnUpload={true}
      />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/business/disputes')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back"
        >
          <ArrowLeft size={16} /> Back to disputes
        </button>

        {genErr ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm">{genErr}</div> : null}
        {notice ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm">{notice}</div> : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="text-white font-semibold">Dispute workspace</div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Title</div>
                  <input
                    value={dispute.title}
                    onChange={(e) => {
                      upsertBusinessDispute({ ...dispute, title: e.target.value });
                      setVersion((v) => v + 1);
                    }}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Status</div>
                  <select
                    value={dispute.status}
                    onChange={(e) => {
                      upsertBusinessDispute({ ...dispute, status: e.target.value as any });
                      setVersion((v) => v + 1);
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white/80"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In progress</option>
                    <option value="mailed">Mailed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
              <summary className="cursor-pointer select-none px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <div className="text-white font-semibold">Negative items</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Expand</div>
              </summary>
              <div className="px-5 pb-5 space-y-4">
                <form
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 grid md:grid-cols-2 gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cents = newAmount.trim() ? Math.round(Number(newAmount) * 100) : undefined;
                    const nextItem: BusinessNegativeItem = {
                      id: newId('biz_item'),
                      bureau: dispute.bureau,
                      category: newCat.trim() || 'Negative item',
                      description: newDesc.trim(),
                      amountCents: cents && Number.isFinite(cents) ? cents : undefined,
                      date: newDate.trim() || undefined,
                      status: 'identified',
                    };
                    upsertBusinessDispute({ ...dispute, negativeItems: [nextItem, ...(dispute.negativeItems ?? [])] });
                    setNewCat('');
                    setNewDesc('');
                    setNewAmount('');
                    setNewDate('');
                    setVersion((v) => v + 1);
                  }}
                >
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Category</div>
                    <input
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                      placeholder="e.g. Incorrect address"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Date (optional)</div>
                    <input value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80" placeholder="YYYY-MM-DD" />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Description</div>
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                      placeholder="What is wrong / what should be corrected?"
                      required
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Amount (optional)</div>
                    <input
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 font-mono"
                      placeholder="0.00"
                    />
                  </label>
                  <div className="flex items-end">
                    <button type="submit" className="fc-button-brand w-full">
                      <Plus size={14} /> Add item
                    </button>
                  </div>
                </form>

                {(dispute.negativeItems ?? []).length === 0 ? (
                  <div className="text-white/60 text-sm">No items yet. Add at least one item before generating a letter.</div>
                ) : (
                  <div className="grid gap-3">
                    {dispute.negativeItems.map((it) => (
                      <div key={it.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-semibold">{it.category}</div>
                            <div className="mt-1 text-white/60 text-sm">{it.description}</div>
                            <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {it.date ? `date:${it.date} • ` : ''}
                              {it.amountCents ? `amount:${moneyLabel(it.amountCents)} • ` : ''}
                              {it.status}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              upsertBusinessDispute({ ...dispute, negativeItems: dispute.negativeItems.filter((x) => x.id !== it.id) });
                              setVersion((v) => v + 1);
                            }}
                            className="px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/90 transition-all"
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-semibold">Evidence</div>
                <button type="button" onClick={() => setPickerOpen(true)} className="fc-button-soft">
                  <Paperclip size={14} /> Attach
                </button>
              </div>
              {attached.length === 0 ? (
                <div className="text-white/60 text-sm">No evidence attached yet. Attach documents that support your dispute.</div>
              ) : (
                <div className="grid gap-2">
                  {attached.slice(0, 10).map((e) => (
                    <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white/80 text-sm truncate">{e.filename}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {String(e.mimeType || '')} • {String(e.id).slice(0, 8)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          upsertBusinessDispute({ ...dispute, evidenceIds: (dispute.evidenceIds ?? []).filter((x) => x !== e.id) });
                          setVersion((v) => v + 1);
                        }}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Remove attachment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
              <div className="text-white font-semibold">Generate dispute letter (PDF)</div>
              <div className="text-white/60 text-sm">
                We’ll create a PDF and save it into your Letters Vault. Then mail it from the vault (address verification + tracking).
              </div>
              <button
                type="button"
                disabled={genBusy || (dispute.negativeItems ?? []).length === 0}
                onClick={async () => {
                  setGenErr(null);
                  setNotice(null);
                  setGenBusy(true);
                  try {
                    const text = buildLetterText({
                      businessName,
                      bureau: dispute.bureau,
                      representativeName: repName,
                      disputeTitle: dispute.title,
                      items: dispute.negativeItems ?? [],
                    });
                    const safe = dispute.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    const filename = `FinelyCred_BusinessDispute_${dispute.bureau}_${safe || dispute.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
                    const pdf = await generateTextPdfToVault({
                      text,
                      filename,
                      meta: { partnerId: partner.id, businessDisputeId: dispute.id, bureauKind: 'business', businessBureau: dispute.bureau },
                    });
                    const createdAt = new Date().toISOString();
                    const letter = upsertLetter({
                      id: newId('letter'),
                      partnerId: partner.id,
                      type: 'dispute',
                      title: `Business dispute • ${bureauLabel(dispute.bureau)} • ${dispute.title}`,
                      createdAt,
                      body: text,
                      status: 'generated',
                      pdfBlobRef: pdf.pdfBlobRef ?? undefined,
                      pdfFilename: pdf.filename,
                      relatedEvidenceIds: dispute.evidenceIds ?? [],
                      meta: {
                        context: 'business_dispute',
                        bureauKind: 'business',
                        businessBureau: dispute.bureau,
                        businessDisputeId: dispute.id,
                      } as any,
                    } as any);
                    upsertBusinessDispute({
                      ...dispute,
                      status: dispute.status === 'draft' ? 'in_progress' : dispute.status,
                      letterIds: Array.from(new Set([...(dispute.letterIds ?? []), letter.id])),
                    });
                    setVersion((v) => v + 1);
                    setNotice('Saved to Letters Vault. Next: open vault and mail the PDF.');
                  } catch (e: any) {
                    setGenErr(e?.message || 'Failed to generate PDF.');
                  } finally {
                    setGenBusy(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileText size={14} /> {genBusy ? 'Generating…' : 'Generate PDF + save'}
              </button>
              <button type="button" onClick={() => navigate('/portal/letters/vault')} className="fc-button-soft w-full">
                Open Letters Vault <ArrowRight size={14} />
              </button>
              <div className="text-white/40 text-xs">
                Tip: keep long explanations out of the letter—stick to facts, items, and requested corrections.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

