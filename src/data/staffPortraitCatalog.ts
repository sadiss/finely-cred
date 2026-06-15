/**
 * Per-agent portrait tuning — each member gets a unique randomuser.me portrait index
 * (real people photos) plus build-time color grade so they don't read as raw stock.
 */
export type StaffPortraitSource = {
  /** randomuser.me portraits/{women|men}/{index}.jpg — 0–99 */
  portraitIndex: number;
  warmShift?: number;
  saturation?: number;
};

export const STAFF_PORTRAIT_CATALOG: Record<string, StaffPortraitSource> = {
  'staff-morgan-hale': { portraitIndex: 44, warmShift: 3, saturation: 0.9 },
  'staff-taylor-brooks': { portraitIndex: 68, warmShift: 2, saturation: 0.88 },
  'staff-marcus-reed': { portraitIndex: 32, warmShift: 4, saturation: 0.92 },
  'staff-casey-nguyen': { portraitIndex: 15, warmShift: 1, saturation: 0.89 },
  'staff-avery-luna': { portraitIndex: 21, warmShift: 2, saturation: 0.91 },
  'staff-jordan-patel': { portraitIndex: 52, warmShift: 3, saturation: 0.9 },
  'staff-sam-ortiz': { portraitIndex: 61, warmShift: 2, saturation: 0.93 },
  'staff-riley-chen': { portraitIndex: 79, warmShift: 1, saturation: 0.88 },
  'staff-alex-wright': { portraitIndex: 73, warmShift: 0, saturation: 0.91 },
  'staff-jamie-foster': { portraitIndex: 55, warmShift: 3, saturation: 0.89 },
  'staff-dana-kim': { portraitIndex: 82, warmShift: 1, saturation: 0.87 },
  'staff-elena-voss': { portraitIndex: 31, warmShift: 2, saturation: 0.9 },
  'staff-noah-grant': { portraitIndex: 18, warmShift: 1, saturation: 0.92 },
  'staff-priya-shah': { portraitIndex: 91, warmShift: 2, saturation: 0.88 },
  'staff-chris-alvarez': { portraitIndex: 47, warmShift: 4, saturation: 0.91 },
  'staff-mia-thompson': { portraitIndex: 12, warmShift: 2, saturation: 0.9 },
  'staff-derek-ford': { portraitIndex: 88, warmShift: 0, saturation: 0.93 },
  'staff-sienna-roy': { portraitIndex: 36, warmShift: 3, saturation: 0.88 },
  'staff-omar-hassan': { portraitIndex: 24, warmShift: 3, saturation: 0.9 },
  'staff-lily-martinez': { portraitIndex: 58, warmShift: 4, saturation: 0.89 },
  'staff-tyler-banks': { portraitIndex: 71, warmShift: 1, saturation: 0.92 },
  'staff-nina-cole': { portraitIndex: 7, warmShift: 2, saturation: 0.87 },
  'staff-victor-stone': { portraitIndex: 39, warmShift: 2, saturation: 0.91 },
  'staff-hannah-lee': { portraitIndex: 64, warmShift: 1, saturation: 0.88 },
  'staff-isaac-bell': { portraitIndex: 56, warmShift: 0, saturation: 0.93 },
  'staff-zara-mitchell': { portraitIndex: 48, warmShift: 3, saturation: 0.89 },
  'staff-ethan-cross': { portraitIndex: 83, warmShift: 1, saturation: 0.92 },
  'staff-ruby-santos': { portraitIndex: 26, warmShift: 4, saturation: 0.88 },
  'staff-calvin-wu': { portraitIndex: 11, warmShift: 1, saturation: 0.9 },
  'staff-jasmine-kerr': { portraitIndex: 93, warmShift: 2, saturation: 0.87 },
  'staff-leo-park': { portraitIndex: 29, warmShift: 1, saturation: 0.91 },
  'staff-ava-dunn': { portraitIndex: 17, warmShift: 2, saturation: 0.9 },
  'staff-renee-cole': { portraitIndex: 41, warmShift: 3, saturation: 0.88 },
  'staff-kai-morrison': { portraitIndex: 66, warmShift: 0, saturation: 0.92 },
  'staff-sophie-grant': { portraitIndex: 3, warmShift: 2, saturation: 0.89 },
  'staff-nate-brooks': { portraitIndex: 77, warmShift: 1, saturation: 0.93 },
  'staff-olivia-park': { portraitIndex: 85, warmShift: 1, saturation: 0.88 },
  'staff-miles-chen': { portraitIndex: 42, warmShift: 2, saturation: 0.91 },
  'staff-harper-wells': { portraitIndex: 59, warmShift: 3, saturation: 0.87 },
  'staff-nora-finch': { portraitIndex: 74, warmShift: 2, saturation: 0.9 },
  'staff-quinn-hayes': { portraitIndex: 38, warmShift: 1, saturation: 0.9 },
  'staff-leo-vance': { portraitIndex: 95, warmShift: 0, saturation: 0.92 },
  'staff-ines-ortega': { portraitIndex: 51, warmShift: 4, saturation: 0.88 },
  'staff-adrian-stone': { portraitIndex: 96, warmShift: 2, saturation: 0.91 },
  'staff-brielle-monroe': { portraitIndex: 96, warmShift: 3, saturation: 0.88 },
  'staff-cameron-blake': { portraitIndex: 97, warmShift: 1, saturation: 0.92 },
  'staff-elise-hart': { portraitIndex: 97, warmShift: 4, saturation: 0.89 },
  'staff-drew-sinclair': { portraitIndex: 98, warmShift: 0, saturation: 0.93 },
};

export type PortraitFolder = 'women' | 'men';

export function portraitFolderForGender(gender: 'feminine' | 'masculine' | 'neutral'): PortraitFolder {
  if (gender === 'masculine') return 'men';
  if (gender === 'feminine') return 'women';
  return 'women';
}

export function randomUserPortraitUrl(folder: PortraitFolder, index: number): string {
  const safe = Math.max(0, Math.min(99, index));
  return `https://randomuser.me/api/portraits/${folder}/${safe}.jpg`;
}
