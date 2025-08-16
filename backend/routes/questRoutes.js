const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest'); // Updated import
const authMiddleware = require('../middleware/auth');

// Get all quests for the user
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const userQuests = await Quest.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(userQuests);
  } catch (err) {
    console.error('Error fetching quests:', err);
    res.status(500).json({ msg: 'Failed to fetch quests due to server error' });
  }
});

// Create a new quest
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { goal, duration } = req.body;
    if (!goal || !duration) {
      return res.status(400).json({ msg: 'Goal and duration are required' });
    }

    const newQuest = new Quest({
      userId: req.user.id,
      goal,
      duration: duration.toLowerCase(),
      ratings: [0], // Initial progress
      date: new Date()
    });
    await newQuest.save();

    res.json({ msg: 'Quest created', quest: newQuest });
  } catch (err) {
    console.error('Error creating quest:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update quest progress
router.put('/progress/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ msg: 'Progress must be a number between 0 and 100' });
    }

    const quest = await Quest.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { 'ratings.0': progress, completed: progress >= 100 } },
      { new: true, runValidators: true }
    );

    if (!quest) {
      return res.status(404).json({ msg: 'Quest not found' });
    }

    res.json({ msg: 'Progress updated', quest });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Toggle quest completion
router.put('/complete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const quest = await Quest.findOne({ _id: id, userId: req.user.id });
    if (!quest) {
      return res.status(404).json({ msg: 'Quest not found' });
    }

    const newProgress = quest.completed ? 0 : 100;
    const updatedQuest = await Quest.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { 'ratings.0': newProgress, completed: newProgress >= 100 } },
      { new: true, runValidators: true }
    );

    res.json({ msg: 'Completion toggled', quest: updatedQuest });
  } catch (err) {
    console.error('Error toggling completion:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;