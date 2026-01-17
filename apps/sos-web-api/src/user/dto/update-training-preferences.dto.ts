import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString } from 'class-validator';
import {
  NotificationPreferences,
  TrainingPreferences,
} from '@strengthos/shared-types/src/user-management';

export class UpdateTrainingPreferencesDto {
  @ApiPropertyOptional({ description: 'Equipment profile' })
  @IsOptional()
  @IsString()
  equipmentProfile?: string;

  @ApiPropertyOptional({ description: 'Language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Weight unit' })
  @IsOptional()
  @IsString()
  weightUnit?: string;

  @ApiPropertyOptional({ description: 'Training preferences' })
  @IsOptional()
  @IsObject()
  training: TrainingPreferences;

  @ApiPropertyOptional({ description: 'Notifications' })
  @IsOptional()
  @IsObject()
  notifications: NotificationPreferences;
}
