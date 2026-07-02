import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  Library,
  Megaphone,
  Mic2,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { callAiGateway } from '../../lib/aiClient';
import { listResourceVideos, upsertResourceVideo } from '../../data/resourceVideosRepo';
import { upsertFunnelMedia } from '../../data/leadMagnetFunnelMediaRepo';
import { listAllCourses, upsertCourse } from '../../data/coursesRepo';
import { LEAD_MAGNET_FUNNELS } from '../../domain/leadMagnetFunnels';
import { newId } from '../../utils/ids';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';
import { StudioActionDeck, StudioKpiCards, StudioSection } from './StudioKpiCards';
import {
  advanceContentStudioJob,
  createContentStudioJob,
  getSelectedContentStudioJobId,
  listContentStudioAssets,
  listContentStudioJobs,
  saveContentStudioAsset,
  setSelectedContentStudioJobId,
  updateContentStudioAsset,
  updateContentStudioJob,
} from './contentStudioRepo';
import type {
  ContentStudioAsset,
  ContentStudioAssetType,
  ContentStudioIntake,
  ContentStudioJob,
  ContentStudioPublishTarget,
  ContentStudioSourceSurface,
  ContentStudioWorkroom,
  StudioUxKpi,
} from './types';

type WorkroomDef = {
  id: ContentStudioWorkroom;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  summary: string;
};

const workrooms: WorkroomDef[] = [
  { id: 'intake', label: 'Intake', icon: Sparkles, summary: 'Start any content request from one prompt.' },
  { id: 'research', label: 'Research', icon: Search, summary: 'Gemini-style research, brief, transcript, and audience insight.' },
  { id: 'script', label: 'Script', icon: FileText, summary: 'Hooks, narration, scenes, captions, CTAs, emails, and ad copy.' },
  { id: 'design', label: 'Design', icon: ImageIcon, summary: 'Canva-like covers, thumbnails, carousels, guides, and slides.' },
  { id: 'voice', label: 'Voice', icon: Mic2, summary: 'Narration, voice clone governance, dubbing, and sound effects.' },
  { id: 'video', label: 'Video', icon: Clapperboard, summary: 'Prompt-to-video, avatar, B-roll, render, subtitles, and cutdowns.' },
  { id: 'ebook', label: 'E-book', icon: BookOpen, summary: 'Full lead magnets, workbooks, SOPs, course PDFs, and downloads.' },
  { id: 'review', label: 'Review', icon: ShieldCheck, summary: 'Approval gates, compliance notes, publish readiness, and QA.' },
  { id: 'assets', label: 'Assets', icon: Library, summary: 'Reusable library for every generated video, PDF, audio, and image.' },
];

const sourceOptions: Array<{ id: ContentStudioSourceSurface; label: string }> = [
  { id: 'media_studio', label: 'Media Studio' },
  { id: 'course_builder', label: 'Course Builder' },
  { id: 'resources', label: 'Resources' },
  { id: 'lead_magnet', label: 'Lead Magnet' },
  { id: 'tour_studio', label: 'Tour/Demo' },
  { id: 'testimonial', label: 'Testimonial' },
  { id: 'social', label: 'Social' },
  { id: 'cmo_campaign', label: 'CMO Campaign' },
  { id: 'internal_training', label: 'Internal Training' },
];

const assetOptions: Array<{ id: ContentStudioAssetType; label: string }> = [
  { id: 'video', label: 'Professional video' },
  { id: 'course_lesson_video', label: 'Course lesson video' },
  { id: 'tour_demo', label: 'Demo walkthrough' },
  { id: 'social_clip', label: 'Social clip/reel' },
  { id: 'testimonial_video', label: 'Testimonial video' },
  { id: 'ebook', label: 'Full e-book' },
  { id: 'guide_pdf', label: 'Lead magnet PDF' },
  { id: 'thumbnail', label: 'Thumbnail/cover' },
  { id: 'campaign_bundle', label: 'Campaign bundle' },
];

const publishOptions: Array<{ id: ContentStudioPublishTarget; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'course_lesson', label: 'Course lesson' },
  { id: 'lead_magnet_hero', label: 'Lead magnet hero' },
  { id: 'tour_demo', label: 'Tour demo' },
  { id: 'testimonial', label: 'Testimonial' },
  { id: 'social_clip', label: 'Social clip' },
  { id: 'cmo_campaign', label: 'CMO campaign' },
  { id: 'download_only', label: 'Download only' },
];

const jobActionCards: Array<{ label: string; detail: string; icon: React.ComponentType<{ size?: number }> }> = [
  { label: 'Design', detail: 'Create cover, thumbnail, carousel, workbook, or slide deck.', icon: ImageIcon },
  { label: 'Voice', detail: 'Generate narration, clone-approved voice, dubbing, or SFX.', icon: Mic2 },
  { label: 'Publish', detail: 'Route approved assets to the right site surface.', icon: Megaphone },
];

