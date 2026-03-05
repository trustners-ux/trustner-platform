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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Insurance - Vehicle Inspection & Vaahan')
@Controller('insurance/inspection')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class InspectionController {
  constructor(private inspectionService: InspectionService) {}

  /**
   * Schedule inspection
   */
  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Schedule inspection',
    description: 'Schedule vehicle inspection for break-in policy',
  })
  @ApiResponse({
    status: 201,
    description: 'Inspection scheduled',
  })
  async scheduleInspection(
    @Body()
    inspectionDto: {
      policyId?: string;
      leadId?: string;
      vehicleRegNumber: string;
      inspectionType: string;
      scheduledAt: string;
      inspectorName?: string;
      inspectorPhone?: string;
    },
  ) {
    return this.inspectionService.scheduleInspection(inspectionDto);
  }

  /**
   * Upload photos
   */
  @Post(':id/photos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload inspection photos',
    description: 'Upload vehicle photos for inspection',
  })
  @ApiResponse({
    status: 201,
    description: 'Photos uploaded',
  })
  async uploadPhotos(
    @Param('id') id: string,
    @Body()
    photos: {
      frontPhoto?: string;
      rearPhoto?: string;
      leftSidePhoto?: string;
      rightSidePhoto?: string;
      dashboardPhoto?: string;
      odometerPhoto?: string;
      chassisNumberPhoto?: string;
      engineNumberPhoto?: string;
      additionalPhotos?: string[];
    },
  ) {
    return this.inspectionService.uploadPhotos(id, photos);
  }

  /**
   * Upload video
   */
  @Post(':id/video')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload inspection video',
    description: 'Upload vehicle inspection video',
  })
  @ApiResponse({
    status: 201,
    description: 'Video uploaded',
  })
  async uploadVideo(
    @Param('id') id: string,
    @Body() body: { videoUrl: string },
  ) {
    return this.inspectionService.uploadVideo(id, body.videoUrl);
  }

  /**
   * Review inspection
   */
  @Patch(':id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @ApiOperation({
    summary: 'Review inspection',
    description: 'Approve or reject inspection',
  })
  @ApiResponse({ status: 200, description: 'Reviewed' })
  async reviewInspection(
    @Param('id') id: string,
    @Body() body: { approved: boolean; remarks: string },
    @CurrentUser() user: any,
  ) {
    return this.inspectionService.reviewInspection(
      id,
      body.approved,
      body.remarks,
      user.id,
    );
  }

  /**
   * Fetch Vaahan data
   */
  @Post('vaahan/fetch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch Vaahan data',
    description: 'Fetch vehicle data from Vaahan API',
  })
  @ApiResponse({ status: 200, description: 'Vaahan data fetched' })
  async fetchVaahanData(@Body() body: { registrationNumber: string }) {
    return this.inspectionService.fetchVaahanData(body.registrationNumber);
  }

  /**
   * Get cached Vaahan data
   */
  @Get('vaahan/:registrationNumber')
  @ApiOperation({
    summary: 'Get cached Vaahan data',
    description: 'Get Vaahan data from cache if available',
  })
  @ApiResponse({ status: 200, description: 'Vaahan data' })
  async getCachedVaahanData(@Param('registrationNumber') registrationNumber: string) {
    return this.inspectionService.getCachedVaahanData(registrationNumber);
  }
}
