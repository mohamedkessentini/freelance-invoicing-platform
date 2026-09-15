import { Schema, model, Types, Document } from 'mongoose';

export interface ClientDocument extends Document {
  user: Types.ObjectId;
  name: string;
  company?: string;
  email?: string;
  createdAt: Date;
}

const clientSchema = new Schema<ClientDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 150 },
  email: { type: String, trim: true, lowercase: true },
  createdAt: { type: Date, default: () => new Date() },
});

clientSchema.index({ user: 1, name: 'text', company: 'text' });

export const Client = model<ClientDocument>('Client', clientSchema);
