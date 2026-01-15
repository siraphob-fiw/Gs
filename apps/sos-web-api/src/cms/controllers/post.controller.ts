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
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam, ApiOperation } from '@nestjs/swagger';
import { PostService } from '../services/post.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostQueryDto,
  PostResponseDto,
} from '../dto';
import { Public } from '../../auth/decorators/public.decorator';
import { PaginatedResult } from '@/database/base.repository';
import { RequestContext } from '@strengthos/shared-types';
import { User } from '@/auth/decorators/user.decorator';
@ApiTags('cms-posts')
@Controller('cms-posts')
@Public()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Post with this title already exists',
  })
  async create(
    @Body() createPostDto: CreatePostDto,
    @User() user: RequestContext,
  ): Promise<PostResponseDto> {
    return this.postService.create(createPostDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
  })
  async findAll(
    @Query() queryDto: PostQueryDto,
  ): Promise<PaginatedResult<PostResponseDto>> {
    return this.postService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    return this.postService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.postService.delete(id);
  }
}
