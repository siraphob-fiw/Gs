import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty()
  tenant_id: number;

  @ApiProperty()
  subscription_id: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  tax_amount: number;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  currency: string;
}
