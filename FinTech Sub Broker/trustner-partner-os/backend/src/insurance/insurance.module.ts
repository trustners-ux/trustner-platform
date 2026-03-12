import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { POSPModule } from './posp/posp.module';
import { LeadsModule } from './leads/leads.module';
import { PoliciesModule } from './policies/policies.module';
import { ClaimsModule } from './claims/claims.module';
import { EndorsementsModule } from './endorsements/endorsements.module';
import { InsuranceCommissionsModule } from './commissions/insurance-commissions.module';
import { RenewalsModule } from './renewals/renewals.module';
import { InspectionModule } from './inspection/inspection.module';
import { TicketsModule } from './tickets/tickets.module';
import { IRDAIComplianceModule } from './compliance/irdai-compliance.module';
import { InsuranceDashboardModule } from './dashboard/insurance-dashboard.module';
import { BulkBookingModule } from './bulk-booking/bulk-booking.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { ProductGradeModule } from './product-grade/product-grade.module';
import { MISModule } from './mis/mis.module';
import { ContestModule } from './contest/contest.module';
import { InsuranceClientsModule } from './clients/insurance-clients.module';

/**
 * Insurance Broking Module
 * Root module that aggregates all insurance-related sub-modules
 * Manages POSP agents, leads, policies, claims, commissions, and regulatory compliance
 * IRDAI-compliant broker platform replacing Heph Scope
 * MIS: Master Information System with maker-checker workflow, hierarchy, grading, and contests
 */
@Module({
  imports: [
    PrismaModule,
    POSPModule,
    LeadsModule,
    PoliciesModule,
    ClaimsModule,
    EndorsementsModule,
    InsuranceCommissionsModule,
    RenewalsModule,
    InspectionModule,
    TicketsModule,
    IRDAIComplianceModule,
    InsuranceDashboardModule,
    BulkBookingModule,
    HierarchyModule,
    ProductGradeModule,
    MISModule,
    ContestModule,
    InsuranceClientsModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    POSPModule,
    LeadsModule,
    PoliciesModule,
    ClaimsModule,
    EndorsementsModule,
    InsuranceCommissionsModule,
    RenewalsModule,
    InspectionModule,
    TicketsModule,
    IRDAIComplianceModule,
    InsuranceDashboardModule,
    BulkBookingModule,
    HierarchyModule,
    ProductGradeModule,
    MISModule,
    ContestModule,
    InsuranceClientsModule,
  ],
})
export class InsuranceModule {}
