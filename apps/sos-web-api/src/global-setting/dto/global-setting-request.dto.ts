import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateGlobalSettingDto {
  @ApiProperty({
    description: 'Configuration key (unique identifier)',
    example: 'app.theme.default',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  config_key: string;

  @ApiProperty({
    description: 'Configuration value (JSON object)',
    example: { theme: 'dark', fontSize: 14 },
  })
  @IsObject()
  @IsNotEmpty()
  config_value: Record<string, any>;
}

export class UpdateGlobalSettingDto {
  @ApiProperty({
    description: 'Configuration key (unique identifier)',
    example: 'app.theme.default',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  key: string;

  @ApiProperty({
    description: 'Configuration value (JSON object)',
    example: { theme: 'light', fontSize: 16 },
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
