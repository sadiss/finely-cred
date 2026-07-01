import { newId } from '../../utils/ids';
import type { Prospect, ProspectStage, ProspectTarget } from '../../domain/crmProspects';
import { addProspectNote, listProspects, setProspectStage } from '../../data/crmProspectsRepo';
import { createCommsTemplate } from '../../data/commsRepo';
import { createCommsSequence, upsertCommsSequence } from '../../data/commsSequencesRepo';
import { createMediaProject, addScene, upsertMediaProject } from '../../data/mediaStudioRepo';
import { createTask } from '../../data/tasksRepo';
import type { CmoAsset, CmoAudienceSnapshot, CmoCampaign, CmoChannel, CmoDirective, CmoObjective, CmoPlaybook, CmoScheduledPost } from '../../domain/cmoPhase2';
import { cmoNowIso } from '../../domain/cmoPhase2';
import {
  getCmoCampaign,
  getCmoSettings,
  listCmoAssets,
  upsertCmoAsset,
  upsertCmoAudience,
  upsertCmoCampaign,
  upsertCmoDirective,
  upsertCmoEngagement,
  upsertCmoScheduledPost,
} from '../../data/cmoPhase2Repo';
import { emitCmoEvent, emitCommsEvent, emitMediaEvent } from './cmoEventBus';
import { classifyGrowthIntent, recommendChannels, scoreConversionCopy150 } from './cmoLearningEngine';

type SegmentArgs = {
  q?: string;
  target?: ProspectTarget | 'all';
  stage?: ProspectStage | 'all';
  minScore?: number;
  tags?: string[];
  limit?: number;
};

