import discoveryRaw from './templates/creditor-discovery.txt?raw';
import motionRaw from './templates/motion-to-compel.txt?raw';
import type { LitigationLetterArgs } from './litigationLetterArgs';
import { fillLitigation } from './litigationLetterArgs';

function applyPartyNames(t: string, args: LitigationLetterArgs): string {
  const plaintiff = args.plaintiffName;
  const defendant = args.debtorName;
  let out = t;
  out = out.replace(/CITIBANK, N\.A\./g, plaintiff);
  out = out.replace(/CITIBANK/g, plaintiff.toUpperCase());
  out = out.replace(/Citibank/g, plaintiff);
  out = out.replace(/CITIGROUP/g, plaintiff.toUpperCase());
  out = out.replace(/CitiGroup/g, plaintiff);
  out = out.replace(/Citigroup/g, plaintiff);
  out = out.replace(/Natasha A\. Debtor/g, defendant);
  out = out.replace(/Jillian A\. Debtor/g, defendant);
  out = out.replace(/Ms\. Jillian A\. Debtor/g, defendant);
  out = out.replace(/Ms\. Debtor/g, defendant);
  out = out.replace(/DEFENDANT ANSWER AND AFFIRMATIVE DEFENSES/g, 'MOTION TO COMPEL DISCOVERY');
  return out;
}

export function getLitigationDiscoveryRequestsBody(args: LitigationLetterArgs): string {
  const base = fillLitigation(applyPartyNames(discoveryRaw, args), args);
  return base;
}

export function getLitigationMotionToCompelBody(args: LitigationLetterArgs): string {
  const base = fillLitigation(applyPartyNames(motionRaw, args), args);
  return base;
}
