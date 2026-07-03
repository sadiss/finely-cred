import React, { useMemo, useState } from 'react';
import { ShieldCheck, UserCircle2, Bot } from 'lucide-react';
import { listScheduledPosts, updateSocialPostStatus } from '../../data/socialHubRepo';
import { STAFF_SOCIAL_PRESENCE } from '../staffCommandCenter/staffSocialPresence';
import { findStaff, staffFullName } from '../staffCommandCenter/staffRoster';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { evaluateDisclosureReview, listPostsNeedingDisclosureReview } from '../../lib/socialDisclosureLayer';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

export function SocialDisclosureReviewPanel() {
  const [version, setVersion] = useState(0);
  const posts = useMemo(() => {
    void version;
    return listPostsNeedingDisclosureReview(listScheduledPosts());
  }, [version]);

  const approve = (id: string) => {
    updateSocialPostStatus(id, 'queued', { complianceStatus: 'approved' });
    setVersion((v) => v + 1);
  };

  const block = (id: string) => {
    updateSocialPostStatus(id, 'needs_review', { complianceStatus: 'blocked' });
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-100 font-bold">
          <ShieldCheck size={18} /> Disclosure & compliance review queue
        </div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          AI agent personas require educational disclosure. Human executives require explicit human-executive labeling before live publish.
        </p>
      </div>
      {posts.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No posts awaiting disclosure review.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const review = evaluateDisclosureReview(p);
            const presence = p.assignedStaffId
              ? STAFF_SOCIAL_PRESENCE.find((s) => s.staffId === p.assignedStaffId)
              : undefined;
            const staff = p.assignedStaffId ? findStaff(p.assignedStaffId) : null;
            return (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                <div className="flex flex-wrap items-start gap-3">
                  {staff ? (
                    <div className="h-10 w-10 rounded-xl overflow-hidden ring-1 ring-white/15">
                      <StaffPortraitImg
                        staff={{
                          id: staff.id,
                          firstName: staff.firstName,
                          lastName: staff.lastName,
                          portraitGender: staff.portrait?.portraitGender ?? 'neutral',
                          avatarPath: `staff-portrait://${staff.id}`,
                        }}
                        className="h-full w-full"
                        alt={staffFullName(staff)}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {presence?.displayName ?? staffFullName(staff!) ?? 'Unassigned'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider rounded-full border border-white/15 px-2 py-0.5 text-white/55">
                        {review.posterType === 'human_executive' ? <UserCircle2 size={10} /> : <Bot size={10} />}
                        {review.posterType === 'human_executive' ? 'Human executive' : 'AI persona'}
                      </span>
                    </div>
                    <p className={`text-xs mt-2 whitespace-pre-wrap line-clamp-4 ${FINELY_OS_ENTITY_BODY}`}>{p.caption}</p>
                    {review.reasons.length ? (
                      <ul className="mt-2 text-xs text-amber-200/90 list-disc pl-4">
                        {review.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => approve(p.id)}>
                    Approve for queue
                  </button>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => block(p.id)}>
                    Block
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
