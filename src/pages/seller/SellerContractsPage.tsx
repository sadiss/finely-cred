import React, { useMemo, useState } from 'react';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { upsertAuSeller } from '../../data/auSellerRepo';
import { nowIso } from '../../domain/auSeller';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

export default function SellerContractsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);

  const accept = () => {
    if (!seller) return;
    if (!accepted) return;
    const sig = (name || seller.fullName || '').trim();
    if (!sig) return;
    upsertAuSeller({
      ...seller,
      contract: {
        acceptedAt: nowIso(),
        acceptedName: sig,
        version: 'v1',
      },
      status: seller.status === 'pending' ? 'active' : seller.status,
    });
    window.dispatchEvent(new Event('finely:store'));
    navigate('/seller/dashboard');
  };

  return (
    <PageShell badge="AU Seller" title="Seller Contracts" subtitle="Review and accept the seller agreement to submit inventory for approval.">
      <div className={FINELY_OS_PAGE}>
        <SellerNav />

        {!seller ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>No seller profile found.</div>
        ) : (
          <div className="space-y-6">
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="inline-flex items-center gap-2 text-fuchsia-400">
                <FileText size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Seller agreement (summary)</span>
              </div>
              <ul className={`list-disc pl-5 ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                <li>Listings must be accurate and supported with proof artifacts.</li>
                <li>Posting windows and refund policy depend on verification and compliance.</li>
                <li>No misleading claims; documentation is required for age/limit and ownership.</li>
              </ul>
              <div className={FINELY_OS_NOTICE_SUCCESS}>
                Signature acceptance is recorded here. A downloadable PDF + full e‑sign workflow can be enabled as part of the seller compliance rollout.
              </div>
            </div>

            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>I accept the seller agreement</div>
                  <div className={FINELY_OS_ENTITY_BODY}>You can’t submit listings for approval without acceptance.</div>
                </div>
              </label>
              <div className="max-w-xl">
                <label className={formLabel}>Signature name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={seller.fullName || 'Full name'} className={formInput} />
              </div>
              <button
                type="button"
                onClick={accept}
                disabled={!accepted || !(name || seller.fullName)}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
              >
                <ShieldCheck size={14} /> Accept & continue <ArrowRight size={14} />
              </button>
            </div>

            {seller.contract.acceptedAt ? (
              <div className={FINELY_OS_ENTITY_BODY}>
                Accepted {new Date(seller.contract.acceptedAt).toLocaleString()} as{' '}
                <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{seller.contract.acceptedName}</span>.
              </div>
            ) : null}
          </div>
        )}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