const publishBridgeCards: Array<{ title: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { title: 'Resources', detail: 'Publish generated videos, PDFs, guides, and posters into the Resources library.', icon: PlayCircle },
  { title: 'Courses', detail: 'Attach lesson videos, narration, slides, and workbooks to Course Builder.', icon: BookOpen },
  { title: 'Lead magnets', detail: 'Set hero videos, guide covers, posters, and e-book PDFs per funnel.', icon: Sparkles },
  { title: 'Tours + demos', detail: 'Create walkthrough videos, transcripts, captions, and instruction clips.', icon: Clapperboard },
];

function fallbackBrief(job: ContentStudioJob) {
  return [
    `Audience: ${job.intake.audience}`,
    `Offer: ${job.intake.offer || 'Finely Cred offer'}`,
    `Primary request: ${job.intake.prompt}`,
    `Production direction: use Finely Cred premium trust language, avoid credit/funding guarantees, and build one clear next step.`,
    `Publish target: ${job.intake.publishTarget}.`,
  ].join('\n\n');
}

function fallbackScript(job: ContentStudioJob) {
  return [
    `HOOK: ${job.intake.audience} need a clearer path before they take the next credit or funding step.`,
    `BODY: Finely Cred turns the process into a guided workflow: education, documentation, timeline, and a specific next action.`,
    `PROOF: Keep claims process-based. Show the tool, guide, checklist, or demo rather than promising guaranteed results.`,
    `CTA: ${job.intake.publishTarget === 'download_only' ? 'Download the asset' : 'Open the next step inside Finely Cred'}.`,
  ].join('\n\n');
}

function fallbackDesignPlan(job: ContentStudioJob) {
  return [
    `Brand preset: ${job.intake.brandPreset}`,
    'Visual system: Finely premium dark shell, controlled gold/amber accents, refined cards, trust-first spacing, no flyer clutter.',
    `Primary deliverable: ${job.intake.requestedAssetType}`,
    'Required variants: cover/poster, square social preview, 9:16 story/reel frame, and web hero crop when applicable.',
    'Design QA: check contrast, mobile crop, no illegible small text, no unsubstantiated credit/funding claims in artwork.',
  ].join('\n\n');
}

function fallbackVoicePlan(job: ContentStudioJob) {
  return [
    'Voice direction: calm authority, premium finance tone, clear pace, no hype.',
    `Audience: ${job.intake.audience}`,
    'Production: generate narration, produce transcript, align captions, and keep an approval record for any cloned/brand voice.',
    'Governance: use only approved voices; require explicit consent for real human voice clones; keep public claims compliance-safe.',
  ].join('\n\n');
}

function fallbackEbookDraft(job: ContentStudioJob) {
  return [
    `# ${job.intake.offer || job.title}`,
    '',
    '## Promise',
    `A practical, compliance-safe guide for ${job.intake.audience}.`,
    '',
    '## What You Will Learn',
    '- What to check before taking the next credit or funding step.',
    '- How to organize documents, deadlines, and decisions.',
    '- What to avoid saying or promising in credit/funding conversations.',
    '- How Finely Cred turns the process into a guided workflow.',
    '',
    '## Step 1: Clarify the Goal',
    'Define the exact approval, funding, education, or operational outcome without promising a guaranteed result.',
    '',
    '## Step 2: Gather Evidence',
    'Collect the documents, screenshots, bureau data, account notes, and business profile details that support the next action.',
    '',
    '## Step 3: Choose the Path',
    'Match the user to the right workflow: guide download, course lesson, consultation, dispute workflow, business credit setup, or partner route.',
    '',
    '## Step 4: Track the Next Move',
    'Use the portal, checklist, or resource library to keep the process organized.',
    '',
    '## Compliance Note',
    'This content is educational. It should not guarantee approvals, deletions, score increases, funding, or legal outcomes.',
  ].join('\n');
}

function statusTone(status: ContentStudioJob['status']) {
  if (status === 'published' || status === 'approved') return 'text-emerald-200 border-emerald-400/25 bg-emerald-500/10';
  if (status === 'needs_review') return 'text-amber-100 border-amber-400/25 bg-amber-500/10';
  if (status === 'failed') return 'text-rose-100 border-rose-400/25 bg-rose-500/10';
  return 'text-sky-100 border-sky-400/20 bg-sky-500/10';
}

