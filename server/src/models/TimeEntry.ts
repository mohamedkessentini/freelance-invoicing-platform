import { Schema, model, Types, Document } from 'mongoose';

export interface TimeEntryDocument extends Document {
  user: Types.ObjectId;
  project: Types.ObjectId;
  date: Date;
  hours: number;
  description: string;
  billable: boolean;
  invoiced: boolean;
  invoice?: Types.ObjectId;
  createdAt: Date;
}

const timeEntrySchema = new Schema<TimeEntryDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  date: { type: Date, required: true },
  hours: { type: Number, required: true, min: 0.01, max: 24 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  billable: { type: Boolean, default: true },
  invoiced: { type: Boolean, default: false, index: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  createdAt: { type: Date, default: () => new Date() },
});

timeEntrySchema.index({ project: 1, date: -1 });

export const TimeEntry = model<TimeEntryDocument>('TimeEntry', timeEntrySchema);
