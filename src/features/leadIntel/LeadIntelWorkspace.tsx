import { LeadIntelHub } from './LeadIntelHub';

type Props = {
  embedded?: boolean;
  showCompliance?: boolean;
};

/** @deprecated Use LeadIntelHub directly — kept for existing imports. */
export function LeadIntelWorkspace(props: Props) {
  return <LeadIntelHub {...props} />;
}

export { LeadIntelHub } from './LeadIntelHub';
export type { IntelResult } from './leadIntelModel';
