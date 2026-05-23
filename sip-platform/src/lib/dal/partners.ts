// ─── Trustner MIS: Partner Data Access Layer ───
// Manages POSP, BQP, Franchise, and Referral partner records

import type { PartnerRecord, PartnerType, POSPCategory, FranchiseSubType } from '@/lib/mis/types';
import { FRANCHISE_DEFAULTS, REFERRAL_DEFAULTS, PARTNER_CODE_PREFIX } from '@/lib/mis/types';

// In-memory store (will migrate to Supabase)
let partners: PartnerRecord[] = [];
let nextId = 1;

/**
 * Generate next partner code for a given type
 */
export function generateNextCode(type: PartnerType, fy: string = '2526'): string {
  const prefix = PARTNER_CODE_PREFIX[type];
  const existingOfType = partners.filter(p => p.type === type);
  const nextSerial = existingOfType.length + 1;
  return `${prefix}/${String(nextSerial).padStart(3, '0')}/${fy}`;
}

/**
 * Create a new partner record
 */
export function createPartner(input: {
  type: PartnerType;
  name: string;
  email?: string;
  phone?: string;
  franchiseSubType?: FranchiseSubType;
  managedByType: PartnerRecord['managedByType'];
  managedById: number;
  parentFranchiseId?: number;
  agreementPct?: number;
  categoryPerLOB?: PartnerRecord['categoryPerLOB'];
  location?: string;
  city?: string;
  notes?: string;
}): PartnerRecord {
  // Set default agreement % based on type
  let agreementPct = input.agreementPct ?? 0;
  if (input.type === 'Franchise' && !input.agreementPct) {
    agreementPct = FRANCHISE_DEFAULTS.defaultAgreementPct;
  }
  if (input.type === 'Referral' && !input.agreementPct) {
    agreementPct = REFERRAL_DEFAULTS.defaultPayoutPct;
  }

  // Default POSP category per LOB (new POSPs start at A)
  const defaultCategory: PartnerRecord['categoryPerLOB'] = input.type === 'POSP' ? {
    life: 'A', health: 'A', giNonMotor: 'A', giMotor: 'A',
  } : undefined;

  const partner: PartnerRecord = {
    id: nextId++,
    code: generateNextCode(input.type),
    type: input.type,
    name: input.name,
    email: input.email,
    phone: input.phone,
    franchiseSubType: input.franchiseSubType,
    managedByType: input.managedByType,
    managedById: input.managedById,
    parentFranchiseId: input.parentFranchiseId,
    agreementPct,
    categoryPerLOB: input.categoryPerLOB ?? defaultCategory,
    isActive: true,
    onboardingDate: new Date().toISOString().slice(0, 10),
    location: input.location,
    city: input.city,
    notes: input.notes,
  };

  partners.push(partner);
  return partner;
}

/**
 * Get partner by ID
 */
export function getPartner(id: number): PartnerRecord | undefined {
  return partners.find(p => p.id === id);
}

/**
 * Get partner by code
 */
export function getPartnerByCode(code: string): PartnerRecord | undefined {
  return partners.find(p => p.code === code);
}

/**
 * List partners with optional filters
 */
export function listPartners(filters?: {
  type?: PartnerType;
  managedById?: number;
  parentFranchiseId?: number;
  isActive?: boolean;
  city?: string;
}): PartnerRecord[] {
  let result = [...partners];
  if (filters?.type) result = result.filter(p => p.type === filters.type);
  if (filters?.managedById) result = result.filter(p => p.managedById === filters.managedById);
  if (filters?.parentFranchiseId) result = result.filter(p => p.parentFranchiseId === filters.parentFranchiseId);
  if (filters?.isActive !== undefined) result = result.filter(p => p.isActive === filters.isActive);
  if (filters?.city) result = result.filter(p => p.city?.toLowerCase() === filters.city?.toLowerCase());
  return result;
}

/**
 * Get all POSPs under a franchise
 */
export function getPOSPsUnderFranchise(franchiseId: number): PartnerRecord[] {
  return partners.filter(p => p.parentFranchiseId === franchiseId && p.type === 'POSP');
}

/**
 * Update partner category (for a specific LOB)
 */
export function updatePartnerCategory(
  partnerId: number,
  lob: 'life' | 'health' | 'giNonMotor' | 'giMotor',
  newCategory: POSPCategory
): PartnerRecord | undefined {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner || !partner.categoryPerLOB) return undefined;
  partner.categoryPerLOB[lob] = newCategory;
  return partner;
}

/**
 * Update partner agreement percentage
 */
export function updatePartnerAgreement(
  partnerId: number,
  newAgreementPct: number
): PartnerRecord | undefined {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return undefined;
  partner.agreementPct = newAgreementPct;
  return partner;
}

/**
 * Upgrade partner type (e.g., Referral -> POSP)
 */
export function upgradePartner(
  partnerId: number,
  newType: PartnerType,
  options?: {
    bqpCertDate?: string;
    franchiseSubType?: FranchiseSubType;
    categoryPerLOB?: PartnerRecord['categoryPerLOB'];
  }
): PartnerRecord | undefined {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return undefined;

  partner.upgradedFrom = partner.type;
  partner.upgradeDate = new Date().toISOString().slice(0, 10);
  partner.type = newType;

  // Generate new code for new type
  partner.code = generateNextCode(newType);

  if (options?.bqpCertDate) partner.bqpCertDate = options.bqpCertDate;
  if (options?.franchiseSubType) partner.franchiseSubType = options.franchiseSubType;

  // If upgrading to POSP, set default categories
  if (newType === 'POSP' && !partner.categoryPerLOB) {
    partner.categoryPerLOB = options?.categoryPerLOB ?? {
      life: 'A', health: 'A', giNonMotor: 'A', giMotor: 'A',
    };
  }

  return partner;
}

/**
 * Upgrade franchise to BQP-certified (can now recruit POSPs)
 */
export function upgradeFranchiseToBQP(
  partnerId: number,
  bqpCertDate: string
): PartnerRecord | undefined {
  const partner = partners.find(p => p.id === partnerId && p.type === 'Franchise');
  if (!partner) return undefined;
  partner.franchiseSubType = 'BQP_Certified';
  partner.bqpCertDate = bqpCertDate;
  return partner;
}

/**
 * Deactivate a partner
 */
export function deactivatePartner(partnerId: number): PartnerRecord | undefined {
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return undefined;
  partner.isActive = false;
  return partner;
}

/**
 * Get partner statistics
 */
export function getPartnerStats(): {
  total: number;
  active: number;
  byType: Record<PartnerType, number>;
  bqpCertifiedFranchises: number;
} {
  const active = partners.filter(p => p.isActive);
  return {
    total: partners.length,
    active: active.length,
    byType: {
      POSP: active.filter(p => p.type === 'POSP').length,
      BQP: active.filter(p => p.type === 'BQP').length,
      Franchise: active.filter(p => p.type === 'Franchise').length,
      Referral: active.filter(p => p.type === 'Referral').length,
    },
    bqpCertifiedFranchises: active.filter(p => p.type === 'Franchise' && p.franchiseSubType === 'BQP_Certified').length,
  };
}
