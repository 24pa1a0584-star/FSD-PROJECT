const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('VISHNUFIT Authentication & Access Control Tests', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Health Check API returns 200 and healthy database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.application).toContain('VISHNUFIT');
  });

  it('Fails login with invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'superadmin@vishnu.edu.in',
      password: 'WrongPassword!999',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Succeeds login for Super Admin and returns JWT token & HttpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'superadmin@vishnu.edu.in',
      password: 'SuperAdmin@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.body.token).toBeDefined();

    // Verify Set-Cookie header contains jwt
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
  });

  it('Retrieves authenticated user profile with /api/auth/me', async () => {
    // First login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'superadmin@vishnu.edu.in',
      password: 'SuperAdmin@123',
    });
    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('superadmin@vishnu.edu.in');
    expect(meRes.body.user.role).toBe('SUPER_ADMIN');
  });
});
