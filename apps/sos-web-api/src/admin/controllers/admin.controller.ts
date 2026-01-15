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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminService } from '../services/admin.service';
import { SystemConfigService } from '../services/system-config.service';
import { AdminReportingService } from '../services/admin-reporting.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  AdminActionDto,
  ReportQueryDto,
} from '../dto/admin-request.dto';
import {
  SystemConfigResponseDto,
  AdminActionResponseDto,
  SystemStatsResponseDto,
  ReportResponseDto,
} from '../dto/admin-response.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemConfigService: SystemConfigService,
    private readonly adminReportingService: AdminReportingService,
  ) {}

  // System Configuration Endpoints

  @Post('config')
  @ApiOperation({ summary: 'Create system configuration' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 409, description: 'Configuration key already exists' })
  async createSystemConfig(
    @Req() req: Request,
    @Body() createConfigDto: CreateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    const userId = req.user?.['sub'];
    const config = await this.systemConfigService.createConfig(
      userId,
      createConfigDto,
    );
    return SystemConfigResponseDto.fromEntity(config);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get all system configurations' })
  @ApiResponse({
    status: 200,
    description: 'Configurations retrieved successfully',
    type: [SystemConfigResponseDto],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  async getAllSystemConfigs(
    @Req() req: Request,
    @Query('category') category?: string,
  ): Promise<SystemConfigResponseDto[]> {
    const userId = req.user?.['sub'];
    const configs = await this.systemConfigService.getAllConfigs(userId, {
      category,
    });
    return configs.map((config) => SystemConfigResponseDto.fromEntity(config));
  }

  @Get('config/:key')
  @ApiOperation({ summary: 'Get system configuration by key' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async getSystemConfigByKey(
    @Req() req: Request,
    @Param('key') key: string,
  ): Promise<SystemConfigResponseDto> {
    const userId = req.user?.['sub'];
    const config = await this.systemConfigService.getConfigByKey(key, userId);
    return SystemConfigResponseDto.fromEntity(config);
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  async updateSystemConfig(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateConfigDto: UpdateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    const userId = req.user?.['sub'];
    const config = await this.systemConfigService.updateConfig(
      userId,
      id,
      updateConfigDto,
    );
    return SystemConfigResponseDto.fromEntity(config);
  }

  @Delete('config/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete system configuration' })
  @ApiResponse({
    status: 204,
    description: 'Configuration deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  async deleteSystemConfig(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user?.['sub'];
    await this.systemConfigService.deleteConfig(userId, id);
  }

  @Get('config/category/:category')
  @ApiOperation({ summary: 'Get configurations by category' })
  @ApiResponse({
    status: 200,
    description: 'Configurations retrieved successfully',
    type: [SystemConfigResponseDto],
  })
  @ApiParam({ name: 'category', description: 'Configuration category' })
  async getConfigsByCategory(
    @Req() req: Request,
    @Param('category') category: string,
  ): Promise<SystemConfigResponseDto[]> {
    const userId = req.user?.['sub'];
    const configs = await this.systemConfigService.getConfigsByCategory(
      category,
      userId,
    );
    return configs.map((config) => SystemConfigResponseDto.fromEntity(config));
  }

  @Get('config-categories')
  @ApiOperation({ summary: 'Get all configuration categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [String],
  })
  async getConfigCategories(@Req() req: Request): Promise<string[]> {
    const userId = req.user?.['sub'];
    return this.systemConfigService.getCategories(userId);
  }

  // Admin Action Endpoints

  @Post('actions')
  @ApiOperation({ summary: 'Log admin action' })
  @ApiResponse({
    status: 201,
    description: 'Admin action logged successfully',
    type: AdminActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async logAdminAction(
    @Req() req: Request,
    @Body() actionDto: AdminActionDto,
  ): Promise<AdminActionResponseDto> {
    const userId = req.user?.['sub'];
    const action = await this.adminService.logAdminAction(userId, actionDto);
    return AdminActionResponseDto.fromEntity(action);
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get admin actions' })
  @ApiResponse({
    status: 200,
    description: 'Admin actions retrieved successfully',
  })
  @ApiQuery({
    name: 'adminUserId',
    required: false,
    description: 'Filter by admin user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'targetType',
    required: false,
    description: 'Filter by target type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getAdminActions(
    @Req() req: Request,
    @Query('adminUserId') adminUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    actions: AdminActionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = req.user?.['sub'];
    const filters = {
      adminUserId,
      action,
      targetType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const pagination =
      page && limit ? { page: Number(page), limit: Number(limit) } : undefined;

    const result = await this.adminService.getAdminActions(
      userId,
      filters,
      pagination,
    );

    return {
      actions: result.actions.map((action) =>
        AdminActionResponseDto.fromEntity(action),
      ),
      total: result.total,
      page: pagination?.page || 1,
      limit: pagination?.limit || result.total,
    };
  }

  @Get('actions/:id')
  @ApiOperation({ summary: 'Get admin action by ID' })
  @ApiResponse({
    status: 200,
    description: 'Admin action retrieved successfully',
    type: AdminActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 404, description: 'Admin action not found' })
  @ApiParam({ name: 'id', description: 'Admin action ID' })
  async getAdminActionById(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AdminActionResponseDto> {
    const userId = req.user?.['sub'];
    const action = await this.adminService.getAdminActionById(userId, id);
    return AdminActionResponseDto.fromEntity(action);
  }

  // User Management Actions

  @Post('users/:userId/actions/:action')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Perform user management action' })
  @ApiResponse({
    status: 204,
    description: 'User action performed successfully',
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiParam({
    name: 'action',
    enum: ['activate', 'deactivate', 'reset_password', 'delete'],
    description: 'Action to perform',
  })
  async performUserAction(
    @Req() req: Request,
    @Param('userId') targetUserId: string,
    @Param('action')
    action: 'activate' | 'deactivate' | 'reset_password' | 'delete',
  ): Promise<void> {
    const userId = req.user?.['sub'];
    await this.adminService.performUserAction(userId, targetUserId, action);
  }

  // Tenant Management Actions

  @Post('tenants/:tenantId/actions/:action')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Perform tenant management action' })
  @ApiResponse({
    status: 204,
    description: 'Tenant action performed successfully',
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiParam({ name: 'tenantId', description: 'Target tenant ID' })
  @ApiParam({
    name: 'action',
    enum: ['activate', 'deactivate', 'suspend', 'delete'],
    description: 'Action to perform',
  })
  async performTenantAction(
    @Req() req: Request,
    @Param('tenantId') targetTenantId: string,
    @Param('action') action: 'activate' | 'deactivate' | 'suspend' | 'delete',
  ): Promise<void> {
    const userId = req.user?.['sub'];
    await this.adminService.performTenantAction(userId, targetTenantId, action);
  }

  // Reporting Endpoints

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
    type: SystemStatsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async getSystemStats(@Req() req: Request): Promise<SystemStatsResponseDto> {
    const userId = req.user?.['sub'];
    const stats = await this.adminReportingService.getSystemStats(userId);
    return SystemStatsResponseDto.fromEntity(stats);
  }

  @Get('reports/users')
  @ApiOperation({ summary: 'Generate user report' })
  @ApiResponse({
    status: 200,
    description: 'User report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async generateUserReport(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    const userId = req.user?.['sub'];
    return this.adminReportingService.generateUserReport(userId, query);
  }

  @Get('reports/tenants')
  @ApiOperation({ summary: 'Generate tenant report' })
  @ApiResponse({
    status: 200,
    description: 'Tenant report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async generateTenantReport(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    const userId = req.user?.['sub'];
    return this.adminReportingService.generateTenantReport(userId, query);
  }

  @Get('reports/transactions')
  @ApiOperation({ summary: 'Generate transaction report' })
  @ApiResponse({
    status: 200,
    description: 'Transaction report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async generateTransactionReport(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    const userId = req.user?.['sub'];
    return this.adminReportingService.generateTransactionReport(userId, query);
  }

  @Get('reports/system')
  @ApiOperation({ summary: 'Generate system report' })
  @ApiResponse({
    status: 200,
    description: 'System report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async generateSystemReport(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    const userId = req.user?.['sub'];
    return this.adminReportingService.generateSystemReport(userId, query);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({
    status: 200,
    description: 'Admin overview retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Super admin access required' })
  async getSystemOverview(@Req() req: Request): Promise<{
    recentActions: AdminActionResponseDto[];
    systemHealth: string;
    criticalAlerts: any[];
  }> {
    const userId = req.user?.['sub'];
    const overview = await this.adminService.getSystemOverview(userId);

    return {
      recentActions: overview.recentActions.map((action) =>
        AdminActionResponseDto.fromEntity(action),
      ),
      systemHealth: overview.systemHealth,
      criticalAlerts: overview.criticalAlerts,
    };
  }
}
