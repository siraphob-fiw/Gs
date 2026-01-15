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
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
  UserStatus,
  AssignRoleDto,
  BulkAssignRoleDto,
  BulkStatusUpdateDto,
  UpdateTrainingPreferencesDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../dto/create-user.dto';
import { ApiStandardOperation } from '../../common/decorators/swagger.decorators';
import { User } from '../../auth/decorators/user.decorator';
import { RequestContext } from '@strengthos/shared-types';
import { ApprovalCoachDto } from '../dto/approvalCoach';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  @Post()
  @ApiStandardOperation('Create a new user', 'Create a new user', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    Logger.log('create');
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiStandardOperation(
    'Get all users with filtering and pagination',
    'Get all users with filtering and pagination',
    true,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.COACH_ADMIN,
    UserRole.COACH,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by email or name',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UserStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async findAll(@Query() queryDto: UserQueryDto, @User() user: RequestContext) {
    return this.userService.findMany(queryDto, user);
  }

  // ============================================
  // Special List Endpoints (must come before :id routes)
  // ============================================

  @Get('approval-coach-list')
  @ApiStandardOperation(
    'Get approval coach list',
    'Get approval coach list',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Approval coach list retrieved successfully',
    type: ApprovalCoachDto,
  })
  async getApprovalCoachList(
    @User() user: RequestContext,
  ): Promise<ApprovalCoachDto> {
    return this.userService.getApprovalCoachList(user.userId);
  }

  // ============================================
  // Query Endpoints (must come before :id routes)
  // ============================================

  @Get('by-role/:role')
  @ApiStandardOperation('Get users by role', 'Get users by role', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'role', enum: UserRole, description: 'User role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async getUsersByRole(
    @Param('role') role: UserRole,
  ): Promise<UserResponseDto[]> {
    Logger.log('getUsersByRole');
    return this.userService.getUsersByRole(role);
  }

  @Get('by-status/:status')
  @ApiStandardOperation('Get users by status', 'Get users by status', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'status', enum: UserStatus, description: 'User status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async getUsersByStatus(
    @Param('status') status: UserStatus,
  ): Promise<UserResponseDto[]> {
    Logger.log('getUsersByStatus');
    return this.userService.getUsersByStatus(status);
  }

  @Get('by-email/:email')
  @ApiStandardOperation('Get user by email', 'Get user by email', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN, UserRole.COACH)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'email', description: 'User email address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto> {
    Logger.log('getUserByEmail');
    return this.userService.findByEmail(email);
  }

  @Get('by-phone/:phoneNumber')
  @ApiStandardOperation(
    'Get user by phone number',
    'Get user by phone number',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN, UserRole.COACH)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'phoneNumber', description: 'User phone number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<UserResponseDto> {
    Logger.log('getUserByPhoneNumber');
    return this.userService.findByPhoneNumber(phoneNumber);
  }

  // ============================================
  // Bulk Operations
  // ============================================

  @Post('bulk/assign-role')
  @ApiStandardOperation(
    'Bulk assign role to multiple users',
    'Bulk assign role to multiple users',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles assigned successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more users not found',
  })
  async bulkAssignRole(
    @Body() bulkAssignRoleDto: BulkAssignRoleDto,
  ): Promise<UserResponseDto[]> {
    Logger.log('bulkAssignRole');
    return this.userService.bulkAssignRole(
      bulkAssignRoleDto.userIds,
      bulkAssignRoleDto.role,
    );
  }

  @Post('bulk/update-status')
  @ApiStandardOperation(
    'Bulk update status for multiple users',
    'Bulk update status for multiple users',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statuses updated successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more users not found',
  })
  async bulkUpdateStatus(
    @Body() bulkStatusUpdateDto: BulkStatusUpdateDto,
  ): Promise<UserResponseDto[]> {
    Logger.log('bulkUpdateStatus');
    return this.userService.bulkUpdateStatus(
      bulkStatusUpdateDto.userIds,
      bulkStatusUpdateDto.status,
    );
  }

  // ============================================
  // User by ID Operations
  // ============================================

  @Get(':id')
  @ApiStandardOperation('Get user by ID', 'Get user by ID', true)
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  @Put(':id')
  @ApiStandardOperation('Update user by ID', 'Update user by ID', true)
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: RequestContext,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto, user.userId);
  }

  @Delete(':id')
  @ApiStandardOperation('Delete user by ID', 'Delete user by ID', true)
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.delete(id);
  }

  // ============================================
  // User Sub-resource Operations
  // ============================================

  @Put(':id/status')
  @ApiStandardOperation('Update user status', 'Update user status', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: UserStatus },
  ): Promise<UserResponseDto> {
    Logger.log('updateStatus');
    return this.userService.updateStatus(id, body.status);
  }

  @Put(':id/role')
  @ApiStandardOperation('Assign role to user', 'Assign role to user', true)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role assigned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRoleDto: AssignRoleDto,
    @User() user: RequestContext,
  ): Promise<UserResponseDto> {
    return this.userService.assignRole(id, assignRoleDto.role, user.userId);
  }

  @Put(':id/verify-phone')
  @ApiStandardOperation(
    'Verify user phone number',
    'Verify user phone number',
    true,
  )
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone number verified successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async verifyPhoneNumber(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    Logger.log('verifyPhoneNumber');
    return this.userService.verifyPhoneNumber(id);
  }

  @Get(':id/training-preferences')
  @ApiStandardOperation(
    'Get user training preferences',
    'Get user training preferences',
    true,
  )
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.COACH_ADMIN,
    UserRole.COACH,
    UserRole.ATHLETE,
    UserRole.SELF_COACHED,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training preferences retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getTrainingPreferences(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Record<string, any>> {
    const res = await this.userService.getTrainingPreferences(id);
    return res;
  }

  @Put(':id/training-preferences')
  @ApiStandardOperation(
    'Update user training preferences',
    'Update user training preferences',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'User ID', format: 'uuid' })
  @ApiBody({ type: UpdateTrainingPreferencesDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training preferences updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateTrainingPreferences(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() trainingPreferences: UpdateTrainingPreferencesDto,
  ) {
    const res = await this.userService.updateTrainingPreferences(
      id,
      trainingPreferences,
    );
    return res;
  }
}
