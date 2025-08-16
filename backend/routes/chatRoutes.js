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

    const chatMessage = new Chat({
      userId: req.user.id,
      messages: [
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'ai', content: reply, timestamp: new Date() }
      ]
    });
    await chatMessage.save();

    res.json({ reply });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await Chat.find({ userId: req.user.id }).sort({ 'messages.timestamp': -1 }).limit(10);
    const messages = history.flatMap(chat => chat.messages);
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;