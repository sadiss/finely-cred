import React, { useMemo } from 'react';
import { MessageSquare, Radio, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinelyCommunicationHub } from '../../../../components/chat/FinelyCommunicationHub';
import { listStaffOnDutyNow, loadStaffRoster } from '../../../../data/staffRoster';
import { getAgentPersona } from '../../../../domain/agentPersonas';
import { staffMemberFullName } from '../../../../domain/staffMember';
import { StaffPortraitImg } from '../../../../components/staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';

const RAIL_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminMessagesProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? MessageSquare;

  const onDuty = useMemo(() => listStaffOnDutyNow().slice(0, 8), []);
  const roster = useMemo(() => loadStaffRoster().filter((s) => s.active), []);
  const rosterSize = roster.length;
  const onDutyIds = useMemo(() => new Set(onDuty.map((m) => m.id)), [onDuty]);

  const metrics: ProductMetric[] = [
    {
      label: 'On duty',
      value: onDuty.length,
      hint: 'Staff available now',
      accent: 'emerald',
      icon: Users,
    },
    {
      label: 'Roster',
      value: rosterSize,
      hint: 'Active specialists',
      accent: 'sky',
      icon: Radio,
    },
    {
      label: 'Mode',
      value: 'Staff desk',
      hint: 'Not partner inbox',
      accent: 'violet',
      icon: Sparkles,
    },
    {
      label: 'Partner threads',
      value: 'Support',
      hint: 'Open partner conversations',
      accent: 'rose',
      icon: MessageSquare,
      onClick: () => navigate('/admin/support'),
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Staff comms"
      title="Staff messages"
      description="See who is on duty, then use the live hub. Partner conversations stay in Support."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="On duty now"
      metricDescription="Ask Finely can reach anyone on the roster. Open Support for partner conversations."
      primaryAction={
        <ProductPagePrimaryAction label="Partner conversations" onClick={() => navigate('/admin/support')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/comms')}>
          Communications hub
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        <section className="space-y-3">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Staff on duty</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
            {onDuty.length} on duty · {rosterSize} on roster
          </h2>
          <p className={`max-w-3xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {onDuty.length > 0
              ? `${onDuty.length} specialist${onDuty.length === 1 ? '' : 's'} available for internal staff chat.`
              : 'No one is on shift right now — the full roster is still reachable from the live hub.'}
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roster.slice(0, 8).map((member, idx) => {
            const persona = getAgentPersona(member.primaryRoleId);
            const roleTitle = persona?.displayTitle ?? 'Specialist';
            const isOnDuty = onDutyIds.has(member.id);
            const family = RAIL_ACCENTS[idx % RAIL_ACCENTS.length];
            return (
              <article
                key={member.id}
                className={`${finelyOsCatalogCard(family)} p-5 lg:p-6`}
                data-fc-accent={family}
              >
                <div className="flex items-center gap-3">
                  <StaffPortraitImg staff={member} className="h-12 w-12 rounded-full object-cover shrink-0" alt="" />
                  <div className="min-w-0">
                    <div className={`text-base font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                      {staffMemberFullName(member)}
                    </div>
                    <div className={`text-sm font-bold truncate ${FINELY_OS_ENTITY_BODY}`}>{roleTitle}</div>
                    <div className={`mt-1 text-[11px] font-black uppercase tracking-widest ${isOnDuty ? 'text-emerald-700' : FINELY_OS_ENTITY_SUBLABEL}`}>
                      {isOnDuty ? 'On duty' : 'Off shift'}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="min-h-[520px]">
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Staff communication center</h2>
          <p className={`mt-2 mb-4 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            The same Communication Hub partners use, with the full staff roster.
          </p>
          <FinelyCommunicationHub mode="page" initialTab="ai" showAllAgents adminMode />
        </section>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
