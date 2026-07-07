/** Boot-time hydration for staff command center, profile overrides, and routing intelligence. */
import type { StaffProfileStore } from '../features/staffCommandCenter/staffProfileRepo';
import { loadStaffProfileStore, seedStaffProfileStore } from '../features/staffCommandCenter/staffProfileRepo';
import type { StaffCommandStore } from '../features/staffCommandCenter/types';
import { loadStaffCommandStore, seedStaffCommandStore } from '../features/staffCommandCenter/staffCommandRepo';
import type { RoutingWeights } from '../lib/staffIntelligenceEngine';
import { defaultRoutingWeights, loadRoutingWeights, seedRoutingWeights } from '../lib/staffIntelligenceEngine';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { hydrateTenantStateFromSupabase, migrateLegacyLocalJson, pushTenantStateToSupabase } from './tenantStateRepo';

const KEYS = {
  commandCenter: 'staff_command_center',
  profileOverrides: 'staff_profile_overrides',
  intelligenceWeights: 'staff_intelligence_weights',
} as const;

async function migrateLegacyCommandCenter() {
  const legacy = migrateLegacyLocalJson<StaffCommandStore>('finely.staff.command.center.v1', loadStaffCommandStore(), 1);
  if (!legacy) return;
  seedStaffCommandStore(legacy);
  if (isSupabaseConfigured) await pushTenantStateToSupabase(KEYS.commandCenter, legacy);
}

async function migrateLegacyProfiles() {
  const legacy = migrateLegacyLocalJson<StaffProfileStore>('finely.staff.roster.profiles.v1', loadStaffProfileStore(), 1);
  if (!legacy) return;
  seedStaffProfileStore(legacy);
  if (isSupabaseConfigured) await pushTenantStateToSupabase(KEYS.profileOverrides, legacy);
}

async function migrateLegacyIntelligence() {
  const legacy = migrateLegacyLocalJson<RoutingWeights>('finely.staffIntelligence.v1', loadRoutingWeights(), 1);
  if (!legacy) return;
  seedRoutingWeights(legacy);
  if (isSupabaseConfigured) await pushTenantStateToSupabase(KEYS.intelligenceWeights, legacy);
}

export async function ensureStaffPlatformStateSyncedOnce() {
  await migrateLegacyCommandCenter();
  await migrateLegacyProfiles();
  await migrateLegacyIntelligence();

  if (!isSupabaseConfigured) return;

  const [command, profiles, weights] = await Promise.all([
    hydrateTenantStateFromSupabase(KEYS.commandCenter, loadStaffCommandStore()),
    hydrateTenantStateFromSupabase(KEYS.profileOverrides, loadStaffProfileStore()),
    hydrateTenantStateFromSupabase(KEYS.intelligenceWeights, defaultRoutingWeights()),
  ]);

  seedStaffCommandStore(command);
  seedStaffProfileStore(profiles);
  seedRoutingWeights(weights);
}
