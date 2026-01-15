import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ExerciseCategoryRepository } from '../repositories/exercise-category.repository';
import { ExerciseCategoryEntity } from '../entities/exercise-category.entity';
import {
  CreateExerciseCategoryDto,
  UpdateExerciseCategoryDto,
  ExerciseCategoryFiltersDto,
  ExerciseCategoryListResponseDto,
} from '../dto/exercise-category.dto';

@Injectable()
export class ExerciseCategoryService {
  constructor(
    private readonly exerciseCategoryRepository: ExerciseCategoryRepository,
  ) {}

  async findAll(
    filter?: ExerciseCategoryFiltersDto,
  ): Promise<ExerciseCategoryListResponseDto> {
    return await this.exerciseCategoryRepository.findWithQuery(filter);
  }

  async findOne(id: string): Promise<ExerciseCategoryEntity> {
    const category = await this.exerciseCategoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Exercise category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string): Promise<ExerciseCategoryEntity | undefined> {
    return await this.exerciseCategoryRepository.findByName(name);
  }

  async create(
    createDto: CreateExerciseCategoryDto,
  ): Promise<ExerciseCategoryEntity> {
    // Check for duplicate name
    const existing = await this.exerciseCategoryRepository.findByName(
      createDto.name,
    );
    if (existing) {
      throw new ConflictException(
        `Exercise category with name "${createDto.name}" already exists`,
      );
    }

    return await this.exerciseCategoryRepository.create(createDto);
  }

  async update(
    id: string,
    updateDto: UpdateExerciseCategoryDto,
  ): Promise<ExerciseCategoryEntity> {
    // Check if category exists
    const existing = await this.exerciseCategoryRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Exercise category with ID ${id} not found`);
    }

    // Check for duplicate name if name is being updated
    if (updateDto.name && updateDto.name !== existing.name) {
      const duplicateName = await this.exerciseCategoryRepository.findByName(
        updateDto.name,
      );
      if (duplicateName) {
        throw new ConflictException(
          `Exercise category with name "${updateDto.name}" already exists`,
        );
      }
    }

    const updated = await this.exerciseCategoryRepository.update(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`Exercise category with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    // Check if category exists
    const existing = await this.exerciseCategoryRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Exercise category with ID ${id} not found`);
    }

    return await this.exerciseCategoryRepository.remove(id);
  }
}
