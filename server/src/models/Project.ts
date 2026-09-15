import { Schema, model, Types, Document } from 'mongoose';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProjectDocument extends Document {
  user: Types.ObjectId;
  client: Types.ObjectId;
  name: string;
  hourlyRate: number;
  currency: string;
  status: ProjectStatus;
  createdAt: Date;
}

const projectSchema = new Schema<ProjectDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  hourlyRate: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: () => new Date() },
});

export const Project = model<ProjectDocument>('Project', projectSchema);
