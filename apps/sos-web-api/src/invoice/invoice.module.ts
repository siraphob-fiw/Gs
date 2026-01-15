import { Module } from '@nestjs/common';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [SharedModule, DatabaseModule, TenantModule],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
  ],
  exports: [
    InvoiceService,
  ],
})
export class InvoiceModule { }
