import './../../brand/finelyAssistantBrand.css';
import { FINELY_ASSISTANT_ALT, FINELY_ASSISTANT_AVATAR } from '../../brand/finelyAssistantBrand';

const PX = { sm: 36, md: 44, lg: 56 } as const;

/** Locked Finely medallion. Alt text is the assistant name, not a staff portrait. */
export function FinelyAssistantAvatar({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof PX;
  className?: string;
}) {
  const px = PX[size];
  return (
    <img
      src={FINELY_ASSISTANT_AVATAR}
      alt={FINELY_ASSISTANT_ALT}
      width={px}
      height={px}
      className={`fc-assistant-mark ${className}`.trim()}
    />
  );
}
