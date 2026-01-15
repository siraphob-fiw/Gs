import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PageRepository } from '../repositories/page.repository';
import {
  CreatePageDto,
  UpdatePageDto,
  PageQueryDto,
  PageResponseDto,
} from '../dto';
import { Page, PageStatus } from '../entities/page.entity';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class PageService {
  constructor(private readonly pageRepository: PageRepository) {}

  async create(
    createPageDto: CreatePageDto,
    user: RequestContext,
  ): Promise<PageResponseDto> {
    const existingPage = await this.pageRepository.findBySlug(
      createPageDto.slug,
    );
    if (existingPage) {
      throw new ConflictException('Page with this slug already exists');
    }

    if (
      createPageDto.status === PageStatus.PUBLISHED &&
      !createPageDto.published_at
    ) {
      createPageDto.published_at = new Date();
    }

    const page = await this.pageRepository.createPage(
      createPageDto,
      user.userId,
    );

    return this.mapToResponseDto(page);
  }

  async findAll(queryDto: PageQueryDto): Promise<{
    data: PageResponseDto[];
    total: number;
    page: number | null;
    limit: number | null;
    totalPages: number;
  }> {
    const result = await this.pageRepository.findWithFilters(queryDto);

    const limit = queryDto.limit ? parseInt(queryDto.limit.toString(), 10) : 10;

    return {
      data: await Promise.all(result.data.map((p) => this.mapToResponseDto(p))),
      total: result.total,
      page: queryDto.page || null,
      limit: queryDto.limit || null,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async findOne(id: string): Promise<PageResponseDto> {
    const page = await this.pageRepository.findById(id);
    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }
    return this.mapToResponseDto(page);
  }

  async findBySlug(slug: string): Promise<PageResponseDto> {
    const page = await this.pageRepository.findBySlug(slug);
    if (!page) {
      throw new NotFoundException(`Page with slug ${slug} not found`);
    }
    return this.mapToResponseDto(page);
  }

  async update(
    updatePageDto: UpdatePageDto,
    user: RequestContext,
  ): Promise<PageResponseDto> {
    const existingPage = await this.pageRepository.findBySlug(
      updatePageDto.slug,
    );
    if (!existingPage) {
      throw new NotFoundException(
        `Page with slug ${updatePageDto.slug} not found`,
      );
    }

    if (
      existingPage.status !== PageStatus.PUBLISHED &&
      updatePageDto.status === PageStatus.PUBLISHED
    ) {
      updatePageDto.published_at = new Date();
    }

    const payload = {
      ...updatePageDto,
      author_id: user.userId,
    };

    const updatedPage = await this.pageRepository.update(
      existingPage.id,
      payload,
    );
    if (!updatedPage) {
      throw new NotFoundException(
        `Page with slug ${updatePageDto.slug} not found`,
      );
    }

    return this.mapToResponseDto(updatedPage);
  }

  async delete(slug: string): Promise<void> {
    const page = await this.pageRepository.findBySlug(slug);
    if (!page) {
      throw new NotFoundException(`Page with slug ${slug} not found`);
    }

    const deleted = await this.pageRepository.delete(page.id);
    if (!deleted) {
      throw new BadRequestException(`Failed to delete page with slug ${slug}`);
    }
  }

  private mapToResponseDto(page: Page): PageResponseDto {
    return {
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt,
      status: page.status,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      meta_keywords: page.meta_keywords,
      published_at: page.published_at,
      created_at: page.created_at,
      updated_at: page.updated_at,
      options: page.options || null,
    };
  }
}
