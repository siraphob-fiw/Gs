import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseRepository } from '../../database/base.repository';
import {
    EquipmentEntity,
    EquipmentCategoryEntity,
    EquipmentListResponseDto,
    EquipmentCategoryListResponseDto,
    EquipmentAvailability,
} from '../entities/equipment.entity';

export interface EquipmentFilters {
    availability?: EquipmentAvailability;
    category_id?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class EquipmentRepository extends BaseRepository<EquipmentEntity> {
    constructor(databaseService: DatabaseService) {
        super(databaseService, 'equipment');
    }

    /**
     * Find all equipment with filters
     */
    async findAllEquipment(
        filters: EquipmentFilters = {},
    ): Promise<EquipmentListResponseDto> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 100;
        const offset = (page - 1) * limit;

        let query = this.databaseService.knex('equipment');

        // Apply filters
        if (filters.availability) {
            query = query.where('availability', filters.availability);
        }

        if (filters.category_id) {
            query = query.where('category_id', filters.category_id);
        }

        if (filters.is_active !== undefined) {
            query = query.where('is_active', filters.is_active);
        }

        if (filters.search) {
            query = query.where('name', 'ilike', `%${filters.search}%`);
        }

        // Get total count
        const countResult = await query.clone().count('* as count').first();
        const total = parseInt(countResult?.count as string, 10) || 0;

        // Get paginated results
        const equipments = await query
            .clone()
            .select('*')
            .orderBy('name', 'asc')
            .limit(limit)
            .offset(offset);

        return {
            equipments: equipments.map((row) => this.mapRowToEquipment(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find equipment by ID
     */
    async findEquipmentById(id: string): Promise<EquipmentEntity | null> {
        const result = await this.databaseService
            .knex('equipment')
            .where('id', id)
            .first();

        return result ? this.mapRowToEquipment(result) : null;
    }

    /**
     * Find equipment by IDs
     */
    async findEquipmentByIds(ids: string[]): Promise<EquipmentEntity[]> {
        const results = await this.databaseService
            .knex('equipment')
            .whereIn('id', ids)
            .where('is_active', true);

        return results.map((row) => this.mapRowToEquipment(row));
    }

    /**
     * Create new equipment
     */
    async createEquipment(
        data: Omit<EquipmentEntity, 'id' | 'created_at' | 'updated_at'>,
    ): Promise<EquipmentEntity> {
        const [result] = await this.databaseService
            .knex('equipment')
            .insert({
                name: data.name,
                type: data.type,
                availability: data.availability,
                category_id: data.category_id,
                specifications: data.specifications
                    ? JSON.stringify(data.specifications)
                    : null,
                description: data.description,
                is_active: data.is_active ?? true,
            })
            .returning('*');

        return this.mapRowToEquipment(result);
    }

    /**
     * Update equipment
     */
    async updateEquipment(
        id: string,
        data: Partial<EquipmentEntity>,
    ): Promise<EquipmentEntity | null> {
        const updateData: Record<string, any> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.availability !== undefined)
            updateData.availability = data.availability;
        if (data.category_id !== undefined)
            updateData.category_id = data.category_id;
        if (data.specifications !== undefined) {
            updateData.specifications = data.specifications
                ? JSON.stringify(data.specifications)
                : null;
        }
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        updateData.updated_at = new Date();

        const [result] = await this.databaseService
            .knex('equipment')
            .where('id', id)
            .update(updateData)
            .returning('*');

        return result ? this.mapRowToEquipment(result) : null;
    }

    /**
     * Delete equipment
     */
    async deleteEquipment(id: string): Promise<boolean> {
        const affectedRows = await this.databaseService
            .knex('equipment')
            .where('id', id)
            .del();

        return affectedRows > 0;
    }

    // ============================================================================
    // EQUIPMENT CATEGORIES
    // ============================================================================

    /**
     * Find all equipment categories
     */
    async findAllCategories(
        filters: { search?: string; page?: number; limit?: number } = {},
    ): Promise<EquipmentCategoryListResponseDto> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 100;
        const offset = (page - 1) * limit;

        let query = this.databaseService.knex('equipment_categories');

        if (filters.search) {
            query = query.where('name', 'ilike', `%${filters.search}%`);
        }

        // Get total count
        const countResult = await query.clone().count('* as count').first();
        const total = parseInt(countResult?.count as string, 10) || 0;

        // Get paginated results
        const categories = await query
            .clone()
            .select('*')
            .orderBy('name', 'asc')
            .limit(limit)
            .offset(offset);

        return {
            categories: categories.map((row) => this.mapRowToCategory(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find category by ID
     */
    async findCategoryById(id: string): Promise<EquipmentCategoryEntity | null> {
        const result = await this.databaseService
            .knex('equipment_categories')
            .where('id', id)
            .first();

        return result ? this.mapRowToCategory(result) : null;
    }

    /**
     * Create equipment category
     */
    async createCategory(
        data: Omit<EquipmentCategoryEntity, 'id' | 'created_at' | 'updated_at'>,
    ): Promise<EquipmentCategoryEntity> {
        const [result] = await this.databaseService
            .knex('equipment_categories')
            .insert({
                name: data.name,
                description: data.description,
            })
            .returning('*');

        return this.mapRowToCategory(result);
    }

    /**
     * Update equipment category
     */
    async updateCategory(
        id: string,
        data: Partial<EquipmentCategoryEntity>,
    ): Promise<EquipmentCategoryEntity | null> {
        const updateData: Record<string, any> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;

        updateData.updated_at = new Date();

        const [result] = await this.databaseService
            .knex('equipment_categories')
            .where('id', id)
            .update(updateData)
            .returning('*');

        return result ? this.mapRowToCategory(result) : null;
    }

    /**
     * Delete equipment category
     */
    async deleteCategory(id: string): Promise<boolean> {
        const affectedRows = await this.databaseService
            .knex('equipment_categories')
            .where('id', id)
            .del();

        return affectedRows > 0;
    }

    // ============================================================================
    // MAPPING HELPERS
    // ============================================================================

    private mapRowToEquipment(row: any): EquipmentEntity {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            availability: row.availability,
            category_id: row.category_id,
            specifications:
                typeof row.specifications === 'string'
                    ? JSON.parse(row.specifications)
                    : row.specifications,
            description: row.description,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    private mapRowToCategory(row: any): EquipmentCategoryEntity {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
