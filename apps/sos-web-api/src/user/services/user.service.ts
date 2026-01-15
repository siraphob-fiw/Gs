import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
  UserStatus,
  AuthMethod,
  UpdateTrainingPreferencesDto,
  UserRole,
} from '../dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';
import { DatabaseService } from '@/database/database.service';
import { ApprovalCoachDto } from '../dto/approvalCoach';
import { RequestContext } from '@strengthos/shared-types';
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  protected get knex(): Knex {
    return this.databaseService.knex;
  }

  async create(
    createUserDto: CreateUserDto,
    trx?: Knex.Transaction<any, any[]>,
  ): Promise<UserResponseDto> {
    // Validate required fields based on auth method
    if (createUserDto.authMethod === AuthMethod.EMAIL) {
      if (!createUserDto.email || !createUserDto.password) {
        throw new BadRequestException(
          'Email and password are required for EMAIL authentication',
        );
      }
      // Skip duplicate check if transaction is provided (already checked in caller)
      if (!trx) {
        const existingUser = await this.userRepository.findByEmail(
          createUserDto.email,
        );
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }
    } else if (
      [AuthMethod.WHATSAPP, AuthMethod.LINE].includes(createUserDto.authMethod)
    ) {
      if (!createUserDto.phone) {
        throw new BadRequestException(
          'Phone number is required for phone-based authentication',
        );
      }

      // Skip duplicate check if transaction is provided (already checked in caller)
      if (!trx) {
        const existingUser = await this.userRepository.findByPhoneNumber(
          createUserDto.phone,
        );
        if (existingUser) {
          throw new ConflictException(
            'User with this phone number already exists',
          );
        }
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    let salt: string | undefined;
    if (createUserDto.password) {
      const saltRounds = 12;
      salt = await bcrypt.genSalt(saltRounds);
      passwordHash = await bcrypt.hash(createUserDto.password, salt);
    }

    const userToCreate = {
      ...createUserDto,
      passwordHash,
      salt,
    };

    const user = await this.userRepository.createUser(userToCreate, trx);
    return this.mapToResponseDto(user);
  }

  async findById(id: string, tenantId?: string): Promise<UserResponseDto> {
    let user: User | null = null;
    if (tenantId) {
      user = await this.userRepository.findByIdWithTenant(id, tenantId);
    } else {
      user = await this.userRepository.findById(id);
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async findByEmailOrPhone(identifier: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByEmailOrPhone(identifier);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapToResponseDto(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (userId !== id) {
      const authUser = await this.userRepository.findById(userId);

      if (authUser) {
        if (
          authUser.role === UserRole.TENANT_ADMIN ||
          authUser.role === UserRole.COACH_ADMIN
        ) {
          if (authUser.tenant_id !== existingUser.tenant_id) {
            throw new BadRequestException(
              'You do not have permission to update users from other tenants',
            );
          }
        } else if (authUser.role !== UserRole.SUPER_ADMIN) {
          throw new BadRequestException(
            'You do not have permission to update other users',
          );
        }
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
      const userWithPhone = await this.userRepository.findByPhoneNumber(
        updateUserDto.phone,
      );
      if (userWithPhone && userWithPhone.id !== id) {
        throw new ConflictException(
          'User with this phone number already exists',
        );
      }
    }

    const payload = {
      ...updateUserDto,
    };

    const updatedUser = await this.userRepository.updateWithTenant(
      id,
      existingUser.tenant_id,
      payload,
    );
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(updatedUser);
  }

  async delete(id: string): Promise<void> {
    try {
      const userToDelete = await this.userRepository.findById(id);
      if (!userToDelete) {
        throw new NotFoundException('User not found');
      }

      if (userToDelete.status === UserStatus.INACTIVE) {
        throw new BadRequestException('User is already deleted');
      }

      const deleted = await this.userRepository.deleteUser(id);
      if (!deleted) {
        throw new BadRequestException('Failed to delete user');
      }
    } catch (error) {
      this.databaseService.knex('logs').insert({
        message: 'Error deleting user',
        error_exception: error,
        log_level: 'ERROR',
      });
      throw error;
    }
  }

  async findMany(
    queryDto: UserQueryDto,
    user: RequestContext,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const authUser = await this.userRepository.findById(user.userId);
    if (!authUser) {
      throw new NotFoundException('Auth user not found');
    }

    let users: User[] = [];
    let total: number = 0;

    if (authUser.role === UserRole.SUPER_ADMIN) {
      ({ users, total } = await this.userRepository.findMany(queryDto, null));

      return {
        users: await Promise.all(
          users.map((user) => this.mapToResponseDto(user)),
        ),
        total,
        page: queryDto.page || 1,
        limit: queryDto.limit || 20,
      };
    } else {
      if (queryDto.availableToInvite) {
        const freeTenant = await this.databaseService
          .knex('tenants')
          .where({
            is_free: true,
          })
          .first();
        const userQuery = this.databaseService
          .knex('users')
          .leftJoin(
            'coach_athlete_relationships',
            'users.id',
            'coach_athlete_relationships.athlete_id',
          )
          .where('users.role', UserRole.ATHLETE)
          .where('users.status', UserStatus.ACTIVE)
          .whereNull('coach_athlete_relationships.coach_id')
          .andWhere(function () {
            this.where('users.tenant_id', freeTenant.id);
          });

        const page = queryDto.page || 1;
        const limit = queryDto.limit || 20;
        const offset = (page - 1) * limit;

        const [usersResult, [{ count } = { count: 0 }]] = await Promise.all([
          userQuery.clone().offset(offset).limit(limit).select('users.*'),
          userQuery.clone().countDistinct('users.id as count'),
        ]);

        users = usersResult;
        total = Number(count);

        return {
          users: await Promise.all(
            users.map((user) => this.mapToResponseDto(user)),
          ),
          total,
          page: queryDto.page || 1,
          limit: queryDto.limit || 20,
        };
      } else {
        ({ users, total } = await this.userRepository.findMany(
          queryDto,
          authUser.tenant_id,
        ));

        return {
          users: await Promise.all(
            users.map((user) => this.mapToResponseDto(user)),
          ),
          total,
          page: queryDto.page || 1,
          limit: queryDto.limit || 20,
        };
      }
    }
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userRepository.updateStatus(id, status);
    if (!updatedUser) {
      throw new BadRequestException('Failed to update user status');
    }

    return this.mapToResponseDto(updatedUser);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }

  async validatePassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  async changePassword(
    id: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.userRepository.changePassword(id, newPassword);
    if (!result) {
      return { success: false, message: 'Failed to change password' };
    }

    return { success: true, message: 'Password changed successfully' };
  }

  async assignRole(
    id: string,
    role: string,
    authId: string,
  ): Promise<UserResponseDto> {
    //check auth user
    let tenantId: string;
    const authUser = await this.userRepository.findById(authId);

    if (!authUser) {
      throw new NotFoundException('Auth user not found');
    } else {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (authUser.role === UserRole.SUPER_ADMIN) {
        tenantId = user.tenant_id;
      } else if (authUser.role === UserRole.TENANT_ADMIN) {
        if (user.tenant_id !== authUser.tenant_id) {
          throw new BadRequestException(
            'You do not have permission to assign role to users from other tenants',
          );
        } else {
          tenantId = user.tenant_id;
        }
      } else {
        throw new BadRequestException(
          'You do not have permission to assign role to other users',
        );
      }
    }

    const updatedUser = await this.userRepository.assignRole(
      id,
      role,
      tenantId,
    );
    if (!updatedUser) {
      throw new BadRequestException('Failed to assign role');
    }

    return await this.mapToResponseDto(updatedUser);
  }

  async bulkAssignRole(
    userIds: string[],
    role: string,
  ): Promise<UserResponseDto[]> {
    // Validate that all users exist
    const existingUsers = await Promise.all(
      userIds.map((id) => this.userRepository.findById(id)),
    );

    const notFoundIds = userIds.filter((id, index) => !existingUsers[index]);
    if (notFoundIds.length > 0) {
      throw new NotFoundException(`Users not found: ${notFoundIds.join(', ')}`);
    }

    const updatedUsers = await this.userRepository.bulkAssignRole(
      userIds,
      role,
    );
    return await Promise.all(
      updatedUsers.map((user) => this.mapToResponseDto(user)),
    );
  }

  async bulkUpdateStatus(
    userIds: string[],
    status: UserStatus,
  ): Promise<UserResponseDto[]> {
    // Validate that all users exist
    const existingUsers = await Promise.all(
      userIds.map((id) => this.userRepository.findById(id)),
    );

    const notFoundIds = userIds.filter((id, index) => !existingUsers[index]);
    if (notFoundIds.length > 0) {
      throw new NotFoundException(`Users not found: ${notFoundIds.join(', ')}`);
    }

    const updatedUsers = await this.userRepository.bulkUpdateStatus(
      userIds,
      status,
    );
    return await Promise.all(
      updatedUsers.map((user) => this.mapToResponseDto(user)),
    );
  }

  async getUsersByRole(role: string): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getUsersByRole(role);
    return await Promise.all(users.map((user) => this.mapToResponseDto(user)));
  }

  async getUsersByStatus(status: string): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getUsersByStatus(status);
    return await Promise.all(users.map((user) => this.mapToResponseDto(user)));
  }

  async verifyPhoneNumber(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.verifyPhone(id, user.tenant_id);

    const updatedUser = await this.userRepository.findByIdWithTenant(
      id,
      user.tenant_id,
    );
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return await this.mapToResponseDto(updatedUser);
  }

  async getTrainingPreferences(id: string): Promise<Record<string, any>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.preferences) {
      return {};
    }
    return user.preferences as Record<string, any>;
  }

  async updateTrainingPreferences(
    id: string,
    trainingPreferences: UpdateTrainingPreferencesDto,
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      preferences: trainingPreferences,
    };

    const res = await this.userRepository.updateWithTenant(
      id,
      user.tenant_id,
      payload,
    );

    return res;
  }

  async getEquipmentPreferences(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return (
      user.preferences?.equipment || {
        defaultEquipmentProfile: '',
        equipmentPriorities: [],
        maintenanceReminders: [],
        safetyPreferences: {
          requireSpotter: false,
          maxWeightWithoutSpotter: 100,
          safetyEquipmentRequired: [],
          emergencyProcedures: [],
          riskTolerance: 'MODERATE',
        },
        upgradeWishlist: [],
      }
    );
  }

  async getApprovalCoachList(userId: string): Promise<ApprovalCoachDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.tenant_id == null) {
      throw new NotFoundException('User is not assigned to any tenant');
    }

    const users = await this.knex('users as u')
      .leftJoin('coach_discovery_profiles as cdp', 'cdp.coach_id', 'u.id')
      .select(
        'u.id as id',
        'u.first_name as firstName',
        'u.last_name as lastName',
        'u.email as email',
        'u.status as status',
        'u.role as role',
        'cdp.bio as bio',
        'cdp.specializations as specializations',
        'cdp.certifications as certifications',
        'cdp.hourly_rate as hourly_rate',
        'cdp.currency as currency',
        'cdp.is_available as is_available',
        'cdp.availability as availability',
        'cdp.social_links as social_links',
        'u.created_at as createdAt',
        'u.updated_at as updatedAt',
      )
      .where('u.tenant_id', user.tenant_id)
      .where('u.role', UserRole.COACH)
      .where('u.status', UserStatus.PENDING_APPROVAL)
      .orderBy('u.created_at', 'desc');

    const coaches = users.map((user) => {
      const specializations: string[] = Array.isArray(user.specializations)
        ? user.specializations
        : [];

      const certifications: string[] = Array.isArray(user.certifications)
        ? user.certifications
        : [];

      const social_links: string[] = Array.isArray(user.social_links)
        ? user.social_links
        : [];

      const availability: any = user.availability || undefined;
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        role: user.role,
        profile: {
          bio: user.bio || '',
          specializations: Array.isArray(specializations)
            ? specializations
            : [],
          certifications: Array.isArray(certifications) ? certifications : [],
          hourly_rate: user.hourly_rate ?? 0,
          currency: user.currency || '',
          is_available: user.is_available ?? false,
          availability: availability,
          social_links: Array.isArray(social_links) ? social_links : [],
        },
        createdAt: user.createdAt || user.profileCreatedAt,
        updatedAt: user.updatedAt || user.profileUpdatedAt,
      };
    });

    return {
      coaches: coaches,
      total: coaches.length,
    };
  }

  async assignTenant(
    userId: string,
    tenantId: string,
    authUserId: string,
  ): Promise<UserResponseDto> {
    // Check if auth user exists and is a super admin
    const authUser = await this.userRepository.findById(authUserId);
    if (!authUser) {
      throw new NotFoundException('Auth user not found');
    }

    if (authUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Only super admins can assign users to different tenants',
      );
    }

    // Check if the target user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if the tenant exists
    const tenant = await this.knex('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Prevent assigning to the same tenant
    if (user.tenant_id === tenantId) {
      throw new BadRequestException('User is already assigned to this tenant');
    }

    const updatedUser = await this.userRepository.assignTenant(
      userId,
      tenantId,
    );
    if (!updatedUser) {
      throw new BadRequestException('Failed to assign tenant');
    }

    return this.mapToResponseDto(updatedUser);
  }

  async bulkAssignTenant(
    userIds: string[],
    tenantId: string,
    authUserId: string,
  ): Promise<UserResponseDto[]> {
    // Check if auth user exists and is a super admin
    const authUser = await this.userRepository.findById(authUserId);
    if (!authUser) {
      throw new NotFoundException('Auth user not found');
    }

    if (authUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Only super admins can assign users to different tenants',
      );
    }

    // Check if the tenant exists
    const tenant = await this.knex('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate that all users exist
    const existingUsers = await Promise.all(
      userIds.map((id) => this.userRepository.findById(id)),
    );

    const notFoundIds = userIds.filter((id, index) => !existingUsers[index]);
    if (notFoundIds.length > 0) {
      throw new NotFoundException(`Users not found: ${notFoundIds.join(', ')}`);
    }

    const updatedUsers = await this.userRepository.bulkAssignTenant(
      userIds,
      tenantId,
    );

    return Promise.all(updatedUsers.map((user) => this.mapToResponseDto(user)));
  }

  /**
   * Allow a user to self-assign to a tenant (for users without a tenant)
   * This bypasses the super admin check since it's a self-service action
   */
  async assignTenantSelf(
    userId: string,
    tenantId: string,
  ): Promise<UserResponseDto> {
    // Check if the target user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure user doesn't already have a tenant
    if (user.tenant_id) {
      throw new BadRequestException('User is already assigned to a tenant');
    }

    // Check if the tenant exists
    const tenant = await this.knex('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedUser = await this.userRepository.assignTenant(
      userId,
      tenantId,
    );
    if (!updatedUser) {
      throw new BadRequestException('Failed to assign tenant');
    }

    return this.mapToResponseDto(updatedUser);
  }

  private async mapToResponseDto(user: User): Promise<UserResponseDto> {
    return {
      id: user.id,
      tenantId: user.tenant_id,
      tenantName:
        (
          await this.knex
            .select('name')
            .from('tenants')
            .where('id', user.tenant_id)
            .first()
        )?.name || '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      phoneVerified: user.phone_verified,
      phoneVerifiedAt: user.phone_verified_at,
      profile: {
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        dateOfBirth: user.date_of_birth ? user.date_of_birth : undefined,
        gender: user.gender,
        bodyWeight: user.body_weight,
        height: user.height,
      },
      preferences: user.preferences,
      hasPassword: user.password_hash ? true : false,
      // auth_providers: user.auth_providers,
      // whatsappData: user.whatsapp_data,
      // lineData: user.line_data,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
      email_verified_at: user.email_verified_at,
    };
  }
}
