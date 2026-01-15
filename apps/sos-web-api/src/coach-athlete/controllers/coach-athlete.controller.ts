import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CoachAthleteService } from '../services/coach-athlete.service';
import { CoachTransitionService } from '../services/coach-transition.service';
import {
  CreateCoachAthleteRelationshipDto,
  CoachAthleteQueryDto,
} from '../dto/coach-athlete-request.dto';
import {
  CoachAthleteRelationshipResponseDto,
  CoachAthleteRelationshipListResponseDto,
  CoachAthleteRelationshipWithTrainingBlocksResponseDto,
} from '../dto/coach-athlete-response.dto';
import {
  CreateTransitionRequestDto,
  ApproveTransitionRequestDto,
  RejectTransitionRequestDto,
  TransitionRequestResponseDto,
  TransitionRequestQueryDto,
} from '../dto/transition-request.dto';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { RelationshipStatus } from '../entities/coach-athlete-relationship.entity';
import { DatabaseService } from '../../database/database.service';
import { RequestContext, Results } from '@strengthos/shared-types';
import { TrainingSessionService } from '@/training-session/services/training-session.service';
import { User } from '@/auth/decorators/user.decorator';
import dayjs from 'dayjs';

@ApiTags('coach-athlete')
@ApiBearerAuth()
@Controller('coach-athlete')
export class CoachAthleteController {
  constructor(
    private readonly coachAthleteService: CoachAthleteService,
    private readonly coachTransitionService: CoachTransitionService,
    private readonly databaseService: DatabaseService,
    private readonly trainingSessionService: TrainingSessionService,
  ) {}

