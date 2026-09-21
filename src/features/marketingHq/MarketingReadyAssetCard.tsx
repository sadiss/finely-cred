import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Download, ExternalLink, Eye } from 'lucide-react';
import type { FinelyPackAsset } from './finelyPackCatalog';
import { getFinelyPackRaw } from './finelyPackContent';
import { startRestoreCopyEn } from '../../copy/startRestoreOffer';

function readinessClass(readiness: FinelyPackAsset['readiness']) {
  return readiness === 'ready'
    ? 'bg-[#fbbf24]/20 text-[#fde68a] border-[#fbbf24]/45'
    : 'bg-amber-900/40 text-amber-200 border-amber-500/40';
}

function readinessLabel(readiness: FinelyPackAsset['readiness']) {
  return readiness === 'ready' ? 'Ready' : 'Hold';
}

function resolveCopyText(asset: FinelyPackAsset): string {
  if (asset.id === 'start-restore-147') {
    return [
      startRestoreCopyEn.headline,
      startRestoreCopyEn.subhead,
      startRestoreCopyEn.priceLine,
      '',
      startRestoreCopyEn.includesTitle,
      ...startRestoreCopyEn.includes.map((b) => `• ${b}`),
      '',
      startRestoreCopyEn.ctaPrimary,
      'https://finelycred.com/start',
    ].join('\n');
  }
  if (!asset.contentPath) return '';
  return getFinelyPackRaw(asset.contentPath) ?? '';
}

export function MarketingReadyAssetCard({ asset }: { asset: FinelyPackAsset }) {
  const [copied, setCopied] = useState(false);
  const raw = resolveCopyText(asset);
  const previewHref =
    asset.publicPreviewPath ??
    (asset.format === 'html' ? `/marketing-packs/finely/${asset.contentPath}` : `/admin/marketing/view/${asset.id}`);

  const onCopy = async () => {
    const text = raw || asset.title;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const onDownload = () => {
    const text = raw || asset.title;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const external = previewHref.startsWith('http') || previewHref.startsWith('/start') || previewHref.includes('.html');

  return (
    <article className="rounded-2xl border border-[#fbbf24]/25 bg-[#0b1110] p-5 flex flex-col gap-3 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-lg font-semibold text-white leading-snug">{asset.title}</h4>
          <p className="text-[#fbbf24]/90 text-xs font-bold uppercase tracking-wider mt-1">{asset.subtitle}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${readinessClass(asset.readiness)}`}
        >
          {readinessLabel(asset.readiness)}
        </span>
      </div>
      <p className="text-white/75 text-sm leading-relaxed">{asset.whenToUse}</p>
      <div className="flex flex-wrap gap-2 mt-auto pt-2">
        {external ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fbbf24] text-[#0b1110] text-xs font-black uppercase tracking-wider hover:brightness-110"
          >
            <Eye size={14} /> Preview
          </a>
        ) : (
          <Link
            to={`/admin/marketing/view/${asset.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fbbf24] text-[#0b1110] text-xs font-black uppercase tracking-wider hover:brightness-110"
          >
            <Eye size={14} /> Preview
          </Link>
        )}
        <button
          type="button"
          onClick={onCopy}
          disabled={!raw && asset.format !== 'offer'}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 disabled:opacity-40"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#fbbf24]/40 text-[#fde68a] text-xs font-bold uppercase tracking-wider hover:bg-[#fbbf24]/10"
        >
          <Download size={14} /> Download
        </button>
        {asset.publicPreviewPath && asset.publicPreviewPath.startsWith('/') && asset.format === 'offer' && (
          <a
            href={asset.publicPreviewPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#fbbf24] text-xs font-semibold underline ml-1"
          >
            Live page <ExternalLink size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
