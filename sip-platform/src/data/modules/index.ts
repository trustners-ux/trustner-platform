import { investmentLandscapeModule } from './investment-landscape';
import { sipMasteryModule } from './sip-mastery';
import { whatIsMutualFundModule } from './what-is-mutual-fund';
import { schemeTypesModule } from './scheme-types';
import { fundStructureModule } from './fund-structure';
import { legalRegulatoryModule } from './legal-regulatory';
import { navExpensesPricingModule } from './nav-expenses-pricing';
import { taxationModule } from './taxation';
import { distributionRoleModule } from './distribution-role';
import { investorServicesModule } from './investor-services';
import { riskReturnPerformanceModule } from './risk-return-performance';
import { schemeSelectionPlanningModule } from './scheme-selection-planning';
// New foundation modules for the seven-track Learn architecture
import { sifFoundationModule } from './sif-foundation';
import { pmsFoundationModule } from './pms-foundation';
import { aifFoundationModule } from './aif-foundation';
import { giftCityFoundationModule } from './gift-city-foundation';
import { internationalFoundationModule } from './international-foundation';
import { insuranceFoundationModule } from './insurance-foundation';
// Phase 2 expansion — Deep Dive (intermediate) and Advanced (practitioner) modules
import { sifStrategiesDeepModule } from './sif-strategies-deep';
import { sifOperationsTaxModule } from './sif-operations-tax';
import { sifAdvancedModule } from './sif-advanced';
import { pmsStrategiesModule } from './pms-strategies';
import { pmsTaxOperationsModule } from './pms-tax-operations';
import { pmsAdvancedModule } from './pms-advanced';
import { aifCategoriesDeepModule } from './aif-categories-deep';
import { aifAdvancedModule } from './aif-advanced';
import { giftProductsDeepModule } from './gift-products-deep';
import { giftAdvancedModule } from './gift-advanced';
import { internationalDeepModule } from './international-deep';
import { internationalAdvancedModule } from './international-advanced';
import { insuranceDeepModule } from './insurance-deep';
import { insuranceAdvancedModule } from './insurance-advanced';
import { LearningModule, Section, LearnTrack } from '@/types/learning';

/**
 * All learning modules across seven tracks.
 * Each module declares a `track` field; defaults to 'mutual-funds' if absent.
 *
 * Tracks:
 *   mutual-funds   — flagship MF curriculum (12 modules: NISM V-A aligned)
 *   sif            — Specialized Investment Funds Foundation
 *   pms            — Portfolio Management Services Foundation
 *   aif            — Alternative Investment Funds Foundation
 *   gift-city      — GIFT IFSC Foundation
 *   international  — International Funds Foundation
 *   insurance      — Insurance Foundation
 */
export const ALL_MODULES: LearningModule[] = [
  // ─── Mutual Funds (Foundation → Intermediate → Advanced) ───
  investmentLandscapeModule,
  whatIsMutualFundModule,
  sipMasteryModule,
  schemeTypesModule,
  fundStructureModule,
  legalRegulatoryModule,
  navExpensesPricingModule,
  taxationModule,
  distributionRoleModule,
  investorServicesModule,
  riskReturnPerformanceModule,
  schemeSelectionPlanningModule,
  // ─── New Foundation Tracks ───
  sifFoundationModule,
  pmsFoundationModule,
  aifFoundationModule,
  giftCityFoundationModule,
  internationalFoundationModule,
  insuranceFoundationModule,
  // ─── SIF Phase 2 (Deep Dive + Advanced) ───
  sifStrategiesDeepModule,
  sifOperationsTaxModule,
  sifAdvancedModule,
  // ─── PMS Phase 2 ───
  pmsStrategiesModule,
  pmsTaxOperationsModule,
  pmsAdvancedModule,
  // ─── AIF Phase 2 ───
  aifCategoriesDeepModule,
  aifAdvancedModule,
  // ─── GIFT City Phase 2 ───
  giftProductsDeepModule,
  giftAdvancedModule,
  // ─── International Phase 2 ───
  internationalDeepModule,
  internationalAdvancedModule,
  // ─── Insurance Phase 2 ───
  insuranceDeepModule,
  insuranceAdvancedModule,
];

/** Default track for legacy modules that don't declare one. */
export function getModuleTrack(module: LearningModule): LearnTrack {
  return module.track ?? 'mutual-funds';
}

/** All modules belonging to a given track. */
export function getModulesByTrack(track: LearnTrack): LearningModule[] {
  return ALL_MODULES.filter((m) => getModuleTrack(m) === track);
}

/** Module count per track. */
export function getModuleCountByTrack(track: LearnTrack): number {
  return getModulesByTrack(track).length;
}

export function getAllModules(): LearningModule[] {
  return ALL_MODULES;
}

export function getModuleBySlug(slug: string): LearningModule | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

export function getSectionBySlug(moduleSlug: string, sectionSlug: string): Section | undefined {
  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return undefined;
  return mod.sections.find((s) => s.slug === sectionSlug);
}

export function getTotalStats() {
  let totalSections = 0;
  let totalMCQs = 0;
  let totalFAQs = 0;

  ALL_MODULES.forEach((module) => {
    totalSections += module.sections.length;
    module.sections.forEach((section) => {
      totalMCQs += section.content.mcqs.length;
      totalFAQs += section.content.faq.length;
    });
  });

  return {
    modules: ALL_MODULES.length,
    sections: totalSections,
    mcqs: totalMCQs,
    faqs: totalFAQs,
  };
}

export function getAllSections(): (Section & { moduleName: string; moduleSlug: string })[] {
  const sections: (Section & { moduleName: string; moduleSlug: string })[] = [];
  ALL_MODULES.forEach((module) => {
    module.sections.forEach((section) => {
      sections.push({
        ...section,
        moduleName: module.title,
        moduleSlug: module.slug,
      });
    });
  });
  return sections;
}

/**
 * Resolve a section slug to its full path by searching all modules.
 * Used for relatedTopics which may reference sections in other modules.
 * Returns { moduleSlug, sectionSlug, title } or null if not found.
 */
const _topicPathCache = new Map<string, { moduleSlug: string; sectionSlug: string; title: string } | null>();

export function resolveTopicPath(
  sectionSlug: string,
  currentModuleSlug?: string
): { moduleSlug: string; sectionSlug: string; title: string } | null {
  const cacheKey = `${currentModuleSlug || ''}:${sectionSlug}`;
  if (_topicPathCache.has(cacheKey)) return _topicPathCache.get(cacheKey)!;

  // First check current module (prefer same-module match)
  if (currentModuleSlug) {
    const currentModule = getModuleBySlug(currentModuleSlug);
    if (currentModule) {
      const section = currentModule.sections.find((s) => s.slug === sectionSlug);
      if (section) {
        const result = { moduleSlug: currentModuleSlug, sectionSlug: section.slug, title: section.title };
        _topicPathCache.set(cacheKey, result);
        return result;
      }
    }
  }

  // Then search all modules
  for (const mod of ALL_MODULES) {
    const section = mod.sections.find((s) => s.slug === sectionSlug);
    if (section) {
      const result = { moduleSlug: mod.slug, sectionSlug: section.slug, title: section.title };
      _topicPathCache.set(cacheKey, result);
      return result;
    }
  }

  _topicPathCache.set(cacheKey, null);
  return null;
}