  @Post('relationships')
  @ApiStandardOperation(
    'Create a new coach-athlete relationship',
    'Creates a new coach-athlete relationship.',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Coach-athlete relationship created successfully',
    type: CoachAthleteRelationshipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or relationship already exists',
  })
  async createRelationship(
    @Body() createDto: CreateCoachAthleteRelationshipDto,
    @User() user: RequestContext,
  ): Promise<CoachAthleteRelationshipResponseDto> {
    const relationship = await this.coachAthleteService.createRelationship(
      createDto,
      user,
    );
    return CoachAthleteRelationshipResponseDto.fromEntity(relationship);
  }

  @Get('relationships')
  @ApiStandardOperation(
    'Get coach-athlete relationships with filtering and pagination',
    'Get coach-athlete relationships with filtering and pagination.',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of coach-athlete relationships',
    type: CoachAthleteRelationshipListResponseDto,
  })
  async getRelationships(
    @Query() queryDto: CoachAthleteQueryDto,
  ): Promise<CoachAthleteRelationshipWithTrainingBlocksResponseDto> {
    const result = await this.coachAthleteService.getRelationships(queryDto);
    const relationshipsWithBlocks = await Promise.all(
      result.relationships.map(async (relationship) => {
        const { sessions } =
          await this.trainingSessionService.getTrainingSessions(
            {},
            relationship.athlete_id,
            relationship.tenant_id,
          );
        const lastActivityRow = await this.databaseService
          .knex('users')
          .where('id', relationship.athlete_id)
          .orderBy('created_at', 'desc')
          .first();

        const lastActivity = lastActivityRow
          ? lastActivityRow.last_login_at
          : null;
        return {
          ...CoachAthleteRelationshipResponseDto.fromEntity(relationship),
          training_session_count: sessions.length,
          last_activity: lastActivity,
        };
      }),
    );

    return {
      relationships: relationshipsWithBlocks,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    } as CoachAthleteRelationshipWithTrainingBlocksResponseDto;
  }

  @Put('relationships/:id/:status')
  @ApiStandardOperation(
    'Update a coach-athlete relationship',
    'Update a coach-athlete relationship',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Relationship ID' })
  @ApiParam({
    name: 'status',
    description: 'Relationship status',
    enum: RelationshipStatus,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coach-athlete relationship updated successfully',
    type: CoachAthleteRelationshipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Relationship not found',
  })
  async updateRelationship(
    @Param('id') id: string,
    @Param('status') status: RelationshipStatus,
    @User() user: RequestContext,
  ): Promise<CoachAthleteRelationshipResponseDto> {
    const relationship = await this.coachAthleteService.updateRelationship(
      id,
      status,
      user.userId,
    );
    return CoachAthleteRelationshipResponseDto.fromEntity(relationship);
  }

  // Transition endpoints
  @Post('transitions')
  @ApiStandardOperation(
    'Create a new coach transition request',
    'Create a new coach transition request',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transition request created successfully',
    type: TransitionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transition request',
  })
  async createTransitionRequest(
    @Body() createDto: CreateTransitionRequestDto,
  ): Promise<TransitionRequestResponseDto> {
    const request =
      await this.coachTransitionService.createTransitionRequest(createDto);
    return TransitionRequestResponseDto.fromEntity(request);
  }

  @Get('transitions')
  @ApiStandardOperation(
    'Get transition requests with filtering and pagination',
    'Get transition requests with filtering and pagination',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get transition requests with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transition requests',
  })
  async getTransitionRequests(@Query() queryDto: TransitionRequestQueryDto) {
    return this.coachTransitionService.getTransitionRequests(queryDto);
  }

  @Get('transitions/:id')
  @ApiStandardOperation(
    'Get a specific transition request by ID',
    'Get a specific transition request by ID',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Transition request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transition request details',
    type: TransitionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transition request not found',
  })
  async getTransitionRequest(
    @Param('id') id: string,
  ): Promise<TransitionRequestResponseDto> {
    const request = await this.coachTransitionService.getTransitionRequest(id);
    return TransitionRequestResponseDto.fromEntity(request);
  }

  @Get('athletes/:athleteId/transition-history')
  @ApiStandardOperation(
    'Get transition history for a specific athlete',
    'Get transition history for a specific athlete',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'athleteId', description: 'Athlete user ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Athlete transition history',
    type: [TransitionRequestResponseDto],
  })
  async getTransitionHistory(
    @Param('athleteId') athleteId: string,
  ): Promise<TransitionRequestResponseDto[]> {
    const requests =
      await this.coachTransitionService.getTransitionHistory(athleteId);
    return requests.map((req) => TransitionRequestResponseDto.fromEntity(req));
  }

  @Put('transitions/:id/approve')
  @ApiStandardOperation(
    'Approve a transition request',
    'Approve a transition request',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Transition request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transition request approved successfully',
    type: TransitionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transition request not found',
  })
  async approveTransition(
    @Param('id') id: string,
    @Body() approveDto: ApproveTransitionRequestDto,
  ): Promise<TransitionRequestResponseDto> {
    const request = await this.coachTransitionService.approveTransition(
      id,
      approveDto,
    );
    return TransitionRequestResponseDto.fromEntity(request);
  }

  @Put('transitions/:id/reject')
  @ApiStandardOperation(
    'Reject a transition request',
    'Reject a transition request',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Transition request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transition request rejected successfully',
    type: TransitionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transition request not found',
  })
  async rejectTransition(
    @Param('id') id: string,
    @Body() rejectDto: RejectTransitionRequestDto,
  ): Promise<TransitionRequestResponseDto> {
    const request = await this.coachTransitionService.rejectTransition(
      id,
      rejectDto,
    );
    return TransitionRequestResponseDto.fromEntity(request);
  }

  @Put('transitions/:id/cancel')
  @ApiStandardOperation(
    'Cancel a transition request',
    'Cancel a transition request',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Transition request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transition request cancelled successfully',
    type: TransitionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transition request not found',
  })
  async cancelTransition(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<TransitionRequestResponseDto> {
    const request = await this.coachTransitionService.cancelTransition(
      id,
      req.user.id,
    );
    return TransitionRequestResponseDto.fromEntity(request);
  }

  @Get('coach-interface-overview')
  @ApiOperation({ summary: 'Get athlete overview data for coach interface' })
  @ApiResponse({
    status: 200,
    description: 'Athlete overview data retrieved successfully',
  })
  @ApiQuery({
    name: 'timeDuration',
    required: false,
    description: 'Time window in days for recent activity (default: 14)',
  })
  async getCoachInterfaceOverview(
    @User() user: RequestContext,
    @Query('timeDuration') timeDuration?: string,
  ): Promise<
    Results<{
      competitionLifts: any[];
      sessionSchedule: Record<string, any>;
      timeWindowDays: number;
    }>
  > {
    const timeWindowDays =
      timeDuration && !isNaN(Number(timeDuration))
        ? parseInt(timeDuration, 10)
        : 14;
    const cutoffDate = dayjs()
      .subtract(timeWindowDays, 'days')
      .startOf('day')
      .toDate();
    const thisWeek = dayjs().startOf('week').toDate();

    // Fetch all active athletes for this coach.
    const athletes = await this.databaseService
      .knex('coach_athlete_relationships as car')
      .join('users as u', 'car.athlete_id', 'u.id')
      .where('car.coach_id', user.userId)
      .where('car.status', RelationshipStatus.ACTIVE)
      .select(
        'car.athlete_id as athlete_id',
        'u.first_name as athlete_firstName',
        'u.last_name as athlete_lastName',
      );

    const athleteIds = athletes.map((a) => a.athlete_id);

    // If no athletes, bail early with empty results.
    if (!athleteIds.length) {
      return Results.ok({
        competitionLifts: [],
        sessionSchedule: {},
        timeWindowDays,
      });
    }

    // Fetch sessions for those athlete ids.
    const sessionIdsRows = await this.databaseService
      .knex('training_sessions as ts')
      .whereIn('ts.athlete_id', athleteIds)
      .select('ts.id as session_id');

    const sessionIds = sessionIdsRows.map((row) => row.session_id);
    if (!sessionIds.length) {
      return Results.ok({
        competitionLifts: [],
        sessionSchedule: {},
        timeWindowDays,
      });
    }

    // Retrieve recent completed competition lifts for those session ids.
    let competitionLiftsRaw: any[] = [];
    try {
      competitionLiftsRaw = await this.databaseService
        .knex('training_sessions_exercises as tse')
        .whereIn('tse.training_session_id', sessionIds)
        .where('tse.exercise_date', '>=', cutoffDate)
        .where('tse.exercise_status', 'COMPLETED')
        .join('exercises as e', 'tse.exercise_id', 'e.id')
        .whereIn('e.name', ['Bench Press', 'Squat', 'Deadlift'])
        .join('training_sessions as ts', 'tse.training_session_id', 'ts.id')
        .join('users as u', 'ts.athlete_id', 'u.id')
        .select(
          'tse.training_session_id as session_id',
          this.databaseService.knex.raw('DATE(tse.exercise_date) as date'),
          'tse.exercise_id as exercise_id',
          this.databaseService.knex.raw(`tse.metrics->>'e1rm' as e1rm`),
          'tse.actual as actual',
          'e.name as exercise_name',
          'u.first_name as athlete_firstName',
          'u.last_name as athlete_lastName',
        );
    } catch {
      competitionLiftsRaw = [];
    }

    const competitionLifts = competitionLiftsRaw.map((lift) => {
      let actual = null;
      try {
        let sets = lift.actual;
        if (typeof sets === 'string') sets = JSON.parse(sets);
        if (Array.isArray(sets) && sets.length > 0) {
          // Find the set with highest weight, fallback to 0 for invalid values.
          let highestWeightSet = { weight: 0, reps: 0, rpe: 0 };
          for (const set of sets) {
            const weight = Number(set.weight) || 0;
            const reps = Number(set.reps) || 0;
            const rpe = Number(set.rpe) || 0;
            if (weight > highestWeightSet.weight) {
              highestWeightSet = { weight, reps, rpe };
            }
          }
          actual = highestWeightSet;
        }
      } catch {
        actual = null;
      }
      return {
        athlete_name: `${lift.athlete_firstName} ${lift.athlete_lastName}`,
        session_id: lift.session_id,
        date: lift.date ? dayjs(lift.date).format('YYYY-MM-DD') : null,
        exercise_id: lift.exercise_id,
        e1rm: lift.e1rm ? Number(lift.e1rm) : null,
        actual,
        exercise_name: lift.exercise_name,
      };
    });

    // Fetch current week's session schedule for all athletes.
    let sessionScheduleRaw: any[] = [];
    try {
      sessionScheduleRaw = await this.databaseService
        .knex('training_sessions as ts')
        .join(
          'coach_athlete_relationships as car',
          'ts.athlete_id',
          'car.athlete_id',
        )
        .join(
          'training_sessions_exercises as tse',
          'ts.id',
          'tse.training_session_id',
        )
        .where('car.coach_id', user.userId)
        .where('car.status', RelationshipStatus.ACTIVE)
        .where('tse.exercise_date', '>=', thisWeek)
        .select(
          'ts.athlete_id as athlete_id',
          this.databaseService.knex.raw('DATE(tse.exercise_date) as date'),
        )
        .distinct();
    } catch {
      sessionScheduleRaw = [];
    }

    // Build compact athlete_id => [date] map for front-end usage
    const sessionSchedule: { [athleteId: string]: string[] } = {};
    for (const row of sessionScheduleRaw) {
      const athleteId = row.athlete_id;
      const date = row.date ? dayjs(row.date).format('YYYY-MM-DD') : null;
      if (!athleteId || !date) continue;
      if (!sessionSchedule[athleteId]) sessionSchedule[athleteId] = [];
      sessionSchedule[athleteId].push(date);
    }

    return Results.ok({
      competitionLifts,
      sessionSchedule,
      timeWindowDays,
    });
  }
}
