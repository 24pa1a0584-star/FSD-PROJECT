const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Gym = require('../src/models/Gym');
const Attendance = require('../src/models/Attendance');

describe('VISHNUFIT Smart Attendance & Atomic Logic Tests', () => {
  let boysGymId;
  let staffToken;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    const gym = await Gym.findOne({ code: 'BOYS_GYM' });
    boysGymId = gym._id.toString();

    // Login as Boys Gym Staff
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'staff.boys@vishnu.edu.in',
      password: 'Staff@123',
    });
    staffToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Rejects check-in when student already has an ACTIVE attendance session', async () => {
    // 22PA1A0512 was seeded with an ACTIVE check-in
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        rollNumber: '22PA1A0512',
        gymId: boysGymId,
      });

    // Must return 409 Conflict due to duplicate active session prevention
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already checked in');
  });

  it('Successfully checks out an active session and computes duration in minutes', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        rollNumber: '22PA1A0512',
        gymId: boysGymId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.status).toBe('COMPLETED');
    expect(res.body.attendance.durationMinutes).toBeGreaterThanOrEqual(1);
  });

  it('Can now check in the student again after previous session is COMPLETED', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        rollNumber: '22PA1A0512',
        gymId: boysGymId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.status).toBe('ACTIVE');
  });
});
