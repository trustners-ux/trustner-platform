import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma Service
 * Manages database connection lifecycle and provides access to all models
 * Uses OnModuleInit for connection and OnModuleDestroy for cleanup
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✓ Database connection established');

      // Optional: Log all queries in development
      if (process.env.NODE_ENV === 'development') {
        this.$on('query', (e) => {
          if (process.env.LOG_QUERIES === 'true') {
            this.logger.debug(`Query: ${e.query}`);
            this.logger.debug(`Duration: ${e.duration}ms`);
          }
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('✓ Database connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting database:', error);
    }
  }

  /**
   * Helper method to reset all tables (use with caution - only in development/testing)
   */
  async resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production environment');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      return typeof key === 'symbol' || (typeof key === 'string' && !key.startsWith('_'));
    });

    for (const model of models) {
      try {
        if (this[model] && typeof this[model].deleteMany === 'function') {
          await this[model].deleteMany();
        }
      } catch (error) {
        // Skip if model doesn't exist
      }
    }
  }
}
