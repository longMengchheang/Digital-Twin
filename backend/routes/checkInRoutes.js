const express = require('express');
const router = express.Router();
const Activity = require('../models/CheckIn'); 
const authMiddleware = require('../middleware/auth');

// Get today's questions
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingActivity = await Activity.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });

    if (existingActivity) {
      return res.status(400).json({ msg: 'Daily check-in already completed' });
    }

    const questions = [
      'How are you feeling today?',
      'How productive did you feel today?',
      'How energized are you right now?',
      'How confident are you about your goals today?',
      'How connected do you feel to others today?'
    ];
    res.json({ questions });
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ msg: 'Failed to fetch questions due to server error' });
  }
});

// Submit ratings
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { ratings } = req.body;
    if (!Array.isArray(ratings) || ratings.length !== 5) {
      return res.status(400).json({ msg: 'Must provide exactly 5 ratings' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingActivity = await Activity.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });

    if (existingActivity) {
      return res.status(400).json({ msg: 'Daily check-in already completed' });
    }

    const overallScore = ratings.reduce((a, b) => a + b, 0);
    const activity = new Activity({
      userId: req.user.id,
      type: 'checkin',
      ratings,
      overallScore
    });
    await activity.save();

    res.json({ msg: 'Check-in submitted', overallScore });
  } catch (err) {
    console.error('Error submitting check-in:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get today's results
router.get('/results', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = await Activity.findOne({ userId: req.user.id, date: { $gte: today } });
    if (!checkIn) {
      return res.status(404).json({ msg: 'No check-in today' });
    }
    res.json({ ratings: checkIn.ratings, overallScore: checkIn.overallScore });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await Activity.find({ userId: req.user.id }).sort({ date: -1 }).limit(30);
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});


module.exports = router;