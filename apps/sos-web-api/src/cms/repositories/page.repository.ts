import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DatabaseService } from '../../database/database.service';
import { Page, PageStatus } from '../entities/page.entity';
import { CreatePageDto, PageQueryDto } from '../dto';
import { Knex } from 'knex';

@Injectable()
export class PageRepository extends BaseRepository<Page> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'pages');
  }

  async createPage(
    createPageDto: CreatePageDto,
    authorId: string,
  ): Promise<Page> {
    const pageData = {
      title: createPageDto.title,
      slug: createPageDto.slug,
      content: createPageDto.content,
      excerpt: createPageDto.excerpt,
      status: (createPageDto.status || PageStatus.DRAFT) as PageStatus,
      meta_title: createPageDto.meta_title,
      meta_description: createPageDto.meta_description,
      meta_keywords: createPageDto.meta_keywords,
      author_id: authorId,
      published_at: createPageDto.published_at
        ? createPageDto.published_at
        : null,
      options: createPageDto.options || null,
    };

    const [result] = await this.databaseService
      .knex('pages')
      .insert(pageData)
      .returning('*');

    if (!result) {
      throw new Error('Failed to create page');
    }

    return result as Page;
  }

  async findBySlug(slug: string): Promise<Page | null> {
    const query = this.table.where('slug', slug).first();
    return query;
  }

  async findWithFilters(
    queryDto: PageQueryDto,
  ): Promise<{ data: Page[]; total: number; page: number; limit: number }> {
    const limit = typeof queryDto.limit === 'number' ? queryDto.limit : null;
    const page =
      typeof queryDto.page === 'number'
        ? queryDto.page
        : typeof queryDto.limit === 'number'
          ? 1
          : null;

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

    if (queryDto.author_id) {
      query = query.where('author_id', queryDto.author_id);
    }

    const sortBy = queryDto.sortBy || 'created_at';
    const sortOrder = queryDto.sortOrder === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(sortBy, sortOrder);

    if (limit !== null && page !== null) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const data = await query.select();

    let countQuery = this.table;

    if (queryDto.search) {
      countQuery = countQuery.where((builder: Knex.QueryBuilder) => {
        builder
          .where('title', 'ilike', `%${queryDto.search}%`)
          .orWhere('content', 'ilike', `%${queryDto.search}%`)
          .orWhere('slug', 'ilike', `%${queryDto.search}%`);
      });
    }
    if (queryDto.status) {
      countQuery = countQuery.where('status', queryDto.status);
    }
    if (queryDto.author_id) {
      countQuery = countQuery.where('author_id', queryDto.author_id);
    }

    const countResult = await countQuery
      .count<{ count: string }>('* as count')
      .first();
    const total = countResult ? parseInt(countResult.count, 10) : 0;

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
