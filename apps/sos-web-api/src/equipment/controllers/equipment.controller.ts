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
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@strengthos/shared-types';
import { EquipmentService } from '../services/equipment.service';
import {
    CreateEquipmentDto,
    UpdateEquipmentDto,
    EquipmentFiltersDto,
    CreateEquipmentCategoryDto,
    UpdateEquipmentCategoryDto,
    EquipmentResponseDto,
    EquipmentCategoryResponseDto,
} from '../dto/equipment.dto';
import {
    EquipmentListResponseDto,
    EquipmentCategoryListResponseDto,
} from '../entities/equipment.entity';

@ApiTags('Equipment')
@Controller('equipment')
@ApiBearerAuth()
export class EquipmentController {
    private readonly logger = new Logger(EquipmentController.name);

    constructor(private readonly equipmentService: EquipmentService) { }

    // ============================================================================
    // EQUIPMENT ENDPOINTS
    // ============================================================================

    @Get()
    @ApiOperation({
        summary: 'Get all equipment',
        description: 'Retrieve all equipment with optional filters',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment list retrieved successfully',
    })
    @ApiQuery({
        name: 'availability',
        required: false,
        enum: ['common_gym', 'home', 'specialty_gym'],
    })
    @ApiQuery({ name: 'category_id', required: false, type: String })
    @ApiQuery({ name: 'is_active', required: false, type: Boolean })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @UseGuards(JwtAuthGuard)
    async findAll(
        @Query() filters: EquipmentFiltersDto,
    ): Promise<EquipmentListResponseDto> {
        try {
            return await this.equipmentService.findAll(filters);
        } catch (error) {
            this.logger.error('Failed to find equipment', error);
            throw new HttpException(
                'Failed to find equipment',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get equipment by ID',
        description: 'Retrieve a single equipment by its ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment retrieved successfully',
        type: EquipmentResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    @ApiParam({ name: 'id', description: 'Equipment ID' })
    @UseGuards(JwtAuthGuard)
    async findById(@Param('id') id: string): Promise<EquipmentResponseDto> {
        try {
            return await this.equipmentService.findById(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to find equipment with id ${id}`, error);
            throw new HttpException(
                'Failed to find equipment',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post()
    @ApiOperation({
        summary: 'Create equipment',
        description: 'Create a new equipment item',
    })
    @ApiResponse({
        status: 201,
        description: 'Equipment created successfully',
        type: EquipmentResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.COACH_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async create(@Body() dto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
        try {
            return await this.equipmentService.create(dto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error('Failed to create equipment', error);
            throw new HttpException(
                'Failed to create equipment',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update equipment',
        description: 'Update an existing equipment item',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment updated successfully',
        type: EquipmentResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    @ApiParam({ name: 'id', description: 'Equipment ID' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.COACH_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEquipmentDto,
    ): Promise<EquipmentResponseDto> {
        try {
            return await this.equipmentService.update(id, dto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to update equipment with id ${id}`, error);
            throw new HttpException(
                'Failed to update equipment',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete equipment',
        description: 'Delete an equipment item',
    })
    @ApiResponse({ status: 204, description: 'Equipment deleted successfully' })
    @ApiResponse({ status: 404, description: 'Equipment not found' })
    @ApiParam({ name: 'id', description: 'Equipment ID' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async delete(@Param('id') id: string): Promise<void> {
        try {
            await this.equipmentService.delete(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to delete equipment with id ${id}`, error);
            throw new HttpException(
                'Failed to delete equipment',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // ============================================================================
    // EQUIPMENT CATEGORY ENDPOINTS
    // ============================================================================

    @Get('categories/all')
    @ApiOperation({
        summary: 'Get all equipment categories',
        description: 'Retrieve all equipment categories',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment categories retrieved successfully',
    })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @UseGuards(JwtAuthGuard)
    async findAllCategories(
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<EquipmentCategoryListResponseDto> {
        try {
            return await this.equipmentService.findAllCategories({
                search,
                page,
                limit,
            });
        } catch (error) {
            this.logger.error('Failed to find equipment categories', error);
            throw new HttpException(
                'Failed to find equipment categories',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('categories/:id')
    @ApiOperation({
        summary: 'Get equipment category by ID',
        description: 'Retrieve a single equipment category by its ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment category retrieved successfully',
        type: EquipmentCategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Equipment category not found' })
    @ApiParam({ name: 'id', description: 'Equipment Category ID' })
    @UseGuards(JwtAuthGuard)
    async findCategoryById(
        @Param('id') id: string,
    ): Promise<EquipmentCategoryResponseDto> {
        try {
            return await this.equipmentService.findCategoryById(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to find equipment category with id ${id}`,
                error,
            );
            throw new HttpException(
                'Failed to find equipment category',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('categories')
    @ApiOperation({
        summary: 'Create equipment category',
        description: 'Create a new equipment category',
    })
    @ApiResponse({
        status: 201,
        description: 'Equipment category created successfully',
        type: EquipmentCategoryResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createCategory(
        @Body() dto: CreateEquipmentCategoryDto,
    ): Promise<EquipmentCategoryResponseDto> {
        try {
            return await this.equipmentService.createCategory(dto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error('Failed to create equipment category', error);
            throw new HttpException(
                'Failed to create equipment category',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put('categories/:id')
    @ApiOperation({
        summary: 'Update equipment category',
        description: 'Update an existing equipment category',
    })
    @ApiResponse({
        status: 200,
        description: 'Equipment category updated successfully',
        type: EquipmentCategoryResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Equipment category not found' })
    @ApiParam({ name: 'id', description: 'Equipment Category ID' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateCategory(
        @Param('id') id: string,
        @Body() dto: UpdateEquipmentCategoryDto,
    ): Promise<EquipmentCategoryResponseDto> {
        try {
            return await this.equipmentService.updateCategory(id, dto);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to update equipment category with id ${id}`,
                error,
            );
            throw new HttpException(
                'Failed to update equipment category',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete('categories/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete equipment category',
        description: 'Delete an equipment category',
    })
    @ApiResponse({
        status: 204,
        description: 'Equipment category deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Equipment category not found' })
    @ApiParam({ name: 'id', description: 'Equipment Category ID' })
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async deleteCategory(@Param('id') id: string): Promise<void> {
        try {
            await this.equipmentService.deleteCategory(id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to delete equipment category with id ${id}`,
                error,
            );
            throw new HttpException(
                'Failed to delete equipment category',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
