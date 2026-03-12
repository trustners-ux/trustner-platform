import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PospCategoryService } from './posp-category.service';
import {
  AssignCategoryDto,
  UpdateCategoryDto,
  CreateTierSharingDto,
  UpdateTierSharingDto,
  CreateProductDto,
  UpdateProductDto,
  CalculatePayoutDto,
} from './dto/posp-category.dto';

@Controller('insurance/posp-category')
@UseGuards(JwtAuthGuard)
export class PospCategoryController {
  constructor(private readonly service: PospCategoryService) {}

  // =========================================================================
  // DASHBOARD
  // =========================================================================

  @Get('dashboard')
  async getDashboard() {
    return this.service.getDashboardStats();
  }

  // =========================================================================
  // CATEGORY ASSIGNMENTS
  // =========================================================================

  /** List all active assignments */
  @Get('assignments')
  async listAssignments(
    @Query('lob') lob?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listAssignments({
      lob,
      category,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /** Assign category to a POSP for a LOB */
  @Post('assignments')
  async assignCategory(@Body() dto: AssignCategoryDto, @Request() req) {
    return this.service.assignCategory(dto, req.user.id || req.user.sub);
  }

  /** Bulk assign default category A to all POSPs without assignments */
  @Post('assignments/bulk-defaults')
  async bulkAssignDefaults(@Request() req) {
    return this.service.bulkAssignDefaults(req.user.id || req.user.sub);
  }

  /** Get categories for a specific POSP */
  @Get('posp/:pospId/categories')
  async getPospCategories(@Param('pospId') pospId: string) {
    return this.service.getPospCategories(pospId);
  }

  /** Get category history for a POSP */
  @Get('posp/:pospId/history')
  async getCategoryHistory(
    @Param('pospId') pospId: string,
    @Query('lob') lob?: string,
  ) {
    return this.service.getCategoryHistory(pospId, lob);
  }

  /** Update category for a POSP + LOB */
  @Patch('posp/:pospId/:lob')
  async updateCategory(
    @Param('pospId') pospId: string,
    @Param('lob') lob: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req,
  ) {
    return this.service.updateCategory(pospId, lob, dto, req.user.id || req.user.sub);
  }

  // =========================================================================
  // TIER SHARING CONFIG
  // =========================================================================

  /** Get the full tier sharing matrix */
  @Get('tier-sharing')
  async getTierSharing() {
    return this.service.getTierSharingConfigs();
  }

  /** Create or update a tier sharing config entry */
  @Post('tier-sharing')
  async upsertTierSharing(@Body() dto: CreateTierSharingDto) {
    return this.service.upsertTierSharing(dto);
  }

  /** Update a specific tier sharing config */
  @Patch('tier-sharing/:id')
  async updateTierSharing(@Param('id') id: string, @Body() dto: UpdateTierSharingDto) {
    return this.service.updateTierSharing(id, dto);
  }

  // =========================================================================
  // PRODUCT CATALOG
  // =========================================================================

  /** Get product stats summary */
  @Get('products/stats')
  async getProductStats() {
    return this.service.getProductStats();
  }

  /** Get filter options (insurers, product lines) */
  @Get('products/filters')
  async getFilterOptions() {
    return this.service.getFilterOptions();
  }

  /** List products with filters */
  @Get('products')
  async getProducts(
    @Query('lob') lob?: string,
    @Query('insurer') insurer?: string,
    @Query('productLine') productLine?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getProducts({
      lob,
      insurer,
      productLine,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  /** Get single product */
  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.service.getProduct(id);
  }

  /** Create a product */
  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.service.createProduct(dto);
  }

  /** Update a product */
  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.updateProduct(id, dto);
  }

  // =========================================================================
  // PAYOUT CALCULATION
  // =========================================================================

  /** Calculate payout for a single policy */
  @Post('payouts/calculate')
  async calculatePayout(@Body() dto: CalculatePayoutDto, @Request() req) {
    return this.service.calculatePayout(dto, req.user.id || req.user.sub);
  }

  /** Quick calculator (no DB record) */
  @Post('payouts/quick-calc')
  async quickCalculate(@Body() body: { trustnerCommPct: number; category: string; premiumAmount: number }) {
    return this.service.quickCalculate(body);
  }

  /** List payout records */
  @Get('payouts')
  async getPayoutRecords(
    @Query('pospId') pospId?: string,
    @Query('lob') lob?: string,
    @Query('status') status?: string,
    @Query('periodMonth') periodMonth?: string,
    @Query('periodYear') periodYear?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getPayoutRecords({
      pospId,
      lob,
      status,
      periodMonth: periodMonth ? parseInt(periodMonth) : undefined,
      periodYear: periodYear ? parseInt(periodYear) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /** Get POSP payout summary */
  @Get('payouts/posp/:pospId')
  async getPospPayoutSummary(@Param('pospId') pospId: string) {
    return this.service.getPospPayoutSummary(pospId);
  }

  /** Approve a payout */
  @Patch('payouts/:id/approve')
  async approvePayout(@Param('id') id: string, @Request() req) {
    return this.service.approvePayout(id, req.user.id || req.user.sub);
  }

  /** Mark payout as paid */
  @Patch('payouts/:id/paid')
  async markPayoutPaid(@Param('id') id: string, @Body() body: { bankRefNumber: string }) {
    return this.service.markPayoutPaid(id, body.bankRefNumber);
  }

  // =========================================================================
  // SEED
  // =========================================================================

  /** Seed tier sharing matrix */
  @Post('seed/tier-sharing')
  async seedTierSharing() {
    return this.service.seedTierSharing();
  }

  /** Seed product catalog */
  @Post('seed/products')
  async seedProducts(@Body() body: { products: Array<{
    lob: string;
    productLine: string;
    productName: string;
    insurer: string;
    trustnerCommission: number;
    basis: string;
  }> }) {
    return this.service.seedProducts(body.products);
  }
}
