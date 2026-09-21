import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPackAsset } from './finelyPackCatalog';
import { getFinelyPackRaw, finelyPackPublicUrl } from './finelyPackContent';
import { startRestoreCopyEn } from '../../copy/startRestoreOffer';

export function MarketingPackViewer() {
  const { assetId } = useParams<{ assetId: string }>();
  const asset = assetId ? getPackAsset(assetId) : undefined;

  const body = useMemo(() => {
    if (!asset) return null;
    if (asset.id === 'start-restore-147') {
      return JSON.stringify(startRestoreCopyEn, null, 2);
    }
    if (!asset.contentPath) return null;
    return getFinelyPackRaw(asset.contentPath);
  }, [asset]);

  if (!asset) {
    return (
      <div className="text-white/70">
        Asset not found.{' '}
        <Link to="/admin/marketing" className="text-[#fbbf24] underline">Back to HQ</Link>
      </div>
    );
  }

  const publicHtml = asset.format === 'html' ? finelyPackPublicUrl(asset.contentPath) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to={`/admin/marketing/${asset.departmentId}/${asset.channelId}`}
        className="inline-flex items-center gap-2 text-sm text-[#fbbf24] hover:underline"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="rounded-2xl border border-[#fbbf24]/25 bg-[#0b1110] p-6">
        <h2 className="text-2xl font-semibold text-white">{asset.title}</h2>
        <p className="text-white/70 text-sm mt-2">{asset.whenToUse}</p>
        <p className="text-[10px] uppercase tracking-widest text-[#fbbf24]/80 mt-4 font-bold">Manual send only — copy from here</p>
      </div>

      {publicHtml ? (
        <iframe
          title={asset.title}
          src={publicHtml}
          className="w-full min-h-[70vh] rounded-2xl border border-white/15 bg-white"
        />
      ) : body ? (
        <pre className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed rounded-2xl border border-white/10 bg-black/40 p-6 font-mono">
          {body}
        </pre>
      ) : (
        <p className="text-white/60">No preview body for this asset.</p>
      )}
    </div>
  );
}
