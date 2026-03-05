import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IRDAIComplianceService } from './irdai-compliance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - IRDAI Compliance')
@Controller('insurance/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class IRDAIComplianceController {
  constructor(private complianceService: IRDAIComplianceService) {}

  /**
   * Generate monthly business report
   */
  @Post('reports/monthly-business')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate monthly business report',
    description: 'Generate IRDAI monthly business report',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated',
  })
  async generateMonthlyBusinessReport(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.complianceService.generateMonthlyBusinessReport(
      parseInt(month),
      parseInt(year),
    );
  }

  /**
   * Generate SP/BQP list
   */
  @Post('reports/sp-bqp-list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate SP/BQP list',
    description: 'Generate Sales Person and Business Query Person register',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated',
  })
  async generateSPBQPList() {
    return this.complianceService.generateSPBQPList();
  }

  /**
   * Generate complaint register
   */
  @Post('reports/complaint-register')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate complaint register',
    description: 'Generate IRDAI complaint register',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated',
  })
  async generateComplaintRegister(
    @Query('month') month?: string,
    @Query('year') year: string = new Date().getFullYear().toString(),
  ) {
    return this.complianceService.generateComplaintRegister({
      month: month ? parseInt(month) : undefined,
      year: parseInt(year),
    });
  }

  /**
   * Generate claims register
   */
  @Post('reports/claims-register')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate claims register',
    description: 'Generate IRDAI claims register',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated',
  })
  async generateClaimsRegister(
    @Query('month') month?: string,
    @Query('year') year: string = new Date().getFullYear().toString(),
  ) {
    return this.complianceService.generateClaimsRegister({
      month: month ? parseInt(month) : undefined,
      year: parseInt(year),
    });
  }

  /**
   * Check POSP compliance
   */
  @Post('check/posp-compliance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check POSP compliance',
    description: 'Check for expired certificates, training gaps',
  })
  @ApiResponse({ status: 200, description: 'Compliance check done' })
  async checkPOSPCompliance() {
    return this.complianceService.checkPOSPCompliance();
  }

  /**
   * Get compliance dashboard
   */
  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Get compliance dashboard',
    description: 'Summary of all compliance metrics',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getComplianceDashboard() {
    return this.complianceService.getComplianceDashboard();
  }
}
