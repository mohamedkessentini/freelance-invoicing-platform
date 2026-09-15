import { Schema, model, Types, Document } from 'mongoose';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface InvoiceLineItem {
  project: Types.ObjectId;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface InvoiceDocument extends Document {
  user: Types.ObjectId;
  client: Types.ObjectId;
  invoiceNumber: number;
  status: InvoiceStatus;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  paidAt?: Date;
  createdAt: Date;
}

const lineItemSchema = new Schema<InvoiceLineItem>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    description: { type: String, required: true },
    hours: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  invoiceNumber: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'], default: 'DRAFT' },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  lineItems: { type: [lineItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paidAt: { type: Date },
  createdAt: { type: Date, default: () => new Date() },
});

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = model<InvoiceDocument>('Invoice', invoiceSchema);
