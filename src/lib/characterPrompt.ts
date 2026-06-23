import type { MediaProject, MediaScene } from '../domain/mediaStudio';

export function buildCharacterContinuityPrompt(project: MediaProject, scene: MediaScene): string {
  const lines: string[] = [
    'Finely Cred Brand Style: maintain a premium financial tone using wealth green, platinum, and warm gold visual palettes.',
    'Keep visuals clean, trusted, cinematic, and suitable for credit/funding education.',
  ];

  const refs = (scene.characterRefIds ?? [])
    .map((refId) => (project.characterRefs ?? []).find((c) => c.id === refId))
    .filter(Boolean) as NonNullable<MediaProject['characterRefs']>;

  if (refs.length) {
    lines.push('', 'CHARACTER CONTINUITY ENFORCEMENT:');
    lines.push('Preserve the same character identity, face, outfit, posture, tone, and visual continuity across scenes.');
    refs.forEach((ref) => {
      lines.push(`- Character Name: ${ref.name}`);
      if (ref.notes?.trim()) lines.push(`  Notes: ${ref.notes.trim()}`);
    });
  }

  if (scene.motionPrompt?.trim()) {
    lines.push('', 'MOTION INSTRUCTIONS:', scene.motionPrompt.trim());
  }

  return lines.join('\n');
}
