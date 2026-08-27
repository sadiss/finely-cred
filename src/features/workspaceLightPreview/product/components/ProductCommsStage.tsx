import React from 'react';
import { useLocation } from 'react-router-dom';
import { FinelyCommunicationHub } from '../../../../components/chat/FinelyCommunicationHub';
import type { FcmAccent } from '../../../../styles/finelyMaterials';
import './productCommsStage.css';

/**
 * Frames the existing `FinelyCommunicationHub` (page mode) in the workspace product shell's
 * luxury material language (depth + glow ring + specular + grain) without touching the hub's
 * own markup — the stylish surface underneath is reused as-is, only the surrounding "jewel
 * case" is new.
 */
export function ProductCommsStage({
  adminMode = false,
  accent = 'violet',
  partnerId,
  partnerDisplayName,
  lane,
  journeyStage,
  showAllAgents,
}: {
  adminMode?: boolean;
  accent?: FcmAccent;
  partnerId?: string;
  partnerDisplayName?: string;
  lane?: string;
  journeyStage?: string;
  showAllAgents?: boolean;
}) {
  const { pathname } = useLocation();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
  return (
    <div className="fc-wlp-comms-stage fcm-depth fcm-glow-ring" data-bed="dark" data-fcm-accent={accent}>
      <span className="fcm-grain" aria-hidden />
      {/* Product mode paints the communication hub on an opaque violet/navy bed. Keep this
          boundary dark so white utility text is not remapped to black over purple panels. */}
      <div className="fc-wlp-comms-stage-inner fcm-specular" data-bed="dark">
        <FinelyCommunicationHub
          mode="page"
          partnerId={partnerId}
          partnerDisplayName={partnerDisplayName}
          lane={lane}
          journeyStage={journeyStage}
          adminMode={adminMode}
          showAllAgents={showAllAgents}
          navigationMode={navigationMode}
          forceEnabled={navigationMode === 'preview'}
          visualVariant="product"
        />
      </div>
    </div>
  );
}
