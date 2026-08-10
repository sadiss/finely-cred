// Simulate browser import order for staff command center
const { getStaffRoster } = await import('../src/features/staffCommandCenter/staffRoster.ts');
const { STAFF_DEPARTMENTS, GEO_CLUSTERS } = await import('../src/features/staffCommandCenter/staffDirectory.ts');
const { loadStaffCommandStore } = await import('../src/features/staffCommandCenter/staffCommandRepo.ts');

console.log('roster', getStaffRoster().length);
console.log('depts', STAFF_DEPARTMENTS.length);
console.log('geo', GEO_CLUSTERS.length);
const store = loadStaffCommandStore();
console.log('missions', store.missions.length);
for (const m of store.missions) {
  if (!m.leadOwner?.portrait) {
    console.error('BAD MISSION leadOwner', m.request?.id, m.leadOwner);
  }
}
