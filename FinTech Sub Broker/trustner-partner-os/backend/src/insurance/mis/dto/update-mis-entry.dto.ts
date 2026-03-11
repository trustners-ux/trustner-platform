import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsInt } from 'class-validator';

export class UpdateMISEntryDto {
  // Entry Metadata
  @IsInt() @IsOptional() slNo?: number;
  @IsDateString() @IsOptional() entryDate?: string;
  @IsString() @IsOptional() entryMonth?: string;

  // Customer Details
  @IsString() @IsOptional() customerName?: string;
  @IsString() @IsOptional() customerPhone?: string;
  @IsString() @IsOptional() customerEmail?: string;
  @IsString() @IsOptional() insurerName?: string;

  // Policy Details
  @IsString() @IsOptional() policyNumber?: string;
  @IsString() @IsOptional() productName?: string;
  @IsString() @IsOptional() lob?: string;
  @IsString() @IsOptional() policyType?: string;
  @IsString() @IsOptional() motorPolicyType?: string;
  @IsString() @IsOptional() policyCategory?: string;
  @IsNumber() @IsOptional() sumInsured?: number;

  // Policy Dates
  @IsDateString() @IsOptional() policyStartDate?: string;
  @IsDateString() @IsOptional() policyEndDate?: string;
  @IsDateString() @IsOptional() issuedDate?: string;

  // Premium Breakdown
  @IsNumber() @IsOptional() odPremium?: number;
  @IsNumber() @IsOptional() tpPremium?: number;
  @IsNumber() @IsOptional() grossPremium?: number;
  @IsNumber() @IsOptional() netPremium?: number;
  @IsNumber() @IsOptional() gstAmount?: number;
  @IsNumber() @IsOptional() newPremium?: number;

  // Commission Splits
  @IsNumber() @IsOptional() netPremium100?: number;
  @IsNumber() @IsOptional() netPremium70?: number;
  @IsNumber() @IsOptional() netPremium30?: number;
  @IsNumber() @IsOptional() renewalPremium50?: number;
  @IsNumber() @IsOptional() commissionAmount?: number;

  // Business Source & Sales
  @IsString() @IsOptional() referredBy?: string;
  @IsString() @IsOptional() businessClosedBy?: string;
  @IsString() @IsOptional() agencyBroker?: string;

  // Agent/POSP Details
  @IsString() @IsOptional() pospId?: string;
  @IsString() @IsOptional() pospName?: string;
  @IsString() @IsOptional() pospCode?: string;

  // Location & Classification
  @IsString() @IsOptional() employeeLocation?: string;
  @IsString() @IsOptional() branchName?: string;
  @IsBoolean() @IsOptional() isRenewal?: boolean;
  @IsBoolean() @IsOptional() isNewCustomer?: boolean;

  // Motor-specific
  @IsString() @IsOptional() vehicleRegNo?: string;
  @IsString() @IsOptional() vehicleMake?: string;
  @IsString() @IsOptional() rtoLocation?: string;

  // Payment Info
  @IsString() @IsOptional() paymentMode?: string;
  @IsString() @IsOptional() paymentReference?: string;

  // Premium Auto-Calculation
  @IsNumber() @IsOptional() policyTermYears?: number;
  @IsBoolean() @IsOptional() isDST?: boolean;

  // Remarks
  @IsString() @IsOptional() makerRemarks?: string;
}
