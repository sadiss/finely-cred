import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, ShieldCheck, X, Send, AlertTriangle } from 'lucide-react';
import type { LetterRecord } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import { businessBureauDisputeAddress, consumerBureauDisputeAddress } from '../../letters/bureauAddresses';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import {
  mailLetterViaProvider,
  verifyMailAddressesViaProvider,
  type MailAddress,
  type MailAddressVerificationResult,
} from '../../lib/mailerClient';
import { buildLetterAgentChain } from '../../lib/letterAgentChain';
import { LetterAgentChainStrip } from './LetterAgentChainStrip';
import { appendAiActionAudit } from '../../data/aiActionAuditLog';

function sanitizeState(s: string) {
  return (s || '').trim().toUpperCase().slice(0, 2);
}

function zipOnly(s: string) {
  return (s || '').replace(/\D/g, '').slice(0, 10);
}

function parseCityStateZip(s: string): { city: string; state: string; zip: string } | null {
  const raw = (s || '').trim();
  if (!raw) return null;
  const m = raw.match(/^(.+?),\s*([A-Za-z]{2})\s+(.+)$/);
  if (!m) return null;
  return { city: m[1]!.trim(), state: sanitizeState(m[2]!), zip: String(m[3] || '').trim() };
}

function mailDefaultsForDisputeRecipient(letter: LetterRecord): Partial<MailAddress> | null {
  const meta: any = (letter as any)?.meta ?? null;
  const isObj = meta && typeof meta === 'object';

  // Business-bureau disputes (manual-first workflow).
  if (isObj && (meta.context === 'business_dispute' || meta.bureauKind === 'business') && meta.businessBureau) {
    const addr = businessBureauDisputeAddress(meta.businessBureau);
    const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
    if (!lines.length) return null;
    const name = String(addr.name || '').trim() || 'Business bureau';
    const cityStateZip = lines[lines.length - 1] || '';
    const parsed = parseCityStateZip(cityStateZip);
    if (!parsed) return null;

    const midLines = lines.slice(0, -1);
    // Prefer last "street/po box" line as addressLine1; everything before becomes addressLine2 (attn, dept).
    const addressLine1 = midLines[midLines.length - 1] ?? '';
    const addressLine2 = midLines.length > 1 ? midLines.slice(0, -1).join(', ') : undefined;
    return { name, addressLine1, addressLine2, city: parsed.city, state: parsed.state, zip: parsed.zip };
  }

  // Consumer bureau disputes (existing).
  const bureau = isObj && 'bureau' in meta ? (meta.bureau as any) : null;
  if (!bureau) return null;
  const addr = consumerBureauDisputeAddress(bureau);
  const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!lines.length) return null;

  // Typical: [BureauName, POBoxOrStreet, CityStateZip]
  const first = lines[0] || '';
  const addressLine1 = (first.toLowerCase() === String(addr.name || '').toLowerCase() ? lines[1] : first) || '';
  const cityStateZip = lines[lines.length - 1] || '';
  const parsed = parseCityStateZip(cityStateZip);
  if (!parsed) return null;
  return {
    name: addr.name,
    addressLine1,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
  };
}

function deliverabilityLabel(v: any): string {
  const s = String(v || '').trim();
  return s ? s.replaceAll('_', ' ') : 'unknown';
}

