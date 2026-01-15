import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  TenantUserManagementService,
  TenantUserFilters,
} from '../services/tenant-user-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { RequestContext, UserRole, UserStatus } from '@strengthos/shared-types';
import { ApiStandardOperation } from '../../common/decorators/swagger.decorators';
import { UserResponseDto } from '@/user/dto/user-response.dto';

@ApiTags('tenant-user-management')
@Controller('tenants/:tenantId/users')
@ApiBearerAuth()
export class TenantUserManagementController {
  constructor(
    private readonly tenantUserManagementService: TenantUserManagementService,
  ) {}

  @Get()
  @ApiStandardOperation('Get tenant users', 'Get tenant users', true)
  @UseGuards(JwtAuthGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COACH_ADMIN,
    UserRole.COACH,
    UserRole.TENANT_ADMIN,
  )
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, email, or phone',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getTenantUsers(
    @Param('tenantId') tenantId: string,
    @User() user: RequestContext,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters: TenantUserFilters = {
      role,
      status,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return await this.tenantUserManagementService.getTenantUsers(
      tenantId,
      filters,
      user.userId,
    );
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN, UserRole.TENANT_ADMIN)
  @ApiStandardOperation(
    'Get tenant user statistics',
    'Get tenant user statistics',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async getTenantUserStats(
    @Param('tenantId') tenantId: string,
    @User() user: RequestContext,
  ) {
    return this.tenantUserManagementService.getTenantUserStats(
      user.userId,
      tenantId,
    );
  }

  @Get('coaching-relationships')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @ApiStandardOperation(
    'Get coaching relationships',
    'Get coaching relationships',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Coaching relationships retrieved successfully',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Coaching relationships retrieved successfully',
  })
  async getTenantCoachingRelationships(
    @Param('tenantId') tenantId: string,
    @User() user: RequestContext,
  ) {
    return this.tenantUserManagementService.getTenantCoachingRelationships(
      tenantId,
      user.userId,
    );
  }
}
