import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

const POSTS = [
  {
    slug: 'restore-readiness',
    title: 'Restore readiness vs credit repair hype',
    summary: 'Why file accuracy and evidence discipline come before disputes.',
    path: '/free-guide',
  },
  {
    slug: 'business-credit-journey',
    title: 'Seven-step business credit journey',
    summary: 'Foundation through personal-credit handoff — same rail as the portal.',
    path: '/business-credit',
  },
  {
    slug: 'tradelines-education',
    title: 'AU vs primary tradelines',
    summary: 'Education-first tradeline lanes on Finely Cred.',
    path: '/tradelines',
  },
];

/** `/blog` — curated index (not a silent redirect to resources). */
export default function BlogIndexPage() {
  return (
    <PageShell
      badge="Insights"
      title="Finely Cred blog"
      subtitle="Short reads and funnels — full video library lives in Resources."
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            to={post.path}
            className="block rounded-2xl border border-white/15 bg-[#0b1110] p-5 hover:border-[#fbbf24]/35 transition-all"
          >
            <div className="flex items-start gap-3">
              <Newspaper className="text-[#fbbf24] shrink-0 mt-0.5" size={20} />
              <div>
                <div className="font-semibold text-white">{post.title}</div>
                <p className="text-white/65 text-sm mt-1">{post.summary}</p>
                <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold mt-2">
                  Read <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
        <p className="text-white/50 text-xs pt-4">
          Long-form video and PDF guides: <Link to="/resources" className="text-[#fbbf24] underline">Resource library</Link>
        </p>
      </div>
    </PageShell>
  );
}
