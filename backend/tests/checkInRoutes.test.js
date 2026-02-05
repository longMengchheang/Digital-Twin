const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: global.testUserId };
  next();
});

const CheckIn = require('../models/CheckIn');
const checkInRoutes = require('../routes/checkInRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/api/checkin', checkInRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('CheckIn API & Performance', () => {
  let userId;

  beforeEach(async () => {
    await CheckIn.deleteMany({});
    userId = new mongoose.Types.ObjectId();
    global.testUserId = userId.toString();

    // Create a CheckIn for today
    const checkIn = new CheckIn({
      userId: userId,
      ratings: [1, 2, 3, 4, 5],
      overallScore: 15,
      date: new Date()
    });
    await checkIn.save();
  });

  test('GET /questions should return 400 if check-in exists', async () => {
    const res = await request(app).get('/api/checkin/questions');
    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('Daily check-in already completed');
  });

  test('GET /results should return results if check-in exists', async () => {
    const res = await request(app).get('/api/checkin/results');
    expect(res.status).toBe(200);
    expect(res.body.overallScore).toBe(15);
  });

  test('GET /history should return history', async () => {
    const res = await request(app).get('/api/checkin/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].overallScore).toBe(15);
  });

  test('POST /submit should return 400 if check-in exists', async () => {
    const res = await request(app).post('/api/checkin/submit').send({ ratings: [5,5,5,5,5] });
    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('Daily check-in already completed');
  });

  test('POST /submit should succeed if no check-in exists', async () => {
    await CheckIn.deleteMany({}); // Clear existing
    const res = await request(app).post('/api/checkin/submit').send({ ratings: [5,5,5,5,5] });
    expect(res.status).toBe(200);
    expect(res.body.msg).toBe('Check-in submitted');
  });
});
