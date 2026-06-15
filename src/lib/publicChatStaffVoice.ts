import type { AgentPersonaId } from '../domain/agentPersonas';
import { getAgentPersona } from '../domain/agentPersonas';
import { getStaffMemberById } from '../data/staffRoster';
import { buildDefaultNarration } from '../resources/guideNarration';
import type { VoiceProfile } from '../resources/voiceProfiles';
import { getPublicVoiceProfile, getVoiceStudioStatus, renderVoiceAsset, resolveVoiceAsset, sha256Text } from './voiceStudioClient';

let activeAudio: HTMLAudioElement | null = null;
let activeRevoke: (() => void) | null = null;

export function stopStaffReplyAudio() {
  activeRevoke?.();
  activeRevoke = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
}

function resolveVoiceProfileForChat(args: {
  personaId: AgentPersonaId;
  staffMemberId?: string;
}): VoiceProfile {
  if (args.staffMemberId) {
    const member = getStaffMemberById(args.staffMemberId);
    if (member) {
      const roleVoice = getAgentPersona(member.primaryRoleId)?.voiceProfile;
      if (roleVoice) return roleVoice as VoiceProfile;
    }
  }
  const persona = getAgentPersona(args.personaId);
  return (persona?.voiceProfile as VoiceProfile | undefined) ?? getPublicVoiceProfile('finely_cred');
}

function displayNameForAudio(args: { personaId: AgentPersonaId; staffMemberId?: string }): string {
  if (args.staffMemberId) {
    const member = getStaffMemberById(args.staffMemberId);
    if (member) return member.firstName;
  }
  return getAgentPersona(args.personaId)?.name ?? 'Finely staff';
}

/** Human-quality staff reply audio via Voice Studio — never browser robot TTS. */
export async function playStaffReplyAudio(args: {
  text: string;
  personaId: AgentPersonaId;
  staffMemberId?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const trimmed = args.text.trim().slice(0, 1200);
  if (!trimmed) return { ok: false, reason: 'empty' };

  const studio = getVoiceStudioStatus();
  if (!studio.available) {
    return {
      ok: false,
      reason: 'Premium voice is loading — configure Voice Studio in production for natural narration.',
    };
  }

  stopStaffReplyAudio();

  const voiceProfile = resolveVoiceProfileForChat(args);
  const displayName = displayNameForAudio(args);
  const hash = (await sha256Text(trimmed)).slice(0, 16);
  const contentId = args.staffMemberId
    ? `public-chat-staff-${args.staffMemberId}-${hash}`
    : `public-chat-${args.personaId}-${hash}`;
  const title = `${displayName} reply`;

  const narration = buildDefaultNarration(contentId, title, [
    { heading: displayName, bullets: [trimmed] },
  ]);

  try {
    let url: string | null = null;
    let revoke: (() => void) | undefined;

    const resolved = await resolveVoiceAsset({
      tenantId: 'finely_cred',
      contentType: 'guide',
      contentId,
      title,
      narration,
      voiceProfile,
    });
    if (resolved) {
      url = resolved.url;
      revoke = resolved.revoke;
    } else {
      const rendered = await renderVoiceAsset({
        tenantId: 'finely_cred',
        contentType: 'guide',
        contentId,
        title,
        narration,
        voiceProfile,
      });
      url = rendered.url;
      revoke = rendered.revoke;
    }

    if (!url) return { ok: false, reason: 'Could not load voice asset.' };

    activeRevoke = revoke ?? null;
    const audio = new Audio(url);
    activeAudio = audio;
    await audio.play();
    audio.onended = () => stopStaffReplyAudio();
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: (e as Error)?.message ?? 'Playback failed' };
  }
}
