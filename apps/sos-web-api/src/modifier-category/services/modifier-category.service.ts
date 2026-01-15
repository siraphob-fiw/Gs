import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Knex } from 'knex';
import { ModifierCategoryRepository } from '../repositories/modifier-category.repositiory';
import { ModifierCategoryEntity } from '../entities/modifier-category.entity';
import { ModifierCategoryFiltersDto } from '../dto/modifier-category.dto';

@Injectable()
export class ModifierCategoryService {
  constructor(
    private readonly modifierCategoryRepository: ModifierCategoryRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  protected get knex(): Knex {
    return this.databaseService.knex;
  }

  async findAllCategories(filter?: ModifierCategoryFiltersDto): Promise<{
    modifier_categories: ModifierCategoryEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.modifierCategoryRepository.findWithQuery(filter);

    return result;
  }

  async findOneCategory(id: string): Promise<any | undefined> {
    return await this.modifierCategoryRepository.findOne(id);
  }

  async createCategory(createModifierCategoryDto: any): Promise<any> {
    return await this.modifierCategoryRepository.create(
      createModifierCategoryDto,
    );
  }

  async updateCategory(
    id: string,
    updateModifierCategoryDto: any,
  ): Promise<any | undefined> {
    return await this.modifierCategoryRepository.update(
      id,
      updateModifierCategoryDto,
    );
  }

  async removeCategory(id: string): Promise<boolean> {
    return await this.modifierCategoryRepository.remove(id);
  }
}
