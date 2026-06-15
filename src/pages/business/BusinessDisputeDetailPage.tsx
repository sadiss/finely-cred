import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, FileText, Paperclip } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EvidencePickerModal } from '../../components/evidence/EvidencePickerModal';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { newId } from '../../utils/ids';
import { upsertLetter } from '../../data/lettersRepo';
import { getBusinessDispute, upsertBusinessDispute } from '../../data/businessCreditRepo';
import type { BusinessBureau, BusinessNegativeItem } from '../../domain/businessCredit';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,

  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

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
  const { partner } = usePartnerSession();
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
  const [detailTab, setDetailTab] = useState<'workspace' | 'items' | 'evidence'>('workspace');

  if (!partner) {
    return (
      <PageShell badge="Business Portal" title="Business dispute" subtitle="">
        <div className={FINELY_OS_NOTICE}>Sign in to view disputes.</div>
      </PageShell>
    );
  }

  if (!disputeId || !dispute) {
    return (
      <PageShell badge="Business Portal" title="Dispute not found" subtitle="">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_NOTICE}>This dispute does not exist or you don't have access to it.</div>
          <button type="button" onClick={() => navigate('/business/disputes')} className={FINELY_OS_PRIMARY_BTN}>
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

      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Business disputes"
          title={dispute.title}
          subtitle={`${bureauLabel(dispute.bureau)} • ${dispute.status}`}
          accent="amber"
          tabs={[
            { id: 'workspace', label: 'Workspace' },
            { id: 'items', label: 'Items', badge: String((dispute.negativeItems ?? []).length) || undefined },
            { id: 'evidence', label: 'Evidence', badge: String(attached.length) || undefined },
          ]}
          activeTab={detailTab}
          onTabChange={(id) => setDetailTab(id as typeof detailTab)}
          primaryAction={{ label: 'All disputes', onClick: () => navigate('/business/disputes') }}
          secondaryAction={{ label: 'Documents', onClick: () => navigate('/business/documents') }}
        >
        {genErr ? <div className={FINELY_OS_NOTICE_ERROR}>{genErr}</div> : null}
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        {detailTab === 'workspace' && (
        <div className="space-y-6">
            <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
              <div className={FINELY_OS_ENTITY_TITLE}>Dispute workspace</div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Title</div>
                  <input
                    value={dispute.title}
                    onChange={(e) => {
                      upsertBusinessDispute({ ...dispute, title: e.target.value });
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Status</div>
                  <select
                    value={dispute.status}
                    onChange={(e) => {
                      upsertBusinessDispute({ ...dispute, status: e.target.value as any });
                      setVersion((v) => v + 1);
                    }}
                    className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In progress</option>
                    <option value="mailed">Mailed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
              </div>
            </div>

            <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
              <div className={FINELY_OS_ENTITY_TITLE}>Generate dispute letter (PDF)</div>
              <div className={FINELY_OS_ENTITY_BODY}>We'll create a PDF and save it into your Letters Vault. Then mail it from the vault (address verification + tracking).</div>
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
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <FileText size={14} /> {genBusy ? 'Generating…' : 'Generate PDF + save'}
              </button>
              <button type="button" onClick={() => navigate('/portal/letters/vault')} className={`${FINELY_OS_SECONDARY_BTN} w-full`}>
                Open Letters Vault <ArrowRight size={14} />
              </button>
              <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Tip: keep long explanations out of the letter—stick to facts, items, and requested corrections.</div>
            </div>
        </div>
        )}

        {detailTab === 'items' && (
            <div className={`${finelyOsCatalogCard('sky')} !p-6 space-y-4`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_VALUE}>Negative items</div>
              <form
                className={`${finelyOsInlineListItem()} grid md:grid-cols-2 gap-3`}
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
                  <div className={FINELY_OS_ENTITY_LABEL}>Category</div>
                  <input value={newCat} onChange={(e) => setNewCat(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="e.g. Incorrect address" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Date (optional)</div>
                  <input value={newDate} onChange={(e) => setNewDate(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="YYYY-MM-DD" />
                </label>
                <label className="block md:col-span-2">
                  <div className={FINELY_OS_ENTITY_LABEL}>Description</div>
                  <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="What is wrong / what should be corrected?" required />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Amount (optional)</div>
                  <input value={newAmount} onChange={(e) => setNewAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 10))} className={`${FINELY_OS_ENTITY_INPUT} font-mono`} placeholder="0.00" />
                </label>
                <div className="flex items-end">
                  <button type="submit" className={`${FINELY_OS_PRIMARY_BTN} w-full`}>
                    <Plus size={14} /> Add item
                  </button>
                </div>
              </form>

              {(dispute.negativeItems ?? []).length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No items yet. Add at least one item before generating a letter.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={[...(dispute.negativeItems ?? [])]}
                  pageSize={6}
                  itemSpacingClassName="grid gap-3"
                  renderItem={(it) => (
                    <div key={it.id} className={finelyOsInlineListItem()}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className={FINELY_OS_ENTITY_VALUE}>{it.category}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{it.description}</div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
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
                          className={FINELY_OS_DANGER_BTN}
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
        )}

        {detailTab === 'evidence' && (
            <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
              <div className="flex items-center justify-between gap-3">
                <div className={FINELY_OS_ENTITY_TITLE}>Evidence</div>
                <button type="button" onClick={() => setPickerOpen(true)} className={FINELY_OS_SECONDARY_BTN}>
                  <Paperclip size={14} /> Attach
                </button>
              </div>
              {attached.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No evidence attached yet. Attach documents that support your dispute.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={attached}
                  pageSize={6}
                  itemSpacingClassName="grid gap-2"
                  renderItem={(e) => (
                    <div key={e.id} className={`${finelyOsInlineListItem()} flex items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <div className={`text-sm truncate ${FINELY_OS_ENTITY_VALUE}`}>{e.filename}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                          {String(e.mimeType || '')} • {String(e.id).slice(0, 8)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          upsertBusinessDispute({ ...dispute, evidenceIds: (dispute.evidenceIds ?? []).filter((x) => x !== e.id) });
                          setVersion((v) => v + 1);
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                        title="Remove attachment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                />
              )}
            </div>
        )}

        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
