import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';

// Controllers
import { PageController } from './controllers/page.controller';
import { PostController } from './controllers/post.controller';

// Services
import { PageService } from './services/page.service';
import { PostService } from './services/post.service';

// Repositories
import { PageRepository } from './repositories/page.repository';
import { PostRepository } from './repositories/post.repository';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [PageController, PostController],
  providers: [
    // Services
    PageService,
    PostService,
    // Repositories
    PageRepository,
    PostRepository,
  ],
  exports: [PageService, PostService, PageRepository, PostRepository],
})
export class CmsModule {}
