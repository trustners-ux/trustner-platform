import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BulkBookingService } from './bulk-booking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Bulk Booking')
@Controller('insurance/bulk-booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class BulkBookingController {
  constructor(private bulkBookingService: BulkBookingService) {}

  /**
   * Upload bulk file
   */
  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload bulk file',
    description: 'Upload Excel/CSV file for bulk policy booking',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded',
  })
  async uploadBulkFile(
    @Body()
    body: {
      filePath: string;
      fileName: string;
      lob: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.bulkBookingService.uploadBulkFile(
      body.filePath,
      body.fileName,
      body.lob as any,
      user.id,
    );
  }

  /**
   * Process batch
   */
  @Post(':batchId/process')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process batch',
    description: 'Start processing uploaded batch file',
  })
  @ApiResponse({
    status: 200,
    description: 'Processing started',
  })
  async processBatch(@Param('batchId') batchId: string) {
    return this.bulkBookingService.processBatch(batchId);
  }

  /**
   * Get batch status
   */
  @Get(':batchId/status')
  @ApiOperation({
    summary: 'Get batch status',
    description: 'Get current status of batch processing',
  })
  @ApiResponse({ status: 200, description: 'Batch status' })
  async getBatchStatus(@Param('batchId') batchId: string) {
    return this.bulkBookingService.getBatchStatus(batchId);
  }

  /**
   * Get all batches
   */
  @Get()
  @ApiOperation({
    summary: 'Get all batches',
    description: 'List all bulk booking batches with filters',
  })
  @ApiResponse({ status: 200, description: 'Batches list' })
  async getBatches(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('status') status?: string,
    @Query('lob') lob?: string,
    @Query('uploadedBy') uploadedBy?: string,
  ) {
    return this.bulkBookingService.getBatches(
      {
        skip: parseInt(skip),
        take: parseInt(take),
      },
      {
        status,
        lob: lob as any,
        uploadedBy,
      },
    );
  }

  /**
   * Download error log
   */
  @Get(':batchId/error-log')
  @ApiOperation({
    summary: 'Download error log',
    description: 'Get error log for failed records in batch',
  })
  @ApiResponse({ status: 200, description: 'Error log' })
  async downloadErrorLog(@Param('batchId') batchId: string) {
    return this.bulkBookingService.downloadErrorLog(batchId);
  }
}
