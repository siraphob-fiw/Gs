import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Logger,
  HttpStatus,
  HttpException,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ModifierService } from '../services/modifier.service';
import { ModifierCacheService } from '../services/modifier-cache.service';
import { ModifierCacheSyncService } from '../services/modifier-cache-sync.service';
import { ApiStandardOperation } from '@/common';
import { RequestContext, UserRole } from '@/types';
import { User } from '@/auth/decorators/user.decorator';
import {
  CreateModifierDto,
  ModifierFiltersDto,
  ModifierListResponseDto,
  UpdateModifierDto,
} from '../dto/modifier.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';

@ApiTags('modifiers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modifiers')
export class ModifierController {
  private readonly logger = new Logger(ModifierController.name);

  constructor(
    private readonly modifierService: ModifierService,
    private readonly modifierCacheService: ModifierCacheService,
    private readonly modifierCacheSyncService: ModifierCacheSyncService,
  ) {}

  @Get()
  @ApiStandardOperation('Get all modifiers', 'Get all modifiers', true)
  @ApiResponse({ status: 200, description: 'List of modifiers returned' })
  async findAll(
    @Query() filters: ModifierFiltersDto,
  ): Promise<ModifierListResponseDto> {
    try {
      // Use cache service for better performance
      return await this.modifierCacheService.findAllWithFilters(filters);
    } catch (error) {
      this.logger.error('Failed to get modifiers', error);
      throw new HttpException(
        'Failed to get modifiers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiStandardOperation('Get a modifier by ID', 'Get a modifier by ID', true)
  @ApiParam({ name: 'id', description: 'Modifier ID', required: true })
  @ApiResponse({ status: 200, description: 'Modifier found' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  async findOne(@Param('id') id: string) {
    try {
      // Use cache service for better performance
      const modifier = await this.modifierCacheService.findOne(id);
      if (!modifier) {
        throw new NotFoundException('Modifier not found');
      }
      return modifier;
    } catch (error) {
      this.logger.error(`Failed to get modifier with id ${id}`, error);
      throw new HttpException(
        'Failed to get modifier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiStandardOperation('Create a new modifier', 'Create a new modifier', true)
  @ApiBody({
    description: 'Modifier create DTO',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        modifier_category_id: { type: 'string' },
        central_stress_factor: { type: 'number' },
        peripheral_stress_factor: { type: 'number' },
      },
      required: ['name', 'modifier_category_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Modifier created' })
  async create(
    @Body() createModifierDto: CreateModifierDto,
    @User() user: RequestContext,
  ) {
    try {
      // Use service for business logic (role-based status), then sync cache
      const modifier = await this.modifierService.create(
        createModifierDto,
        user.userId,
      );
      // Trigger cache sync after create
      await this.modifierCacheSyncService.syncAllModifiersToCache();
      return modifier;
    } catch (error) {
      this.logger.error('Failed to create modifier', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create modifier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiStandardOperation('Update a modifier', 'Update a modifier', true)
  @ApiParam({ name: 'id', description: 'Modifier ID', required: true })
  @ApiBody({ description: 'Modifier update DTO', type: UpdateModifierDto })
  @ApiResponse({ status: 200, description: 'Modifier updated' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  async update(
    @Param('id') id: string,
    @Body() updateModifierDto: UpdateModifierDto,
  ) {
    try {
      const updated = await this.modifierCacheService.update(
        id,
        updateModifierDto,
      );
      if (!updated) {
        throw new NotFoundException('Modifier not found');
      }
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update modifier with id ${id}`, error);
      throw new HttpException(
        'Failed to update modifier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiStandardOperation('Delete a modifier', 'Delete a modifier', true)
  @ApiParam({ name: 'id', description: 'Modifier ID', required: true })
  @ApiResponse({ status: 200, description: 'Modifier deleted' })
  @ApiResponse({ status: 404, description: 'Modifier not found' })
  async remove(@Param('id') id: string, @User() user: RequestContext) {
    try {
      // Use service for permission check, then sync cache
      const deleted = await this.modifierService.remove(id, user.userId);
      if (!deleted) {
        throw new NotFoundException('Modifier not found');
      }
      // Trigger cache sync after delete
      await this.modifierCacheSyncService.syncAllModifiersToCache();
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Failed to delete modifier with id ${id}`, error);
      throw new HttpException(
        'Failed to delete modifier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/bulkUpdate')
  @ApiStandardOperation('Bulk update modifiers', 'Bulk update modifiers', true)
  @ApiBody({ description: 'Bulk update DTO', type: [UpdateModifierDto] })
  @ApiResponse({ status: 200, description: 'Modifiers updated' })
  @ApiResponse({ status: 404, description: 'Modifiers not found' })
  async bulkUpdate(
    @Body() bulkUpdateModifierDto: UpdateModifierDto[],
    @User() user: RequestContext,
  ) {
    try {
      const result = await this.modifierCacheService.bulkUpdate(
        bulkUpdateModifierDto,
        user,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to bulk update modifiers', error);
      throw new HttpException(
        'Failed to bulk update modifiers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/sync-cache')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiStandardOperation(
    'Manually synchronize modifier cache',
    'Manually synchronize modifier cache',
    true,
  )
  @ApiResponse({ status: 200, description: 'Cache sync initiated' })
  async syncCache() {
    try {
      const result = await this.modifierCacheSyncService.forceSync();
      return {
        message: 'Modifier cache synchronization completed',
        ...result,
      };
    } catch (error) {
      this.logger.error('Failed to sync modifier cache', error);
      throw new HttpException(
        'Failed to sync modifier cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
