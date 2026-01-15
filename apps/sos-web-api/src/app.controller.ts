import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get application information',
    description: 'Get application information',
  })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  getAppInfo() {
    return {
      name: 'StrengthOS API',
      version: '1.0.0',
      description: 'NestJS-based REST API for the StrengthOS platform',
      status: 'running',
    };
  }
}
