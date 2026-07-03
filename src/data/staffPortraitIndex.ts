/** Deterministic unique portrait index per staff id — every agent gets a distinct headshot. */

export function portraitIndexFromStaffId(staffId: string): number {
  let h = 0;
  for (let i = 0; i < staffId.length; i += 1) {
    h = (h * 31 + staffId.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

export function portraitTuningFromStaffId(staffId: string) {
  const idx = portraitIndexFromStaffId(staffId);
  return {
    portraitIndex: idx,
    warmShift: idx % 5,
    saturation: 0.86 + (idx % 10) * 0.008,
  };
}
