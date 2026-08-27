import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildPartnerLaneSpecialistCards } from '../../lib/partnerLaneSpecialistSnapshot';
import { staffMemberFullName } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN, finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

const LANE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export function PartnerLaneSpecialistStrip({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const cards = useMemo(() => {
    void version;
    return buildPartnerLaneSpecialistCards(partnerId);
  }, [partnerId, version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  if (!cards.length) return null;

  return (
    <div className={`${finelyOsCatalogCard('violet')} space-y-5`} data-fc-accent="violet">
      <div className="text-sm font-extrabold uppercase tracking-widest text-violet-700">Your specialists by lane</div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const accent = LANE_ACCENTS[idx % LANE_ACCENTS.length];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(c.href)}
              className={`${finelyOsCatalogCard(accent)} text-left min-h-[8.5rem]`}
              data-fc-accent={accent}
            >
              <div className="flex items-center gap-4">
                <StaffPortraitImg staff={c.staff} className="h-12 w-12 rounded-xl shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold">{c.laneLabel}</div>
                  <div className="mt-1 text-xl font-extrabold text-slate-900 truncate">{staffMemberFullName(c.staff)}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} mt-1 text-base font-semibold truncate`}>{c.detail}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/portal/messages?hub=team')}>
        Message your team <ArrowRight size={16} />
      </button>
    </div>
  );
}
