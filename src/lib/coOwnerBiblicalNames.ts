/**
 * Biblical first names for AI staff the co-owner hires autonomously.
 */

export type BiblicalName = { firstName: string; lastName: string; portraitGender: 'feminine' | 'masculine' };

const MALE: BiblicalName[] = [
  { firstName: 'Daniel', lastName: 'Benjamin', portraitGender: 'masculine' },
  { firstName: 'Samuel', lastName: 'David', portraitGender: 'masculine' },
  { firstName: 'Joseph', lastName: 'Solomon', portraitGender: 'masculine' },
  { firstName: 'Joshua', lastName: 'Caleb', portraitGender: 'masculine' },
  { firstName: 'Ethan', lastName: 'Nathan', portraitGender: 'masculine' },
  { firstName: 'Micah', lastName: 'Isaiah', portraitGender: 'masculine' },
  { firstName: 'Timothy', lastName: 'Silas', portraitGender: 'masculine' },
  { firstName: 'Luke', lastName: 'Matthew', portraitGender: 'masculine' },
  { firstName: 'Andrew', lastName: 'Philip', portraitGender: 'masculine' },
  { firstName: 'Benjamin', lastName: 'Levi', portraitGender: 'masculine' },
  { firstName: 'Aaron', lastName: 'Elijah', portraitGender: 'masculine' },
  { firstName: 'Noah', lastName: 'Abraham', portraitGender: 'masculine' },
];

const FEMALE: BiblicalName[] = [
  { firstName: 'Deborah', lastName: 'Hannah', portraitGender: 'feminine' },
  { firstName: 'Esther', lastName: 'Abigail', portraitGender: 'feminine' },
  { firstName: 'Sarah', lastName: 'Rebecca', portraitGender: 'feminine' },
  { firstName: 'Miriam', lastName: 'Lydia', portraitGender: 'feminine' },
  { firstName: 'Priscilla', lastName: 'Phoebe', portraitGender: 'feminine' },
  { firstName: 'Martha', lastName: 'Elizabeth', portraitGender: 'feminine' },
  { firstName: 'Joanna', lastName: 'Susanna', portraitGender: 'feminine' },
  { firstName: 'Leah', lastName: 'Rachel', portraitGender: 'feminine' },
  { firstName: 'Naomi', lastName: 'Orpah', portraitGender: 'feminine' },
  { firstName: 'Hannah', lastName: 'Peninnah', portraitGender: 'feminine' },
];

let nameCursor = 0;

export function pickBiblicalName(seed: string, preferFeminine = false): BiblicalName {
  const pool = preferFeminine ? FEMALE : MALE;
  const idx = (hashString(seed) + nameCursor++) % pool.length;
  return pool[idx]!;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickBiblicalNameForExecutive(hatId: string, title: string): BiblicalName {
  const feminineTitles = /people|marketing|partner|culture|concierge|education/i;
  return pickBiblicalName(`${hatId}-${title}`, feminineTitles.test(title));
}
