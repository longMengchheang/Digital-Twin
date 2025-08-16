const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true },
  duration: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  ratings: {
    type: [Number],
    required: true,
    validate: [progressLimit, 'Progress must be a single value between 0 and 100']
  },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

function progressLimit(val) {
  return val.length === 1 && val[0] >= 0 && val[0] <= 100;
}

questSchema.index({ userId: 1, date: 1 }); // Optional, for querying by user and date

module.exports = mongoose.model('Quest', questSchema);