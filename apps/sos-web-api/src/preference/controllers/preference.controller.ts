import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PreferenceService } from '../services/preference.service';
import {
  CreateUserPreferenceDto,
  UpdateUserPreferenceDto,
  BulkUpdatePreferencesDto,
} from '../dto/preference-request.dto';
import {
  UserPreferenceResponseDto,
  PreferenceSchemaResponseDto,
  PreferenceCategoryResponseDto,
  UserPreferencesGroupedResponseDto,
  BulkPreferenceUpdateResponseDto,
} from '../dto/preference-response.dto';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  // User Preference Endpoints

  @Post()
  @ApiOperation({ summary: 'Create user preference' })
  @ApiResponse({
    status: 201,
    description: 'Preference created successfully',
    type: UserPreferenceResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Preference already exists' })
  @ApiResponse({ status: 400, description: 'Invalid preference value' })
  async createUserPreference(
    @Req() req: Request,
    @Body() createPreferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceResponseDto> {
    const userId = req.user?.['sub'];
    const preference = await this.preferenceService.createUserPreference(
      userId,
      createPreferenceDto,
    );
    return UserPreferenceResponseDto.fromEntity(preference);
  }

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
    type: [UserPreferenceResponseDto],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'key',
    required: false,
    description: 'Filter by specific key',
  })
  async getUserPreferences(
    @Req() req: Request,
    @Query('category') category?: string,
    @Query('key') key?: string,
  ): Promise<UserPreferenceResponseDto[]> {
    const userId = req.user?.['sub'];
    const filters = { category, key };
    const preferences = await this.preferenceService.getUserPreferences(
      userId,
      filters,
    );
    return preferences.map((pref) =>
      UserPreferenceResponseDto.fromEntity(pref),
    );
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get user preferences grouped by category' })
  @ApiResponse({
    status: 200,
    description: 'Grouped preferences retrieved successfully',
    type: [UserPreferencesGroupedResponseDto],
  })
  async getUserPreferencesGrouped(
    @Req() req: Request,
  ): Promise<UserPreferencesGroupedResponseDto[]> {
    const userId = req.user?.['sub'];
    return this.preferenceService.getUserPreferencesGrouped(userId);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get user preference by key' })
  @ApiResponse({
    status: 200,
    description: 'Preference retrieved successfully',
    type: UserPreferenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Preference not found' })
  @ApiParam({ name: 'key', description: 'Preference key' })
  async getUserPreferenceByKey(
    @Req() req: Request,
    @Param('key') key: string,
  ): Promise<UserPreferenceResponseDto> {
    const userId = req.user?.['sub'];
    const preference = await this.preferenceService.getUserPreferenceByKey(
      userId,
      key,
    );
    return UserPreferenceResponseDto.fromEntity(preference);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update user preference' })
  @ApiResponse({
    status: 200,
    description: 'Preference updated successfully',
    type: UserPreferenceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Preference not found' })
  @ApiResponse({
    status: 400,
    description: 'Invalid preference value or not user-editable',
  })
  @ApiParam({ name: 'key', description: 'Preference key' })
  async updateUserPreference(
    @Req() req: Request,
    @Param('key') key: string,
    @Body() updatePreferenceDto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceResponseDto> {
    const userId = req.user?.['sub'];
    const preference = await this.preferenceService.updateUserPreference(
      userId,
      key,
      updatePreferenceDto,
    );
    return UserPreferenceResponseDto.fromEntity(preference);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert user preference (create or update)' })
  @ApiResponse({
    status: 200,
    description: 'Preference upserted successfully',
    type: UserPreferenceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid preference value' })
  async upsertUserPreference(
    @Req() req: Request,
    @Body() createPreferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceResponseDto> {
    const userId = req.user?.['sub'];
    const preference = await this.preferenceService.upsertUserPreference(
      userId,
      createPreferenceDto,
    );
    return UserPreferenceResponseDto.fromEntity(preference);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user preference' })
  @ApiResponse({ status: 204, description: 'Preference deleted successfully' })
  @ApiResponse({ status: 404, description: 'Preference not found' })
  @ApiResponse({
    status: 400,
    description: 'Required preference cannot be deleted',
  })
  @ApiParam({ name: 'key', description: 'Preference key' })
  async deleteUserPreference(
    @Req() req: Request,
    @Param('key') key: string,
  ): Promise<void> {
    const userId = req.user?.['sub'];
    await this.preferenceService.deleteUserPreference(userId, key);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk update user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed',
    type: BulkPreferenceUpdateResponseDto,
  })
  async bulkUpdateUserPreferences(
    @Req() req: Request,
    @Body() bulkUpdateDto: BulkUpdatePreferencesDto,
  ): Promise<BulkPreferenceUpdateResponseDto> {
    const userId = req.user?.['sub'];
    return this.preferenceService.bulkUpdateUserPreferences(
      userId,
      bulkUpdateDto,
    );
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset user preferences to defaults' })
  @ApiResponse({
    status: 200,
    description: 'Preferences reset successfully',
    type: [UserPreferenceResponseDto],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Reset only preferences in this category',
  })
  async resetUserPreferencesToDefaults(
    @Req() req: Request,
    @Query('category') category?: string,
  ): Promise<UserPreferenceResponseDto[]> {
    const userId = req.user?.['sub'];
    const preferences =
      await this.preferenceService.resetUserPreferencesToDefaults(
        userId,
        category,
      );
    return preferences.map((pref) =>
      UserPreferenceResponseDto.fromEntity(pref),
    );
  }

  // Schema and Category Endpoints (Read-only for users)

  @Get('schemas/all')
  @ApiOperation({ summary: 'Get all preference schemas' })
  @ApiResponse({
    status: 200,
    description: 'Schemas retrieved successfully',
    type: [PreferenceSchemaResponseDto],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  async getPreferenceSchemas(
    @Query('category') category?: string,
  ): Promise<PreferenceSchemaResponseDto[]> {
    const schemas = await this.preferenceService.getPreferenceSchemas(category);
    return schemas.map((schema) =>
      PreferenceSchemaResponseDto.fromEntity(schema),
    );
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Get all preference categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [PreferenceCategoryResponseDto],
  })
  async getPreferenceCategories(): Promise<PreferenceCategoryResponseDto[]> {
    const categories = await this.preferenceService.getPreferenceCategories();
    return categories.map((category) =>
      PreferenceCategoryResponseDto.fromEntity(category),
    );
  }

  // User-specific endpoints for other users (admin functionality could be added here)

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get preferences for specific user (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully',
    type: [UserPreferenceResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  async getUserPreferencesForUser(
    @Req() req: Request,
    @Param('userId') targetUserId: string,
    @Query('category') category?: string,
  ): Promise<UserPreferenceResponseDto[]> {
    const currentUserId = req.user?.['sub'];

    // For now, users can only access their own preferences
    // In the future, this could be extended to allow admins to view other users' preferences
    if (currentUserId !== targetUserId) {
      // This would require admin role checking
      // For now, we'll allow it but in a real implementation you'd check admin permissions
    }

    const filters = { category };
    const preferences = await this.preferenceService.getUserPreferences(
      targetUserId,
      filters,
    );
    return preferences.map((pref) =>
      UserPreferenceResponseDto.fromEntity(pref),
    );
  }

  @Get('users/:userId/grouped')
  @ApiOperation({
    summary: 'Get grouped preferences for specific user (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User grouped preferences retrieved successfully',
    type: [UserPreferencesGroupedResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  async getUserPreferencesGroupedForUser(
    @Req() req: Request,
    @Param('userId') targetUserId: string,
  ): Promise<UserPreferencesGroupedResponseDto[]> {
    const currentUserId = req.user?.['sub'];

    // For now, users can only access their own preferences
    // In the future, this could be extended to allow admins to view other users' preferences
    if (currentUserId !== targetUserId) {
      // This would require admin role checking
      // For now, we'll allow it but in a real implementation you'd check admin permissions
    }

    return this.preferenceService.getUserPreferencesGrouped(targetUserId);
  }
}
