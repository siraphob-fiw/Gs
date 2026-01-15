import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Query,
  Logger,
  HttpStatus,
  HttpException,
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
import {
  CreateModifierCategoryDto,
  UpdateModifierCategoryDto,
  ModifierCategoryFiltersDto,
} from '../dto/modifier-category.dto';
import { ModifierCategoryService } from '../services/modifier-category.service';
import { ModifierCategoryCacheService } from '../services/modifier-category-cache.service';
import { ModifierCategoryCacheSyncService } from '../services/modifier-category-cache-sync.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/types';

@ApiTags('modifier-categories')
@Controller('modifier-categories')
export class ModifierCategoryController {
  private readonly logger = new Logger(ModifierCategoryController.name);

  constructor(
    private readonly modifierCategoryService: ModifierCategoryService,
    private readonly modifierCategoryCacheService: ModifierCategoryCacheService,
    private readonly modifierCategoryCacheSyncService: ModifierCategoryCacheSyncService,
  ) {}

  @Get()
  @ApiStandardOperation(
    'Get all modifier categories',
    'List all modifier categories',
    true,
  )
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'List of modifier categories' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Modifier category name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Modifier category status',
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
    description: 'Result limit',
    type: Number,
  })
  async findAllCategories(@Query() filters: ModifierCategoryFiltersDto) {
    try {
      // Use cache service for better performance
      return await this.modifierCategoryCacheService.findAllWithFilters(
        filters,
      );
    } catch (error) {
      this.logger.error('Failed to get modifier categories', error);
      throw new HttpException(
        'Failed to get modifier categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiStandardOperation(
    'Get modifier category by ID',
    'Get a single modifier category',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Modifier category ID', required: true })
  @ApiResponse({ status: 200, description: 'Modifier category found' })
  @ApiResponse({ status: 404, description: 'Modifier category not found' })
  async findOneCategory(@Param('id') id: string) {
    try {
      // Use cache service for better performance
      const category = await this.modifierCategoryCacheService.findOne(id);
      if (!category) {
        throw new NotFoundException('Modifier category not found');
      }
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get modifier category with id ${id}`, error);
      throw new HttpException(
        'Failed to get modifier category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiStandardOperation(
    'Create modifier category',
    'Create a new modifier category',
    true,
  )
  @ApiBearerAuth()
  @ApiBody({
    description: 'Modifier category create DTO',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Modifier category created' })
  async createCategory(
    @Body() createModifierCategoryDto: CreateModifierCategoryDto,
  ) {
    try {
      // Use cache service which will sync after create
      return await this.modifierCategoryCacheService.create(
        createModifierCategoryDto,
      );
    } catch (error) {
      this.logger.error('Failed to create modifier category', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create modifier category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiStandardOperation(
    'Update modifier category',
    'Update a modifier category',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Modifier category ID', required: true })
  @ApiBody({
    description: 'Modifier category update DTO',
    type: UpdateModifierCategoryDto,
  })
  @ApiResponse({ status: 200, description: 'Modifier category updated' })
  @ApiResponse({ status: 404, description: 'Modifier category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateModifierCategoryDto: UpdateModifierCategoryDto,
  ) {
    try {
      // Use cache service which will sync after update
      const updated = await this.modifierCategoryCacheService.update(
        id,
        updateModifierCategoryDto,
      );
      if (!updated) {
        throw new NotFoundException('Modifier category not found');
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update modifier category with id ${id}`,
        error,
      );
      throw new HttpException(
        'Failed to update modifier category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiStandardOperation(
    'Delete modifier category',
    'Delete a modifier category',
    true,
  )
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Modifier category ID', required: true })
  @ApiResponse({ status: 200, description: 'Modifier category deleted' })
  @ApiResponse({ status: 404, description: 'Modifier category not found' })
  async removeCategory(@Param('id') id: string) {
    try {
      // Use cache service which will sync after delete
      const deleted = await this.modifierCategoryCacheService.delete(id);
      if (!deleted) {
        throw new NotFoundException('Modifier category not found');
      }
      return { deleted: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete modifier category with id ${id}`,
        error,
      );
      throw new HttpException(
        'Failed to delete modifier category',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/sync-cache')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiStandardOperation(
    'Manually synchronize modifier category cache',
    'Manually synchronize modifier category cache',
    true,
  )
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Cache sync initiated' })
  async syncCache() {
    try {
      const result = await this.modifierCategoryCacheSyncService.forceSync();
      return {
        message: 'Modifier category cache synchronization completed',
        ...result,
      };
    } catch (error) {
      this.logger.error('Failed to sync modifier category cache', error);
      throw new HttpException(
        'Failed to sync modifier category cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
