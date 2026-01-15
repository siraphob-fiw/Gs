import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProgressionService } from '../services/progression.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { User } from '@/auth/decorators/user.decorator';
import { RequestContext } from '@strengthos/shared-types';
import { TrainingSession } from '@/training-session/services/training-session.service';

@ApiTags('Progressions')
@ApiBearerAuth()
@Controller('progressions')
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get()
  @ApiStandardOperation(
    'Get progressions with filtering and pagination',
    'Retrieves progressions with optional filtering by discipline, category, status, or athlete',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'athleteId',
    required: false,
    description: 'Filter by athlete ID (coaches/admins only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progressions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        progressions: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProgressionResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getProgressions(
    @Query()
    query: {
      range?: '1M' | '3M' | '1Y';
      page?: number;
      limit?: number;
    },
    @User() user: RequestContext,
  ): Promise<{
    progressions: TrainingSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.progressionService.getProgressions(
      query,
      user,
      user.tenantId,
    );
  }

  @Get('summary')
  @ApiStandardOperation(
    'Get exercise summary with metrics',
    'Retrieves a summary of exercises with calculated metrics (sets, reps, volume, RPE, estimated max)',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1M', '3M', '1Y'],
    description: 'Time range filter',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'athleteId',
    required: false,
    description: 'Filter by athlete ID (coaches/admins only)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO format: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO format: YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exercise summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              workout: { type: 'string' },
              exercise: { type: 'string' },
              modifiers: { type: 'array', items: { type: 'string' } },
              sets: { type: 'number' },
              totalReps: { type: 'number' },
              exerciseVolume: { type: 'number' },
              maxRPE: { type: 'number' },
              estimatedMax: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getExerciseSummary(
    @Query()
    query: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      athleteId?: string;
    },
    @User() user: RequestContext,
  ) {
    return await this.progressionService.getExerciseSummary(
      query,
      user,
      user.tenantId,
    );
  }

  @Post()
  @ApiStandardOperation(
    'Create a new progression',
    'Creates a new progression with the given data',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description: 'Data required to create a new progression',
    schema: {
      type: 'object',
      properties: {
        squat: { type: 'string' },
        bench: { type: 'string' },
        deadlift: { type: 'string' },
      },
    },
  })
  async createProgression(
    @Body()
    body: {
      squat: string;
      bench: string;
      deadlift: string;
    },
    @User() user: RequestContext,
  ) {
    return await this.progressionService.createProgression(
      body,
      user.userId,
      user.tenantId,
    );
  }

  @Get('stress/summary')
  @ApiStandardOperation(
    'Get progressions for an athlete',
    'Retrieves progressions for an athlete',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async getProgressionsForAthlete(@User() user: RequestContext) {
    return await this.progressionService.getStressSummary(user);
  }
}
