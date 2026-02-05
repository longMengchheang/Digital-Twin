const mongoose = require('mongoose');

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

function arrayLimit(val) {
  return val.length === 5;
}

checkInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.CheckIn || mongoose.model('CheckIn', checkInSchema);
