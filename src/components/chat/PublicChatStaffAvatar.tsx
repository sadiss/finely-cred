import { FinelyAssistantAvatar } from '../brand/FinelyAssistantAvatar';
import type { PublicChatPersonaPresentation } from './publicChatPersonaUi';

type Props = {
  presentation: PublicChatPersonaPresentation;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
};

/** Chat chrome uses the Finely medallion. Specialist photos stay on roster cards. */
export function PublicChatStaffAvatar({ size = 'md', showOnline = false }: Props) {
  return (
    <div className="relative shrink-0">
      <FinelyAssistantAvatar size={size} />
      {showOnline ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#faf6ee] shadow-[0_0_10px_rgba(52,211,153,0.75)]"
          title="Online now"
        />
      ) : null}
    </div>
  );
}
