import { BaseEntity } from '../../database/base.repository';
import { InvoiceStatusType } from '../dto/invoice-status.enum';

export interface Invoice extends BaseEntity {
  id: string;
  tenant_id?: string;
  subscription_id: string;
  invoice_number: string;
  status: InvoiceStatusType;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issue_date: Date | null;
  due_date: Date | null;
  paid_date: Date | null;
  notes: string | null;
  line_items: any[];
}

