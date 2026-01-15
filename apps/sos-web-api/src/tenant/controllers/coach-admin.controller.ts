import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoachAdminService } from '../services/coach-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { ApiStandardOperation } from '../../common/decorators/swagger.decorators';

@ApiTags('coach-admin')
@Controller('tenants/:tenantId/coach-admin')
@ApiBearerAuth()
export class CoachAdminController {
  constructor(private readonly coachAdminService: CoachAdminService) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @ApiStandardOperation('Get team overview', 'Get team overview', true)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Team overview retrieved successfully',
  })
  async getTeamOverview(
    @Param('tenantId') tenantId: string,
    @User() user: RequestContext,
  ) {
    return this.coachAdminService.getTeamOverview(tenantId, user.userId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @ApiStandardOperation('Get team statistics', 'Get team statistics', true)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Team statistics retrieved successfully',
  })
  async getTeamStats(
    @Param('tenantId') tenantId: string,
    @User() _user: RequestContext,
  ) {
    return this.coachAdminService.getTeamStats(tenantId);
  }

  @Get('coach-performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.COACH_ADMIN)
  @ApiStandardOperation(
    'Get coach performance metrics',
    'Get coach performance metrics',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Coach performance metrics retrieved successfully',
  })
  async getCoachPerformanceMetrics(
    @Param('tenantId') tenantId: string,
    @User() user: RequestContext,
  ) {
    return this.coachAdminService.getCoachPerformanceMetrics(
      tenantId,
      user.userId,
    );
  }

  @Post('assign-coach')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiStandardOperation(
    'Assign coach to athlete',
    'Assign coach to athlete',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Coach assigned successfully',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Coach assigned successfully',
  })
  async assignCoachToAthlete(
    @Param('tenantId') tenantId: string,
    @Body() body: { coachId: string; athleteId: string },
    @User() user: any,
  ): Promise<void> {
    return this.coachAdminService.assignCoachToAthlete(
      tenantId,
      body.coachId,
      body.athleteId,
      user.id,
    );
  }

  @Delete('coaching-relationship/:coachId/:athleteId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COACH_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiStandardOperation(
    'Remove coach from athlete',
    'Remove coach from athlete',
    true,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Coach removed successfully',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'coachId',
    description: 'Coach ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiParam({
    name: 'athleteId',
    description: 'Athlete ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiResponse({
    status: 204,
    description: 'Coach removed successfully',
  })
  async removeCoachFromAthlete(
    @Param('tenantId') tenantId: string,
    @Param('coachId') coachId: string,
    @Param('athleteId') athleteId: string,
    @User() user: any,
  ): Promise<void> {
    return this.coachAdminService.removeCoachFromAthlete(
      tenantId,
      coachId,
      athleteId,
      user.id,
    );
  }
}
