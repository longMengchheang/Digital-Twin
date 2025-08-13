const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    ratings: {
        type: [Number],
        require: true,
        validate: [arrayLimit, 'Must provide exactly 5 ratings']
    },
    overallScore: {
        type: Number,
        require: true
    }
});

function arrayLimit(val) {
    return val.length === 5;
}

checkInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema)