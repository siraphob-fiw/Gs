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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  TrainingSessionAthlete,
  TrainingSessionService,
} from '../services/training-session.service';
import {
  CalculateWeightDto,
  CreateTrainingSessionDto,
  ProgressSessionExerciseDto,
  UpdateTrainingSessionDto,
} from '../dto/training-session.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { User } from '@/auth/decorators/user.decorator';
import { RequestContext } from '@strengthos/shared-types';
import { RequiresTenant } from '@/auth/decorators/requires-tenant.decorator';
import { UserService } from '@/user/services/user.service';
import { StressMetricsService } from '../services/stress-metrics.service';

@ApiTags('Training Sessions')
@ApiBearerAuth()
@Controller('training-sessions')
export class TrainingSessionController {
  constructor(
    private readonly trainingSessionService: TrainingSessionService,
    private readonly userService: UserService,
    private readonly stressMetricsService: StressMetricsService,
  ) {}

  @Post()
  @RequiresTenant()
  @ApiStandardOperation(
    'Create a new training session',
    'Creates a new training session with optional exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Training session created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createTrainingSession(
    @Body() createDto: CreateTrainingSessionDto,
    @User() user: RequestContext,
  ): Promise<TrainingSessionAthlete> {
    const trainingSession =
      await this.trainingSessionService.createTrainingSession(
        createDto,
        user.tenantId,
        user.userId,
      );

    return trainingSession;
  }

  @Get('calendar')
  @ApiStandardOperation(
    'Get training sessions calendar',
    'Retrieves training sessions calendar',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'day', required: false, description: 'Day' })
  @ApiQuery({ name: 'month', required: false, description: 'Month' })
  @ApiQuery({ name: 'year', required: false, description: 'Year' })
  @ApiQuery({ name: 'athleteId', required: false, description: 'Athlete ID' })
  async getTrainingSessionsCalendar(
    @User() user: RequestContext,
    @Query('day') day?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('athleteId') athleteId?: string,
  ): Promise<{
    sessions: TrainingSessionAthlete[];
  }> {
    let userId = user.userId;
    let tenant_id = user.tenantId;

    const parsedDay = day !== undefined ? Number(day) : undefined;
    const parsedMonth = month !== undefined ? Number(month) : undefined;
    const parsedYear = year !== undefined ? Number(year) : undefined;
    return await this.trainingSessionService.getTrainingSessionsCalendar(
      {
        day: parsedDay,
        month: parsedMonth,
        year: parsedYear,
        athleteId: athleteId,
      },
      userId,
      tenant_id,
    );
  }

  @Get(':id')
  @ApiStandardOperation(
    'Get training session by ID',
    'Retrieves a specific training session with all exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training session retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training session not found',
  })
  async getTrainingSession(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<TrainingSessionAthlete | { statusCode: number; message: string }> {
    return await this.trainingSessionService.getTrainingSession(id, user);
  }

  @Get()
  @ApiStandardOperation(
    'Get training sessions with filtering and pagination',
    'Retrieves training sessions with optional filtering by program, template, or type',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'athleteId',
    required: false,
    description: 'Filter by athlete ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getTrainingSessions(
    @Query() query: any,
    @User() user: RequestContext,
  ): Promise<{
    sessions: TrainingSessionAthlete[];
    total?: number;
    page?: number;
    limit?: number;
  }> {
    return await this.trainingSessionService.getTrainingSessions(
      query,
      user.userId,
      user.tenantId,
    );
  }

  @Put(':id')
  @RequiresTenant()
  @ApiStandardOperation(
    'Update training session',
    'Updates an existing training session with new data',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training session updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateTrainingSession(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingSessionDto,
    @User() user: RequestContext,
  ): Promise<TrainingSessionAthlete> {
    const updatedSession =
      await this.trainingSessionService.updateTrainingSession(
        id,
        updateDto,
        user.tenantId,
        user.userId,
      );

    return updatedSession;
  }

  @Delete(':id')
  @RequiresTenant()
  @ApiStandardOperation(
    'Delete training session',
    'Deletes a training session and all associated exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training session ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Training session deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training session not found',
  })
  async deleteTrainingSession(
    @Param('id') id: string,
    @User() user: RequestContext,
  ): Promise<void> {
    return await this.trainingSessionService.deleteTrainingSession(
      id,
      user.tenantId,
      user.userId,
    );
  }

  @Put('progress/:id')
  @RequiresTenant()
  @ApiStandardOperation(
    'Progress training session exercise',
    'Progress a training session exercise',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'Training session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Training session exercise progressed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training session exercise not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async progressTrainingSessionExercise(
    @Param('id') id: string,
    @Query('exerciseDate') exerciseDate: string,
    @Body()
    data: {
      exerciseDate: string;
      data: ProgressSessionExerciseDto[];
    },
    @User() user: RequestContext,
  ): Promise<TrainingSessionAthlete> {
    return await this.trainingSessionService.progressTrainingSessionExercise(
      data.exerciseDate,
      id,
      data.data,
      user,
    );
  }

  @Post('calculate-weight')
  @RequiresTenant()
  @ApiStandardOperation(
    'Calculate weight',
    'Calculates the weight for a training session exercise',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: () => CalculateWeightDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weight calculated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async calculateWeight(
    @Body() data: CalculateWeightDto,
    @User() user: RequestContext,
  ): Promise<{ e1rm: number; weight: number }> {
    const athleteId = data.athleteId ?? user.userId;
    let tenantId = user.tenantId;

    if (data.athleteId) {
      tenantId = (await this.userService.findById(data.athleteId)).tenantId;
    }

    return await this.trainingSessionService.calculateWeight(
      data.exerciseId,
      data.reps,
      data.rpe,
      athleteId,
      tenantId,
    );
  }

  @Post('bulk-calculate-weight')
  @RequiresTenant()
  @ApiStandardOperation(
    'Bulk calculate weight',
    'Bulk calculates the weight for training session exercises',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', nullable: true },
        athleteId: { type: 'string', nullable: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exerciseId: { type: 'string' },
              reps: { type: 'number' },
              rpe: { type: 'number' },
            },
            required: ['exerciseId', 'reps', 'rpe'],
          },
        },
      },
      required: ['data'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weights calculated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async bulkCalculateWeight(
    @Body()
    data: {
      tenantId?: string;
      athleteId?: string;
      data: { exerciseId: string; reps: number; rpe: number }[];
    },
    @User() user: RequestContext,
  ): Promise<{ exerciseId: string; weight: number; e1rm: number }[]> {
    return await this.trainingSessionService.bulkCalculateWeight(
      data.data,
      data.tenantId ?? user.tenantId,
      data.athleteId ?? user.userId,
    );
  }

  @Get('stress-metrics-formula')
  @ApiStandardOperation(
    'Get stress metrics formula',
    'Gets the stress metrics formula',
    true,
  )
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stress metrics formula retrieved successfully',
  })
  async getStressMetricsFormula(): Promise<{ formula: string }> {
    return await this.stressMetricsService.getStressMetricsFormula();
  }
}
