import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SharedServicesService } from '../services/shared-services.service';

@ApiTags('shared-libraries')
@Controller('shared-test')
export class SharedTestController {
  constructor(private readonly sharedServices: SharedServicesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get shared services status' })
  @ApiResponse({
    status: 200,
    description: 'Returns the status of all shared library integrations',
    schema: {
      type: 'object',
      properties: {
        database: { type: 'boolean' },
        cache: { type: 'boolean' },
        logging: { type: 'boolean' },
        authentication: { type: 'boolean' },
        accessControl: { type: 'boolean' },
        securityMonitoring: { type: 'boolean' },
      },
    },
  })
  async getSharedServicesStatus() {
    return await this.sharedServices.getSharedServicesStatus();
  }

  @Get('database-test')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({
    status: 200,
    description: 'Returns database connection status',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean' },
      },
    },
  })
  async testDatabase() {
    const connected = await this.sharedServices.testDatabaseConnection();
    return { connected };
  }

  @Get('cache-test')
  @ApiOperation({ summary: 'Test cache connection' })
  @ApiResponse({
    status: 200,
    description: 'Returns cache connection status',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean' },
      },
    },
  })
  async testCache() {
    const connected = await this.sharedServices.testCacheConnection();
    return { connected };
  }

  @Get('cache-metrics')
  @ApiOperation({ summary: 'Get cache metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns cache performance metrics',
  })
  async getCacheMetrics() {
    const metrics = await this.sharedServices.getCacheMetrics();
    return { metrics };
  }

  @Get('logging-test')
  @ApiOperation({ summary: 'Test logging functionality' })
  @ApiResponse({
    status: 200,
    description: 'Tests all logging levels',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async testLogging() {
    await this.sharedServices.testLogging();
    return { message: 'Logging test completed - check console output' };
  }
}
