import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GlobalSettingService } from '../services/global-setting.service';
import {
  CreateGlobalSettingDto,
  UpdateGlobalSettingDto,
} from '../dto/global-setting-request.dto';
import { GlobalSettingResponseDto } from '../dto/global-setting-response.dto';
import { GlobalSettingListResponseDto } from '../entities/global-setting.entity';

@ApiTags('global-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('global-settings')
export class GlobalSettingController {
  constructor(private readonly globalSettingService: GlobalSettingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new global setting' })
  @ApiResponse({
    status: 201,
    description: 'Global setting created successfully',
    type: GlobalSettingResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Global setting key already exists',
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(
    @Body() createDto: CreateGlobalSettingDto,
  ): Promise<GlobalSettingResponseDto> {
    const setting = await this.globalSettingService.create(createDto);
    return GlobalSettingResponseDto.fromEntity(setting);
  }

  @Get()
  @ApiOperation({ summary: 'Get all global settings' })
  @ApiResponse({
    status: 200,
    description: 'Global settings retrieved successfully',
    type: [GlobalSettingResponseDto],
  })
  async findAll(
    @Query() query: GlobalSettingListResponseDto,
  ): Promise<GlobalSettingListResponseDto> {
    return await this.globalSettingService.findAll(query);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get global setting by key' })
  @ApiResponse({
    status: 200,
    description: 'Global setting retrieved successfully',
    type: GlobalSettingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Global setting not found' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async findByKey(
    @Param('key') key: string,
  ): Promise<GlobalSettingResponseDto> {
    const setting = await this.globalSettingService.findByKey(key);
    return GlobalSettingResponseDto.fromEntity(setting);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update global setting by key' })
  @ApiResponse({
    status: 200,
    description: 'Global setting updated successfully',
    type: GlobalSettingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Global setting not found' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async updateByKey(
    @Param('id') id: string,
    @Body() updateDto: UpdateGlobalSettingDto,
  ): Promise<GlobalSettingResponseDto> {
    const setting = await this.globalSettingService.updateById(id, updateDto);
    return GlobalSettingResponseDto.fromEntity(setting);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert global setting (create or update)' })
  @ApiResponse({
    status: 200,
    description: 'Global setting upserted successfully',
    type: GlobalSettingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async upsert(
    @Body() createDto: CreateGlobalSettingDto,
  ): Promise<GlobalSettingResponseDto> {
    const setting = await this.globalSettingService.upsert(createDto);
    return GlobalSettingResponseDto.fromEntity(setting);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete global setting by key (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Global setting deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Global setting not found' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async deleteByKey(@Param('key') key: string): Promise<void> {
    await this.globalSettingService.deleteByKey(key);
  }

  @Delete(':key/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete global setting by key' })
  @ApiResponse({
    status: 204,
    description: 'Global setting permanently deleted',
  })
  @ApiResponse({ status: 404, description: 'Global setting not found' })
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async hardDeleteByKey(@Param('key') key: string): Promise<void> {
    await this.globalSettingService.hardDeleteByKey(key);
  }
}
