import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InspectionStatus } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Vehicle Inspection Service
 * Handles self-inspection for break-in policies and Vaahan API integration
 */
@Injectable()
export class InspectionService {
  private readonly logger = new Logger('InspectionService');

  constructor(private prisma: PrismaService) {}

  /**
   * Schedule inspection
   */
  async scheduleInspection(inspectionDto: {
    policyId?: string;
    leadId?: string;
    vehicleRegNumber: string;
    inspectionType: string;
    scheduledAt: string;
    inspectorName?: string;
    inspectorPhone?: string;
  }): Promise<any> {
    try {
      const inspection = await this.prisma.vehicleInspection.create({
        data: {
          policyId: inspectionDto.policyId,
          leadId: inspectionDto.leadId,
          vehicleRegNumber: inspectionDto.vehicleRegNumber,
          inspectionType: inspectionDto.inspectionType,
          status: InspectionStatus.SCHEDULED,
          scheduledAt: new Date(inspectionDto.scheduledAt),
          inspectorName: inspectionDto.inspectorName,
          inspectorPhone: inspectionDto.inspectorPhone,
        },
      });

      this.logger.log(`✓ Inspection scheduled: ${inspection.id}`);
      return inspection;
    } catch (error) {
      this.logger.error(`Error scheduling inspection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload inspection photos
   */
  async uploadPhotos(id: string, photos: {
    frontPhoto?: string;
    rearPhoto?: string;
    leftSidePhoto?: string;
    rightSidePhoto?: string;
    dashboardPhoto?: string;
    odometerPhoto?: string;
    chassisNumberPhoto?: string;
    engineNumberPhoto?: string;
    additionalPhotos?: string[];
  }): Promise<any> {
    try {
      const inspection = await this.prisma.vehicleInspection.update({
        where: { id },
        data: {
          frontPhoto: photos.frontPhoto,
          rearPhoto: photos.rearPhoto,
          leftSidePhoto: photos.leftSidePhoto,
          rightSidePhoto: photos.rightSidePhoto,
          dashboardPhoto: photos.dashboardPhoto,
          odometerPhoto: photos.odometerPhoto,
          chassisNumberPhoto: photos.chassisNumberPhoto,
          engineNumberPhoto: photos.engineNumberPhoto,
          additionalPhotos: photos.additionalPhotos,
          status: InspectionStatus.PHOTOS_UPLOADED,
        },
      });

      this.logger.log(`✓ Photos uploaded for inspection: ${id}`);
      return inspection;
    } catch (error) {
      this.logger.error(`Error uploading photos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload inspection video
   */
  async uploadVideo(id: string, videoUrl: string): Promise<any> {
    try {
      const inspection = await this.prisma.vehicleInspection.update({
        where: { id },
        data: {
          videoUrl,
          status: InspectionStatus.VIDEO_UPLOADED,
        },
      });

      this.logger.log(`✓ Video uploaded for inspection: ${id}`);
      return inspection;
    } catch (error) {
      this.logger.error(`Error uploading video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Review inspection
   */
  async reviewInspection(
    id: string,
    approved: boolean,
    remarks: string,
    reviewedBy: string,
  ): Promise<any> {
    try {
      const status = approved ? InspectionStatus.APPROVED : InspectionStatus.REJECTED;

      const inspection = await this.prisma.vehicleInspection.update({
        where: { id },
        data: {
          status,
          reviewedBy,
          reviewedAt: new Date(),
          reviewRemarks: remarks,
          isApproved: approved,
        },
      });

      this.logger.log(`✓ Inspection reviewed: ${id} - ${approved ? 'APPROVED' : 'REJECTED'}`);
      return inspection;
    } catch (error) {
      this.logger.error(`Error reviewing inspection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch Vaahan data
   * In production, integrate with actual Vaahan API
   */
  async fetchVaahanData(registrationNumber: string): Promise<any> {
    try {
      // Check cache first
      const cached = await this.getCachedVaahanData(registrationNumber);
      if (cached) {
        return cached;
      }

      // In production, call actual Vaahan API here
      // For now, return stub data
      const vaahanData = {
        registrationNumber,
        ownerName: 'John Doe',
        vehicleClass: 'LIGHT_MOTOR_VEHICLE',
        maker: 'Maruti',
        model: 'Swift',
        fuelType: 'Petrol',
        color: 'White',
        manufacturingDate: dayjs().subtract(3, 'years').toDate(),
        registrationDate: dayjs().subtract(3, 'years').toDate(),
        fitnessUpto: dayjs().add(2, 'years').toDate(),
        insuranceUpto: dayjs().add(1, 'year').toDate(),
        insuranceCompany: 'HDFC ERGO',
        policyNumber: 'HE12345678',
        seatingCapacity: 5,
        grossWeight: 1200,
        bodyType: 'Hatchback',
      };

      // Cache the data
      await this.prisma.vaahanLookup.create({
        data: {
          registrationNumber,
          ownerName: vaahanData.ownerName,
          vehicleClass: vaahanData.vehicleClass,
          maker: vaahanData.maker,
          model: vaahanData.model,
          fuelType: vaahanData.fuelType,
          color: vaahanData.color,
          manufacturingDate: vaahanData.manufacturingDate,
          registrationDate: vaahanData.registrationDate,
          fitnessUpto: vaahanData.fitnessUpto,
          insuranceUpto: vaahanData.insuranceUpto,
          insuranceCompany: vaahanData.insuranceCompany,
          policyNumber: vaahanData.policyNumber,
          seatingCapacity: vaahanData.seatingCapacity,
          grossWeight: vaahanData.grossWeight,
          bodyType: vaahanData.bodyType,
          rawResponse: vaahanData,
          expiresAt: dayjs().add(24, 'hours').toDate(),
        },
      });

      this.logger.log(`✓ Vaahan data fetched and cached: ${registrationNumber}`);
      return vaahanData;
    } catch (error) {
      this.logger.error(`Error fetching Vaahan data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cached Vaahan data
   */
  async getCachedVaahanData(registrationNumber: string): Promise<any> {
    try {
      const cached = await this.prisma.vaahanLookup.findUnique({
        where: { registrationNumber },
      });

      if (cached && dayjs(cached.expiresAt).isAfter(dayjs())) {
        return cached;
      }

      // If expired, delete
      if (cached) {
        await this.prisma.vaahanLookup.delete({
          where: { registrationNumber },
        });
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting cached Vaahan data: ${error.message}`);
      return null;
    }
  }
}
