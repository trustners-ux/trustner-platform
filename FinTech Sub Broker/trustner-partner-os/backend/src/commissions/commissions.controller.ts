import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Commissions')
@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class CommissionsController {
  constructor(private commissionsService: CommissionsService) {}

  /**
   * Import RTA file for commission processing
   */
  @Post('import-rta')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file from RTA',
        },
        rtaSource: {
          type: 'string',
          enum: ['CAMS', 'KFINTECH', 'FRANKLIN', 'SBICAP'],
          description: 'RTA source',
        },
        period: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}$',
          description: 'Period in YYYY-MM format',
        },
      },
      required: ['file', 'rtaSource', 'period'],
    },
  })
  @ApiOperation({
    summary: 'Import RTA file',
    description: 'Upload and process RTA CSV file for commission calculations',
  })
  @ApiResponse({
    status: 200,
    description: 'RTA file imported successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file or parameters' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async importRTA(
    @UploadedFile() file: Express.Multer.File,
    @Query('rtaSource') rtaSource: string,
    @Query('period') period: string,
    @CurrentUser() user: any,
  ) {
    if (!rtaSource || !['CAMS', 'KFINTECH', 'FRANKLIN', 'SBICAP'].includes(rtaSource)) {
      throw new BadRequestException('Invalid RTA source');
    }

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException('Period must be in YYYY-MM format');
    }

    return this.commissionsService.importRTAFile(
      file,
      rtaSource as any,
      period,
    );
  }

  /**
   * Calculate commissions for a month/year
   */
  @Post('calculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate commissions',
    description: 'Calculate commissions for all transactions in a period',
  })
  @ApiResponse({
    status: 200,
    description: 'Commissions calculated',
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async calculateCommissions(
    @Body() body: { month: number; year: number },
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.calculateCommissions(body.month, body.year);
  }

  /**
   * Get all commissions
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({
    summary: 'Get all commissions',
    description: 'List all commission records with filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Commissions list',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getCommissions(
    @Query('subBrokerId') subBrokerId?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    // TODO: Implement filtering and pagination
    return { message: 'Not yet implemented' };
  }

  /**
   * Get commission statement for sub-broker
   */
  @Get('statement/:subBrokerId')
  @ApiOperation({
    summary: 'Get commission statement',
    description: 'Get detailed commission statement for a sub-broker for a specific period',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission statement',
  })
  @ApiResponse({ status: 404, description: 'Sub-broker or statement not found' })
  async getStatement(
    @Param('subBrokerId') subBrokerId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @CurrentUser() user: any,
  ) {
    // Access control: only the sub-broker or finance admin can view
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== subBrokerId) {
      throw new BadRequestException('You can only view your own commission statement');
    }

    return this.commissionsService.getCommissionStatement(subBrokerId, month, year);
  }

  /**
   * Get trail commission forecast
   */
  @Get('forecast/:subBrokerId')
  @ApiOperation({
    summary: 'Get trail forecast',
    description: 'Get estimated trail commissions based on current AUM',
  })
  @ApiResponse({
    status: 200,
    description: 'Trail forecast',
  })
  @ApiResponse({ status: 404, description: 'Sub-broker not found' })
  async getForecast(
    @Param('subBrokerId') subBrokerId: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SUB_BROKER && user.subBrokerId !== subBrokerId) {
      throw new BadRequestException('You can only view your own forecast');
    }

    return this.commissionsService.getTrailForecast(subBrokerId);
  }

  /**
   * Process clawback
   */
  @Post(':id/clawback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process clawback',
    description: 'Process commission clawback (negative commission)',
  })
  @ApiResponse({
    status: 200,
    description: 'Clawback processed',
  })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async processClawback(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.commissionsService.processClawback(id, body.amount, body.reason);
  }
}
