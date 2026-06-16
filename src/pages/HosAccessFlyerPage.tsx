import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HosAccessFlyer } from '../components/heta/HosAccessFlyer';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { HEAD_OF_SOCIETY_NAME, HEAD_OF_SOCIETY_PATH, HETA_SOCIETY_SHORT } from '../config/hetaSocietyProgram';

/** Standalone print / download page for the HOS access flyer. */
export default function HosAccessFlyerPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: `${HEAD_OF_SOCIETY_NAME} Access Flyer`,
    description: `Download or print the invite-only ${HETA_SOCIETY_SHORT} access flyer.`,
    path: `${HEAD_OF_SOCIETY_PATH}/flyer`,
  });

  return (
    <div className="min-h-screen bg-fc-shell text-white">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate(HEAD_OF_SOCIETY_PATH)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to {HETA_SOCIETY_SHORT} member entrance
        </button>
        <HosAccessFlyer onEnterKey={() => navigate(`${HEAD_OF_SOCIETY_PATH}#hos-access`)} />
      </div>
      <FinelyOsPageFooter />
    </div>
  );
}
