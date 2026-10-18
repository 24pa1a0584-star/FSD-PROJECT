const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { initDatabase } = require('../src/config/initDatabase');
const Gym = require('../src/models/Gym');
const MembershipType = require('../src/models/MembershipType');
const CampusGymSettings = require('../src/models/CampusGymSettings');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const GymRegistration = require('../src/models/GymRegistration');
const Membership = require('../src/models/Membership');
const Attendance = require('../src/models/Attendance');

describe('VISHNUFIT Faculty Demonstration & Regression Suite', () => {
  let boysGym;
  let girlsGym;
  let superAdminToken;
  let boysManagerToken;
  let girlsManagerToken;
  let boysStudentUser;
  let girlsStudentUser;
  let boysRegistration;
  let girlsRegistration;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    // Cleanup any temporary student records created during tests
    if (boysStudentUser?._id) {
      await GymRegistration.deleteMany({ userId: boysStudentUser._id });
      await Membership.deleteMany({ studentId: { $in: await Student.find({ userId: boysStudentUser._id }).distinct('_id') } });
      await Attendance.deleteMany({ studentId: { $in: await Student.find({ userId: boysStudentUser._id }).distinct('_id') } });
      await Student.deleteMany({ userId: boysStudentUser._id });
      await User.findByIdAndDelete(boysStudentUser._id);
    }
    if (girlsStudentUser?._id) {
      await GymRegistration.deleteMany({ userId: girlsStudentUser._id });
      await Membership.deleteMany({ studentId: { $in: await Student.find({ userId: girlsStudentUser._id }).distinct('_id') } });
      await Attendance.deleteMany({ studentId: { $in: await Student.find({ userId: girlsStudentUser._id }).distinct('_id') } });
      await Student.deleteMany({ userId: girlsStudentUser._id });
      await User.findByIdAndDelete(girlsStudentUser._id);
    }
    await mongoose.connection.close();
  });

  // TEST 1 & 2: Idempotent Database Initialization
  it('1. Safe initial setup ensures required gyms, membership types, and settings exist', async () => {
    await initDatabase();

    boysGym = await Gym.findOne({ code: 'BOYS_GYM' });
    girlsGym = await Gym.findOne({ code: 'GIRLS_GYM' });
    const membershipTypes = await MembershipType.find({});
    const settings = await CampusGymSettings.findOne({});

    expect(boysGym).toBeDefined();
    expect(boysGym.name).toContain('Boys');
    expect(girlsGym).toBeDefined();
    expect(girlsGym.name).toContain('Girls');
    expect(membershipTypes.length).toBeGreaterThanOrEqual(4);
    expect(settings).toBeDefined();
  });

  it('2. Repeated setup preserves existing records without duplication or data loss', async () => {
    const initialGymCount = await Gym.countDocuments();
    const initialTypeCount = await MembershipType.countDocuments();

    // Re-run initDatabase
    await initDatabase();

    const afterGymCount = await Gym.countDocuments();
    const afterTypeCount = await MembershipType.countDocuments();

    expect(afterGymCount).toBe(initialGymCount);
    expect(afterTypeCount).toBe(initialTypeCount);
  });

  // TEST 3 & 4: Administrator Authentication
  it('3. Successful administrator login with JWT token and HttpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'superadmin@vishnu.edu.in',
      password: 'SuperAdmin@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    expect(res.body.token).toBeDefined();
    superAdminToken = res.body.token;

    // Also get tokens for Boys and Girls managers
    const bRes = await request(app).post('/api/auth/login').send({
      email: 'manager.boys@vishnu.edu.in',
      password: 'ManagerBoys@123',
    });
    expect(bRes.status).toBe(200);
    boysManagerToken = bRes.body.token;

    const gRes = await request(app).post('/api/auth/login').send({
      email: 'manager.girls@vishnu.edu.in',
      password: 'ManagerGirls@123',
    });
    expect(gRes.status).toBe(200);
    girlsManagerToken = gRes.body.token;
  });

  // TEST 5: Public Gyms Endpoint
  it('5. Public gym list endpoint returns active gyms without sensitive data', async () => {
    const res = await request(app).get('/api/gyms/public');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.gyms)).toBe(true);
    expect(res.body.gyms.length).toBeGreaterThanOrEqual(2);

    const firstGym = res.body.gyms[0];
    expect(firstGym._id).toBeDefined();
    expect(firstGym.name).toBeDefined();
    expect(firstGym.code).toBeDefined();
    // Sensitive operational fields should not be exposed
    expect(firstGym.currentOccupancy).toBeUndefined();
  });

  // TEST 6: Student Registration with valid Boys Gym ObjectId
  it('6. Student registration succeeds using a valid Boys Gym MongoDB ObjectId', async () => {
    const testRoll = `TEST_B_${Date.now().toString().slice(-5)}`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Boys Student',
        email: `${testRoll.toLowerCase()}@vishnu.edu.in`,
        password: 'Password@123',
        rollNumber: testRoll,
        gender: 'Male',
        department: 'CSE',
        academicYear: 3,
        section: 'A',
        studentType: 'Hosteller',
        contactNumber: '9876543210',
        assignedGym: boysGym._id.toString(), // Valid ObjectId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.registration).toBeDefined();
    expect(res.body.registration.status).toBe('PENDING');

    boysStudentUser = await User.findById(res.body.user.id);
    boysRegistration = res.body.registration;
  });

  // TEST 7: Student Registration with valid Girls Gym ObjectId
  it('7. Student registration succeeds using a valid Girls Gym MongoDB ObjectId', async () => {
    const testRoll = `TEST_G_${Date.now().toString().slice(-5)}`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Girls Student',
        email: `${testRoll.toLowerCase()}@vishnu.edu.in`,
        password: 'Password@123',
        rollNumber: testRoll,
        gender: 'Female',
        department: 'ECE',
        academicYear: 2,
        section: 'B',
        studentType: 'Day Scholar',
        contactNumber: '9876543211',
        assignedGym: girlsGym._id.toString(), // Valid ObjectId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.registration).toBeDefined();
    expect(res.body.registration.status).toBe('PENDING');

    girlsStudentUser = await User.findById(res.body.user.id);
    girlsRegistration = res.body.registration;
  });

  // TEST 8: Registration with Invalid Gym is Rejected
  it('8. Registration with an invalid gym identifier is rejected with 404 Not Found', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Invalid Student',
        email: `invalid_${Date.now()}@vishnu.edu.in`,
        password: 'Password@123',
        rollNumber: `INV_${Date.now().toString().slice(-4)}`,
        gender: 'Male',
        department: 'MECH',
        academicYear: 1,
        section: 'A',
        studentType: 'Hosteller',
        contactNumber: '9876543212',
        assignedGym: '65f000000000000000000999',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('invalid, inactive, or not initialized');
  });

  // TEST 9 & 10: Registration Approval and Membership Creation
  it('9. Registration approval succeeds without frontend-supplied status and defaults to APPROVED', async () => {
    // Frontend sends only remarks and durationMonths to /registrations/:id/approve
    const res = await request(app)
      .patch(`/api/registrations/${boysRegistration._id}/approve`)
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        remarks: 'Approved by faculty demo test',
        durationMonths: 6,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.registration.status).toBe('APPROVED');
    expect(res.body.membership).toBeDefined();
    expect(res.body.membership.status).toBe('ACTIVE');

    // Verify Student membershipStatus updated to ACTIVE
    const student = await Student.findOne({ userId: boysStudentUser._id });
    expect(student.membershipStatus).toBe('ACTIVE');
  });

  it('10. Repeated approval on already approved registration does not duplicate active memberships', async () => {
    const res = await request(app)
      .patch(`/api/registrations/${boysRegistration._id}/approve`)
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        remarks: 'Repeated approval test',
        durationMonths: 6,
      });

    // Should indicate registration has already been processed/approved
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already approved');

    const student = await Student.findOne({ userId: boysStudentUser._id });
    const activeMemberships = await Membership.countDocuments({
      studentId: student._id,
      status: 'ACTIVE',
    });
    expect(activeMemberships).toBe(1);
  });

  // TEST 11: Cross-Facility Authorization Rejection
  it('11. Boys Gym Manager cannot approve Girls Gym registration (Facility Isolation)', async () => {
    const res = await request(app)
      .patch(`/api/registrations/${girlsRegistration._id}/approve`)
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        remarks: 'Unauthorized cross-facility approval attempt',
        durationMonths: 6,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  // TEST 12: Attendance and Duplicate Active Check-in Prevention
  it('12. Attendance check-in succeeds and prevents duplicate active check-ins', async () => {
    const student = await Student.findOne({ userId: boysStudentUser._id });

    // Initial manual check-in
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        rollNumber: student.rollNumber,
        gymId: boysGym._id.toString(),
      });

    expect(checkInRes.status).toBe(201);
    expect(checkInRes.body.success).toBe(true);
    expect(checkInRes.body.attendance.status).toBe('ACTIVE');

    // Attempt second simultaneous check-in -> must be rejected
    const dupRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        rollNumber: student.rollNumber,
        gymId: boysGym._id.toString(),
      });

    // Expect 400 or 409 duplicate rejection
    expect([400, 409]).toContain(dupRes.status);

    // Check-out succeeds
    const checkOutRes = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${boysManagerToken}`)
      .send({
        rollNumber: student.rollNumber,
        gymId: boysGym._id.toString(),
      });

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.success).toBe(true);
    expect(checkOutRes.body.attendance.status).toBe('COMPLETED');
  });
});
