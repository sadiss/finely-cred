import React from 'react';
import { ArrowLeft, ArrowRight, Layout, Library, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { ClickableCard } from '../../components/ui';

export default function AdminCmsPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Admin"
      title="CMS"
      subtitle="Content operations hub. This is the staging area for landing copy, guides, and reusable messaging."
    >
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <div className="inline-flex items-center gap-2 text-amber-300">
            <Layout size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Content control</span>
          </div>
          <div className="mt-2 text-white/70 text-sm">
            The full CMS editor is a Phase-2 build. For now, use the live modules below to manage the most important content surfaces.
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <ClickableCard onClick={() => navigate('/admin/resources')} className="p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Module</div>
            <div className="mt-2 text-white font-semibold inline-flex items-center gap-2">
              <Library size={16} className="text-amber-300" /> Resources
            </div>
            <div className="mt-2 text-white/60 text-sm">Edit public guides and partner-facing resources.</div>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Open <ArrowRight size={12} />
            </div>
          </ClickableCard>

          <ClickableCard onClick={() => navigate('/admin/comms')} className="p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Module</div>
            <div className="mt-2 text-white font-semibold inline-flex items-center gap-2">
              <Mail size={16} className="text-amber-300" /> Comms Studio
            </div>
            <div className="mt-2 text-white/60 text-sm">Templates and delivery logic for partner communication.</div>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Open <ArrowRight size={12} />
            </div>
          </ClickableCard>

          <ClickableCard onClick={() => navigate('/pricing')} className="p-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Surface</div>
            <div className="mt-2 text-white font-semibold">Public pricing</div>
            <div className="mt-2 text-white/60 text-sm">Audit what customers see (DIY vs DFY, categories, rails).</div>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
              Open <ArrowRight size={12} />
            </div>
          </ClickableCard>
        </div>
      </div>
    </PageShell>
  );
}

