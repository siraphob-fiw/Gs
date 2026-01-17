import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
    EquipmentRepository,
    EquipmentFilters,
} from '../repositories/equipment.repository';
import {
    EquipmentEntity,
    EquipmentCategoryEntity,
    EquipmentListResponseDto,
    EquipmentCategoryListResponseDto,
} from '../entities/equipment.entity';
import {
    CreateEquipmentDto,
    UpdateEquipmentDto,
    CreateEquipmentCategoryDto,
    UpdateEquipmentCategoryDto,
} from '../dto/equipment.dto';

@Injectable()
export class EquipmentService {
    private readonly logger = new Logger(EquipmentService.name);

    constructor(private readonly equipmentRepository: EquipmentRepository) { }

    // ============================================================================
    // EQUIPMENT METHODS
    // ============================================================================

    /**
     * Get all equipment with optional filters
     */
    async findAll(
        filters: EquipmentFilters = {},
    ): Promise<EquipmentListResponseDto> {
        this.logger.log(
            `Finding all equipment with filters: ${JSON.stringify(filters)}`,
        );
        return this.equipmentRepository.findAllEquipment(filters);
    }

    /**
     * Get equipment by ID
     */
    async findById(id: string): Promise<EquipmentEntity> {
        const equipment = await this.equipmentRepository.findEquipmentById(id);
        if (!equipment) {
            throw new NotFoundException(`Equipment with ID '${id}' not found`);
        }
        return equipment;
    }

    /**
     * Get equipment by multiple IDs
     */
    async findByIds(ids: string[]): Promise<EquipmentEntity[]> {
        return this.equipmentRepository.findEquipmentByIds(ids);
    }

    /**
     * Create new equipment
     */
    async create(dto: CreateEquipmentDto): Promise<EquipmentEntity> {
        this.logger.log(`Creating equipment: ${dto.name}`);

        // Validate category exists if provided
        if (dto.category_id) {
            const category = await this.equipmentRepository.findCategoryById(
                dto.category_id,
            );
            if (!category) {
                throw new NotFoundException(
                    `Equipment category with ID '${dto.category_id}' not found`,
                );
            }
        }

        return this.equipmentRepository.createEquipment({
            name: dto.name,
            type: dto.type,
            availability: dto.availability,
            category_id: dto.category_id,
            specifications: dto.specifications,
            description: dto.description,
            is_active: dto.is_active ?? true,
        });
    }

    /**
     * Update equipment
     */
    async update(id: string, dto: UpdateEquipmentDto): Promise<EquipmentEntity> {
        this.logger.log(`Updating equipment: ${id}`);

        // Check if equipment exists
        const existing = await this.equipmentRepository.findEquipmentById(id);
        if (!existing) {
            throw new NotFoundException(`Equipment with ID '${id}' not found`);
        }

        // Validate category exists if provided
        if (dto.category_id) {
            const category = await this.equipmentRepository.findCategoryById(
                dto.category_id,
            );
            if (!category) {
                throw new NotFoundException(
                    `Equipment category with ID '${dto.category_id}' not found`,
                );
            }
        }

        const updated = await this.equipmentRepository.updateEquipment(id, dto);
        if (!updated) {
            throw new NotFoundException(`Equipment with ID '${id}' not found`);
        }

        return updated;
    }

    /**
     * Delete equipment
     */
    async delete(id: string): Promise<void> {
        this.logger.log(`Deleting equipment: ${id}`);

        const deleted = await this.equipmentRepository.deleteEquipment(id);
        if (!deleted) {
            throw new NotFoundException(`Equipment with ID '${id}' not found`);
        }
    }

    // ============================================================================
    // EQUIPMENT CATEGORY METHODS
    // ============================================================================

    /**
     * Get all equipment categories
     */
    async findAllCategories(
        filters: { search?: string; page?: number; limit?: number } = {},
    ): Promise<EquipmentCategoryListResponseDto> {
        this.logger.log(`Finding all equipment categories`);
        return this.equipmentRepository.findAllCategories(filters);
    }

    /**
     * Get category by ID
     */
    async findCategoryById(id: string): Promise<EquipmentCategoryEntity> {
        const category = await this.equipmentRepository.findCategoryById(id);
        if (!category) {
            throw new NotFoundException(
                `Equipment category with ID '${id}' not found`,
            );
        }
        return category;
    }

    /**
     * Create equipment category
     */
    async createCategory(
        dto: CreateEquipmentCategoryDto,
    ): Promise<EquipmentCategoryEntity> {
        this.logger.log(`Creating equipment category: ${dto.name}`);
        return this.equipmentRepository.createCategory({
            name: dto.name,
            description: dto.description,
        });
    }

    /**
     * Update equipment category
     */
    async updateCategory(
        id: string,
        dto: UpdateEquipmentCategoryDto,
    ): Promise<EquipmentCategoryEntity> {
        this.logger.log(`Updating equipment category: ${id}`);

        const existing = await this.equipmentRepository.findCategoryById(id);
        if (!existing) {
            throw new NotFoundException(
                `Equipment category with ID '${id}' not found`,
            );
        }

        const updated = await this.equipmentRepository.updateCategory(id, dto);
        if (!updated) {
            throw new NotFoundException(
                `Equipment category with ID '${id}' not found`,
            );
        }

        return updated;
    }

    /**
     * Delete equipment category
     */
    async deleteCategory(id: string): Promise<void> {
        this.logger.log(`Deleting equipment category: ${id}`);

        const deleted = await this.equipmentRepository.deleteCategory(id);
        if (!deleted) {
            throw new NotFoundException(
                `Equipment category with ID '${id}' not found`,
            );
        }
    }
}
