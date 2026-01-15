import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BaseRepository,
  PaginatedResult,
} from '../../database/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Post, PostStatus } from '../entities/post.entity';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from '../dto';
import { Knex } from 'knex';

@Injectable()
export class PostRepository extends BaseRepository<Post> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'posts');
  }

  async createPost(
    createPostDto: CreatePostDto,
    authorId: string,
  ): Promise<Post> {
    const postData = {
      title: createPostDto.title,
      details: createPostDto.details,
      status: createPostDto.status ?? PostStatus.DRAFT,
      author_id: authorId,
    };

    const [result] = await this.databaseService
      .knex('posts')
      .insert(postData)
      .returning('*');

    if (!result) {
      throw new Error('Failed to create post');
    }

    return result as Post;
  }

  async findWithFilters(
    queryDto: PostQueryDto,
  ): Promise<PaginatedResult<Post>> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const offset = (page - 1) * limit;

    let query = this.table;

    if (queryDto.search) {
      query = query.where((builder: Knex.QueryBuilder) => {
        builder
          .where('title', 'ilike', `%${queryDto.search}%`)
          .orWhere('content', 'ilike', `%${queryDto.search}%`)
          .orWhere('slug', 'ilike', `%${queryDto.search}%`);
      });
    }

    if (queryDto.status) {
      query = query.where('status', queryDto.status);
    }

    const sortBy = queryDto.sortBy || 'created_at';
    const sortOrder = queryDto.sortOrder || 'asc';
    query = query.orderBy(sortBy, sortOrder);

    const totalQuery = query
      .clone()
      .clearSelect()
      .clearOrder()
      .count('* as count');
    const [{ count }] = await totalQuery;
    const total = parseInt(count as string, 10);

    const data = await query.limit(limit).offset(offset);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneByTitle(title: string): Promise<Post> {
    return await this.databaseService
      .knex('posts')
      .where('title', title)
      .first();
  }

  async findOneById(id: string): Promise<Post> {
    return await this.databaseService.knex('posts').where('id', id).first();
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const res = await this.databaseService
      .knex('posts')
      .where('id', id)
      .update(updatePostDto)
      .returning('*');

    return res[0];
  }

  async deletePost(id: string): Promise<boolean> {
    const post = await this.databaseService
      .knex('posts')
      .where('id', id)
      .first();

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.databaseService.knex('posts').where('id', id).delete();

    return true;
  }
}
