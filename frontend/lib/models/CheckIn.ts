import mongoose, { Document, Model } from 'mongoose';

export interface ICheckIn extends Document {
  userId: mongoose.Types.ObjectId;
  ratings: number[];
  overallScore: number;
  date: Date;
}

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: {
    type: [Number],
    required: true,
    validate: [arrayLimit, 'Must provide exactly 5 ratings']
  },
  overallScore: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

function arrayLimit(val: any[]) {
  return val.length === 5;
}

checkInSchema.index({ userId: 1, date: 1 }, { unique: true });

const CheckIn: Model<ICheckIn> = mongoose.models.CheckIn || mongoose.model<ICheckIn>('CheckIn', checkInSchema);
export default CheckIn;