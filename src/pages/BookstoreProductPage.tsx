import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Library } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { getBookstoreProductBySlug } from '../data/bookstoreRepo';
import { formatPrice } from '../config/pricingCatalog';
import { previewChaptersForProduct } from '../lib/bookstoreCommerce';
import { downloadBookstorePdf } from '../resources/buildBookstorePdf';
import { BookstoreBundlesPanel } from '../components/bookstore/BookstoreBundlesPanel';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { useAuth } from '../auth/AuthProvider';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { CommsWorkspaceActions } from '../components/comms/CommsWorkspaceActions';
import { BookMarkdownRenderer } from '../components/bookstore/BookMarkdownRenderer';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,

  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

export default function BookstoreProductPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { id } = useParams();
  const product = useMemo(() => getBookstoreProductBySlug(id || ''), [id]);
  const previewChapters = useMemo(() => (product ? previewChaptersForProduct(product, 2) : []), [product]);
  const chapterCount = useMemo(
    () => (product ? splitBookIntoChapters(product.contentMarkdown ?? '', product.slug).length : 0),
    [product],
  );

  usePublicSeoMeta({
    title: product ? `${product.title} — Finely Cred bookstore` : 'Bookstore product — Finely Cred',
    description: product?.sub ?? 'Premium credit restoration and business credit playbooks from Finely Cred.',
    path: `/bookstore/${id ?? ''}`,
  });

  return (
    <PageShell
      badge="Store"
      title={product ? product.title : 'Product Detail'}
      subtitle={product ? product.sub : 'Premium playbook detail page.'}
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Finely bookstore"
          title={product?.title ?? 'Product detail'}
          subtitle={product?.sub ?? 'Premium playbook detail page.'}
          accent="fuchsia"
          kpis={product ? [
            { label: 'Price', value: formatPrice(product.priceAmount), accent: 'amber' },
            { label: 'Chapters', value: String(chapterCount), accent: 'emerald' },
          ] : undefined}
          tabs={[{ id: 'detail', label: 'Detail' }]}
          activeTab="detail"
          primaryAction={{ label: 'Back to bookstore', onClick: () => navigate('/bookstore') }}
          secondaryAction={{ label: 'Resources hub', onClick: () => navigate('/resources') }}
        >
        {auth.user ? <CommsWorkspaceActions variant="inline" calendarLabel="Book session" hubLabel="Ask in Hub" /> : null}

        <div className={`space-y-4 ${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
          <div className="inline-flex items-center gap-2 text-fuchsia-700">
            <BookOpen size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{product ? 'Book' : 'Product'}</span>
          </div>

          {!product ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>Product not found. Return to the bookstore to browse available titles.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold text-2xl`}>{product.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>{product.desc}</div>
                </div>
                <div className="text-right">
                  <div className={FINELY_OS_ENTITY_LABEL}>Price</div>
                  <div className="mt-1 text-amber-700 font-black text-2xl">{formatPrice(product.priceAmount)}</div>
                </div>
              </div>

              {product.bullets?.length ? (
                <ul className={`list-disc pl-5 ${FINELY_OS_ENTITY_BODY} text-sm space-y-1`}>
                  {product.bullets.slice(0, 10).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}

              {previewChapters.length > 0 ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                  <div className={FINELY_OS_ENTITY_LABEL}>Chapter preview (free)</div>
                  <div className="mt-3">
                    <FinelyOsPaginatedStack
                      items={previewChapters}
                      pageSize={2}
                      itemSpacingClassName="space-y-4"
                      renderItem={(ch) => (
                        <div key={ch.id}>
                          <div className={`${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>{ch.title}</div>
                          <div className="mt-3 max-h-64 overflow-hidden relative">
                            <BookMarkdownRenderer markdown={ch.body} accent="sky" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-900/95" />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              ) : product.contentMarkdown ? (
                <details className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony`} data-fc-accent="emerald">
                  <summary className="cursor-pointer select-none">
                    <div className={FINELY_OS_ENTITY_LABEL}>Full preview ({chapterCount} chapters)</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>Expand to browse the complete table of contents and sample chapters.</div>
                  </summary>
                  <div className="mt-4">
                    <BookMarkdownRenderer markdown={product.contentMarkdown.trim()} accent="emerald" />
                  </div>
                </details>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(auth.user ? `/portal/library/purchase/${product.slug}` : `/onboarding?next=/portal/library/purchase/${product.slug}`)}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  <Library size={14} /> Buy & unlock in My Library
                </button>
                <button
                  type="button"
                  onClick={() => downloadBookstorePdf({ product, previewOnly: true })}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Download sample PDF
                </button>
                <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SECONDARY_BTN}>
                  Start onboarding <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
                  Back to resources <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>

        <BookstoreBundlesPanel />
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="education_coach"
          goal="personal"
          roleLabel="education coach"
          subline="Questions about this title, listen mode, or library unlock before you buy?"
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
