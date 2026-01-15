import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConsoleLogService } from '../shared/services/console-log.service';
import { CreateLogDTO } from '@strengthos/shared-logging';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logService: ConsoleLogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a log entry' })
  @ApiResponse({ status: 201, description: 'Log entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid log data' })
  async createLog(
    @Body() createLogDto: CreateLogDTO,
  ): Promise<{ message: string }> {
    await this.logService.create(createLogDto);
    return { message: 'Log entry created successfully' };
  }
}
