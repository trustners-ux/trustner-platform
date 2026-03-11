import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { POSPService } from './posp.service';
import { POSPExportService } from './posp-export.service';
import { CreatePOSPDto } from './dto/create-posp.dto';
import { UpdatePOSPDto } from './dto/update-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - POSP Management')
@Controller('insurance/posp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class POSPController {
  constructor(
    private pospService: POSPService,
    private pospExportService: POSPExportService,
  ) {}

  /**
   * Get POSPs scoped to current user's hierarchy position
   * RM: only their assigned POSPs | CDM: their team's POSPs | Admin: all
   */
  @Get('my-posps')
  @ApiOperation({
    summary: 'Get my scoped POSPs',
    description: 'Returns POSPs based on user role and hierarchy position',
  })
  @ApiResponse({ status: 200, description: 'Scoped POSP list' })
  async getMyPOSPs(
    @CurrentUser() user: any,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.pospService.getMyTeamPOSPs(
      user.id,
      user.role,
      { skip: parseInt(skip), take: parseInt(take) },
      { status: status as any, category: category as any, search, managerId },
    );
  }

  /**
   * Get current user's team hierarchy tree
   */
  @Get('my-team')
  @ApiOperation({
    summary: 'Get my team hierarchy',
    description: 'Returns user position and team structure',
  })
  @ApiResponse({ status: 200, description: 'Team hierarchy tree' })
  async getMyTeam(@CurrentUser() user: any) {
    return this.pospService.getMyTeamTree(user.id);
  }

  /**
   * Export POSPs as Excel or CSV file
   */
  @Get('export')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRINCIPAL_OFFICER,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.CLUSTER_DEVELOPMENT_MANAGER,
  )
  @ApiOperation({
    summary: 'Export POSPs',
    description: 'Download POSPs data as Excel or CSV (hierarchy-scoped)',
  })
  @ApiResponse({ status: 200, description: 'File download' })
  async exportPOSPs(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
    @Query('format') format: string = 'xlsx',
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      status: status as any,
      category: category as any,
      search,
    };

    if (format === 'csv') {
      const buffer = await this.pospExportService.exportToCSV(
        user.id,
        user.role,
        filters,
      );
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="posps_${new Date().toISOString().slice(0, 10)}.csv"`,
      });
      return new StreamableFile(buffer);
    }

    // Default: XLSX
    const buffer = await this.pospExportService.exportToExcel(
      user.id,
      user.role,
      filters,
    );
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="posps_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    });
    return new StreamableFile(buffer);
  }

  /**
   * Search POSPs for dropdown selector (by name or code)
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search POSPs for dropdown',
    description: 'Search POSP agents by name or code for selector dropdown. Returns top 20 matches.',
  })
  @ApiResponse({ status: 200, description: 'POSP search results' })
  async searchPOSPs(
    @Query('q') query: string = '',
    @Query('limit') limit: string = '20',
  ) {
    return this.pospService.searchForDropdown(query, parseInt(limit) || 20);
  }

  /**
   * POSP self-service dashboard — shows own business + expected earnings
   */
  @Get('my-dashboard')
  @Roles(UserRole.POSP)
  @ApiOperation({
    summary: 'POSP self-service dashboard',
    description: 'Get own business summary, expected earnings, and recent policies',
  })
  @ApiResponse({ status: 200, description: 'POSP self-dashboard data' })
  async getMyDashboard(@CurrentUser() user: any) {
    return this.pospService.getPOSPSelfDashboard(user.id);
  }

  /**
   * Register new POSP agent
   */
  @Post('register')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.RELATIONSHIP_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new POSP agent',
    description:
      'Create new insurance agent with APPLICATION_RECEIVED status. Returns TIBPL-POSP-XXXXX code.',
  })
  @ApiResponse({
    status: 201,
    description: 'POSP agent registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Agent already exists' })
  async register(
    @Body() createDto: CreatePOSPDto,
    @CurrentUser() user: any,
  ) {
    return this.pospService.registerPOSP(createDto, user.id);
  }

  /**
   * Get all POSPs with filters and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all POSP agents',
    description:
      'List POSPs with pagination, status/category/branch filters and search',
  })
  @ApiResponse({ status: 200, description: 'POSPs list with pagination' })
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.pospService.findAll(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      { status: status as any, category: category as any, branchId, search },
    );
  }

  /**
   * Get single POSP profile
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get POSP agent profile',
    description: 'Get full profile with training records, documents, performance',
  })
  @ApiResponse({ status: 200, description: 'POSP profile details' })
  @ApiResponse({ status: 404, description: 'POSP not found' })
  async findOne(@Param('id') id: string) {
    return this.pospService.findOne(id);
  }

  /**
   * Update POSP profile
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.RELATIONSHIP_MANAGER)
  @ApiOperation({
    summary: 'Update POSP profile',
    description: 'Update personal and contact details',
  })
  @ApiResponse({ status: 200, description: 'POSP updated' })
  @ApiResponse({ status: 404, description: 'POSP not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateDto: UpdatePOSPDto,
  ) {
    return this.pospService.updateProfile(id, updateDto);
  }

  /**
   * Update bank details
   */
  @Patch(':id/bank-details')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Update bank details',
    description: 'Update bank account for commission payout',
  })
  @ApiResponse({ status: 200, description: 'Bank details updated' })
  async updateBankDetails(
    @Param('id') id: string,
    @Body()
    bankDetails: {
      bankAccountName: string;
      bankAccountNumber: string;
      bankIfscCode: string;
      bankName: string;
    },
  ) {
    return this.pospService.updateBankDetails(id, bankDetails);
  }

  /**
   * Start training
   */
  @Post(':id/training/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start training',
    description: 'Change POSP status to TRAINING_IN_PROGRESS',
  })
  @ApiResponse({ status: 200, description: 'Training started' })
  async startTraining(@Param('id') id: string) {
    return this.pospService.startTraining(id);
  }

  /**
   * Update training progress
   */
  @Post(':id/training/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN, UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update training progress',
    description: 'Mark module complete and track hours',
  })
  @ApiResponse({ status: 200, description: 'Training progress updated' })
  async updateTrainingProgress(
    @Param('id') id: string,
    @Body()
    data: {
      moduleTitle: string;
      duration: number;
      score?: number;
      videoUrl?: string;
      materialUrl?: string;
    },
  ) {
    if (!data.moduleTitle || !data.duration) {
      throw new BadRequestException(
        'moduleTitle and duration are required',
      );
    }
    return this.pospService.updateTrainingProgress(id, data.moduleTitle, data);
  }

  /**
   * Complete training
   */
  @Post(':id/training/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete training',
    description: 'Verify 15 hours completed and change status to TRAINING_COMPLETED',
  })
  @ApiResponse({ status: 200, description: 'Training completed' })
  async completeTraining(@Param('id') id: string) {
    return this.pospService.completeTraining(id);
  }

  /**
   * Schedule exam
   */
  @Post(':id/exam/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Schedule exam',
    description: 'Schedule exam after training completion',
  })
  @ApiResponse({ status: 200, description: 'Exam scheduled' })
  async scheduleExam(
    @Param('id') id: string,
    @Body() body: { examDate: string },
  ) {
    return this.pospService.scheduleExam(id, new Date(body.examDate));
  }

  /**
   * Record exam result
   */
  @Post(':id/exam/result')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record exam result',
    description: 'Mark exam as PASSED or FAILED with score',
  })
  @ApiResponse({ status: 200, description: 'Exam result recorded' })
  async recordExamResult(
    @Param('id') id: string,
    @Body() body: { passed: boolean; score: number },
  ) {
    return this.pospService.recordExamResult(id, body.passed, body.score);
  }

  /**
   * Issue certificate
   */
  @Post(':id/certificate/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue certificate',
    description: 'Issue IRDAI certificate after exam passage',
  })
  @ApiResponse({ status: 200, description: 'Certificate issued' })
  async issueCertificate(
    @Param('id') id: string,
    @Body() body: { certNumber: string; expiryDate: string },
  ) {
    return this.pospService.issueCertificate(
      id,
      body.certNumber,
      new Date(body.expiryDate),
    );
  }

  /**
   * Activate POSP
   */
  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate POSP',
    description: 'Final activation after all requirements met',
  })
  @ApiResponse({ status: 200, description: 'POSP activated' })
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.pospService.activate(id, user.id);
  }

  /**
   * Suspend POSP
   */
  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend POSP',
    description: 'Suspend POSP account with reason',
  })
  @ApiResponse({ status: 200, description: 'POSP suspended' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.pospService.suspend(id, body.reason);
  }

  /**
   * Terminate POSP
   */
  @Post(':id/terminate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate POSP',
    description: 'Terminate POSP agent permanently',
  })
  @ApiResponse({ status: 200, description: 'POSP terminated' })
  async terminate(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.pospService.terminate(id, body.reason);
  }

  /**
   * Get POSP performance
   */
  @Get(':id/performance')
  @ApiOperation({
    summary: 'Get POSP performance',
    description: 'Get policies sold, premium, commission, renewal rate metrics',
  })
  @ApiResponse({ status: 200, description: 'Performance metrics' })
  async getPerformance(@Param('id') id: string) {
    return this.pospService.getPerformance(id);
  }

  /**
   * Get POSP dashboard
   */
  @Get(':id/dashboard')
  @ApiOperation({
    summary: 'Get POSP dashboard',
    description: 'Get POSP own dashboard with summary stats',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getPOSPDashboard(@Param('id') id: string) {
    return this.pospService.getPOSPDashboard(id);
  }

}
