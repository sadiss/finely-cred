import { FinelyCommunicationHub } from './FinelyCommunicationHub';

/** Floating Communication Hub — AI coach, team chat, meetings, and guide. */
export function PortalChatWidget(args: {
  partnerId?: string;
  partnerDisplayName?: string;
  lane?: string;
  journeyStage?: string;
  adminMode?: boolean;
  forceEnabled?: boolean;
  navigationMode?: 'preview' | 'live';
  visualVariant?: 'default' | 'product';
}) {
  return (
    <FinelyCommunicationHub
      mode="floating"
      partnerId={args.partnerId}
      partnerDisplayName={args.partnerDisplayName}
      lane={args.lane}
      journeyStage={args.journeyStage}
      adminMode={args.adminMode}
      showAllAgents={args.adminMode}
      forceEnabled={args.forceEnabled}
      navigationMode={args.navigationMode}
      visualVariant={args.visualVariant}
    />
  );
}
