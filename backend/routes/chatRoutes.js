const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/auth');
const OpenAI = require('openai');

// Configure OpenAI client
const apiKey = process.env.XAI_API_KEY;
const baseURL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const model = process.env.XAI_MODEL || 'grok-beta';

let openai;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
}

// Send message to AI and save
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    let reply;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: message },
          ],
        });
        reply = completion.choices[0].message.content;
      } catch (apiError) {
        console.error('AI API Error:', apiError);
        return res.status(502).json({ msg: 'AI Service unavailable', error: apiError.message });
      }
    } else {
      // Simulate AI response (fallback if no API key)
      reply = `AI response to: ${message}`;
    }

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
    //We increase limit to 20 to support legacy data (where 1 doc = 1 interaction).
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
