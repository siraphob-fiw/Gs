import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import {
  CreatePostDto,
  UpdatePostDto,
  PostQueryDto,
  PostResponseDto,
} from '../dto';
import { Post } from '../entities/post.entity';
import { PaginatedResult } from '@/database/base.repository';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async create(
    createPostDto: CreatePostDto,
    user: RequestContext,
  ): Promise<PostResponseDto> {
    const existingPost = await this.postRepository.findOneByTitle(
      createPostDto.title,
    );
    if (existingPost) {
      throw new ConflictException('Post with this title already exists');
    }

    const post = await this.postRepository.createPost(
      createPostDto,
      user.userId,
    );

    return this.mapToResponseDto(post);
  }

  async findAll(
    queryDto: PostQueryDto,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const result = await this.postRepository.findWithFilters(queryDto);

    return {
      data: await Promise.all(result.data.map((p) => this.mapToResponseDto(p))),
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOneById(id);
    return this.mapToResponseDto(post);
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const existingPost = await this.postRepository.findOneById(id);
    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const updatedPost = await this.postRepository.updatePost(id, updatePostDto);
    return this.mapToResponseDto(updatedPost);
  }

  async delete(id: string): Promise<void> {
    await this.postRepository.deletePost(id);
  }

  private mapToResponseDto(post: Post): PostResponseDto {
    return {
      id: post.id,
      title: post.title,
      details: post.details,
      status: post.status,
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
  }
}
