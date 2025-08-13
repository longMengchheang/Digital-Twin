const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const authMiddleware = require('../middleware/auth');

// Get today's questions (frontend rotates, backend just confirms not completed)
router.get('/questions', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkIn = await CheckIn.findOne({
            userId: req.user.id, 
            date: { $gte: today}
        });

        if (checkIn) {
            return res.status(400).json({ msg: 'Daily check-in already completed'});

        }
    // Return questions (hardcoded for now; later, randomize or use AI)
    const questions = [
        'How are you feeling today?',
        'How productive did you feel today?',
        'How energized are you right now?',
        'How confident are you about your goals today?',
        'How connected do you feel to others today?'
    ];
    res.json({ questions });

 }catch (err) {
    console.error(err);   
    res.status(500).json({ msg: 'Server error'});
 }
});

// Submit ratings
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { ratings } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingCheckIn = await CheckIn.findOne({ 
            userId: req.user.id,
            date: { $gte: today }
        });

        if (existingCheckIn) {
            return res.status(400).json({ msg:'Daily check-in already completed'});            
        }
        const overallScore = ratings.reduce((a, b) => a + b, 0); // Sum (max 25); or average: overallScore / 5
        const checkIn = new CheckIn({
            userId: req.user.id,
            ratings,
            overallScore
        });
        await checkIn.save()

        // Optional: Update Profile points (e.g., +10 for completion)
        res.json({ msg: 'Check-in submitted', overallScore });


    } catch (err) {
        res.status(500).json({ msg: 'Server error'})
    }
});

// Get today's results
router.get('/results', authMiddleware, async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const checkIn = await CheckIn.findOne({ userId: req.user.id, date: { $gte: today } });
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
    const history = await CheckIn.find({ userId: req.user.id }).sort({ date: -1 }).limit(30);  // Last 30 days
    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;