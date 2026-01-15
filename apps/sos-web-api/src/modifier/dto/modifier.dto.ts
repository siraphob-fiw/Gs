import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { EntityStatus } from '@/types';

// CreateModifierDto: Accepts name and modifier_category_id (snake_case for DB consistency)
export class CreateModifierDto {
  @ApiProperty({ description: 'Modifier name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Modifier category ID' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  modifier_category_id: string;

  @ApiProperty({ description: 'Central stress factor' })
  @IsNumber()
  @IsNotEmpty()
  central_stress_factor: number;

  @ApiProperty({ description: 'Peripheral stress factor' })
  @IsNumber()
  @IsNotEmpty()
  peripheral_stress_factor: number;

  @ApiProperty({ description: 'Status', enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  // Cluster-based stress modifier fields (for Myo-reps, etc.)
  @ApiPropertyOptional({
    description:
      'Base multiplier for Central Stress (e.g., 1.10 for Myo-reps = +10% base)',
  })
  @IsOptional()
  @IsNumber()
  cs_base_multiplier?: number;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Central Stress (e.g., 0.02 for Myo-reps = +2% per cluster)',
  })
  @IsOptional()
  @IsNumber()
  cs_cluster_increment?: number;

  @ApiPropertyOptional({
    description:
      'Base multiplier for Peripheral Stress (e.g., 1.25 for Myo-reps = +25% base)',
  })
  @IsOptional()
  @IsNumber()
  ps_base_multiplier?: number;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Peripheral Stress (e.g., 0.05 for Myo-reps = +5% per cluster)',
  })
  @IsOptional()
  @IsNumber()
  ps_cluster_increment?: number;

  @ApiPropertyOptional({
    description:
      'Whether this modifier uses cluster-based calculation (Myo-reps formula)',
    default: false,
  })
  @IsOptional()
  uses_cluster_calculation?: boolean;
}

// UpdateModifierDto: Allows partial update of fields
export class UpdateModifierDto {
  @ApiPropertyOptional({ description: 'Modifier name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Status', enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({ description: 'Modifier category ID' })
  @IsOptional()
  @IsUUID()
  modifier_category_id?: string;

  @ApiPropertyOptional({ description: 'Central stress factor' })
  @IsOptional()
  @IsNumber()
  central_stress_factor?: number;

  @ApiPropertyOptional({ description: 'Peripheral stress factor' })
  @IsOptional()
  @IsNumber()
  peripheral_stress_factor?: number;

  // Cluster-based stress modifier fields (for Myo-reps, etc.)
  @ApiPropertyOptional({
    description:
      'Base multiplier for Central Stress (e.g., 1.10 for Myo-reps = +10% base)',
  })
  @IsOptional()
  @IsNumber()
  cs_base_multiplier?: number;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Central Stress (e.g., 0.02 for Myo-reps = +2% per cluster)',
  })
  @IsOptional()
  @IsNumber()
  cs_cluster_increment?: number;

  @ApiPropertyOptional({
    description:
      'Base multiplier for Peripheral Stress (e.g., 1.25 for Myo-reps = +25% base)',
  })
  @IsOptional()
  @IsNumber()
  ps_base_multiplier?: number;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Peripheral Stress (e.g., 0.05 for Myo-reps = +5% per cluster)',
  })
  @IsOptional()
  @IsNumber()
  ps_cluster_increment?: number;

  @ApiPropertyOptional({
    description:
      'Whether this modifier uses cluster-based calculation (Myo-reps formula)',
  })
  @IsOptional()
  uses_cluster_calculation?: boolean;
}

// Response DTO with snake_case properties for DB alignment
export class ModifierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  modifier_category_id: string;

  @ApiProperty()
  modifier_category_name?: string;

  @ApiProperty({ enum: EntityStatus })
  status: EntityStatus;

  @ApiProperty()
  central_stress_factor: number;

  @ApiProperty()
  peripheral_stress_factor: number;

  // Cluster-based stress modifier fields (for Myo-reps, etc.)
  @ApiPropertyOptional({
    description: 'Base multiplier for Central Stress (e.g., 1.10 for Myo-reps)',
  })
  cs_base_multiplier?: number | null;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Central Stress (e.g., 0.02 for Myo-reps)',
  })
  cs_cluster_increment?: number | null;

  @ApiPropertyOptional({
    description:
      'Base multiplier for Peripheral Stress (e.g., 1.25 for Myo-reps)',
  })
  ps_base_multiplier?: number | null;

  @ApiPropertyOptional({
    description:
      'Per-cluster increment for Peripheral Stress (e.g., 0.05 for Myo-reps)',
  })
  ps_cluster_increment?: number | null;

  @ApiProperty({
    description: 'Whether this modifier uses cluster-based calculation',
    default: false,
  })
  uses_cluster_calculation: boolean;

  @ApiProperty({
    description: 'Custom value to use on modifier',
    default: null,
  })
  custom_value?: Record<string, any> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

// Filters DTO for modifier queries
export class ModifierFiltersDto {
  @ApiPropertyOptional({ description: 'Modifier name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Modifier status', enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class ModifierListResponseDto {
  @ApiProperty()
  modifiers: ModifierResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
