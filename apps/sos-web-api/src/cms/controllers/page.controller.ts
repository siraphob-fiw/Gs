import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam, ApiOperation } from '@nestjs/swagger';
import { PageService } from '../services/page.service';
import {
  CreatePageDto,
  UpdatePageDto,
  PageQueryDto,
  PageResponseDto,
} from '../dto';
import { Public } from '../../auth/decorators/public.decorator';
import { RequestContext } from '@strengthos/shared-types';
import { User } from '@/auth/decorators/user.decorator';

@ApiTags('cms-pages')
@Controller('cms-pages')
@Public()
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new page' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Page created successfully',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Page with this slug already exists',
  })
  async create(
    @Body() createPageDto: CreatePageDto,
    @User() user: RequestContext,
  ): Promise<PageResponseDto> {
    return this.pageService.create(createPageDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pages retrieved successfully',
    type: [PageResponseDto],
  })
  async findAll(@Query() queryDto: PageQueryDto): Promise<{
    data: PageResponseDto[];
    total: number;
    page: number | null;
    limit: number | null;
    totalPages: number;
  }> {
    return this.pageService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a page by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page retrieved successfully',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PageResponseDto> {
    return this.pageService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a page by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page retrieved successfully',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<PageResponseDto> {
    return this.pageService.findBySlug(slug);
  }

  @Put()
  @ApiOperation({ summary: 'Update a page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page updated successfully',
    type: PageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found',
  })
  async update(
    @Body() updatePageDto: UpdatePageDto,
    @User() user: RequestContext,
  ): Promise<PageResponseDto> {
    return this.pageService.update(updatePageDto, user);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a page' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Page deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found',
  })
  async delete(@Param('slug') slug: string): Promise<void> {
    await this.pageService.delete(slug);
    // No content is expected, so nothing is returned.
  }
}
