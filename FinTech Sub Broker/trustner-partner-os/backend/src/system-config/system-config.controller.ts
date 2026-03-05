import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { SetTargetDto } from './dto/set-target.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('System Config')
@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
export class SystemConfigController {
  constructor(private systemConfigService: SystemConfigService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all configurations' })
  async getAll(@Query('category') category?: string) {
    return this.systemConfigService.getAll(category);
  }

  @Get(':key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get configuration by key' })
  async get(@Param('key') key: string) {
    return this.systemConfigService.get(key);
  }

  @Put()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert configuration' })
  async upsert(@Body() upsertDto: UpsertConfigDto, @CurrentUser() user: any) {
    return this.systemConfigService.upsert(upsertDto, user.id);
  }

  @Delete(':key')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete configuration' })
  async delete(@Param('key') key: string) {
    await this.systemConfigService.delete(key);
  }

  @Get('categories/list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get config categories' })
  async getCategories() {
    const categories = await this.systemConfigService.getCategories();
    return { categories };
  }

  @Post('targets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Set partner target' })
  async setPartnerTarget(@Body() setTargetDto: SetTargetDto) {
    return this.systemConfigService.setPartnerTarget(setTargetDto);
  }

  @Get('targets/:subBrokerId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER_MANAGER, UserRole.REGIONAL_HEAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get partner targets' })
  async getPartnerTargets(@Param('subBrokerId') subBrokerId: string, @Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.systemConfigService.getPartnerTargets(subBrokerId, yearNum);
  }
}
