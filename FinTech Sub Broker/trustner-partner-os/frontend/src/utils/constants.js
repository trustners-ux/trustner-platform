export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPLIANCE_ADMIN: 'COMPLIANCE_ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  REGIONAL_HEAD: 'REGIONAL_HEAD',
  SUB_BROKER: 'SUB_BROKER',
  CLIENT: 'CLIENT',
}

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COMPLIANCE_ADMIN: 'Compliance Admin',
  FINANCE_ADMIN: 'Finance Admin',
  REGIONAL_HEAD: 'Regional Head',
  SUB_BROKER: 'Sub-Broker',
  CLIENT: 'Investor',
}

export const ROLE_COLORS = {
  SUPER_ADMIN: 'red',
  COMPLIANCE_ADMIN: 'orange',
  FINANCE_ADMIN: 'green',
  REGIONAL_HEAD: 'blue',
  SUB_BROKER: 'purple',
  CLIENT: 'gray',
}

export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.COMPLIANCE_ADMIN,
  ROLES.FINANCE_ADMIN,
]

export const PARTNER_ROLES = [
  ROLES.SUB_BROKER,
  ROLES.REGIONAL_HEAD,
]

export const CLIENT_ROLES = [ROLES.CLIENT]

export const KYC_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const KYC_STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const KYC_STATUS_COLORS = {
  PENDING: 'yellow',
  IN_PROGRESS: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
}

export const PARTNER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
}

export const PARTNER_STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending Approval',
}

export const PARTNER_STATUS_COLORS = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  SUSPENDED: 'red',
  PENDING: 'yellow',
}

export const PARTNER_TIERS = {
  TIER_1: 'TIER_1',
  TIER_2: 'TIER_2',
  TIER_3: 'TIER_3',
  ASSOCIATE: 'ASSOCIATE',
}

export const PARTNER_TIER_LABELS = {
  TIER_1: 'Tier 1 Partner',
  TIER_2: 'Tier 2 Partner',
  TIER_3: 'Tier 3 Partner',
  ASSOCIATE: 'Associate',
}

export const TRANSACTION_TYPE = {
  LUMPSUM: 'LUMPSUM',
  SIP: 'SIP',
  REDEMPTION: 'REDEMPTION',
  SWITCH: 'SWITCH',
  STP: 'STP',
  SWP: 'SWP',
}

export const TRANSACTION_TYPE_LABELS = {
  LUMPSUM: 'Lump Sum',
  SIP: 'Systematic Investment Plan',
  REDEMPTION: 'Redemption',
  SWITCH: 'Switch',
  STP: 'Systematic Transfer Plan',
  SWP: 'Systematic Withdrawal Plan',
}

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  PROCESSED: 'PROCESSED',
}

export const TRANSACTION_STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  PROCESSED: 'Processed',
}

export const TRANSACTION_STATUS_COLORS = {
  PENDING: 'yellow',
  ACCEPTED: 'blue',
  REJECTED: 'red',
  PROCESSED: 'green',
}

export const COMPLIANCE_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

export const COMPLIANCE_SEVERITY_LABELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const COMPLIANCE_SEVERITY_COLORS = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'yellow',
  LOW: 'blue',
}

export const SIP_FREQUENCY = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMI_ANNUAL: 'SEMI_ANNUAL',
  ANNUAL: 'ANNUAL',
}

export const SIP_FREQUENCY_LABELS = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
}

export const COMMISSION_TYPE = {
  UPFRONT: 'UPFRONT',
  TRAIL: 'TRAIL',
}

export const COMMISSION_TYPE_LABELS = {
  UPFRONT: 'Upfront',
  TRAIL: 'Trail',
}

export const PAYOUT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
}

export const PAYOUT_STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  REJECTED: 'Rejected',
}

export const PAYOUT_STATUS_COLORS = {
  PENDING: 'yellow',
  APPROVED: 'blue',
  PROCESSING: 'cyan',
  PAID: 'green',
  REJECTED: 'red',
}

export const CLIENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DORMANT: 'DORMANT',
}

export const CLIENT_STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DORMANT: 'Dormant',
}

export const CLIENT_STATUS_COLORS = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DORMANT: 'yellow',
}