export function MailLetterModal({
  open,
  partnerId,
  letter,
  defaultFromName,
  defaultFromAddress,
  onClose,
  onMailed,
  onStatus,
  evidence = [],
}: {
  open: boolean;
  partnerId: string;
  letter: LetterRecord;
  defaultFromName?: string;
  defaultFromAddress?: Partial<MailAddress>;
  evidence?: EvidenceItem[];
  onClose: () => void;
  onMailed: (args: {
    providerId: string;
    expectedDeliveryDate?: string;
    status?: string;
    to: MailAddress;
    from: MailAddress;
  }) => void;
  onStatus?: (args: { status: 'mail_pending' | 'mail_failed'; error?: string; to: MailAddress; from: MailAddress }) => void;
}) {
  const canMail = Boolean(letter.pdfBlobRef);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [to, setTo] = useState<MailAddress>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [from, setFrom] = useState<MailAddress>({
    name: defaultFromName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  const [pdfPreview, setPdfPreview] = useState<{ url: string; revoke?: () => void } | null>(null);

  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [verifyRes, setVerifyRes] = useState<{ to: MailAddressVerificationResult; from: MailAddressVerificationResult } | null>(
    null,
  );
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);

  const currentHash = useMemo(() => {
    const pick = (a: MailAddress) => ({
      name: a.name,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 || '',
      city: a.city,
      state: sanitizeState(a.state),
      zip: zipOnly(a.zip),
    });
    return JSON.stringify({ to: pick(to), from: pick(from) });
  }, [to, from]);

  useEffect(() => {
    if (!open) return;
    // Autofill defaults without overwriting user edits.
    const disputeTo = mailDefaultsForDisputeRecipient(letter);
    if (disputeTo) {
      setTo((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : (disputeTo.name ?? ''),
        addressLine1: prev.addressLine1.trim() ? prev.addressLine1 : (disputeTo.addressLine1 ?? ''),
        addressLine2: prev.addressLine2?.trim() ? prev.addressLine2 : (disputeTo.addressLine2 ?? ''),
        city: prev.city.trim() ? prev.city : (disputeTo.city ?? ''),
        state: prev.state.trim() ? prev.state : (disputeTo.state ?? ''),
        zip: prev.zip.trim() ? prev.zip : (disputeTo.zip ?? ''),
      }));
    }
    if (defaultFromName || defaultFromAddress) {
      setFrom((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : (defaultFromName ?? ''),
        addressLine1: prev.addressLine1.trim() ? prev.addressLine1 : (defaultFromAddress?.addressLine1 ?? ''),
        addressLine2: prev.addressLine2?.trim() ? prev.addressLine2 : (defaultFromAddress?.addressLine2 ?? ''),
        city: prev.city.trim() ? prev.city : (defaultFromAddress?.city ?? ''),
        state: prev.state.trim() ? prev.state : (defaultFromAddress?.state ?? ''),
        zip: prev.zip.trim() ? prev.zip : (defaultFromAddress?.zip ?? ''),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Reset verification if addresses change after verification.
    if (verifiedHash && verifiedHash !== currentHash) {
      setVerifyRes(null);
      setVerifiedHash(null);
      setVerifyErr(null);
    }
  }, [open, currentHash, verifiedHash]);

  useEffect(() => {
    if (!open) return;
    if (!letter.pdfBlobRef) {
      setPdfPreview(null);
      return;
    }
    let mounted = true;
    let revoke: (() => void) | undefined;
    void (async () => {
      try {
        const res = await getBlobUrl(letter.pdfBlobRef!, { mimeType: 'application/pdf', preferSigned: true });
        if (!mounted || !res?.url) return;
        revoke = res.revoke;
        setPdfPreview({ url: res.url, revoke: res.revoke });
      } catch {
        // ignore (preview is best-effort)
        if (!mounted) return;
        setPdfPreview(null);
      }
    })();
    return () => {
      mounted = false;
      try {
        revoke?.();
      } catch {
        // ignore
      }
    };
  }, [open, letter.pdfBlobRef]);

  const invalid = useMemo(() => {
    const need = (a: MailAddress) =>
      !a.name.trim() || !a.addressLine1.trim() || !a.city.trim() || !sanitizeState(a.state) || zipOnly(a.zip).length < 5;
    return need(to) || need(from) || !canMail;
  }, [to, from, canMail]);

  const deliverability = useMemo(() => {
    const toRaw = verifyRes?.to?.raw ?? null;
    const fromRaw = verifyRes?.from?.raw ?? null;
    // Lob typically returns deliverability at the top-level.
    const toDel = toRaw ? (toRaw.deliverability ?? toRaw.deliverability_analysis?.deliverability ?? null) : null;
    const fromDel = fromRaw ? (fromRaw.deliverability ?? fromRaw.deliverability_analysis?.deliverability ?? null) : null;
    return { toDel, fromDel };
  }, [verifyRes]);

  const verifiedOk = useMemo(() => {
    if (!verifyRes) return false;
    const bad = new Set(['undeliverable', 'no_match']);
    const toDel = String(deliverability.toDel || '').toLowerCase();
    const fromDel = String(deliverability.fromDel || '').toLowerCase();
    if (!toDel || !fromDel) return false;
    return !bad.has(toDel) && !bad.has(fromDel);
  }, [verifyRes, deliverability.toDel, deliverability.fromDel]);

  const agentChain = useMemo(
    () => buildLetterAgentChain({ letter, evidence }),
    [letter, evidence],
  );

  if (!open) return null;

  const verify = async () => {
    if (invalid || verifyBusy) return;
    setVerifyErr(null);
    setVerifyBusy(true);
    try {
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      const res = await verifyMailAddressesViaProvider({ to: toClean, from: fromClean });
      setVerifyRes({ to: res.to, from: res.from });
      setVerifiedHash(currentHash);
    } catch (e: any) {
      setVerifyRes(null);
      setVerifiedHash(null);
      setVerifyErr(e?.message || 'Verification failed.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const submit = async () => {
    if (!letter.pdfBlobRef) return;
    if (invalid || busy) return;
    if (!agentChain.readyToMail) {
      setErr(agentChain.blockingMessage ?? 'Complete the agent review steps before mailing.');
      appendAiActionAudit({
        kind: 'letter_chain',
        action: 'Mail blocked — compliance gate',
        detail: agentChain.blockingMessage,
        partnerId,
        status: 'blocked',
        meta: { letterId: letter.id },
      });
      return;
    }
    if (!verifiedOk) {
      setErr('Please verify both addresses before mailing.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      onStatus?.({ status: 'mail_pending', to: toClean, from: fromClean });
      const res = await mailLetterViaProvider({
        partnerId,
        letterId: letter.id,
        pdfBlobRef: letter.pdfBlobRef,
        to: toClean,
        from: fromClean,
        options: { color: true, doubleSided: true },
      });
      onMailed({
        providerId: res.providerId,
        expectedDeliveryDate: res.expectedDeliveryDate,
        status: res.status,
        to: toClean,
        from: fromClean,
      });
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Mailing failed.';
      setErr(msg);
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      onStatus?.({ status: 'mail_failed', error: msg, to: toClean, from: fromClean });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => (busy ? null : onClose())} />
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Mail letter</div>
            <div className="mt-2 text-2xl font-light text-white truncate">{letter.title}</div>
            <div className="mt-1 text-white/60 text-sm">Send this PDF via US mail directly from Finely Cred (powered by provider API).</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-60"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {letter.type === 'dispute' ? <LetterAgentChainStrip steps={agentChain.steps} /> : null}
          {!canMail ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100 text-sm">
              This letter has no stored PDF. Generate and save it to the vault before mailing.
            </div>
          ) : null}
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100 text-sm">{err}</div> : null}

          {/* Preview */}
          <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-white font-semibold">Letter preview</div>
                <div className="mt-1 text-white/60 text-sm">Confirm the exact PDF artifact that will be mailed.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!pdfPreview?.url) return;
                    openUrlInNewTab({ url: pdfPreview.url });
                  }}
                  disabled={!pdfPreview?.url}
                  className="inline-flex items-center gap-2 px-4 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/80 disabled:opacity-60"
                >
                  <ExternalLink size={14} /> Open PDF
                </button>
              </div>
            </div>
            {pdfPreview?.url ? (
              <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
                <iframe
                  title="Letter PDF preview"
                  src={pdfPreview.url}
                  className="w-full h-[320px] md:h-[420px]"
                />
              </div>
            ) : (
              <div className="text-white/55 text-sm">Preview unavailable (PDF may not be stored yet).</div>
            )}
          </div>

          {/* Addresses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
              <div className="text-white font-semibold">Recipient address</div>
              {(['name', 'addressLine1', 'addressLine2', 'city', 'state', 'zip'] as const).map((k) => (
                <label key={k} className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
                  <input
                    value={(to as any)[k] ?? ''}
                    onChange={(e) =>
                      setTo((prev) => ({
                        ...prev,
                        [k]: k === 'state' ? sanitizeState(e.target.value) : k === 'zip' ? zipOnly(e.target.value) : e.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder={k === 'state' ? 'CA' : k === 'zip' ? '90210' : ''}
                  />
                </label>
              ))}
            </div>

            <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
              <div className="text-white font-semibold">Return address</div>
              {(['name', 'addressLine1', 'addressLine2', 'city', 'state', 'zip'] as const).map((k) => (
                <label key={k} className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
                  <input
                    value={(from as any)[k] ?? ''}
                    onChange={(e) =>
                      setFrom((prev) => ({
                        ...prev,
                        [k]: k === 'state' ? sanitizeState(e.target.value) : k === 'zip' ? zipOnly(e.target.value) : e.target.value,
                      }))
                    }
                    className="mt-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder={k === 'state' ? 'CA' : k === 'zip' ? '90210' : ''}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Verification */}
          <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-white font-semibold">Address verification (recommended)</div>
                <div className="mt-1 text-white/60 text-sm">We’ll verify deliverability before sending.</div>
              </div>
              <button
                type="button"
                onClick={() => void verify()}
                disabled={verifyBusy || invalid}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
              >
                <ShieldCheck size={14} /> {verifyBusy ? 'Verifying…' : 'Verify addresses'}
              </button>
            </div>

            {verifyErr ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 text-sm">
                {verifyErr}
              </div>
            ) : null}

            {verifyRes ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="fc-light-glass-panel fc-light-chrome-panel p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">To deliverability</div>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <div className="text-white/85 font-semibold">{deliverabilityLabel(deliverability.toDel)}</div>
                  </div>
                </div>
                <div className="fc-light-glass-panel fc-light-chrome-panel p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">From deliverability</div>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <div className="text-white/85 font-semibold">{deliverabilityLabel(deliverability.fromDel)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 text-white/70 text-sm">
                <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
                <div>Not verified yet. Verify addresses to unlock mailing.</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || invalid || !verifiedOk}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {busy ? 'Sending…' : 'Mail letter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

