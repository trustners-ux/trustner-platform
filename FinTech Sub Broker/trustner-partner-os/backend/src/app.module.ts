import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Feature Modules
import { UsersModule } from './users/users.module';
import { SubBrokersModule } from './sub-brokers/sub-brokers.module';
import { ClientsModule } from './clients/clients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SIPModule } from './sip/sip.module';
import { CommissionsModule } from './commissions/commissions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { HoldingsModule } from './holdings/holdings.module';
import { ComplianceModule } from './compliance/compliance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { BSEIntegrationModule } from './bse-integration/bse-integration.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { InsuranceModule } from './insurance/insurance.module';
import { AiAdvisoryModule } from './ai-advisory/ai-advisory.module';

/**
 * Application Root Module
 * Trustner Partner OS - B2B2C Fintech Distribution Platform
 *
 * Imports all feature modules and configures global services
 */
@Module({
  imports: [
    // Global Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // Database
    PrismaModule,

    // Authentication & Authorization
    AuthModule,

    // Task Scheduling
    ScheduleModule.forRoot(),

    // JWT Module Configuration
    JwtModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY') || '3600s',
        },
      }),
    }),

    // Feature Modules - User Management
    UsersModule,

    // Feature Modules - Sub-Broker Management
    SubBrokersModule,

    // Feature Modules - Client Management
    ClientsModule,

    // Feature Modules - Investment Transactions
    TransactionsModule,
    SIPModule,
    HoldingsModule,

    // Feature Modules - Commission & Payout Processing
    CommissionsModule,
    PayoutsModule,

    // Feature Modules - Compliance & Audit
    ComplianceModule,
    AuditModule,

    // Feature Modules - Reporting & Analytics
    DashboardModule,
    ReportsModule,

    // Feature Modules - Integrations
    BSEIntegrationModule,

    // Feature Modules - Communications
    NotificationsModule,

    // Feature Modules - System Administration
    SystemConfigModule,

    // Feature Modules - Insurance
    InsuranceModule,

    // Feature Modules - AI Advisory Engine
    AiAdvisoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
