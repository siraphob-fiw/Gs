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
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { TenantContextService } from '../services/tenant-context.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import {
  RequestContext,
  tenantWithSubscription,
  UserRole,
} from '@strengthos/shared-types';
import {
  Tenant,
  TenantSettings,
} from '@strengthos/shared-types/user-management';
import { TenantAccessDeniedException } from '../../common/exceptions/authorization.exception';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantFiltersDto,
  TenantResponseDto,
  PublicTenantResponseDto,
} from '../dto';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { UserService } from '@/user';
import { TenantUserManagementService } from '../services/tenant-user-management.service';
@ApiTags('tenants')
@Controller('tenants')
@ApiBearerAuth()
export class TenantController {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantUserManagementService: TenantUserManagementService,
  ) {}

  @Get('public')
  @ApiStandardOperation(
    'Get public tenants',
    'Retrieves a list of tenants that allow public joining. Available for authenticated users without a tenant.',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'List of public tenants retrieved successfully',
  })
  async getPublicTenants(): Promise<PublicTenantResponseDto[]> {
    return await this.tenantService.getPublicTenants();
  }

  @Post()
  @ApiStandardOperation(
    'Create a new tenant',
    'Creates a new tenant with the provided information. Only super admins can create tenants.',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<tenantWithSubscription> {
    const tenant = await this.tenantService.createTenant(createTenantDto);
    return tenant;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Get all tenants',
    'Retrieves a list of tenants with optional filtering. Super admins can see all tenants, tenant admins can only see their own.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'List of tenants retrieved successfully',
  })
  async getAllTenants(
    @Query() filters: TenantFiltersDto,
    @User() user: RequestContext,
  ): Promise<tenantWithSubscription[]> {
    let tenants: tenantWithSubscription[] = [];
    if (Object.keys(filters).length > 0) {
      const convertedFilters = {
        ...filters,
        createdAfter: filters.createdAfter
          ? new Date(filters.createdAfter)
          : undefined,
        createdBefore: filters.createdBefore
          ? new Date(filters.createdBefore)
          : undefined,
      };
      tenants = await this.tenantService.getAllTenants(convertedFilters);
    } else {
      const tenantIds =
        await this.tenantContextService.getUserAccessibleTenants(user.userId);
      tenants = await Promise.all(
        tenantIds.map((tenantId) => this.tenantService.getTenant(tenantId)),
      );
    }

    if (!tenants || tenants.length === 0) {
      return [];
    }

    return tenants;
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN, UserRole.TENANT_ADMIN)
  @ApiStandardOperation(
    'Get tenant by ID',
    'Retrieves a specific tenant by its ID. Users can only access tenants they have permission for.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to tenant',
  })
  async getTenant(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<tenantWithSubscription> {
    const userRole = await this.userService.findById(user.userId!);
    if (!userRole) {
      throw new NotFoundException('User not found');
    }
    if (userRole.role !== UserRole.SUPER_ADMIN) {
      const hasAccess = await this.tenantContextService.validateTenantAccess(
        user.userId,
        id,
      );
      if (!hasAccess) {
        throw new TenantAccessDeniedException(id);
      }
    }

    return await this.tenantService.getTenant(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiStandardOperation(
    'Update tenant',
    'Updates a tenant with the provided information. Super admins can update any tenant, tenant admins can only update their own.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @User() user: any,
  ): Promise<tenantWithSubscription> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      const hasAccess = await this.tenantContextService.validateTenantAccess(
        user.userId,
        id,
      );
      if (!hasAccess) {
        throw new TenantAccessDeniedException(id);
      }
    }

    return await this.tenantService.updateTenant(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiStandardOperation(
    'Delete tenant',
    'Soft deletes a tenant by setting its status to CANCELLED. Only super admins can delete tenants.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async deleteTenant(@Param('id') id: string): Promise<void> {
    await this.tenantService.deleteTenant(id);
  }

  @Get(':id/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiStandardOperation(
    'Get tenant settings',
    'Retrieves the settings for a specific tenant.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant settings retrieved successfully',
    type: 'object',
  })
  async getTenantSettings(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<TenantSettings> {
    const u = await this.userService.findById(user.userId!);
    if (!u) {
      throw new NotFoundException('User not found');
    } else {
      if (u.role !== UserRole.SUPER_ADMIN) {
        const hasAccess = await this.tenantContextService.validateTenantAccess(
          user.userId!,
          id,
        );
        if (!hasAccess) {
          throw new TenantAccessDeniedException(id);
        }
      }
    }

    return await this.tenantService.getTenantSettings(id);
  }

  @Put(':id/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiStandardOperation(
    'Update tenant settings',
    'Updates the settings for a specific tenant.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant settings updated successfully',
    type: 'object',
  })
  async updateTenantSettings(
    @Param('id') id: string,
    @Body() settings: TenantSettings,
    @User() user: RequestContext,
  ): Promise<TenantSettings> {
    const userRole = await this.userService.findById(user.userId!);
    if (!userRole) {
      throw new NotFoundException('User not found');
    } else {
      if (userRole.role !== UserRole.SUPER_ADMIN) {
        const hasAccess = await this.tenantContextService.validateTenantAccess(
          user.userId!,
          id,
        );
        if (!hasAccess) {
          throw new TenantAccessDeniedException(id);
        }
      }
    }

    return await this.tenantService.updateTenantSettings(id, settings);
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiStandardOperation(
    'Suspend tenant',
    'Suspends a tenant and revokes all active user sessions. Only super admins can suspend tenants.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Tenant suspended successfully',
  })
  async suspendTenant(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @User() user: any,
  ): Promise<void> {
    await this.tenantService.suspendTenant(id, user.id);
  }

  @Post(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiStandardOperation(
    'Reactivate tenant',
    'Reactivates a suspended tenant. Only super admins can reactivate tenants.',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Tenant reactivated successfully',
  })
  async reactivateTenant(
    @Param('id') id: string,
    @User() user: any,
  ): Promise<void> {
    await this.tenantService.reactivateTenant(id, user.id);
  }

  @Get(':id/util')
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'Get Tenant Locale and Weight unit',
    'Get Teannt Locale and Weight unit',
    true,
  )
  async tenantUtils(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<{
    defaultLanguage: string;
    availableLanguages: string[];
  }> {
    return await this.tenantService.getUtil(id, user.userId!);
  }

  @Get(':id/leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'Get tenant leaderboard',
    'Get tenant leaderboard',
    true,
  )
  @ApiResponse({
    status: 200,
    description: 'Tenant leaderboard retrieved successfully',
    type: 'object',
  })
  async getTenantLeaderboard(@Param('id') id: string): Promise<{
    leaderboard: {
      userId: string;
      name: string;
      status: string;
      lastActivity: string;
      max1RM: number;
    }[];
  }> {
    return await this.tenantService.getLeaderboard(id);
  }

  @Get('users/stats')
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation('Get tenant stats', 'Get tenant stats', true)
  async getTenantStats(@User() user: RequestContext): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    usersByStatus: Record<string, number>;
    recentRegistrations: number;
  }> {
    return await this.tenantUserManagementService.getTenantUserStats(
      user.userId,
    );
  }
}
