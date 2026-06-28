/**
 * Client master — shared TypeScript types matching the Postgres schema
 * in migration 027_clients_master.sql. Camelcase wrappers stay close to
 * the SQL column names so that ORM-free row passing reads naturally.
 */

export type ClientStatus = 'active' | 'inactive' | 'dormant' | 'archived';
export type ClientGender = 'M' | 'F' | 'O' | 'U';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';
export type ResidentialStatus = 'resident' | 'nri' | 'foreign_national' | 'pio' | 'oci';
export type KycStatus = 'pending' | 'in_progress' | 'verified' | 'rejected' | 'expired';
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'unknown';
export type OnboardedVia = 'rm' | 'partner' | 'posp' | 'self' | 'bulk_import' | 'walk_in';
export type IdVerifStatus = 'unverified' | 'verified' | 'invalid';

export type ClientDocType =
  | 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
  | 'photo' | 'signature'
  | 'address_proof_current' | 'address_proof_permanent'
  | 'income_proof' | 'bank_proof' | 'cancelled_cheque'
  | 'gst_certificate' | 'incorporation_certificate' | 'other';

export type ClientDocVerifStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type RelationshipType =
  | 'spouse' | 'son' | 'daughter' | 'father' | 'mother'
  | 'father_in_law' | 'mother_in_law' | 'brother' | 'sister'
  | 'grandfather' | 'grandmother' | 'grandson' | 'granddaughter'
  | 'uncle' | 'aunt' | 'nephew' | 'niece' | 'cousin'
  | 'friend' | 'guardian' | 'ward'
  | 'business_partner' | 'employer' | 'employee' | 'other';

export type FamilyRole = 'head' | 'spouse' | 'child' | 'parent' | 'grandparent' | 'sibling' | 'other_dependent';

/** Row shape returned from `clients` table. Mirrors SQL columns 1:1. */
export interface ClientRow {
  id: number;
  code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  display_name: string;
  salutation: string | null;
  gender: ClientGender;
  dob: string | null;
  age_years: number | null;
  marital_status: MaritalStatus;

  pan: string | null;
  pan_status: IdVerifStatus | null;
  aadhaar_last4: string | null;
  aadhaar_hash: string | null;
  aadhaar_status: IdVerifStatus | null;

  mobile_primary: string | null;
  mobile_alt: string | null;
  email_primary: string | null;
  email_alt: string | null;

  addr_current_line1: string | null;
  addr_current_line2: string | null;
  addr_current_city: string | null;
  addr_current_state: string | null;
  addr_current_pincode: string | null;
  addr_current_country: string;

  addr_permanent_same_as_current: boolean;
  addr_permanent_line1: string | null;
  addr_permanent_line2: string | null;
  addr_permanent_city: string | null;
  addr_permanent_state: string | null;
  addr_permanent_pincode: string | null;
  addr_permanent_country: string | null;

  residential_status: ResidentialStatus;
  occupation: string | null;
  employer: string | null;
  annual_income_band: string | null;
  risk_profile: RiskProfile;

  onboarded_via: OnboardedVia;
  onboarded_by_user_id: number | null;
  onboarded_by_partner_id: number | null;
  onboarded_at: string;

  kyc_status: KycStatus;
  kyc_last_reviewed_at: string | null;
  kyc_last_reviewed_by_user_id: number | null;
  kyc_remarks: string | null;

  portal_user_id: number | null;

  whatsapp_opt_in: boolean;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  marketing_opt_in: boolean;
  /** JSONB in Postgres — comes back as a typed object */
  consent_log: ConsentEntry[] | null;

  preferred_language: string;

  status: ClientStatus;

  tags: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;

  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClientDocumentRow {
  id: number;
  client_id: number;
  doc_type: ClientDocType;
  file_name: string;
  file_size_bytes: number;
  file_mime: string;
  file_sha256: string;
  storage_key: string;
  ocr_text: string | null;
  ocr_extracted_fields: Record<string, unknown> | null;
  verification_status: ClientDocVerifStatus;
  verified_by_user_id: number | null;
  verified_at: string | null;
  rejected_reason: string | null;
  expiry_date: string | null;
  uploaded_by_user_id: number | null;
  uploaded_at: string;
  notes: string | null;
}

export interface ClientRelationshipRow {
  id: number;
  from_client_id: number;
  to_client_id: number;
  relationship_type: RelationshipType;
  is_dependent: boolean;
  notes: string | null;
  created_by_user_id: number | null;
  created_at: string;
}

export interface FamilyRow {
  id: number;
  code: string;
  name: string;
  head_client_id: number;
  description: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberRow {
  id: number;
  family_id: number;
  client_id: number;
  role: FamilyRole;
  joined_at: string;
  is_active: boolean;
}

export interface ConsentEntry {
  channel: 'whatsapp' | 'sms' | 'email' | 'marketing';
  opted_in: boolean;
  at: string;
  source: string;
  by_user_id: number | null;
}

/** Actor identity (the signed-in employee) — passed through every write. */
export interface ClientsActor {
  user_id: number;
  email: string;
}
