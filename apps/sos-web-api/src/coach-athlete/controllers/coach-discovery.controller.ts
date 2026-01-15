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
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  CoachDiscoveryService,
  CoachDiscoveryFilters,
} from '../services/coach-discovery.service';
import {
  CreateCoachDiscoveryProfileRequest,
  UpdateCoachDiscoveryProfileRequest,
  CreateCoachRequestRequest,
  RespondToCoachRequestRequest,
} from '../entities/coach-athlete-relationship.entity';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { User } from '@/auth/decorators/user.decorator';

@ApiTags('Coach Discovery')
@ApiBearerAuth()
@Controller('coach-discovery')
export class CoachDiscoveryController {
  constructor(private readonly coachDiscoveryService: CoachDiscoveryService) {}

  @Post('profile')
  @Roles(UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Create coach discovery profile',
    'Create coach discovery profile',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Profile already exists' })
  async createProfile(
    @Body() createProfileDto: CreateCoachDiscoveryProfileRequest,
    @User() user: RequestContext,
  ) {
    const profile = await this.coachDiscoveryService.createCoachProfile(
      user.userId,
      user.tenantId,
      createProfileDto,
    );

    return {
      success: true,
      message: 'Coach discovery profile created successfully',
      data: profile,
    };
  }

  @Put('profile')
  @Roles(UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Update coach discovery profile',
    'Update coach discovery profile',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @Body() updateProfileDto: UpdateCoachDiscoveryProfileRequest,
    @User() user: RequestContext,
  ) {
    const profile = await this.coachDiscoveryService.updateCoachProfile(
      user.userId,
      updateProfileDto,
    );

    return {
      success: true,
      message: 'Coach discovery profile updated successfully',
      data: profile,
    };
  }

  @Get('profile')
  @Roles(UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Get own coach discovery profile',
    'Get own coach discovery profile',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getOwnProfile(@User() user: RequestContext) {
    return await this.coachDiscoveryService.getCoachProfile(user.userId);
  }

  @Get('search')
  @Roles(UserRole.ATHLETE, UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation('Search for coaches', 'Search for coaches', true)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Coaches retrieved successfully' })
  async searchCoaches(@Query() filters: CoachDiscoveryFilters) {
    const result = await this.coachDiscoveryService.searchCoaches(filters);

    return {
      success: true,
      message: 'Coaches retrieved successfully',
      data: result.coaches,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Post('request')
  @Roles(UserRole.ATHLETE, UserRole.SUPER_ADMIN)
  @ApiStandardOperation('Request a coach', 'Request a coach', true)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 201, description: 'Coach request sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or coach not available',
  })
  async requestCoach(
    @Request() req: any,
    @Body() requestDto: CreateCoachRequestRequest,
  ) {
    const coachRequest = await this.coachDiscoveryService.requestCoach(
      req.user.id,
      requestDto,
    );

    return {
      success: true,
      message: 'Coach request sent successfully',
      data: coachRequest,
    };
  }

  @Put('request/:requestId/respond')
  @Roles(UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Respond to a coach request',
    'Respond to a coach request',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Response sent successfully' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to respond to this request',
  })
  async respondToRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
    @Body() responseDto: RespondToCoachRequestRequest,
  ) {
    const coachRequest = await this.coachDiscoveryService.respondToCoachRequest(
      req.user.id,
      requestId,
      responseDto,
    );

    return {
      success: true,
      message: 'Response sent successfully',
      data: coachRequest,
    };
  }

  @Get('requests/received')
  @Roles(UserRole.COACH, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Get received coach requests',
    'Get received coach requests',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  async getReceivedRequests(
    @Request() req: any,
    @Query('status') status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  ) {
    const requests = await this.coachDiscoveryService.getCoachRequests(
      req.user.id,
      status,
    );

    return {
      success: true,
      message: 'Coach requests retrieved successfully',
      data: requests,
    };
  }

  @Get('requests/sent')
  @Roles(UserRole.ATHLETE, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Get sent coach requests',
    'Get sent coach requests',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  async getSentRequests(
    @Request() req: any,
    @Query('status') status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  ) {
    const requests = await this.coachDiscoveryService.getAthleteRequests(
      req.user.id,
      status,
    );

    return {
      success: true,
      message: 'Coach requests retrieved successfully',
      data: requests,
    };
  }

  @Delete('request/:requestId')
  @Roles(UserRole.ATHLETE, UserRole.SUPER_ADMIN)
  @ApiStandardOperation(
    'Cancel a coach request',
    'Cancel a coach request',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'Request cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to cancel this request',
  })
  @HttpCode(HttpStatus.OK)
  async cancelRequest(
    @Request() req: any,
    @Param('requestId') requestId: string,
  ) {
    const coachRequest = await this.coachDiscoveryService.cancelCoachRequest(
      req.user.id,
      requestId,
    );

    return {
      success: true,
      message: 'Coach request cancelled successfully',
      data: coachRequest,
    };
  }
}
