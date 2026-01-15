import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Logger,
  HttpStatus,
  HttpCode,
  HttpException,
  ParseUUIDPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiStandardOperation } from '@/common';
import { ExerciseCategoryService } from '../services/exercise-category.service';
import { ExerciseCategoryCacheService } from '../services/exercise-category-cache.service';
import { ExerciseCategoryCacheSyncService } from '../services/exercise-category-cache-sync.service';
import {
  CreateExerciseCategoryDto,
  UpdateExerciseCategoryDto,
  ExerciseCategoryFiltersDto,
  ExerciseCategoryResponseDto,
  ExerciseCategoryListResponseDto,
} from '../dto/exercise-category.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/types';

@ApiTags('exercise-categories')
@Controller('exercise-categories')
export class ExerciseCategoryController {
  private readonly logger = new Logger(ExerciseCategoryController.name);

  constructor(
    private readonly exerciseCategoryService: ExerciseCategoryService,
    private readonly exerciseCategoryCacheService: ExerciseCategoryCacheService,
    private readonly exerciseCategoryCacheSyncService: ExerciseCategoryCacheSyncService,
  ) {}

  @Get()
  @ApiStandardOperation(
    'Get all exercise categories',
    'List all exercise categories with optional filtering and pagination',
    true,
  )
  @ApiBearerAuth()
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by name (partial match)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercise categories',
    type: ExerciseCategoryListResponseDto,
  })
  async findAll(
    @Query() filters: ExerciseCategoryFiltersDto,
  ): Promise<ExerciseCategoryListResponseDto> {
    try {
      this.logger.log('Fetching exercise categories');
      // Use cache service for better performance
      return await this.exerciseCategoryCacheService.findAllWithFilters(
        filters,
      );
    } catch (error) {
      this.logger.error('Failed to get exercise categories', error);
      throw new HttpException(
        'Failed to get exercise categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiStandardOperation(
    'Get exercise category by ID',
    'Get a single exercise category by its ID',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Exercise category ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise category found',
    type: ExerciseCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise category not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExerciseCategoryResponseDto> {
    try {
      this.logger.log(`Fetching exercise category with ID: ${id}`);
      // Use cache service for better performance
      const category = await this.exerciseCategoryCacheService.findOne(id);
      if (!category) {
        throw new NotFoundException('Exercise category not found');
      }
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get exercise category with id ${id}`, error);
      throw new HttpException(
        'Failed to get exercise category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiStandardOperation(
    'Create exercise category',
    'Create a new exercise category',
    true,
  )
  @ApiBearerAuth()
  @ApiBody({
    description: 'Exercise category data',
    type: CreateExerciseCategoryDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise category created',
    type: ExerciseCategoryResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Exercise category with this name already exists',
  })
  async create(
    @Body() createDto: CreateExerciseCategoryDto,
  ): Promise<ExerciseCategoryResponseDto> {
    try {
      this.logger.log(`Creating exercise category: ${createDto.name}`);
      // Use cache service which will sync after create
      return await this.exerciseCategoryCacheService.create(createDto);
    } catch (error) {
      this.logger.error('Failed to create exercise category', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create exercise category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiStandardOperation(
    'Update exercise category',
    'Update an existing exercise category',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Exercise category ID',
    type: String,
  })
  @ApiBody({
    description: 'Exercise category update data',
    type: UpdateExerciseCategoryDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise category updated',
    type: ExerciseCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise category not found' })
  @ApiResponse({
    status: 409,
    description: 'Exercise category with this name already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateExerciseCategoryDto,
  ): Promise<ExerciseCategoryResponseDto> {
    try {
      // Use cache service which will sync after update
      const updated = await this.exerciseCategoryCacheService.update(
        id,
        updateDto,
      );
      if (!updated) {
        throw new NotFoundException('Exercise category not found');
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update exercise category with id ${id}`,
        error,
      );
      throw new HttpException(
        'Failed to update exercise category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiStandardOperation(
    'Delete exercise category',
    'Delete an exercise category by its ID',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Exercise category ID',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Exercise category deleted' })
  @ApiResponse({ status: 404, description: 'Exercise category not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    try {
      this.logger.log(`Deleting exercise category with ID: ${id}`);
      // Use cache service which will sync after delete
      const deleted = await this.exerciseCategoryCacheService.delete(id);
      if (!deleted) {
        throw new NotFoundException('Exercise category not found');
      }
      return { deleted };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete exercise category with id ${id}`,
        error,
      );
      throw new HttpException(
        'Failed to delete exercise category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/sync-cache')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiStandardOperation(
    'Manually synchronize exercise category cache',
    'Manually synchronize exercise category cache',
    true,
  )
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Cache sync initiated' })
  async syncCache() {
    try {
      const result = await this.exerciseCategoryCacheSyncService.forceSync();
      return {
        message: 'Exercise category cache synchronization completed',
        ...result,
      };
    } catch (error) {
      this.logger.error('Failed to sync exercise category cache', error);
      throw new HttpException(
        'Failed to sync exercise category cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