export function ContentStudioDepartmentPage() {
  const [version, setVersion] = useState(0);
  const [activeWorkroom, setActiveWorkroom] = useState<ContentStudioWorkroom>('intake');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selectedFunnelKey, setSelectedFunnelKey] = useState<string>(LEAD_MAGNET_FUNNELS.find((f) => f.id !== 'credit')?.funnelId ?? LEAD_MAGNET_FUNNELS[0]?.funnelId ?? '');
  const [selectedCourseLesson, setSelectedCourseLesson] = useState<string>('');
  const [intake, setIntake] = useState<ContentStudioIntake>({
    prompt: 'Create a professional Finely Cred video and matching guide assets for business owners who want funding readiness without overpromising outcomes.',
    sourceSurface: 'media_studio',
    requestedAssetType: 'video',
    audience: 'business owners and credit-focused consumers',
    offer: 'Finely Cred Content Studio',
    publishTarget: 'resources',
    durationSec: 60,
    aspect: '9:16',
    brandPreset: 'finely_dark',
    complianceStrict: true,
  });

  const jobs = useMemo(() => listContentStudioJobs(), [version]);
  const assets = useMemo(() => listContentStudioAssets(), [version]);
  const resourceVideos = useMemo(() => listResourceVideos(), [version]);
  const courses = useMemo(() => listAllCourses(), [version]);
  const courseLessonOptions = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.modules ?? []).flatMap((module) =>
          (module.lessons ?? []).map((lesson) => ({
            id: `${course.id}::${lesson.id}`,
            courseId: course.id,
            lessonId: lesson.id,
            label: `${course.title} / ${module.title} / ${lesson.title}`,
          })),
        ),
      ),
    [courses],
  );
  const selectedId = useMemo(() => getSelectedContentStudioJobId(), [version]);
  const activeJob = useMemo(() => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null, [jobs, selectedId]);
  const reviewJobs = jobs.filter((j) => j.status === 'needs_review');
  const readyAssets = assets.filter((a) => a.status === 'approved' || a.status === 'published');

  const kpis: StudioUxKpi[] = [
    { label: 'Production jobs', value: jobs.length, hint: 'Every request has owner, status, and audit trail', tone: 'amber' },
    { label: 'Assets', value: assets.length, hint: 'Reusable videos, guides, audio, covers, and scripts', tone: 'emerald' },
    { label: 'Review queue', value: reviewJobs.length, hint: 'Compliance and brand approval before publish', tone: 'violet' },
    { label: 'Ready to reuse', value: readyAssets.length, hint: 'Approved/published assets for site surfaces', tone: 'sky' },
  ];

  const createJob = () => {
    const job = createContentStudioJob(intake);
    setSelectedContentStudioJobId(job.id);
    setVersion((v) => v + 1);
    setNotice('Content Studio job created. Move it through research, script, design, voice, video, review, and publish.');
    setActiveWorkroom('research');
  };

  const selectJob = (jobId: string) => {
    setSelectedContentStudioJobId(jobId);
    setVersion((v) => v + 1);
  };

  async function generateResearchAndScript(job: ContentStudioJob) {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      let researchBrief = fallbackBrief(job);
      let scriptDraft = fallbackScript(job);
      try {
        const out = await callAiGateway({
          taskType: 'content.studio.research_script.v1',
          responseFormat: 'json',
          messages: [
            {
              role: 'system',
              content:
                'You are the Finely Cred content director. Return JSON with researchBrief and scriptDraft. Keep financial/credit copy compliant: no guaranteed approval, funding, deletion, score increase, or legal advice.',
            },
            {
              role: 'user',
              content:
                `Prompt: ${job.intake.prompt}\nAudience: ${job.intake.audience}\nOffer: ${job.intake.offer || 'n/a'}\n` +
                `Asset type: ${job.intake.requestedAssetType}\nPublish target: ${job.intake.publishTarget}\nBrand preset: ${job.intake.brandPreset}`,
            },
          ],
        });
        const parsed = JSON.parse(out.text.slice(out.text.indexOf('{'), out.text.lastIndexOf('}') + 1)) as { researchBrief?: string; scriptDraft?: string };
        researchBrief = parsed.researchBrief || researchBrief;
        scriptDraft = parsed.scriptDraft || scriptDraft;
      } catch {
        // Gateway can be offline locally; the department still needs a deterministic brief.
      }

      updateContentStudioJob(
        job.id,
        {
          status: 'script_ready',
          ownerRole: 'scriptwriter',
          researchBrief,
          scriptDraft,
        },
        { label: 'Research + script generated', detail: 'Created a compliance-safe brief and draft script.' },
      );
      saveContentStudioAsset({
        jobId: job.id,
        title: `${job.title} research brief`,
        assetType: 'research_brief',
        status: 'draft',
        summary: researchBrief,
        script: researchBrief,
        publishTargets: [job.intake.publishTarget],
        complianceNotes: ['Review all credit/funding claims before public use.'],
        provider: 'ai_gateway',
      });
      saveContentStudioAsset({
        jobId: job.id,
        title: `${job.title} script draft`,
        assetType: 'script',
        status: 'draft',
        summary: scriptDraft.slice(0, 240),
        script: scriptDraft,
        publishTargets: [job.intake.publishTarget],
        complianceNotes: ['Ready for brand and compliance review.'],
        provider: 'ai_gateway',
      });
      setVersion((v) => v + 1);
      setNotice('Research brief and script draft created.');
    } catch (e: any) {
      setErr(e?.message || 'Research/script generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function generateWorkroomAsset(job: ContentStudioJob, mode: 'design' | 'voice' | 'ebook') {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const fallback = mode === 'design' ? fallbackDesignPlan(job) : mode === 'voice' ? fallbackVoicePlan(job) : fallbackEbookDraft(job);
      let text = fallback;
      try {
        const out = await callAiGateway({
          taskType: `content.studio.${mode}.v1`,
          responseFormat: 'text',
          messages: [
            {
              role: 'system',
              content:
                'You are the Finely Cred Content Studio department lead. Create production-ready planning content. Keep the tone premium, structured, and compliance-safe. Do not guarantee credit, funding, approval, score increases, deletion, or legal outcomes.',
            },
            {
              role: 'user',
              content:
                `Mode: ${mode}\nPrompt: ${job.intake.prompt}\nAudience: ${job.intake.audience}\nOffer: ${job.intake.offer || 'n/a'}\n` +
                `Asset type: ${job.intake.requestedAssetType}\nPublish target: ${job.intake.publishTarget}\nBrand preset: ${job.intake.brandPreset}\n` +
                `Existing research:\n${job.researchBrief || 'none'}\nExisting script:\n${job.scriptDraft || 'none'}`,
            },
          ],
        });
        if (out.text.trim()) text = out.text.trim();
      } catch {
        // Keep local generation deterministic when AI Gateway or Supabase is unavailable.
      }

      if (mode === 'design') {
        updateContentStudioJob(
          job.id,
          { status: 'design_ready', ownerRole: 'designer', designPlan: text },
          { label: 'Design plan generated', detail: 'Created a Canva-style design plan for covers, thumbnails, social cuts, and web crops.' },
        );
        saveContentStudioAsset({
          jobId: job.id,
          title: `${job.title} design plan`,
          assetType: 'thumbnail',
          status: 'draft',
          provider: 'manual',
          summary: text,
          script: text,
          publishTargets: [job.intake.publishTarget],
          complianceNotes: ['Review all artwork claims and tiny text before public publish.'],
        });
      } else if (mode === 'voice') {
        updateContentStudioJob(
          job.id,
          { status: 'voice_ready', ownerRole: 'voice_producer', voicePlan: text },
          { label: 'Voice plan generated', detail: 'Created narration, voice governance, caption, and dubbing direction.' },
        );
        saveContentStudioAsset({
          jobId: job.id,
          title: `${job.title} voice plan`,
          assetType: 'audio',
          status: 'draft',
          provider: 'voice_studio',
          summary: text,
          transcript: text,
          publishTargets: [job.intake.publishTarget],
          complianceNotes: ['Use only approved voices; require consent for cloned human voices.'],
        });
      } else {
        const assetType: ContentStudioAssetType = job.intake.requestedAssetType === 'guide_pdf' ? 'guide_pdf' : 'ebook';
        updateContentStudioJob(
          job.id,
          { status: 'design_ready', ownerRole: 'designer', designPlan: job.designPlan || fallbackDesignPlan(job) },
          { label: 'E-book draft generated', detail: 'Created a structured long-form guide draft ready for PDF/design rendering.' },
        );
        saveContentStudioAsset({
          jobId: job.id,
          title: `${job.title} e-book draft`,
          assetType,
          status: 'draft',
          provider: 'ai_gateway',
          summary: text.slice(0, 320),
          script: text,
          publishTargets: [job.intake.publishTarget],
          complianceNotes: ['Needs compliance and formatting review before PDF export.'],
        });
      }
      setVersion((v) => v + 1);
      setNotice(`${mode === 'ebook' ? 'E-book/guide draft' : `${mode} plan`} created.`);
    } catch (e: any) {
      setErr(e?.message || `${mode} generation failed.`);
    } finally {
      setBusy(false);
    }
  }

  const markForReview = (job: ContentStudioJob) => {
    advanceContentStudioJob(job.id, 'needs_review', 'Moved to review queue for brand/compliance approval.');
    setVersion((v) => v + 1);
    setActiveWorkroom('review');
  };

  const approveJob = (job: ContentStudioJob) => {
    advanceContentStudioJob(job.id, 'approved', 'Approved for publish bridge wiring.');
    setVersion((v) => v + 1);
  };

  const approveAsset = (asset: ContentStudioAsset) => {
    updateContentStudioAsset(asset.id, { status: 'approved' });
    setVersion((v) => v + 1);
    setNotice(`${asset.title} approved for publishing.`);
  };

  const publishAssetToResources = (asset: ContentStudioAsset) => {
    if (!asset.blobRef) {
      setErr('This asset does not have rendered media yet. Export/generate the video first.');
      return;
    }
    const existing = resourceVideos.find((v) => v.blobRef === asset.blobRef);
    const resource = existing ?? upsertResourceVideo({
      title: `${asset.title} (Content Studio)`,
      desc: asset.summary || 'Generated by Content Studio. Review before publishing publicly.',
      blobRef: asset.blobRef,
      mimeType: asset.assetType === 'audio' ? 'audio/mpeg' : 'video/webm',
      tags: ['content-studio', asset.assetType],
      isPublic: false,
    });
    updateContentStudioAsset(asset.id, {
      status: 'published',
      publishTargets: Array.from(new Set([...asset.publishTargets, 'resources'])),
      summary: `${asset.summary || ''}\n\nPublished to Resources as private item: ${resource.title}`.trim(),
    });
    setVersion((v) => v + 1);
    setNotice(`${asset.title} published to Resources as a private item.`);
  };

  const renderAssetToPdf = async (asset: ContentStudioAsset) => {
    const text = (asset.script || asset.summary || asset.transcript || '').trim();
    if (!text) {
      setErr('This asset has no text content to render into a PDF.');
      return;
    }
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const pdf = await generateTextPdfToVault({
        text,
        filename: `${asset.title}.pdf`,
        meta: {
          kind: 'content_studio_pdf',
          source: 'content_studio',
          assetId: asset.id,
          assetType: asset.assetType,
          title: asset.title,
        },
      });
      if (!pdf.pdfBlobRef) throw new Error('PDF generated but could not be saved to the vault.');
      updateContentStudioAsset(asset.id, {
        blobRef: pdf.pdfBlobRef,
        status: 'needs_review',
        provider: 'manual',
        summary: `${asset.summary || text.slice(0, 280)}\n\nRendered PDF: ${pdf.filename}`.trim(),
        complianceNotes: Array.from(new Set([...(asset.complianceNotes ?? []), 'Review generated PDF before publishing or sharing.'])),
      });
      setVersion((v) => v + 1);
      setNotice(`${asset.title} rendered into a PDF and saved as a Content Studio asset.`);
    } catch (e: any) {
      setErr(e?.message || 'PDF render failed.');
    } finally {
      setBusy(false);
    }
  };

  const openAssetBlob = async (asset: ContentStudioAsset) => {
    if (!asset.blobRef) {
      setErr('This asset does not have a rendered file yet.');
      return;
    }
    const mime =
      asset.assetType === 'ebook' || asset.assetType === 'guide_pdf' || asset.blobRef.includes('pdf')
        ? 'application/pdf'
        : asset.assetType === 'audio'
          ? 'audio/mpeg'
          : asset.assetType === 'video'
            ? 'video/webm'
            : 'application/octet-stream';
    const res = await openBlobRefInNewTab({ blobRef: asset.blobRef, mimeType: mime, preferSigned: true });
    if (!res.ok) setErr(res.message);
  };

  const setAssetAsLeadMagnetHero = (asset: ContentStudioAsset) => {
    if (!asset.blobRef) {
      setErr('This asset does not have rendered video yet. Export/generate the video first.');
      return;
    }
    const resource = resourceVideos.find((v) => v.blobRef === asset.blobRef) ?? upsertResourceVideo({
      title: `${asset.title} (Lead magnet hero)`,
      desc: asset.summary || 'Generated by Content Studio for a lead magnet hero video.',
      blobRef: asset.blobRef,
      mimeType: 'video/webm',
      tags: ['content-studio', 'lead-magnet'],
      isPublic: false,
    });
    upsertFunnelMedia(selectedFunnelKey, {
      resourceVideoId: resource.id,
      videoTitle: asset.title,
      showLivePulse: true,
    });
    updateContentStudioAsset(asset.id, {
      status: 'published',
      publishTargets: Array.from(new Set([...asset.publishTargets, 'lead_magnet_hero'])),
      summary: `${asset.summary || ''}\n\nAttached to lead magnet funnel: ${selectedFunnelKey}`.trim(),
    });
    setVersion((v) => v + 1);
    setNotice(`${asset.title} is now attached to ${selectedFunnelKey} as its hero video via Resources.`);
  };

  const publishAssetToCourseLesson = (asset: ContentStudioAsset) => {
    if (!asset.blobRef) {
      setErr('This asset does not have rendered media yet. Export/generate the video first.');
      return;
    }
    const selected = courseLessonOptions.find((o) => o.id === selectedCourseLesson) ?? courseLessonOptions[0];
    if (!selected) {
      setErr('No course lesson is available yet.');
      return;
    }
    const course = courses.find((c) => c.id === selected.courseId);
    if (!course) {
      setErr('Selected course was not found.');
      return;
    }
    const resource = resourceVideos.find((v) => v.blobRef === asset.blobRef) ?? upsertResourceVideo({
      title: `${asset.title} (Course asset)`,
      desc: asset.summary || 'Generated by Content Studio for a course lesson.',
      blobRef: asset.blobRef,
      mimeType: 'video/webm',
      tags: ['content-studio', 'course'],
      isPublic: false,
    });
    const next = {
      ...course,
      modules: (course.modules ?? []).map((module) => ({
        ...module,
        lessons: (module.lessons ?? []).map((lesson) => {
          if (lesson.id !== selected.lessonId) return lesson;
          return {
            ...lesson,
            content: [
              ...(lesson.content ?? []),
              {
                id: newId('blk'),
                type: 'video_asset' as const,
                data: {
                  videoAssetId: resource.id,
                  caption: `${asset.title} (generated by Content Studio)`,
                },
              },
            ],
          };
        }),
      })),
    };
    upsertCourse(next);
    updateContentStudioAsset(asset.id, {
      status: 'published',
      publishTargets: Array.from(new Set([...asset.publishTargets, 'course_lesson'])),
      summary: `${asset.summary || ''}\n\nAttached to course lesson: ${selected.label}`.trim(),
    });
    setVersion((v) => v + 1);
    setNotice(`${asset.title} attached to ${selected.label}.`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/12 via-white/[0.04] to-violet-500/10 p-6 md:p-8 overflow-hidden relative">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-12 items-start">
          <div className="xl:col-span-7">
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200 font-black">Content Studio Department OS</div>
            <h1 className="mt-3 text-3xl md:text-5xl font-black text-white tracking-tight">Research, script, design, voice, video, e-books, review, and publish from one production floor.</h1>
            <p className="mt-4 text-white/65 max-w-3xl">
              This is the professional layer that turns Finely Cred content into reusable assets for courses, resources, lead magnets, demos, testimonials, social clips, and CMO campaigns.
            </p>
          </div>
          <div className="xl:col-span-5">
            <StudioKpiCards items={kpis} />
          </div>
        </div>
      </div>

      {err ? <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div> : null}
      {notice ? <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm inline-flex gap-3"><CheckCircle2 size={18} />{notice}</div> : null}

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {workrooms.map((w) => {
            const Icon = w.icon;
            const active = activeWorkroom === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWorkroom(w.id)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                  active ? 'border-amber-400/40 bg-amber-500/12 text-white' : 'border-white/10 bg-white/[0.035] text-white/65 hover:bg-white/[0.06]'
                }`}
              >
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                  <Icon size={15} /> {w.label}
                </div>
                <div className="mt-1 max-w-[220px] text-xs text-white/45">{w.summary}</div>
              </button>
            );
          })}
        </div>
      </div>

      {activeWorkroom === 'intake' ? (
        <StudioSection eyebrow="department intake" title="Start with any content need. The system routes it to the right production workrooms.">
          <div className="grid xl:grid-cols-12 gap-5">
            <div className="xl:col-span-7 space-y-4">
              <textarea
                value={intake.prompt}
                onChange={(e) => setIntake((v) => ({ ...v, prompt: e.target.value }))}
                className="w-full min-h-[220px] rounded-[1.75rem] border border-white/10 bg-black/45 px-5 py-4 text-white/90 placeholder:text-white/25 text-base leading-relaxed focus:outline-none focus:border-amber-400/60"
                placeholder="Describe what you need: video, guide, course lesson, resource, demo, lead magnet, testimonial, social content, or full campaign bundle."
              />
              <div className="grid md:grid-cols-2 gap-3">
                <input value={intake.audience} onChange={(e) => setIntake((v) => ({ ...v, audience: e.target.value }))} className="fc-input" placeholder="Audience" />
                <input value={intake.offer || ''} onChange={(e) => setIntake((v) => ({ ...v, offer: e.target.value }))} className="fc-input" placeholder="Offer / campaign / guide" />
              </div>
            </div>
            <div className="xl:col-span-5 grid sm:grid-cols-2 gap-3">
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Source</div>
                <select value={intake.sourceSurface} onChange={(e) => setIntake((v) => ({ ...v, sourceSurface: e.target.value as ContentStudioSourceSurface }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                  {sourceOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Asset</div>
                <select value={intake.requestedAssetType} onChange={(e) => setIntake((v) => ({ ...v, requestedAssetType: e.target.value as ContentStudioAssetType }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                  {assetOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Publish target</div>
                <select value={intake.publishTarget} onChange={(e) => setIntake((v) => ({ ...v, publishTarget: e.target.value as ContentStudioPublishTarget }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                  {publishOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Brand preset</div>
                <select value={intake.brandPreset} onChange={(e) => setIntake((v) => ({ ...v, brandPreset: e.target.value as ContentStudioIntake['brandPreset'] }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                  <option value="finely_dark">Finely dark premium</option>
                  <option value="finely_light">Finely light editorial</option>
                  <option value="premium_gold">Premium gold</option>
                  <option value="credit_education">Credit education</option>
                  <option value="business_funding">Business funding</option>
                </select>
              </label>
              <button type="button" className="fc-button-brand sm:col-span-2" onClick={createJob}>
                <Sparkles size={15} /> Create production job <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </StudioSection>
      ) : null}

      {activeWorkroom !== 'video' ? (
        <StudioSection
          eyebrow="production queue"
          title="Active jobs"
          right={activeJob ? <button type="button" className="fc-button-brand" onClick={() => void generateResearchAndScript(activeJob)} disabled={busy}><Wand2 size={14} /> Generate brief + script</button> : null}
        >
          {!jobs.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">No Content Studio jobs yet. Start from intake.</div>
          ) : (
            <StudioActionDeck
              items={jobs.map((j) => ({ id: j.id, title: j.title, summary: `${j.status} • ${j.intake.requestedAssetType} → ${j.intake.publishTarget}` }))}
              activeId={activeJob?.id}
              onSelect={(x) => selectJob(x.id)}
              renderMeta={(x) => {
                const job = jobs.find((j) => j.id === x.id);
                return job ? <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(job.status)}`}>{job.status}</span> : null;
              }}
            />
          )}
        </StudioSection>
      ) : null}

      {activeWorkroom === 'video' ? (
        <GeminiStyleVideoCommand
          key={activeJob?.id ?? 'default-video-command'}
          initialRequest={
            activeJob
              ? {
                  prompt: activeJob.scriptDraft || activeJob.researchBrief || activeJob.intake.prompt,
                  durationSec: activeJob.intake.durationSec ?? 28,
                  aspect: activeJob.intake.aspect ?? '9:16',
                  offer: activeJob.intake.offer || activeJob.title,
                  audience: activeJob.intake.audience,
                  intent:
                    activeJob.intake.sourceSurface === 'lead_magnet'
                      ? 'lead_magnet_ad'
                      : activeJob.intake.sourceSurface === 'testimonial'
                        ? 'testimonial_style'
                        : activeJob.intake.sourceSurface === 'cmo_campaign'
                          ? 'authority_clip'
                          : 'business_credit_education',
                }
              : undefined
          }
        />
      ) : null}

      {activeJob && activeWorkroom !== 'intake' && activeWorkroom !== 'video' ? (
        <StudioSection
          eyebrow={`${activeWorkroom} workroom`}
          title={activeJob.title}
          right={
            <div className="flex flex-wrap gap-2">
              <button type="button" className="fc-button-soft" onClick={() => markForReview(activeJob)}><ShieldCheck size={14} /> Send to review</button>
              <button type="button" className="fc-button-brand" onClick={() => approveJob(activeJob)}><CheckCircle2 size={14} /> Approve</button>
            </div>
          }
        >
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Request</div>
              <div className="mt-3 text-white/75 leading-relaxed">{activeJob.intake.prompt}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Provider path</div>
              <div className="mt-3 space-y-2">
                {activeJob.providerPlan.map((p) => (
                  <div key={`${p.provider}-${p.purpose}`} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-white font-semibold">{p.provider}</div>
                    <div className="text-xs text-white/45 mt-1">{p.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Timeline</div>
              <div className="mt-3 space-y-2">
                {activeJob.events.slice(0, 6).map((e) => (
                  <div key={e.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-white text-sm font-semibold">{e.label}</div>
                    <div className="text-xs text-white/45 mt-1">{e.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-400/15 bg-amber-500/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-amber-200 font-black">Workroom actions</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="fc-button-brand" onClick={() => void generateResearchAndScript(activeJob)} disabled={busy}>
                <Wand2 size={14} /> Research + script
              </button>
              <button type="button" className="fc-button-soft" onClick={() => void generateWorkroomAsset(activeJob, 'design')} disabled={busy}>
                <ImageIcon size={14} /> Design plan
              </button>
              <button type="button" className="fc-button-soft" onClick={() => void generateWorkroomAsset(activeJob, 'voice')} disabled={busy}>
                <Mic2 size={14} /> Voice plan
              </button>
              <button type="button" className="fc-button-soft" onClick={() => void generateWorkroomAsset(activeJob, 'ebook')} disabled={busy}>
                <BookOpen size={14} /> E-book draft
              </button>
              <button type="button" className="fc-button-soft" onClick={() => markForReview(activeJob)}>
                <ShieldCheck size={14} /> Send to review
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 text-amber-200 font-black uppercase tracking-widest text-[10px]"><Search size={14} /> Research brief</div>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-white/65 leading-relaxed font-sans">{activeJob.researchBrief || 'Generate a research brief to fill this workroom.'}</pre>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 text-sky-200 font-black uppercase tracking-widest text-[10px]"><FileText size={14} /> Script draft</div>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-white/65 leading-relaxed font-sans">{activeJob.scriptDraft || 'Generate a script to fill this workroom.'}</pre>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 text-violet-200 font-black uppercase tracking-widest text-[10px]"><ImageIcon size={14} /> Design plan</div>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-white/65 leading-relaxed font-sans">{activeJob.designPlan || 'Generate a design plan for covers, thumbnails, decks, and guide layouts.'}</pre>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 text-emerald-200 font-black uppercase tracking-widest text-[10px]"><Mic2 size={14} /> Voice plan</div>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-white/65 leading-relaxed font-sans">{activeJob.voicePlan || 'Generate a voice plan for narration, dubbing, captions, and sound design.'}</pre>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="inline-flex items-center gap-2 text-sky-200 font-black uppercase tracking-widest text-[10px]"><BookOpen size={14} /> E-book / guide assets</div>
              <div className="mt-4 space-y-2">
                {assets.filter((a) => a.jobId === activeJob.id && (a.assetType === 'ebook' || a.assetType === 'guide_pdf')).slice(0, 3).map((a) => (
                  <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="text-white text-sm font-semibold">{a.title}</div>
                    <div className="mt-1 text-xs text-white/45 line-clamp-3">{a.summary || a.script}</div>
                  </div>
                ))}
                {!assets.some((a) => a.jobId === activeJob.id && (a.assetType === 'ebook' || a.assetType === 'guide_pdf')) ? <div className="text-sm text-white/55">Generate an e-book draft to create long-form content assets.</div> : null}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {jobActionCards.map(({ label, detail, icon: Icon }) => {
              return (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <Icon size={18} />
                  <div className="mt-3 text-white font-black">{label}</div>
                  <div className="mt-2 text-sm text-white/55">{label === 'Publish' ? `Target: ${activeJob.intake.publishTarget}` : detail}</div>
                </div>
              );
            })}
          </div>
        </StudioSection>
      ) : null}

      {activeWorkroom === 'assets' ? (
        <StudioSection eyebrow="asset registry" title="Reusable Content Studio assets">
          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-white font-black">Publish bridge controls</div>
              <div className="mt-1 text-sm text-white/50">Generated video assets can become private Resource videos, lead magnet hero videos, or course lesson blocks.</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 md:min-w-[560px]">
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Lead magnet target</div>
                <select
                  value={selectedFunnelKey}
                  onChange={(e) => setSelectedFunnelKey(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                >
                  {LEAD_MAGNET_FUNNELS.filter((f) => f.id !== 'credit').map((f) => (
                    <option key={f.funnelId} value={f.funnelId}>
                      {f.path} • {f.offer}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Course lesson target</div>
                <select
                  value={selectedCourseLesson || courseLessonOptions[0]?.id || ''}
                  onChange={(e) => setSelectedCourseLesson(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
                >
                  {courseLessonOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((a) => (
              <div key={a.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-black">{a.title}</div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${a.status === 'published' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-black/25 text-white/50'}`}>{a.status}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">{a.assetType} • {a.provider || 'manual'}</div>
                <div className="text-sm text-white/55 line-clamp-4">{a.summary || a.script || a.transcript || 'No summary yet.'}</div>
                <div className="flex flex-wrap gap-2">{a.publishTargets.map((t) => <span key={t} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] text-white/45">{t}</span>)}</div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  <button type="button" className="fc-button-soft" onClick={() => approveAsset(a)}>
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  {(a.assetType === 'ebook' || a.assetType === 'guide_pdf' || a.assetType === 'script' || a.assetType === 'research_brief') ? (
                    <button type="button" className="fc-button-brand" onClick={() => void renderAssetToPdf(a)} disabled={busy || !((a.script || a.summary || a.transcript || '').trim())}>
                      <FileText size={14} /> Render PDF
                    </button>
                  ) : null}
                  {a.blobRef ? (
                    <button type="button" className="fc-button-soft" onClick={() => void openAssetBlob(a)}>
                      <ArrowRight size={14} /> Open file
                    </button>
                  ) : null}
                  {a.assetType === 'video' ? (
                    <>
                      <button type="button" className="fc-button-brand" disabled={!a.blobRef} onClick={() => publishAssetToResources(a)} title={!a.blobRef ? 'Render/export media first' : 'Publish to private Resources'}>
                        <Library size={14} /> Resources
                      </button>
                      <button type="button" className="fc-button-soft" disabled={!a.blobRef} onClick={() => setAssetAsLeadMagnetHero(a)} title={!a.blobRef ? 'Render/export video first' : 'Set as selected lead magnet hero video'}>
                        <Sparkles size={14} /> Lead magnet hero
                      </button>
                      <button type="button" className="fc-button-soft" disabled={!a.blobRef} onClick={() => publishAssetToCourseLesson(a)} title={!a.blobRef ? 'Render/export video first' : 'Attach as selected course lesson video'}>
                        <BookOpen size={14} /> Course lesson
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            {!assets.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">No assets yet. Generate a brief/script or video project first.</div> : null}
          </div>
        </StudioSection>
      ) : null}

      <StudioSection eyebrow="publish bridges" title="Where this department will connect next">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {publishBridgeCards.map(({ title, detail, icon: Icon }) => {
            return (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <Icon size={18} className="text-amber-200" />
                <div className="mt-3 text-white font-black">{title}</div>
                <div className="mt-2 text-sm text-white/55 leading-relaxed">{detail}</div>
              </div>
            );
          })}
        </div>
      </StudioSection>
    </div>
  );
}
