import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiProperty()
  id: number;

  @ApiProperty()
  status: string;
}
