import { LifePlanProfile, ProfileCategory } from '@/types/life-plans';
import { lifePlanProfiles } from './profiles';

export { lifePlanProfiles };

/** Return all 15 life-plan profiles. */
export function getAllProfiles(): LifePlanProfile[] {
  return lifePlanProfiles;
}

/** Find a single profile by its URL slug. */
export function getProfileBySlug(slug: string): LifePlanProfile | undefined {
  return lifePlanProfiles.find((p) => p.slug === slug);
}

/** Return all profiles within a given category. */
export function getProfilesByCategory(
  cat: ProfileCategory
): LifePlanProfile[] {
  return lifePlanProfiles.filter((p) => p.category === cat);
}

/** Return a deduplicated list of categories in display order. */
export function getCategories(): ProfileCategory[] {
  return [...new Set(lifePlanProfiles.map((p) => p.category))];
}

/**
 * Return up to `limit` related profiles from the same category,
 * excluding the profile itself.
 */
export function getRelatedProfiles(
  profile: LifePlanProfile,
  limit = 3
): LifePlanProfile[] {
  return lifePlanProfiles
    .filter((p) => p.id !== profile.id && p.category === profile.category)
    .slice(0, limit);
}
