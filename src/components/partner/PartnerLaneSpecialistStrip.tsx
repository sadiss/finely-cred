import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildPartnerLaneSpecialistCards } from '../../lib/partnerLaneSpecialistSnapshot';
import { staffMemberFullName } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

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
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.04] via-transparent to-emerald-500/[0.04] p-4 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your specialists by lane</div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(c.href)}
            className="text-left rounded-xl border border-black/10 bg-transparent p-3 hover:border-violet-500/30 hover:bg-violet-500/[0.04] transition"
          >
            <div className="flex items-center gap-3">
              <StaffPortraitImg staff={c.staff} className="h-10 w-10 rounded-xl border border-black/10 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">{c.laneLabel}</div>
                <div className="text-sm font-bold text-slate-900 truncate">{staffMemberFullName(c.staff)}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-[11px] truncate`}>{c.detail}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/portal/messages?hub=team')}>
        Message your team <ArrowRight size={12} />
      </button>
    </div>
  );
}
