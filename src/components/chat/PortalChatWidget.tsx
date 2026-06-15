import { FinelyCommunicationHub } from './FinelyCommunicationHub';

/** Floating Communication Hub — AI coach, team chat, meetings, and guide. */
export function PortalChatWidget(args: {
  partnerId?: string;
  partnerDisplayName?: string;
  lane?: string;
  journeyStage?: string;
}) {
  return (
    <FinelyCommunicationHub
      mode="floating"
      partnerId={args.partnerId}
      partnerDisplayName={args.partnerDisplayName}
      lane={args.lane}
      journeyStage={args.journeyStage}
    />
  );
}
