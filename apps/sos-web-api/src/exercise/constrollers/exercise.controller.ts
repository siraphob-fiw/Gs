import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { ExerciseCacheService } from '../services/exercise-cache.service';
import { ExerciseCacheSyncService } from '../services/exercise-cache-sync.service';
import {
  ExerciseFiltersDto,
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../dto/exercise.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import {
  BodyPart,
  Discipline,
  ExerciseListResponse,
  MovementPattern,
  RequestContext,
  UserRole,
} from '@strengthos/shared-types';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { User } from '@/auth/decorators/user.decorator';
import { DatabaseService } from '@/database/database.service';

@ApiTags('Exercise')
@Controller('exercise')
@ApiBearerAuth()
export class ExerciseController {
  private readonly logger = new Logger(ExerciseController.name);

  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly exerciseCacheService: ExerciseCacheService,
    private readonly exerciseCacheSyncService: ExerciseCacheSyncService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  @ApiStandardOperation('Find exercises', 'Find exercises', true)
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'discipline',
    type: 'string',
    enum: Discipline,
    required: false,
  })
  @ApiQuery({
    name: 'movementPatterns',
    type: 'string',
    enum: MovementPattern,
    required: false,
  })
  @ApiQuery({
    name: 'bodyParts',
    type: 'string',
    enum: BodyPart,
    isArray: true,
    required: false,
  })
  @ApiQuery({
    name: 'exerciseType',
    type: 'string',
    description: 'Category ID from exercise_category',
    required: false,
  })
  @ApiQuery({
    name: 'excludeInjuryTypes',
    type: [String],
    required: false,
  })
  @ApiQuery({
    name: 'experienceLevel',
    type: 'string',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'],
    required: false,
  })
  @ApiQuery({
    name: 'maxComplexity',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'minEffectiveness',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    type: 'string',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    type: 'string',
    enum: ['name', 'exerciseType', 'created_at', 'is_approved'],
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    type: 'string',
    enum: ['asc', 'desc'],
    required: false,
  })
  async findExercises(
    @Query() filters: ExerciseFiltersDto,
    @User() user: RequestContext,
  ): Promise<ExerciseListResponse> {
    try {
      // Use cached version for better performance
      const result = await this.exerciseCacheService.findAllWithFilters(
        filters as any,
        user.userId,
      );
      return {
        exercises: result.exercises.map((e: any) => ({
          ...e.toJSON(),
          movementPatterns: e.movementPatterns ?? [],
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to find exercises', error);
      throw new HttpException(
        'Failed to find exercises',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiStandardOperation('Find exercise by ID', 'Find exercise by ID', true)
  @UseGuards(JwtAuthGuard)
  async findExerciseById(@Param('id') id: string) {
    try {
      // Use cached version for better performance
      const exercise = await this.exerciseCacheService.findById(id);
      if (!exercise) {
        throw new HttpException('Exercise not found', HttpStatus.NOT_FOUND);
      }
      return exercise.toJSON();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find exercise',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('approved/:id')
  @ApiStandardOperation(
    'approved exercise by ID',
    'approved exercise by ID',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async approvedExerciseById(@Param('id') id: string, @User() user: any) {
    try {
      const exercise = await this.exerciseRepository.approvedExerciseById(
        id,
        user,
      );
      return exercise;
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post()
  @ApiStandardOperation('Create exercise', 'Create exercise', true)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.COACH_ADMIN,
    UserRole.COACH,
    UserRole.SELF_COACHED,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createExercise(
    @Body() createExerciseDto: CreateExerciseDto,
    @User() user: RequestContext,
  ) {
    try {
      // Exercises are global - only need createdBy
      const payload = {
        ...createExerciseDto,
        createdBy: user.userId,
      };
      // Use cache service to create and invalidate caches
      const exercise = await this.exerciseCacheService.create(payload);
      return exercise.toJSON();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @ApiStandardOperation('Update exercise', 'Update exercise', true)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.COACH_ADMIN,
    UserRole.COACH,
    UserRole.SELF_COACHED,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    try {
      // Use cache service to update and invalidate caches
      const exercise = await this.exerciseCacheService.update(
        id,
        updateExerciseDto,
      );
      if (!exercise) {
        throw new HttpException('Exercise not found', HttpStatus.NOT_FOUND);
      }
      return exercise.toJSON();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update exercise',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiStandardOperation('Delete exercise', 'Delete exercise', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteExercise(@Param('id') id: string): Promise<{ message: string }> {
    try {
      // Use cache service to delete and invalidate caches
      const deleted = await this.exerciseCacheService.delete(id);
      if (!deleted) {
        throw new HttpException('Exercise not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Exercise deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete exercise',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('discipline/:discipline')
  @ApiStandardOperation(
    'Find exercises by discipline',
    'Find exercises by discipline',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async findByDiscipline(@Param('discipline') discipline: string) {
    try {
      // Use cached version for better performance
      const exercises =
        await this.exerciseCacheService.findByDiscipline(discipline);
      return {
        discipline,
        exercises: exercises.map((ex) => ex.toJSON()),
        count: exercises.length,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('movement-pattern/:pattern')
  @ApiStandardOperation(
    'Find exercises by movement pattern',
    'Find exercises by movement pattern',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async findByMovementPattern(@Param('pattern') pattern: string) {
    try {
      // Use cached version for better performance
      const exercises =
        await this.exerciseCacheService.findByMovementPattern(pattern);
      return {
        movementPattern: pattern,
        exercises: exercises.map((ex) => ex.toJSON()),
        count: exercises.length,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('body-part/:bodyPart')
  @ApiStandardOperation(
    'Find exercises by body part',
    'Find exercises by body part',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async findByBodyPart(@Param('bodyPart') bodyPart: string) {
    try {
      // Use cached version for better performance
      const exercises =
        await this.exerciseCacheService.findByBodyPart(bodyPart);
      return {
        bodyPart,
        exercises: exercises.map((ex) => ex.toJSON()),
        count: exercises.length,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('bulk-import')
  @ApiStandardOperation('Bulk import exercises', 'Bulk import exercises', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async bulkImportExercises(
    @Body() bulkImportExercisesDto: CreateExerciseDto[],
    @User() user: RequestContext,
  ) {
    try {
      // Exercises are global - only need userId for created_by
      const exercises = await this.exerciseRepository.bulkCreate(
        bulkImportExercisesDto,
        user.userId,
      );

      // Trigger cache sync after bulk import
      await this.exerciseCacheSyncService.forceSync();

      return exercises.map((exercise) => exercise.toJSON());
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT ENDPOINTS
  // ============================================================================

  @Post('cache/sync')
  @ApiStandardOperation(
    'Sync exercises to cache',
    'Manually trigger exercise cache sync from database',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async syncCache() {
    try {
      const result = await this.exerciseCacheSyncService.forceSync();
      return {
        message: result.success
          ? 'Cache sync completed successfully'
          : 'Cache sync failed or already in progress',
        ...result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('cache/status')
  @ApiStandardOperation(
    'Get cache status',
    'Get exercise cache sync status and last sync time',
    true,
  )
  @UseGuards(JwtAuthGuard)
  async getCacheStatus() {
    try {
      const lastSync = await this.exerciseCacheSyncService.getLastSyncTime();
      const isSyncing = this.exerciseCacheSyncService.isSyncInProgress();
      const cacheStats = await this.exerciseCacheService.getCacheStats();

      return {
        lastSync,
        isSyncing,
        cacheMode: cacheStats.mode,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
