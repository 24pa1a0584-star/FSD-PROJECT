const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Gym = require('../src/models/Gym');

describe('VISHNUFIT Multi-Facility Gym Isolation Security Tests', () => {
  let boysGym;
  let girlsGym;
  let boysManagerToken;
  let superAdminToken;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    boysGym = await Gym.findOne({ code: 'BOYS_GYM' });
    girlsGym = await Gym.findOne({ code: 'GIRLS_GYM' });

    // Login as Boys Gym Manager
    const bRes = await request(app).post('/api/auth/login').send({
      email: 'manager.boys@vishnu.edu.in',
      password: 'ManagerBoys@123',
    });
    boysManagerToken = bRes.body.token;

    // Login as Super Admin
    const sRes = await request(app).post('/api/auth/login').send({
      email: 'superadmin@vishnu.edu.in',
      password: 'SuperAdmin@123',
    });
    superAdminToken = sRes.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Boys Gym Manager accessing Boys Gym dashboard succeeds', async () => {
    const res = await request(app)
      .get(`/api/gyms/${boysGym._id}/dashboard`)
      .set('Authorization', `Bearer ${boysManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.gym.code).toBe('BOYS_GYM');
    expect(res.body.stats).toBeDefined();
  });

  it('Boys Gym Manager accessing Girls Gym dashboard is strictly rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/gyms/${girlsGym._id}/dashboard`)
      .set('Authorization', `Bearer ${boysManagerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  it('Super Admin can access both Boys Gym and Girls Gym dashboards without restriction', async () => {
    const resBoys = await request(app)
      .get(`/api/gyms/${boysGym._id}/dashboard`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resBoys.status).toBe(200);

    const resGirls = await request(app)
      .get(`/api/gyms/${girlsGym._id}/dashboard`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resGirls.status).toBe(200);
  });

  it('Cross-facility check-in rejection: Boys Gym staff cannot check in a Girls Gym student', async () => {
    // 24PA1A0584 is registered to Girls Gym
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        rollNumber: '24PA1A0584',
        gymId: boysGym._id.toString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Cross-facility check-in is not permitted');
  });
});
