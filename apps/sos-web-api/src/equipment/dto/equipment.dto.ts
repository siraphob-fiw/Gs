import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsObject,
    IsNumber,
    Min,
    MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
    EquipmentAvailability,
    EquipmentSpecifications,
} from '../entities/equipment.entity';

export class CreateEquipmentDto {
    @ApiProperty({
        description: 'Equipment name',
        example: 'Barbell',
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiProperty({
        description: 'Equipment type',
        example: 'Olympic Bar',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    type: string;

    @ApiProperty({
        description: 'Equipment availability',
        enum: ['common_gym', 'home', 'specialty_gym'],
        example: 'common_gym',
    })
    @IsEnum(['common_gym', 'home', 'specialty_gym'])
    availability: EquipmentAvailability;

    @ApiPropertyOptional({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    category_id?: string;

    @ApiPropertyOptional({
        description: 'Equipment specifications',
        type: 'object',
        additionalProperties: true,
    })
    @IsOptional()
    @IsObject()
    specifications?: EquipmentSpecifications;

    @ApiPropertyOptional({
        description: 'Equipment description',
        example: 'Standard 20kg Olympic barbell',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Is equipment active',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateEquipmentDto {
    @ApiPropertyOptional({
        description: 'Equipment name',
        example: 'Barbell',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @ApiPropertyOptional({
        description: 'Equipment type',
        example: 'Olympic Bar',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    type?: string;

    @ApiPropertyOptional({
        description: 'Equipment availability',
        enum: ['common_gym', 'home', 'specialty_gym'],
        example: 'common_gym',
    })
    @IsOptional()
    @IsEnum(['common_gym', 'home', 'specialty_gym'])
    availability?: EquipmentAvailability;

    @ApiPropertyOptional({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    @IsOptional()
    @IsString()
    category_id?: string;

    @ApiPropertyOptional({
        description: 'Equipment specifications',
        type: 'object',
        additionalProperties: true,
    })
    @IsOptional()
    @IsObject()
    specifications?: EquipmentSpecifications;

    @ApiPropertyOptional({
        description: 'Equipment description',
        example: 'Standard 20kg Olympic barbell',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Is equipment active',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class EquipmentFiltersDto {
    @ApiPropertyOptional({
        description: 'Filter by availability',
        enum: ['common_gym', 'home', 'specialty_gym'],
    })
    @IsOptional()
    @IsEnum(['common_gym', 'home', 'specialty_gym'])
    availability?: EquipmentAvailability;

    @ApiPropertyOptional({
        description: 'Filter by category ID',
    })
    @IsOptional()
    @IsString()
    category_id?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean;

    @ApiPropertyOptional({
        description: 'Search by name',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 10,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    limit?: number;
}

export class CreateEquipmentCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Free Weights',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        description: 'Category description',
        example: 'Barbells, dumbbells, and kettlebells',
    })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateEquipmentCategoryDto {
    @ApiPropertyOptional({
        description: 'Category name',
        example: 'Free Weights',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        description: 'Category description',
        example: 'Barbells, dumbbells, and kettlebells',
    })
    @IsOptional()
    @IsString()
    description?: string;
}

export class EquipmentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    type: string;

    @ApiProperty({ enum: ['common_gym', 'home', 'specialty_gym'] })
    availability: EquipmentAvailability;

    @ApiPropertyOptional()
    category_id?: string;

    @ApiPropertyOptional()
    specifications?: EquipmentSpecifications;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    is_active: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}

export class EquipmentCategoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
