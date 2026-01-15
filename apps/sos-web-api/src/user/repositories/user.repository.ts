import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DatabaseService } from '../../database/database.service';
import { TenantContextService } from '../../tenant/services/tenant-context.service';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto, UserStatus } from '../dto';
import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super(databaseService, 'users');
  }

  async createUser(
    createUserDto: CreateUserDto & { passwordHash?: string; salt?: string },
    trx?: Knex.Transaction,
  ): Promise<User> {
    const userData = {
      tenant_id: createUserDto.tenantId,
      email: createUserDto.email,
      phone: createUserDto.phone,
      password_hash: createUserDto.passwordHash,
      salt: createUserDto.salt,
      role: createUserDto.role,
      phone_verified: createUserDto.authMethod !== 'EMAIL',

      // Profile fields from nested profile object
      first_name: createUserDto.profile?.firstName,
      last_name: createUserDto.profile?.lastName,
      date_of_birth: createUserDto.profile?.dateOfBirth,
      gender: createUserDto.profile?.gender,
      body_weight: createUserDto.profile?.bodyWeight,
      height: createUserDto.profile?.height,

      // JSON fields
      preferences: createUserDto.preferences || {},
      auth_providers: createUserDto.auth_providers,
      whatsapp_data: createUserDto.whatsappData,
      line_data: createUserDto.lineData,
    };

    const query = trx ? trx(this.tableName) : this.knex(this.tableName);
    const [user] = await query.insert(userData).returning('*');

    return user;
  }

  async changePassword(id: string, newPassword: string): Promise<User | null> {
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const [user] = await this.knex(this.tableName)
      .where({ id: id })
      .update({ password_hash: passwordHash, salt: salt })
      .returning('*');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.knex(this.tableName).where({ email }).first();

    return user || null;
  }

  async findByPhoneNumber(phone: string): Promise<User | null> {
    const user = await this.knex(this.tableName).where({ phone }).first();

    return user || null;
  }

  async findByEmailOrPhone(
    identifier: string,
    tenantId?: string,
  ): Promise<User | null> {
    const currentTenantId =
      tenantId || this.tenantContextService.getCurrentTenantId()?.toString();

    const user = await this.knex(this.tableName)
      .where({ tenant_id: currentTenantId })
      .andWhere((builder) => {
        builder.where({ email: identifier }).orWhere({ phone: identifier });
      })
      .first();

    return user || null;
  }

  async findByIdWithTenant(id: string, tenantId: string): Promise<User | null> {
    if (!id) {
      Logger.error('findByEmailOrPhone function error: User ID is required');
    }

    const currentTenantId = tenantId;

    if (!currentTenantId) {
      Logger.error('findByEmailOrPhone function error: Tenant ID is required');
    }

    const user = await this.knex(this.tableName)
      .where({ id: id, tenant_id: currentTenantId })
      .first();

    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.knex(this.tableName).where({ id: id }).first();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user || null;
  }

  async updateWithTenant(
    id: string,
    tenantId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updateUserDto.firstName)
      updateData.first_name = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.last_name = updateUserDto.lastName;
    if (updateUserDto.dateOfBirth)
      updateData.date_of_birth = updateUserDto.dateOfBirth;
    if (updateUserDto.gender) updateData.gender = updateUserDto.gender;
    if (updateUserDto.bodyWeight)
      updateData.body_weight = updateUserDto.bodyWeight;
    if (updateUserDto.height) updateData.height = updateUserDto.height;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.status) updateData.status = updateUserDto.status;
    if (updateUserDto.preferences)
      updateData.preferences = updateUserDto.preferences;

    const [user] = await this.knex(this.tableName)
      .where({ id: id, tenant_id: tenantId })
      .update(updateData)
      .returning('*');

    return user || null;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    return this.updateWithTenant(id, tenantId?.toString() || '', updateUserDto);
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const deletedCount = await this.knex(this.tableName)
        .where({ id: id })
        .update({ status: UserStatus.SUSPENDED })
        .returning('*');
      return deletedCount.length > 0;
    } catch (error) {
      Logger.error('Error deleting user:', error);
      return false;
    }
  }

  async findMany(
    queryDto: UserQueryDto,
    tenantId: string | null,
  ): Promise<{ users: User[]; total: number }> {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = queryDto;

    let query = this.knex(this.tableName);

    if (tenantId) {
      query = query.where({ tenant_id: tenantId });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('email', `%${search}%`)
          .orWhereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereRaw(`CONCAT("first_name", ' ', "last_name") ILIKE ?`, [
            `%${search}%`,
          ]);
      });
    }

    if (role) {
      query = query.where({ role });
    }

    if (status) {
      query = query.where({ status });
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string, 10);

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    const users = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      users,
      total,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    const tenantId = this.tenantContextService.getCurrentTenantId()?.toString();

    await this.knex(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ last_login_at: new Date() });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const updateData: any = { status, updated_at: new Date() };

    if (status === UserStatus.SUSPENDED) {
      updateData.suspended_at = new Date();
    } else if (status === UserStatus.ACTIVE) {
      updateData.suspended_at = null;
    }

    const [user] = await this.knex(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');

    return user || null;
  }

  async bulkUpdateStatus(userIds: string[], status: string): Promise<User[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId()?.toString();

    const updateData: any = { status, updated_at: new Date() };

    if (status === 'SUSPENDED') {
      updateData.suspended_at = new Date();
    } else if (status === 'ACTIVE') {
      updateData.suspended_at = null;
    }

    const users = await this.knex(this.tableName)
      .whereIn('id', userIds)
      .andWhere({ tenant_id: tenantId })
      .update(updateData)
      .returning('*');

    return users;
  }

  async bulkAssignRole(userIds: string[], role: string): Promise<User[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId()?.toString();

    const updateData = {
      role,
      updated_at: new Date(),
    };

    const users = await this.knex(this.tableName)
      .whereIn('id', userIds)
      .andWhere({ tenant_id: tenantId })
      .update(updateData)
      .returning('*');

    return users;
  }

  async assignRole(
    id: string,
    role: string,
    tenantId: string,
  ): Promise<User | null> {
    const [user] = await this.knex(this.tableName)
      .where({ id, tenant_id: tenantId })
      .update({ role, updated_at: new Date() })
      .returning('*');

    return user || null;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId()?.toString();

    return await this.knex(this.tableName)
      .where({ role, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId()?.toString();

    return await this.knex(this.tableName)
      .where({ status, tenant_id: tenantId })
      .orderBy('created_at', 'desc');
  }

  async verifyPhone(id: string, tenantId: string): Promise<void> {
    await this.knex(this.tableName).where({ id, tenant_id: tenantId }).update({
      phone_verified: true,
      phone_verified_at: new Date(),
      updated_at: new Date(),
    });
  }

  async assignTenant(id: string, tenantId: string): Promise<User | null> {
    const [user] = await this.knex(this.tableName)
      .where({ id })
      .update({ tenant_id: tenantId, updated_at: new Date() })
      .returning('*');

    return user || null;
  }

  async bulkAssignTenant(userIds: string[], tenantId: string): Promise<User[]> {
    const updateData = {
      tenant_id: tenantId,
      updated_at: new Date(),
    };

    const users = await this.knex(this.tableName)
      .whereIn('id', userIds)
      .update(updateData)
      .returning('*');

    return users;
  }
}
