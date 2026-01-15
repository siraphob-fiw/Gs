import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TrainingBlockService } from '../services/training-block.service';
import {
  WorkoutSummaryService,
  WorkoutSummaryResult,
} from '../services/workout-summary.service';
import {
  CreateTrainingBlockDto,
  UpdateTrainingBlockDto,
  CalculateSummaryDto,
  WorkoutMethod,
  WorkoutType,
} from '../dto/training-block.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TrainingBlockWithExercises } from '../services/training-block.service';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { User } from '@/auth/decorators/user.decorator';
import { RequestContext } from '@strengthos/shared-types';
import { Results } from '@strengthos/shared-utils';
import { RequiresTenant } from '@/auth/decorators/requires-tenant.decorator';

@ApiTags('Training Blocks')
@ApiBearerAuth()
@Controller('training-blocks')
export class TrainingBlockController {
  private readonly logger = new Logger(TrainingBlockController.name);

  constructor(
    private readonly trainingBlockService: TrainingBlockService,
    private readonly workoutSummaryService: WorkoutSummaryService,
  ) {}

  @Post()
  @ApiStandardOperation(
    'Create a new training block',
    'Creates a new training block with optional sessions and exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Training block created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createTrainingBlock(
    @Body() createDto: CreateTrainingBlockDto,
    @User() user: RequestContext,
  ): Promise<TrainingBlockWithExercises> {
    const trainingBlock = await this.trainingBlockService.createTrainingBlock(
      createDto,
      user.tenantId,
      user.userId,
    );

    return trainingBlock;
  }

  @Get(':id')
  @ApiStandardOperation(
    'Get training block by ID',
    'Retrieves a specific training block with all sessions and exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training block ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training block retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training block not found',
  })
  async getTrainingBlock(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<TrainingBlockWithExercises> {
    return await this.trainingBlockService.getTrainingBlock(id, user.tenantId);
  }

  @Get()
  @ApiStandardOperation(
    'Get training blocks with filtering and pagination',
    'Retrieves training blocks with optional filtering by program, template, or type',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by training block type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training blocks retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        blocks: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getTrainingBlocks(
    @Query() query: any,
    @User() user: RequestContext,
  ): Promise<{
    blocks: TrainingBlockWithExercises[];
    total?: number;
    page?: number;
    limit?: number;
  }> {
    return await this.trainingBlockService.getTrainingBlocks(
      query,
      user.userId,
      user.tenantId,
    );
  }

  @Put(':id')
  @ApiStandardOperation(
    'Update training block',
    'Updates an existing training block with new data',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training block ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training block updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training block not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateTrainingBlock(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingBlockDto,
    @User() user: RequestContext,
  ): Promise<TrainingBlockWithExercises> {
    this.logger.log(
      `Updating training block: ${id} for tenant: ${user.tenantId}`,
    );

    return await this.trainingBlockService.updateTrainingBlock(
      id,
      updateDto,
      user.tenantId,
      user.userId,
    );
  }

  @Delete(':id')
  @RequiresTenant()
  @ApiStandardOperation(
    'Delete training block',
    'Deletes a training block and all associated sessions and exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training block ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Training block deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training block not found',
  })
  async deleteTrainingBlock(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<void> {
    this.logger.log(
      `Deleting training block: ${id} for tenant: ${user.tenantId}`,
    );

    return await this.trainingBlockService.deleteTrainingBlock(
      id,
      user.tenantId,
      user.userId,
    );
  }

  @Get(':id/statistics')
  @ApiStandardOperation(
    'Get training block statistics',
    'Retrieves detailed statistics and analytics for a training block',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training block ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Block statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number' },
        totalExercises: { type: 'number' },
        averageSessionDuration: { type: 'number' },
        totalVolume: { type: 'number' },
        averageIntensity: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training block not found',
  })
  async getBlockStatistics(
    @Param('id') id: string,
    // @User() user: RequestContext,
  ): Promise<{
    totalSessions: number;
    totalExercises: number;
    averageSessionDuration: number;
    totalVolume: number;
    averageIntensity: number;
  }> {
    this.logger.log(`Fetching statistics for training block: ${id}`);

    return {
      totalSessions: 0,
      totalExercises: 0,
      averageSessionDuration: 0,
      totalVolume: 0,
      averageIntensity: 0,
    };
  }

  @Post(':id/duplicate')
  @RequiresTenant()
  @ApiStandardOperation(
    'Duplicate a training block',
    'Creates a copy of an existing training block with all sessions and exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training block ID to duplicate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Training block duplicated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Original training block not found',
  })
  async duplicateTrainingBlock(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<Results<void>> {
    try {
      const originalBlock = await this.trainingBlockService.getTrainingBlock(
        id,
        user.tenantId,
      );

      if (!originalBlock) {
        this.logger.warn(
          `Training block not found: ${id} for tenant: ${user.tenantId}`,
        );
        return Results.fail();
      }

      const duplicateDto: CreateTrainingBlockDto = {
        workoutName: originalBlock.workoutName.endsWith(' (Copy)')
          ? originalBlock.workoutName
          : `${originalBlock.workoutName} (Copy)`,
        workoutMethod: originalBlock.workoutMethod as WorkoutMethod,
        workoutType: originalBlock.workoutType as WorkoutType,
        isGlobal: false,
        summary: originalBlock.summary || undefined,
        exercises: originalBlock.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          order: exercise.order,
          day: exercise.day,
          sets: exercise.sets,
          modifiers: exercise.modifiers,
          summary: (exercise as any).summary || undefined,
        })),
      };

      const res = await this.trainingBlockService.createTrainingBlock(
        duplicateDto,
        user.tenantId,
        user.userId,
      );

      if (res) {
        this.logger.log(
          `Training block duplicated: ${id} -> ${res.id} for tenant: ${user.tenantId}`,
        );
        return Results.ok();
      }

      this.logger.error(`Failed to create duplicate training block: ${id}`);
      return Results.fail();
    } catch (error) {
      this.logger.error(
        `Failed to duplicate training block ${id}: ${error.message}`,
        error.stack,
      );
      return Results.fail();
    }
  }

  @Post('calculate-summary')
  @ApiStandardOperation(
    'Calculate workout summary',
    'Calculates stress metrics summary for a workout based on exercises data',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout summary calculated successfully',
    schema: {
      type: 'object',
      properties: {
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exerciseId: { type: 'string' },
              day: { type: 'number' },
              order: { type: 'number' },
              summary: {
                type: 'object',
                properties: {
                  nl: { type: 'number' },
                  totalStress: { type: 'number' },
                  centralStress: { type: 'number' },
                  peripheralStress: { type: 'number' },
                  csBalance: { type: 'number' },
                },
              },
            },
          },
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              nl: { type: 'number' },
              peripheralStress: { type: 'number' },
              centralStress: { type: 'number' },
              totalStress: { type: 'number' },
              csBalance: { type: 'number' },
            },
          },
        },
        total: {
          type: 'object',
          properties: {
            nl: { type: 'number' },
            peripheral: { type: 'number' },
            central: { type: 'number' },
            total: { type: 'number' },
            csBalance: { type: 'number' },
          },
        },
      },
    },
  })
  async calculateSummary(
    @Body() calculateSummaryDto: CalculateSummaryDto,
  ): Promise<WorkoutSummaryResult> {
    return await this.workoutSummaryService.calculateSummary({
      exercises: calculateSummaryDto.exercises,
    });
  }
}
