import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsuranceLOB } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Bulk Booking Service
 * Handles bulk offline policy booking via Excel/CSV upload
 */
@Injectable()
export class BulkBookingService {
  private readonly logger = new Logger('BulkBookingService');

  constructor(private prisma: PrismaService) {}

  /**
   * Generate batch code
   */
  private async generateBatchCode(): Promise<string> {
    const datePrefix = dayjs().format('YYYYMMDD');
    const count = await this.prisma.bulkBooking.count({
      where: {
        batchCode: { startsWith: `BULK-${datePrefix}` },
      },
    });
    const seqNum = String(count + 1).padStart(3, '0');
    return `BULK-${datePrefix}-${seqNum}`;
  }

  /**
   * Upload bulk file
   */
  async uploadBulkFile(
    filePath: string,
    fileName: string,
    lob: InsuranceLOB,
    uploadedBy: string,
  ): Promise<any> {
    try {
      const batchCode = await this.generateBatchCode();

      const batch = await this.prisma.bulkBooking.create({
        data: {
          batchCode,
          fileName,
          filePath,
          lob,
          uploadedBy,
          status: 'UPLOADED',
        },
      });

      this.logger.log(`✓ Bulk file uploaded: ${batchCode}`);
      return batch;
    } catch (error) {
      this.logger.error(`Error uploading bulk file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process batch - validate and create policies
   * In production, parse CSV/Excel and validate each record
   */
  async processBatch(batchId: string): Promise<any> {
    try {
      const batch = await this.prisma.bulkBooking.findUniqueOrThrow({
        where: { id: batchId },
      });

      if (batch.status !== 'UPLOADED') {
        throw new BadRequestException('Batch must be in UPLOADED status to process');
      }

      // Update status to processing
      await this.prisma.bulkBooking.update({
        where: { id: batchId },
        data: { status: 'VALIDATING' },
      });

      // In production:
      // 1. Parse file (CSV/Excel)
      // 2. Validate each record
      // 3. Create policies for valid records
      // 4. Log errors for invalid records

      // For now, mark as processing and return stub
      const result = await this.prisma.bulkBooking.update({
        where: { id: batchId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      this.logger.log(`✓ Batch processing started: ${batchId}`);

      return {
        batchId,
        status: result.status,
        message: 'Batch processing started',
      };
    } catch (error) {
      this.logger.error(`Error processing batch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<any> {
    try {
      const batch = await this.prisma.bulkBooking.findUniqueOrThrow({
        where: { id: batchId },
      });

      return {
        batchId: batch.id,
        batchCode: batch.batchCode,
        status: batch.status,
        fileName: batch.fileName,
        lob: batch.lob,
        totalRecords: batch.totalRecords,
        processedRecords: batch.processedRecords,
        successRecords: batch.successRecords,
        failedRecords: batch.failedRecords,
        uploadedAt: batch.createdAt,
        processedAt: batch.processedAt,
        errorLog: batch.errorLog,
      };
    } catch (error) {
      this.logger.error(`Error fetching batch status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all batches with filters
   */
  async getBatches(
    pagination: { skip: number; take: number },
    filters: {
      status?: string;
      lob?: InsuranceLOB;
      uploadedBy?: string;
    },
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.lob) where.lob = filters.lob;
      if (filters.uploadedBy) where.uploadedBy = filters.uploadedBy;

      const [data, total] = await Promise.all([
        this.prisma.bulkBooking.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.bulkBooking.count({ where }),
      ]);

      return {
        data,
        pagination: {
          total,
          skip: pagination.skip,
          take: pagination.take,
          pages: Math.ceil(total / pagination.take),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching batches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download error log
   */
  async downloadErrorLog(batchId: string): Promise<any> {
    try {
      const batch = await this.prisma.bulkBooking.findUniqueOrThrow({
        where: { id: batchId },
      });

      if (!batch.errorLog) {
        throw new BadRequestException('No errors in this batch');
      }

      return {
        batchCode: batch.batchCode,
        errorLog: batch.errorLog,
        failedRecords: batch.failedRecords,
      };
    } catch (error) {
      this.logger.error(`Error downloading error log: ${error.message}`);
      throw error;
    }
  }
}