function countBy<T extends string>(items: T[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function topTags(prospects: Prospect[]) {
  const counts = new Map<string, number>();
  prospects.forEach((p) => (p.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function objectiveForProspects(prospects: Prospect[]): CmoObjective {
  const targets = countBy(prospects.map((p) => p.target));
  if ((targets.agents ?? 0) > prospects.length * 0.35) return 'recruit_specialists';
  if ((targets.affiliates ?? 0) > prospects.length * 0.25 || (targets.b2b_partners ?? 0) > prospects.length * 0.25) return 'enroll_affiliates';
  if ((targets.au_sellers ?? 0) > prospects.length * 0.2) return 'promote_tradelines';
  if (prospects.some((p) => (p.tags ?? []).join(' ').toLowerCase().includes('fund'))) return 'promote_funding';
  return 'book_consultations';
}

export function buildAudienceFromLeadIntel(args: SegmentArgs = {}): CmoAudienceSnapshot {
  const minScore = Math.max(0, Number(args.minScore ?? 0));
  const requiredTags = (args.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const prospects = listProspects({ q: args.q, target: args.target ?? 'all', stage: args.stage ?? 'all' })
    .filter((p) => (p.score ?? 0) >= minScore)
    .filter((p) => !requiredTags.length || requiredTags.every((tag) => (p.tags ?? []).map((x) => x.toLowerCase()).includes(tag)))
    .slice(0, Math.max(1, args.limit ?? 500));
  const avg = prospects.length ? Math.round(prospects.reduce((sum, p) => sum + (p.score ?? 0), 0) / prospects.length) : 0;
  const objective = objectiveForProspects(prospects);
  const channels = recommendChannels({ objective, limit: 5 }).map((x) => x.channel);
  const snapshot: CmoAudienceSnapshot = {
    id: newId('cmoaud'),
    createdAt: cmoNowIso(),
    label: `Lead Intel segment • ${prospects.length} prospect${prospects.length === 1 ? '' : 's'}`,
    source: 'lead_intel',
    prospectIds: prospects.map((p) => p.id),
    targetMix: countBy(prospects.map((p) => p.target)),
    stageMix: countBy(prospects.map((p) => p.stage)),
    topTags: topTags(prospects),
    averageScore: avg,
    recommendedObjective: objective,
    recommendedChannels: channels,
    notes: args.q ? `Search/query context: ${args.q}` : undefined,
  };
  upsertCmoAudience(snapshot);
  emitCmoEvent({ type: 'prospect_selected', source: 'lead_intel', labels: snapshot.topTags.map((t) => t.tag), meta: { prospectCount: prospects.length, averageScore: avg, filters: args } });
  return snapshot;
}

function channelList(channels: CmoChannel[]) {
  return channels.map((c) => c.replace(/_/g, ' ')).join(', ');
}

export function createCampaignFromAudience(args: { audience: CmoAudienceSnapshot; title?: string; offer?: string; objective?: CmoObjective }): CmoCampaign {
  const objective = args.objective ?? args.audience.recommendedObjective;
  const channels = args.audience.recommendedChannels.length ? args.audience.recommendedChannels : recommendChannels({ objective, limit: 5 }).map((x) => x.channel);
  const offer = (args.offer || '').trim() || offerForObjective(objective);
  const campaign: CmoCampaign = {
    id: newId('cmocamp'),
    createdAt: cmoNowIso(),
    updatedAt: cmoNowIso(),
    title: (args.title || '').trim() || titleForObjective(objective),
    objective,
    offer,
    audienceSnapshotId: args.audience.id,
    prospectIds: args.audience.prospectIds,
    channels,
    status: 'draft',
    season: seasonForObjective(objective),
    expectedDailyLeads: estimateDailyLeadPotential(args.audience.prospectIds.length, channels),
    strategy: {
      bigIdea: bigIdeaForObjective(objective),
      promise: promiseForObjective(objective),
      audiencePain: painForObjective(objective),
      objectionPlan: objectionsForObjective(objective),
      proofPlan: ['Founder POV video', 'case-style education post', 'testimonial capture', 'behind-the-scenes authority proof'],
      ctaPlan: ctasForObjective(objective),
      contentPillars: pillarsForObjective(objective),
    },
  };
  const scored = scoreConversionCopy150(`${campaign.title}\n${campaign.offer}\n${campaign.strategy.bigIdea}\n${campaign.strategy.promise}\n${campaign.strategy.ctaPlan.join('\n')}`);
  campaign.score150 = scored.score;
  campaign.riskLevel = scored.riskLevel;
  upsertCmoCampaign(campaign);
  emitCmoEvent({ type: 'campaign_created', source: 'marketing_agent', campaignId: campaign.id, labels: [objective, ...channels], score: campaign.score150, meta: { prospectCount: campaign.prospectIds.length } });
  return campaign;
}

export function createStarterAssetsForCampaign(campaignId: string): CmoAsset[] {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const items: Array<Pick<CmoAsset, 'kind' | 'title' | 'body' | 'channel'>> = [
    {
      kind: 'social_post',
      channel: campaign.channels[0] ?? 'shorts',
      title: 'Scroll-stopper post',
      body: `${campaign.strategy.bigIdea}\n\n${campaign.strategy.audiencePain}\n\n${campaign.strategy.promise}\n\nCTA: ${campaign.strategy.ctaPlan[0] ?? 'Book a consultation.'}`,
    },
    {
      kind: 'email',
      channel: 'email',
      title: `${campaign.title} — email opener`,
      body: `Subject: ${campaign.strategy.promise}\n\nMost people do not need another random tip. They need a cleaner plan.\n\n${campaign.strategy.audiencePain}\n\nHere is the move: ${campaign.offer}.\n\n${campaign.strategy.ctaPlan[0] ?? 'Book a private consultation today.'}`,
    },
    {
      kind: 'sms',
      channel: 'sms',
      title: `${campaign.title} — SMS opener`,
      body: `Finely Cred: quick question — do you want us to map the cleanest next move for ${campaign.offer}? Reply YES and we will send the next step.`,
    },
    {
      kind: 'video_script',
      channel: campaign.channels.includes('shorts') ? 'shorts' : campaign.channels[0],
      title: `${campaign.title} — 30s Shorts script`,
      body: `HOOK: ${campaign.strategy.bigIdea}\nSCENE 1: Call out the costly mistake.\nSCENE 2: Explain ${campaign.strategy.audiencePain}\nSCENE 3: Show the cleaner strategy: ${campaign.offer}\nSCENE 4: Proof cue: ${campaign.strategy.proofPlan[0]}\nCTA: ${campaign.strategy.ctaPlan[0] ?? 'Book the consultation.'}`,
    },
    {
      kind: 'press_pitch',
      channel: 'press',
      title: `${campaign.title} — interview pitch`,
      body: `Pitch angle: ${campaign.strategy.bigIdea}\n\nFinely Cred can speak on why ${campaign.strategy.audiencePain.toLowerCase()} and what consumers/business owners should understand before making expensive credit or funding decisions. Available for interviews, expert commentary, and educational segments.`,
    },
  ];
  return items.map((item) => {
    const scored = scoreConversionCopy150(item.body);
    const asset: CmoAsset = {
      id: newId('cmoasset'),
      campaignId,
      createdAt: cmoNowIso(),
      updatedAt: cmoNowIso(),
      kind: item.kind,
      channel: item.channel,
      title: item.title,
      body: item.body,
      score150: scored.score,
      riskLevel: scored.riskLevel,
      complianceFlags: scored.complianceFlags,
      status: scored.riskLevel === 'blocked' ? 'blocked' : 'draft',
      meta: { strengths: scored.strengths, fixes: scored.fixes },
    };
    upsertCmoAsset(asset);
    emitCmoEvent({ type: 'asset_created', source: 'marketing_agent', campaignId, assetId: asset.id, channel: asset.channel, score: asset.score150, labels: [asset.kind, ...(asset.complianceFlags ?? [])] });
    return asset;
  });
}

export function pushCampaignAssetsToComms(campaignId: string): { templateIds: string[]; sequenceId?: string } {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const assets = listCmoAssets(campaignId).filter((a) => a.kind === 'email' || a.kind === 'sms');
  const created = assets.map((asset) => {
    const channel = asset.kind === 'sms' ? 'sms' : 'email';
    const template = createCommsTemplate({
      name: `CMO • ${campaign.title} • ${asset.kind.toUpperCase()}`,
      channel,
      enabled: false,
      subjectTemplate: channel === 'email' ? asset.title : undefined,
      bodyTemplate: asset.body,
      tags: ['cmo', 'growth-os', campaign.objective, campaign.id],
      meta: { campaignId, assetId: asset.id, source: 'cmo_phase2' },
    });
    upsertCmoAsset({ ...asset, linkedTemplateId: template.id, status: asset.status === 'blocked' ? 'blocked' : 'needs_review' });
    emitCommsEvent({ type: 'asset_created', campaignId, assetId: asset.id, channel: channel as any, meta: { templateId: template.id } });
    return template;
  });
  let sequenceId: string | undefined;
  if (created.length) {
    const seq = createCommsSequence({ name: `CMO Sequence • ${campaign.title}`, defaultChannel: created[0]?.channel ?? 'email', enabled: false });
    const steps = created.map((tpl, idx) => ({ id: newId('step'), templateId: tpl.id, delayHours: idx === 0 ? 0 : idx * 24, channel: tpl.channel }));
    const saved = upsertCommsSequence({ ...seq, tags: ['cmo', campaign.objective, campaign.id], steps, meta: { campaignId, source: 'cmo_phase2', safeDraft: true } });
    sequenceId = saved.id;
  }
  return { templateIds: created.map((t) => t.id), sequenceId };
}

export function pushCampaignToMediaStudio(campaignId: string) {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const script = listCmoAssets(campaignId).find((a) => a.kind === 'video_script');
  const project = createMediaProject({ title: `CMO Reel • ${campaign.title}`, aspect: '9:16', stylePreset: 'luxury' });
  const lines = (script?.body || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
  const sceneLines = lines.length ? lines : [campaign.strategy.bigIdea, campaign.strategy.promise, campaign.strategy.ctaPlan[0] ?? 'Book a consultation.'];
  sceneLines.forEach((line, index) => {
    addScene(project.id, {
      caption: line.replace(/^(HOOK|SCENE \d+|CTA):\s*/i, ''),
      prompt: `Finely Cred luxury dark gold cinematic vertical video scene, ${campaign.offer}, ${line}, premium, clean, high-conversion, no clutter`,
      durationSec: index === 0 ? 3 : 4,
    });
  });
  const active = upsertMediaProject({ ...project, title: `CMO Reel • ${campaign.title}` });
  if (script) upsertCmoAsset({ ...script, linkedMediaProjectId: active.id, status: script.status === 'blocked' ? 'blocked' : 'needs_review' });
  emitMediaEvent({ type: 'asset_created', campaignId, assetId: script?.id, channel: 'shorts', meta: { mediaProjectId: active.id, scenes: sceneLines.length } });
  return active;
}

export function scheduleCampaignContent(campaignId: string, startDateIso?: string): CmoScheduledPost[] {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const settings = getCmoSettings();
  const assets = listCmoAssets(campaignId).filter((a) => ['social_post', 'video_script', 'press_pitch'].includes(a.kind));
  const base = startDateIso ? new Date(startDateIso) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const posts = assets.slice(0, 14).map((asset, idx) => {
    const date = new Date(base.getTime() + idx * 24 * 60 * 60 * 1000);
    date.setHours(idx % 2 === 0 ? 10 : 18, 30, 0, 0);
    const post: CmoScheduledPost = {
      id: newId('cmopost'),
      campaignId,
      assetId: asset.id,
      createdAt: cmoNowIso(),
      updatedAt: cmoNowIso(),
      channel: asset.channel ?? campaign.channels[idx % Math.max(1, campaign.channels.length)] ?? 'shorts',
      scheduledFor: date.toISOString(),
      title: asset.title,
      caption: asset.body,
      status: settings.approvalMode === 'safe_auto_execute' && asset.riskLevel !== 'blocked' ? 'approved' : 'needs_review',
      checklist: [
        { id: newId('chk'), text: 'Confirm CTA link is correct', done: false },
        { id: newId('chk'), text: 'Confirm compliance-safe wording', done: (asset.complianceFlags ?? []).length === 0 },
        { id: newId('chk'), text: 'Attach visual/video asset', done: Boolean(asset.linkedMediaProjectId) },
      ],
      meta: { source: 'cmo_phase2', score150: asset.score150, approvalRequired: settings.approvalMode !== 'safe_auto_execute' },
    };
    upsertCmoScheduledPost(post);
    upsertCmoAsset({ ...asset, scheduledPostId: post.id, status: asset.status === 'blocked' ? 'blocked' : 'needs_review' });
    emitCmoEvent({ type: 'post_scheduled', source: 'scheduler', campaignId, assetId: asset.id, channel: post.channel, score: asset.score150, meta: { postId: post.id, scheduledFor: post.scheduledFor } });
    return post;
  });
  return posts;
}

export function routeEngagementText(args: { text: string; source?: 'comment' | 'dm' | 'email_reply' | 'sms_reply' | 'form' | 'manual'; channel?: CmoChannel; campaignId?: string; prospectId?: string; author?: string }) {
  const classified = classifyGrowthIntent(args.text);
  const item = {
    id: newId('cmoeng'),
    createdAt: cmoNowIso(),
    updatedAt: cmoNowIso(),
    source: args.source ?? 'manual',
    channel: args.channel,
    campaignId: args.campaignId,
    prospectId: args.prospectId,
    author: args.author,
    text: args.text,
    intent: classified.intent,
    confidence: classified.confidence,
    suggestedReply: classified.suggestedReply,
    suggestedAction: classified.suggestedAction,
    status: classified.intent === 'spam' ? 'archived' : 'needs_review',
  } as const;
  const saved = upsertCmoEngagement(item as any);
  emitCmoEvent({ type: args.source === 'dm' ? 'dm_received' : args.source === 'comment' ? 'comment_received' : 'reply_received', source: 'inbox', campaignId: args.campaignId, prospectId: args.prospectId, channel: args.channel, labels: [classified.intent], score: Math.round(classified.confidence * 100), meta: { engagementId: saved.id } });
  return saved;
}

export function markCampaignProspectsOutreachSent(campaignId: string) {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const changed = campaign.prospectIds.map((id) => {
    addProspectNote(id, `CMO campaign queued/outreach prepared: ${campaign.title}`);
    return setProspectStage(id, 'outreach_sent');
  });
  emitCmoEvent({ type: 'outreach_sent', source: 'crm', campaignId, meta: { prospectCount: changed.filter(Boolean).length } });
  return changed.filter(Boolean);
}

export function createCampaignFollowUpTasks(campaignId: string) {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const tasks = [
    createTask({
      partnerId: 'admin_growth',
      title: `Review CMO campaign assets: ${campaign.title}`,
      kind: 'follow_up',
      priority: 'high',
      status: 'pending',
      stage: 'funding',
      dueAt: due,
      visibility: 'admin',
      assignedTo: 'admin',
      tags: ['cmo', 'campaign', campaign.objective],
      labels: ['Growth OS'],
      notes: `Campaign ${campaign.id} needs approval, scheduling, and follow-up setup.`,
      meta: { campaignId, source: 'cmo_phase2' },
    } as any),
    createTask({
      partnerId: 'admin_growth',
      title: `Check lead response and scale/kill list: ${campaign.title}`,
      kind: 'follow_up',
      priority: 'normal',
      status: 'pending',
      stage: 'funding',
      dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      visibility: 'admin',
      assignedTo: 'admin',
      tags: ['cmo', 'analytics', campaign.objective],
      labels: ['Growth OS'],
      notes: 'Review comments, replies, booked calls, and lead quality. Double down on winners. Kill weak hooks without mercy.',
      meta: { campaignId, source: 'cmo_phase2' },
    } as any),
  ];
  emitCmoEvent({ type: 'playbook_executed', source: 'automation', campaignId, meta: { tasks: tasks.map((t) => t.id) } });
  return tasks;
}

export function buildDefaultPlaybooks(): CmoPlaybook[] {
  return [
    {
      id: 'month1_authority_interviews',
      title: 'Month 1 Authority + Interview Machine',
      objective: 'get_interviews',
      description: 'Build credibility fast with Shorts, LinkedIn POVs, press pitches, and expert-commentary outreach.',
      dailyLeadTarget: 50,
      channels: ['shorts', 'linkedin', 'press', 'podcast', 'email'],
      automationLevel: 'approve_then_execute',
      safeExecutionOnly: true,
      steps: [
        { id: 's1', title: 'Build authority audience', ownerRole: 'lead_gen_manager', actionKind: 'route_leads', expectedOutput: 'Lead Intel/CRM segment for reporters, podcasters, partners, and high-intent clients.', requiresHumanApproval: false },
        { id: 's2', title: 'Create interview angles', ownerRole: 'press_director', actionKind: 'create_campaign', expectedOutput: 'Press/interview campaign and pitch assets.', requiresHumanApproval: true },
        { id: 's3', title: 'Create Shorts authority series', ownerRole: 'creative_director', actionKind: 'create_media', expectedOutput: 'Shorts storyboard assets and production queue.', requiresHumanApproval: true },
        { id: 's4', title: 'Create outreach sequence', ownerRole: 'growth_operator', actionKind: 'create_comms', expectedOutput: 'Email/SMS sequence drafts in Comms Studio.', requiresHumanApproval: true },
      ],
    },
    {
      id: 'month2_product_offer_push',
      title: 'Month 2 Offer + Product Push',
      objective: 'sell_course_or_book',
      description: 'Turn attention into product/book/course sales with proof-led content and clean CTA routing.',
      dailyLeadTarget: 75,
      channels: ['shorts', 'instagram_reels', 'email', 'sms', 'affiliate'],
      automationLevel: 'approve_then_execute',
      safeExecutionOnly: true,
      steps: [
        { id: 's1', title: 'Segment buyers', ownerRole: 'lead_gen_manager', actionKind: 'route_leads', expectedOutput: 'Audience snapshot grouped by offer fit.', requiresHumanApproval: false },
        { id: 's2', title: 'Build offer campaign', ownerRole: 'copy_chief', actionKind: 'create_campaign', expectedOutput: 'Sales campaign with hooks, emails, SMS, posts, and landing copy.', requiresHumanApproval: true },
        { id: 's3', title: 'Schedule content', ownerRole: 'growth_operator', actionKind: 'schedule_posts', expectedOutput: '14-day posting queue.', requiresHumanApproval: true },
      ],
    },
    {
      id: 'evergreen_200_lead_engine',
      title: 'Evergreen 200 Leads/Day Engine',
      objective: 'generate_leads',
      description: 'A realistic, clean-growth operating loop toward 200 daily leads through content, affiliate, nurture, press, and Lead Intel.',
      dailyLeadTarget: 200,
      channels: ['shorts', 'instagram_reels', 'tiktok', 'email', 'sms', 'affiliate', 'referral', 'manual_outreach'],
      automationLevel: 'approve_then_execute',
      safeExecutionOnly: true,
      steps: [
        { id: 's1', title: 'Build daily audience segments', ownerRole: 'lead_gen_manager', actionKind: 'route_leads', expectedOutput: 'Lead Intel segments for clients, affiliates, agents, and B2B partners.', requiresHumanApproval: false },
        { id: 's2', title: 'Generate campaigns by segment', ownerRole: 'cmo_prime', actionKind: 'create_campaign', expectedOutput: 'Campaigns matched to each segment and objective.', requiresHumanApproval: true },
        { id: 's3', title: 'Create Comms follow-up', ownerRole: 'automation_architect', actionKind: 'create_comms', expectedOutput: 'Comms Studio draft templates and sequences.', requiresHumanApproval: true },
        { id: 's4', title: 'Create media production queue', ownerRole: 'creative_director', actionKind: 'create_media', expectedOutput: 'Media Studio projects for Shorts/Reels and visual posts.', requiresHumanApproval: true },
        { id: 's5', title: 'Schedule and review', ownerRole: 'growth_operator', actionKind: 'schedule_posts', expectedOutput: 'Approved internal schedule queue with manual publish checklist.', requiresHumanApproval: true },
      ],
    },
  ];
}

export function runSafeCmoPlaybook(args: { playbookId: string; segment?: SegmentArgs; offer?: string }): { directive: CmoDirective; campaign?: CmoCampaign; assets: CmoAsset[] } {
  const playbook = buildDefaultPlaybooks().find((p) => p.id === args.playbookId);
  if (!playbook) throw new Error('Playbook not found.');
  const settings = getCmoSettings();
  const audience = buildAudienceFromLeadIntel(args.segment ?? { stage: 'contact_ready', minScore: 25, limit: 150 });
  const campaign = createCampaignFromAudience({ audience, offer: args.offer, objective: playbook.objective, title: playbook.title });
  const assets = createStarterAssetsForCampaign(campaign.id);
  const directive: CmoDirective = {
    id: newId('cmodir'),
    createdAt: cmoNowIso(),
    updatedAt: cmoNowIso(),
    role: 'cmo_prime',
    title: `${playbook.title} is staged`,
    body: `I built the campaign shell, audience snapshot, starter assets, and next actions. I did not auto-publish or spam anyone. Clean growth only. The machine has a seatbelt because lawsuits are not a marketing strategy.`,
    priority: playbook.dailyLeadTarget >= 200 ? 'urgent' : 'high',
    status: settings.approvalMode === 'safe_auto_execute' ? 'approved' : 'needs_review',
    playbookId: playbook.id,
    campaignId: campaign.id,
    actions: playbook.steps.map((step) => ({ id: newId('cmoact'), label: step.title, kind: step.actionKind, status: step.requiresHumanApproval ? 'needs_review' : 'draft', meta: { expectedOutput: step.expectedOutput, ownerRole: step.ownerRole } })),
    meta: { dailyLeadTarget: playbook.dailyLeadTarget, safeExecutionOnly: playbook.safeExecutionOnly, automationLevel: playbook.automationLevel },
  };
  upsertCmoDirective(directive);
  emitCmoEvent({ type: 'directive_created', source: 'marketing_agent', campaignId: campaign.id, labels: [playbook.id, playbook.objective], meta: { directiveId: directive.id } });
  return { directive, campaign, assets };
}

export function executeApprovedCampaignBuildout(campaignId: string) {
  const campaign = getCmoCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const comms = pushCampaignAssetsToComms(campaignId);
  const media = pushCampaignToMediaStudio(campaignId);
  const posts = scheduleCampaignContent(campaignId);
  const tasks = createCampaignFollowUpTasks(campaignId);
  upsertCmoCampaign({ ...campaign, status: 'active' });
  return { comms, mediaProjectId: media.id, scheduledPostIds: posts.map((p) => p.id), taskIds: tasks.map((t) => t.id) };
}

function offerForObjective(objective: CmoObjective) {
  switch (objective) {
    case 'get_interviews':
    case 'build_authority':
      return 'Expert commentary, founder POV, and authority education around credit, funding readiness, and business growth.';
    case 'recruit_specialists':
      return 'Credit Specialist opportunity for disciplined operators who want a serious growth path.';
    case 'enroll_affiliates':
      return 'Affiliate and referral partner path for people with finance, credit, real estate, trucking, or business-owner audiences.';
    case 'sell_course_or_book':
      return 'Book/course education offer that turns curiosity into a first paid step.';
    case 'promote_funding':
      return 'Funding readiness consultation and strategy review.';
    case 'promote_tradelines':
      return 'Tradeline/AU education and fit review with compliant expectations.';
    case 'promote_business_credit':
      return 'Business credit roadmap consultation.';
    default:
      return 'Private Finely Cred consultation and custom roadmap.';
  }
}

function titleForObjective(objective: CmoObjective) {
  return objective.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function seasonForObjective(objective: CmoObjective): CmoCampaign['season'] {
  if (objective === 'get_interviews' || objective === 'build_authority') return 'month_1_authority';
  if (objective === 'sell_course_or_book' || objective === 'promote_business_credit' || objective === 'promote_funding') return 'month_2_offer';
  if (objective === 'enroll_affiliates' || objective === 'recruit_specialists') return 'month_3_affiliate';
  return 'evergreen';
}
function estimateDailyLeadPotential(prospectCount: number, channels: CmoChannel[]) {
  return Math.max(5, Math.min(200, Math.round(prospectCount * 0.08 + channels.length * 8)));
}
function bigIdeaForObjective(objective: CmoObjective) {
  if (objective === 'get_interviews') return 'Most credit/funding advice is loud. Finely Cred brings the calm, strategic version worth quoting.';
  if (objective === 'recruit_specialists') return 'A credit specialist should be more than a salesperson — they should be a disciplined growth operator.';
  if (objective === 'enroll_affiliates') return 'The right affiliate partner turns trust into clean, trackable revenue without turning the audience into a cash register.';
  if (objective === 'promote_funding') return 'Funding does not start with an application. It starts with readiness.';
  return 'The expensive mistake is chasing tactics before the roadmap is clear.';
}
function promiseForObjective(objective: CmoObjective) {
  if (objective === 'get_interviews') return 'A credible expert voice for modern credit, funding readiness, and business growth conversations.';
  if (objective === 'recruit_specialists') return 'A premium lane for people who can follow up, educate, and convert with integrity.';
  if (objective === 'enroll_affiliates') return 'A partner path with clear offers, clean tracking, and conversion-ready assets.';
  if (objective === 'promote_funding') return 'A sharper view of what may block funding before money is on the line.';
  return 'A custom roadmap that turns confusion into the next clean move.';
}
function painForObjective(objective: CmoObjective) {
  if (objective === 'get_interviews') return 'The market is drowning in noisy credit content and needs a voice that can explain the real strategy.';
  if (objective === 'recruit_specialists') return 'Most people want opportunity but do not have a system, offer, or serious training path.';
  if (objective === 'enroll_affiliates') return 'Good audiences get wasted when referral paths are unclear or generic.';
  if (objective === 'promote_funding') return 'Business owners often apply before they are ready and collect denials like terrible souvenirs.';
  return 'People keep buying isolated tactics instead of solving the actual bottleneck.';
}
function objectionsForObjective(objective: CmoObjective) {
  return [
    'Is this guaranteed? Answer with process, not promises.',
    'How much does it cost? Route to fit and consultation.',
    'How fast does it work? Explain readiness, review, and realistic timing.',
    objective === 'get_interviews' ? 'Why are you credible? Lead with expertise, clarity, and audience relevance.' : 'Why should I trust this? Lead with proof, education, and next-step clarity.',
  ];
}
function ctasForObjective(objective: CmoObjective) {
  if (objective === 'get_interviews') return ['Book Finely Cred for an expert interview.', 'Request founder commentary.', 'Send the media inquiry.'];
  if (objective === 'recruit_specialists') return ['Apply for the Credit Specialist path.', 'Start the specialist review.', 'Request the opportunity details.'];
  if (objective === 'enroll_affiliates') return ['Apply to become a referral partner.', 'Request affiliate details.', 'Start the partner fit review.'];
  return ['Book a private consultation.', 'Get your custom roadmap.', 'Start with a strategy review.'];
}
function pillarsForObjective(objective: CmoObjective) {
  if (objective === 'get_interviews') return ['myth-busting', 'founder POV', 'market education', 'press-ready commentary'];
  if (objective === 'recruit_specialists') return ['opportunity', 'training', 'income path', 'discipline', 'client impact'];
  if (objective === 'enroll_affiliates') return ['partnership', 'audience trust', 'offer clarity', 'tracking', 'recurring opportunities'];
  return ['education', 'proof', 'objection handling', 'next-step clarity', 'premium positioning'];
}
export function channelLabel(ch: CmoChannel) {
  return channelList([ch]);
}
