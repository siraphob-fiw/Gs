import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SuperAdminService } from '../services/super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { ApiStandardOperation } from '../../common/decorators/swagger.decorators';
import {
  AssignTenantDto,
  BulkAssignTenantDto,
  UserResponseDto,
} from '../../user/dto';

@ApiTags('super-admin')
@Controller('super-admin')
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('platform-stats')
  @ApiStandardOperation('Get platform stats', 'Retrieves platform stats', true)
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Platform stats retrieved successfully',
  })
  async getPlatformStats(@User() user: RequestContext) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }

    const userId = user.userId;
    return this.superAdminService.getPlatformStats(userId);
  }

  @Get('tenant-health')
  @ApiStandardOperation(
    'Get tenant health metrics',
    'Retrieves health metrics for all tenants',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Tenant health metrics retrieved successfully',
  })
  async getTenantHealthMetrics(@User() user: RequestContext) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.getTenantHealthMetrics(user.userId);
  }

  @Get('system-health')
  @ApiStandardOperation(
    'Get system health check',
    'Retrieves comprehensive system health information',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'System health check retrieved successfully',
  })
  async getSystemHealthCheck(@User() user: RequestContext) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.getSystemHealthCheck(user.userId);
  }

  @Post('bulk-tenant-operation')
  @HttpCode(HttpStatus.OK)
  @ApiStandardOperation(
    'Perform bulk tenant operation',
    'Performs a bulk operation on multiple tenants',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
  })
  async performBulkTenantOperation(
    @Body()
    body: {
      tenantId: string;
      operation: 'activate' | 'suspend' | 'deactivate';
    },
    @User() user: RequestContext,
  ) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.performBulkTenantOperation(
      user.userId,
      body.tenantId,
      body.operation,
    );
  }

  @Get('usage-analytics')
  @ApiStandardOperation(
    'Get platform usage analytics',
    'Retrieves platform usage analytics for a specified date range',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (ISO string)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage analytics retrieved successfully',
  })
  async getPlatformUsageAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @User() user: RequestContext,
  ) {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.getPlatformUsageAnalytics(
      user.userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Put('users/:id/tenant')
  @ApiStandardOperation(
    'Assign tenant to user',
    'Assigns a user to a different tenant (Super Admin only)',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant assigned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or tenant not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or user already in tenant',
  })
  async assignTenantToUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTenantDto: AssignTenantDto,
    @User() user: RequestContext,
  ): Promise<UserResponseDto> {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.assignTenantToUser(
      id,
      assignTenantDto.tenantId,
      user.userId,
    );
  }

  @Post('users/bulk-assign-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiStandardOperation(
    'Bulk assign tenant to users',
    'Assigns multiple users to a tenant (Super Admin only)',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant assigned successfully to all users',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more users or tenant not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  async bulkAssignTenantToUsers(
    @Body() bulkAssignTenantDto: BulkAssignTenantDto,
    @User() user: RequestContext,
  ): Promise<UserResponseDto[]> {
    if (!user || !user.userId) {
      throw new UnauthorizedException('User context not found or invalid');
    }
    return this.superAdminService.bulkAssignTenantToUsers(
      bulkAssignTenantDto.userIds,
      bulkAssignTenantDto.tenantId,
      user.userId,
    );
  }
}
