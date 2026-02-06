import mongoose, { Document, Model } from 'mongoose';

export interface IQuest extends Document {
  userId: mongoose.Types.ObjectId;
  goal: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  ratings: number[];
  progress: number;
  completed: boolean;
  date: Date;
  completedDate?: Date;
}

function progressLimit(values: number[]): boolean {
  return Array.isArray(values) && values.length === 1 && values[0] >= 0 && values[0] <= 100;
}

const questSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true, trim: true, maxlength: 100 },
  duration: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  ratings: {
    type: [Number],
    required: true,
    validate: [progressLimit, 'Progress must be a single value between 0 and 100'],
  },
  completed: { type: Boolean, default: false },
  completedDate: { type: Date, default: null },
  date: { type: Date, default: Date.now },
});

questSchema.index({ userId: 1, date: -1 });

const Quest: Model<IQuest> = mongoose.models.Quest || mongoose.model<IQuest>('Quest', questSchema);

export default Quest;
