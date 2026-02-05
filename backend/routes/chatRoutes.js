const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat'); // Assume a Chat model
const authMiddleware = require('../middleware/auth');

// Send message to AI and save
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    // Simulate AI response (replace with actual AI API call, e.g., xAI API)
    const reply = `AI response to: ${message}`; // Placeholder

    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    const aiMsg = { role: 'ai', content: reply, timestamp: new Date() };

    // Find the most recent chat document for the user
    // We sort by updatedAt desc to get the latest active bucket.
    // We add _id desc as a fallback for legacy documents (which lack updatedAt) or tie-breaking.
    const latestChat = await Chat.findOne({ userId: req.user.id })
      .sort({ updatedAt: -1, _id: -1 });

    if (latestChat && latestChat.messages.length < 50) {
      latestChat.messages.push(userMsg, aiMsg);
      await latestChat.save();
    } else {
      const chatMessage = new Chat({
        userId: req.user.id,
        messages: [userMsg, aiMsg]
      });
      await chatMessage.save();
    }

    res.json({ reply });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Fetch recent history.
    // We increase limit to 20 to support legacy data (where 1 doc = 1 interaction).
    // Sort by updatedAt desc (new buckets) and _id desc (legacy fallbacks).
    const history = await Chat.find({ userId: req.user.id })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(20);

    // Reconstruct chronological order: Oldest Bucket -> Newest Bucket
    const sortedHistory = history.reverse();
    const messages = sortedHistory.flatMap(chat => chat.messages);

    // Return last 20 messages to match previous behavior (approx 10 interactions)
    // Original code returned last 10 documents * 2 messages = 20 messages.
    // We slice the last 20 from the consolidated stream.
    res.json({ messages: messages.slice(-20) });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;