import React from 'react';
import type { ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { EvidenceItem } from '../domain/evidence';
import { getBlobStore } from '../storage/getBlobStore';
import { newId } from '../utils/ids';
import { captureReactElementPng } from '../utils/captureReactPng';
import { TradelineEvidenceSheet } from '../components/evidence/EvidenceSheet';

function norm(s: string) {
  return (s || '').toLowerCase().trim();
}

/**
 * Best-effort tradeline lookup by creditor/account name — same normalization used
 * across the dispute letter builder (exact match, then substring match either way).
 */
export function findMatchingTradeline(
  parsed: ParsedCreditReport | null | undefined,
  accountName: string,
): ParsedTradeline | null {
  if (!parsed?.tradelines?.length) return null;
  const needle = norm(accountName);
  if (!needle) return null;
  return (
    parsed.tradelines.find((t) => norm(t.creditorName) === needle) ??
    parsed.tradelines.find((t) => needle.includes(norm(t.creditorName)) || norm(t.creditorName).includes(needle)) ??
    null
  );
}

/**
 * Capture a print-styled tradeline evidence sheet (white background, no UI chrome) as a PNG,
 * store it in the blob store, and build the EvidenceItem record. Does NOT persist to the
 * evidence repo — callers decide when/how to upsert (mirrors EvidenceUploader's onCreated pattern).
 *
 * Shared by ParsedReportViewer's "Capture" button and the in-popup capture flow in
 * EvidencePickerModal so both use the exact same capture pipeline.
 */
export async function captureTradelineEvidenceScreenshot(args: {
  tradeline: ParsedTradeline;
  partnerId: string;
  reportId?: string;
  creditorName?: string;
}): Promise<EvidenceItem> {
  const { tradeline, partnerId, reportId } = args;
  const creditorName = (args.creditorName || tradeline.creditorName || '').trim() || 'Account';

  const dataUrl = await captureReactElementPng(
    React.createElement(TradelineEvidenceSheet, { tradeline, showHeader: false }),
    { pixelRatio: 2, widthPx: 1100 },
  );
  const blob = await (await fetch(dataUrl)).blob();
  const store = getBlobStore();
  const put = await store.put(blob, {
    kind: 'evidence_screenshot',
    partnerId,
    reportId,
    creditorName,
  });

  const safeName = creditorName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  const filename = `Screenshot_${safeName || 'Tradeline'}_${new Date().toISOString().slice(0, 10)}.png`;

  const item: EvidenceItem = {
    id: newId('evidence'),
    partnerId,
    reportId,
    type: 'screenshot',
    source: 'tradeline_screenshot',
    creditorName,
    caption: `Tradeline screenshot: ${creditorName}`,
    filename,
    mimeType: 'image/png',
    sizeBytes: blob.size,
    blobRef: put.ref,
    createdAt: new Date().toISOString(),
  };
  return item;
}
