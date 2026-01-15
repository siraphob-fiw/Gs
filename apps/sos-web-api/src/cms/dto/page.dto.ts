import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  IsBoolean,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { PageStatus } from '../entities/page.entity';
import { Type } from 'class-transformer';

export class PageOptions {
  @IsOptional()
  @IsBoolean()
  on_menu?: boolean;

  @IsOptional()
  @IsBoolean()
  on_footer?: boolean;
}

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meta_description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keywords?: string[];

  @IsOptional()
  @IsDateString()
  published_at?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => PageOptions)
  options?: PageOptions;
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meta_description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meta_keywords?: string[];

  @IsOptional()
  @IsDateString()
  published_at?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => PageOptions)
  options?: PageOptions;
}

export class PageQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsUUID()
  author_id?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class PageResponseDto {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PageStatus;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  options?: PageOptions | null;
}
