import mongoose, { Document, Model } from 'mongoose';

export interface ICheckIn extends Document {
  userId: mongoose.Types.ObjectId;
  ratings: number[];
  overallScore: number;
  percentage: number;
  dayKey: string;
  date: Date;
}

function validateRatings(values: number[]): boolean {
  return Array.isArray(values) && values.length === 5 && values.every((value) => value >= 1 && value <= 5);
}

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: {
    type: [Number],
    required: true,
    validate: [validateRatings, 'Must provide exactly 5 ratings from 1 to 5'],
  },
  overallScore: { type: Number, required: true, min: 5, max: 25 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  dayKey: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

checkInSchema.index({ userId: 1, dayKey: 1 }, { unique: true });
checkInSchema.index({ userId: 1, date: -1 });

const CheckIn: Model<ICheckIn> = mongoose.models.CheckIn || mongoose.model<ICheckIn>('CheckIn', checkInSchema);

export default CheckIn;
