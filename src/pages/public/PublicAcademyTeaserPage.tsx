import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

/** `/academy` — public teaser; specialist training stays in admin academy. */
export default function PublicAcademyTeaserPage() {
  return (
    <PageShell
      badge="Academy"
      title="Finely Cred Academy"
      subtitle="DIY courses, restore methodology previews, and partner education — specialist certification is staff-only."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#0b1110] p-6">
          <GraduationCap className="text-[#fbbf24]" size={32} />
          <p className="mt-3 text-white/75 text-sm leading-relaxed">
            Active partners access courses inside the portal after onboarding. This public page explains what is available — it is not the
            full Specialist Academy (admin-only).
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/resources" className="rounded-2xl border border-white/15 p-5 hover:border-[#fbbf24]/40 transition-all block">
            <BookOpen className="text-amber-400" size={22} />
            <div className="mt-2 font-semibold text-white">Free guides & videos</div>
            <p className="text-white/60 text-sm mt-1">Resource library with downloadable kits.</p>
          </Link>
          <Link to="/bookstore" className="rounded-2xl border border-white/15 p-5 hover:border-[#fbbf24]/40 transition-all block">
            <BookOpen className="text-amber-400" size={22} />
            <div className="mt-2 font-semibold text-white">e-Books</div>
            <p className="text-white/60 text-sm mt-1">Deeper DIY curriculum.</p>
          </Link>
        </div>

        <Link to="/login?next=%2Fportal%2Fcourses" className="fc-button-brand inline-flex">
          Partner login for courses <ArrowRight size={14} />
        </Link>
      </div>
    </PageShell>
  );
}
