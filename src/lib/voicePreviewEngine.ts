import { getExpandedVoice, type ExpandedVoiceEntry } from '../data/expandedVoiceCatalog';

export function voicePreviewParams(voice: ExpandedVoiceEntry): { pitch: number; rate: number; gender: ExpandedVoiceEntry['gender'] } {
  const pitch = voice.gender === 'masculine' ? 0.82 : voice.gender === 'feminine' ? 1.12 : 1;
  const rate = voice.energy === 'high' ? 1.08 : voice.energy === 'low' ? 0.92 : 1;
  return { pitch, rate, gender: voice.gender };
}

export function previewLineForVoice(voice: ExpandedVoiceEntry): string {
  if (voice.useCases.includes('commercial')) {
    return `Hi, I'm your ${voice.tone} commercial voice. Let's make your Finely Cred message sound premium and clear.`;
  }
  if (voice.useCases.includes('testimonial')) {
    return `This is a warm testimonial read. Real results, real confidence, delivered in a ${voice.tone} tone.`;
  }
  if (voice.useCases.includes('course')) {
    return `Lesson one begins here. I'll guide your partner through credit education with a ${voice.tone}, professional delivery.`;
  }
  return `Finely Cred voice preview — ${voice.label}.`;
}

export function resolveVoicePreview(voiceId: string) {
  const voice = getExpandedVoice(voiceId);
  if (!voice) return null;
  return { voice, ...voicePreviewParams(voice), text: previewLineForVoice(voice) };
}
