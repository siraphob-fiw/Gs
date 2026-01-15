import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoiceStatusType } from '../dto/invoice-status.enum';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@/database';

@Injectable()
export class InvoiceService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createInvoiceDto: CreateInvoiceDto) {
    const invoice = await this.databaseService
      .knex('invoices')
      .insert({
        ...createInvoiceDto,
        status: InvoiceStatusType.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return invoice;
  }

  findAll() {
    return this.databaseService.knex('invoices').select('*');
  }

  async findOne(id: number) {
    const invoice = await this.databaseService
      .knex('invoices')
      .select('*')
      .where({ id });
    return invoice;
  }

  async update(updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.databaseService
      .knex('invoices')
      .update({
        ...updateInvoiceDto,
        updated_at: new Date(),
      })
      .where({ id: updateInvoiceDto.id });
    return invoice;
  }

  async cancel(id: number) {
    const invoice = await this.databaseService
      .knex('invoices')
      .update({
        status: InvoiceStatusType.CANCELLED,
        updated_at: new Date(),
      })
      .where({ id });
    return invoice;
  }

  async delete(id: number) {
    const invoice = await this.databaseService
      .knex('invoices')
      .delete()
      .where({ id });
    return invoice;
  }

  @Cron('0 0 */1 * *')
  async updateInvoiceTimeout() {
    const invoices = await this.databaseService
      .knex('invoices')
      .where({
        status: InvoiceStatusType.PENDING,
      })
      .where('created_at', '<=', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
      .select('*');

    await Promise.all(
      invoices.map(async (invoice) => {
        await this.databaseService
          .knex('invoices')
          .update({
            status: InvoiceStatusType.TIMEOUT,
            updated_at: new Date(),
          })
          .where({ id: invoice.id });
      }),
    );
  }
}
