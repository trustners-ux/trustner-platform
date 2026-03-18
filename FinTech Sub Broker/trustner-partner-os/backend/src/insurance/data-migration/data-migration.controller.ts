import { Controller, Post, Get, Body, Request, UseGuards, UsePipes, ValidationPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DataMigrationService } from './data-migration.service';

/**
 * Data Migration Controller — handles VJ Infosoft data imports.
 *
 * NOTE: We disable the global ValidationPipe on POST endpoints here because
 * the request bodies contain dynamic CSV/Excel row data (arbitrary column names).
 * The global ValidationPipe's `whitelist` and `forbidNonWhitelisted` options
 * would strip/reject these dynamic properties since there's no DTO class.
 */
@Controller('insurance/data-migration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataMigrationController {
  constructor(private readonly migrationService: DataMigrationService) {}

  @Get('status')
  getStatus() {
    return this.migrationService.getMigrationStatus();
  }

  @Post('clients')
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }))
  importClients(@Body() body: { rows: any[] }, @Request() req: any) {
    return this.migrationService.importClients(body.rows, req.user.id);
  }

  @Post('policy-register')
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }))
  importPolicyRegister(@Body() body: { rows: any[] }, @Request() req: any) {
    return this.migrationService.importPolicyRegister(body.rows, req.user.id);
  }

  @Post('payout-data')
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }))
  importPayoutData(@Body() body: { rows: any[] }, @Request() req: any) {
    return this.migrationService.importPayoutData(body.rows, req.user.id);
  }

  @Post('renewal-due')
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }))
  importRenewalDue(@Body() body: { rows: any[] }, @Request() req: any) {
    return this.migrationService.importRenewalDue(body.rows, req.user.id);
  }

  @Post('sync-to-policies')
  async syncToInsurancePolicies(@Request() req: any, @Res() res: Response) {
    // Disable request timeout for long-running sync (1653+ entries)
    req.setTimeout(300000); // 5 minutes
    const result = await this.migrationService.syncMISToInsurancePolicies(req.user.id);
    return res.json(result);
  }

  /**
   * Smart import: auto-detect CSV type from headers, import, and auto-sync to InsurancePolicy
   */
  @Post('smart-import')
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }))
  smartImport(@Body() body: { rows: any[]; headers: string[] }, @Request() req: any) {
    return this.migrationService.smartImport(body.rows, body.headers, req.user.id);
  }
}
