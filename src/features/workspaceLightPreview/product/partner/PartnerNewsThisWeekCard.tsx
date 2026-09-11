import React, { useEffect, useState } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { featuredPartnerNews, loadPartnerNewsToday, type PartnerNewsStory } from '../../../../lib/partnerNewsToday';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from '../../../os/finelyOsLightUi';
import './partnerNewsProductSurface.css';

export function PartnerNewsThisWeekCard({ onOpen }: { onOpen: () => void }) {
  const [story, setStory] = useState<PartnerNewsStory | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPartnerNewsToday().then((pack) => {
      if (cancelled) return;
      setStory(featuredPartnerNews(pack.stories));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button type="button" className="fc-news-thisweek" onClick={onOpen}>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>
        <Newspaper size={16} className="inline mr-2" /> This week
      </p>
      <strong className={`mt-2 block text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
        {story?.headline ?? 'Credit news'}
      </strong>
      <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
        {story?.meaning ?? 'See what moved this week and the action that helps your file.'}
      </p>
      <span className={`mt-4 inline-flex items-center gap-2 font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
        Open Credit news <ArrowRight size={16} />
      </span>
    </button>
  );
}
