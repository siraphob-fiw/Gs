import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Knex } from 'knex';
import { ModifierRepository } from '../repositories/modifier.repository';
import {
  CreateModifierDto,
  ModifierListResponseDto,
  ModifierResponseDto,
  UpdateModifierDto,
} from '../dto/modifier.dto';
import { UserService } from '@/user/services/user.service';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { EntityStatus } from '@/types/entities/base.entity';

@Injectable()
export class ModifierService {
  constructor(
    private readonly userService: UserService,
    private readonly modifierRepository: ModifierRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  protected get knex(): Knex {
    return this.databaseService.knex;
  }

  async findAll(filters): Promise<ModifierListResponseDto> {
    const res = await this.modifierRepository.findAll(filters);

    return {
      modifiers: res.modifiers,
      total: res.total,
      page: res.page,
      limit: res.limit,
    };
  }

  async findOne(id: string): Promise<any | undefined> {
    return await this.modifierRepository.findOne(id);
  }

  async create(
    createModifierDto: CreateModifierDto,
    user_id: string,
  ): Promise<any> {
    const user = await this.userService.findById(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.role == UserRole.SUPER_ADMIN ||
      user.role == UserRole.TENANT_ADMIN
    ) {
      createModifierDto.status = EntityStatus.ACTIVE;
    } else {
      createModifierDto.status = EntityStatus.INACTIVE;
    }

    try {
      // Helper function to round to 2 decimal places
      const roundToTwoDecimals = (
        value: number | undefined | null,
      ): number | undefined => {
        if (value === null || value === undefined || isNaN(value))
          return undefined;
        return Math.round(value * 100) / 100;
      };

      const payload: CreateModifierDto = {
        name: createModifierDto.name,
        modifier_category_id: createModifierDto.modifier_category_id,
        central_stress_factor: createModifierDto.central_stress_factor,
        peripheral_stress_factor: createModifierDto.peripheral_stress_factor,
        status: createModifierDto.status,
        cs_base_multiplier: roundToTwoDecimals(
          createModifierDto.cs_base_multiplier,
        ),
        cs_cluster_increment: roundToTwoDecimals(
          createModifierDto.cs_cluster_increment,
        ),
        ps_base_multiplier: roundToTwoDecimals(
          createModifierDto.ps_base_multiplier,
        ),
        ps_cluster_increment: roundToTwoDecimals(
          createModifierDto.ps_cluster_increment,
        ),
        uses_cluster_calculation: createModifierDto.uses_cluster_calculation,
      };

      const createdModifier = await this.modifierRepository.create(payload);
      return createdModifier;
    } catch (error) {
      Logger.error('Failed to create modifier', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateModifierDto: UpdateModifierDto,
  ): Promise<ModifierResponseDto | undefined> {
    if (id) {
      const currentModifier = await this.modifierRepository.findOne(id);
      if (!currentModifier) {
        throw new NotFoundException('Modifier not found');
      }
      return await this.modifierRepository.update(id, updateModifierDto);
    }
  }

  async remove(id: string, user_id: string): Promise<boolean> {
    const user = await this.userService.findById(user_id);

    if (!user) throw new NotFoundException('User not found');

    if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN].includes(user.role)) {
      throw new ForbiddenException(
        'You are not authorized to delete this modifier',
      );
    }

    const deleted = await this.modifierRepository.remove(id);
    if (!deleted) throw new NotFoundException('Modifier not found');

    return true;
  }

  async bulkUpdateModifiers(
    bulkUpdateModifierDto: UpdateModifierDto[],
    user: RequestContext,
  ): Promise<{
    updated: number;
    created: number;
    failed: number;
    errors: string[];
  }> {
    const AuthUser = await this.userService.findById(user.userId);
    if (!AuthUser) throw new NotFoundException('User not found');

    if (
      AuthUser.role !== UserRole.SUPER_ADMIN &&
      AuthUser.role !== UserRole.TENANT_ADMIN
    ) {
      throw new ForbiddenException('Permission denied');
    }

    return await this.modifierRepository.bulkUpdate(
      bulkUpdateModifierDto,
      user,
    );
  }
}
