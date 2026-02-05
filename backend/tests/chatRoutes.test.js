const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Define mock factory outside
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  });
});

process.env.JWT_SECRET = 'testsecret';

describe('Chat Routes', () => {
  let mongoServer;
  let userId;
  let token;
  let mongoose;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    if (mongoose) await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /send without API key uses simulation', async () => {
    jest.resetModules();
    delete process.env.XAI_API_KEY;

    // Import modules afresh to trigger logic
    mongoose = require('mongoose');
    await mongoose.connect(mongoServer.getUri());

    const Chat = require('../models/Chat');
    const chatRoutes = require('../routes/chatRoutes');
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);

    // Setup data
    userId = new mongoose.Types.ObjectId();
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET);
    // Ensure clean state
    await Chat.deleteMany({});

    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/AI response to: Hello/);
    expect(mockCreate).not.toHaveBeenCalled();

    const savedChat = await Chat.findOne({ userId });
    expect(savedChat).toBeTruthy();
    expect(savedChat.messages).toHaveLength(2);

    await mongoose.disconnect();
  });

  test('POST /send with API key calls OpenAI', async () => {
    jest.resetModules();
    process.env.XAI_API_KEY = 'testkey';

    mongoose = require('mongoose');
    await mongoose.connect(mongoServer.getUri());

    const Chat = require('../models/Chat');
    const chatRoutes = require('../routes/chatRoutes');
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);

    userId = new mongoose.Types.ObjectId();
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET);
    await Chat.deleteMany({});

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Real AI Response' } }]
    });

    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello AI' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Real AI Response');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        { role: 'user', content: 'Hello AI' }
      ])
    }));

    const savedChat = await Chat.findOne({ userId });
    expect(savedChat.messages[1].content).toBe('Real AI Response');

    await mongoose.disconnect();
  });

  test('POST /send handles API error', async () => {
    jest.resetModules();
    process.env.XAI_API_KEY = 'testkey';

    mongoose = require('mongoose');
    await mongoose.connect(mongoServer.getUri());

    const Chat = require('../models/Chat');
    const chatRoutes = require('../routes/chatRoutes');
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);

    userId = new mongoose.Types.ObjectId();
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET);
    await Chat.deleteMany({});

    mockCreate.mockRejectedValue(new Error('API Down'));

    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello AI' });

    expect(res.status).toBe(502);
    expect(res.body.msg).toBe('AI Service unavailable');

    await mongoose.disconnect();
  });
});
