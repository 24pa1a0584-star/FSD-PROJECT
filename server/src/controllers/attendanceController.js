const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Membership = require('../models/Membership');
const Gym = require('../models/Gym');
const AuditLog = require('../models/AuditLog');
const { generateQrToken, verifyQrToken } = require('../utils/tokenUtils');
const {
  manualCheckInSchema,
  manualCheckOutSchema,
  qrScanSchema,
} = require('../validators/attendanceValidator');

/**
 * Manual Check-In by Student Roll Number
 */
const manualCheckIn = async (req, res, next) => {
  try {
    const { rollNumber, gymId, notes } = manualCheckInSchema.parse(req.body);

    // 1. Verify Gym Exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym facility not found' });
    }

    // 2. Find Student Profile
    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() })
      .populate('userId', 'name email avatar')
      .populate('assignedGym', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No registered student found with roll number '${rollNumber}'.`,
      });
    }

    // 3. Enforce Facility Assignment Matching
    if (student.assignedGym._id.toString() !== gymId.toString()) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Student is assigned to ${student.assignedGym.name}, not ${gym.name}. Cross-facility check-in is not permitted.`,
      });
    }

    // 4. Verify Active Gym Membership
    const activeMembership = await Membership.findOne({
      studentId: student._id,
      gymId,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
    });

    if (!activeMembership) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Student has no active gym membership for ${gym.name}. Please submit or renew registration.`,
      });
    }

    // 5. ATOMIC CHECK: Prevent Duplicate Active Attendance Sessions
    const existingActiveSession = await Attendance.findOne({
      studentId: student._id,
      status: 'ACTIVE',
    });

    if (existingActiveSession) {
      return res.status(409).json({
        success: false,
        message: `Student '${student.rollNumber}' is already checked in since ${new Date(existingActiveSession.checkInTime).toLocaleTimeString()}. Please check out first.`,
        activeSession: existingActiveSession,
      });
    }

    // 6. Record Check-In
    const newAttendance = await Attendance.create({
      studentId: student._id,
      gymId,
      checkInTime: new Date(),
      status: 'ACTIVE',
      method: 'MANUAL',
      recordedBy: req.user._id,
      notes: notes || '',
    });

    // Populate for client response
    const populatedRecord = await Attendance.findById(newAttendance._id)
      .populate({
        path: 'studentId',
        select: 'rollNumber department academicYear studentType',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('gymId', 'name code');

    // 7. Real-Time Socket.IO Notification
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`gym_${gymId}`).emit('attendance:checkin', populatedRecord);
      io.to('super_admin').emit('attendance:checkin', populatedRecord);
    }

    // 8. Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'ATTENDANCE_CHECKIN_MANUAL',
      resource: 'Attendance',
      resourceId: newAttendance._id.toString(),
      gymId,
      ipAddress: req.ip,
      details: { rollNumber: student.rollNumber, method: 'MANUAL' },
    });

    res.status(201).json({
      success: true,
      message: `Successfully checked in ${student.userId.name} (${student.rollNumber}).`,
      attendance: populatedRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual Check-Out
 */
const manualCheckOut = async (req, res, next) => {
  try {
    const { rollNumber, attendanceId, gymId, notes } = manualCheckOutSchema.parse(req.body);

    let query = { gymId, status: 'ACTIVE' };

    if (attendanceId) {
      query._id = attendanceId;
    } else if (rollNumber) {
      const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with roll number '${rollNumber}' not found.`,
        });
      }
      query.studentId = student._id;
    }

    const activeSession = await Attendance.findOne(query).populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email' },
    });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'No active gym check-in session found for this student.',
      });
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((checkOutTime.getTime() - new Date(activeSession.checkInTime).getTime()) / 60000)
    );

    activeSession.checkOutTime = checkOutTime;
    activeSession.durationMinutes = durationMinutes;
    activeSession.status = 'COMPLETED';
    if (notes) activeSession.notes = notes;
    await activeSession.save();

    // Socket.IO Emit
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`gym_${gymId}`).emit('attendance:checkout', activeSession);
      io.to('super_admin').emit('attendance:checkout', activeSession);
    }

    // Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'ATTENDANCE_CHECKOUT_MANUAL',
      resource: 'Attendance',
      resourceId: activeSession._id.toString(),
      gymId,
      ipAddress: req.ip,
      details: { durationMinutes },
    });

    res.status(200).json({
      success: true,
      message: `Checked out successfully. Workout duration: ${durationMinutes} minutes.`,
      attendance: activeSession,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Dynamic QR Token for Student
 */
const generateStudentQrToken = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('assignedGym');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found for this account.',
      });
    }

    // Verify active membership exists
    const activeMembership = await Membership.findOne({
      studentId: student._id,
      gymId: student.assignedGym._id,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
    });

    if (!activeMembership) {
      return res.status(403).json({
        success: false,
        message: 'Active gym membership required to generate check-in QR token.',
      });
    }

    const qrData = generateQrToken({
      studentId: student._id.toString(),
      rollNumber: student.rollNumber,
      gymId: student.assignedGym._id.toString(),
    }, 60);

    res.status(200).json({
      success: true,
      token: qrData.token,
      expiresAt: qrData.expiresAt,
      remainingSeconds: qrData.remainingSeconds,
      student: {
        name: req.user.name,
        rollNumber: student.rollNumber,
        department: student.department,
        gym: student.assignedGym.name,
        membershipExpiry: activeMembership.endDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scan Student QR Code (Atomic Check-in / Check-out Smart Toggle)
 */
const scanQrToken = async (req, res, next) => {
  try {
    const { qrToken, gymId } = qrScanSchema.parse(req.body);

    // 1. Verify Cryptographic Token & Expiry
    let decoded;
    try {
      decoded = verifyQrToken(qrToken);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `QR verification failed: ${err.message}`,
      });
    }

    const { sub: studentId, roll: rollNumber, gym: tokenGymId } = decoded;

    // 2. Validate Facility Authorization
    if (tokenGymId !== gymId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Facility mismatch: This digital card belongs to another gym facility.',
      });
    }

    // 3. Find Student and Check Membership
    const student = await Student.findById(studentId)
      .populate('userId', 'name email avatar')
      .populate('assignedGym', 'name code');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const activeMembership = await Membership.findOne({
      studentId: student._id,
      gymId,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
    });

    if (!activeMembership) {
      return res.status(403).json({
        success: false,
        message: `Student '${student.rollNumber}' does not have an active membership for this facility.`,
      });
    }

    // 4. SMART TAP LOGIC:
    // If active session exists -> Check Out
    // If no active session -> Check In
    const existingActiveSession = await Attendance.findOne({
      studentId: student._id,
      status: 'ACTIVE',
    });

    const io = req.app.get('io');

    if (existingActiveSession) {
      // CHECK OUT FLOW
      const checkOutTime = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round((checkOutTime.getTime() - new Date(existingActiveSession.checkInTime).getTime()) / 60000)
      );

      existingActiveSession.checkOutTime = checkOutTime;
      existingActiveSession.durationMinutes = durationMinutes;
      existingActiveSession.status = 'COMPLETED';
      await existingActiveSession.save();

      if (io) {
        io.to(`gym_${gymId}`).emit('attendance:checkout', existingActiveSession);
        io.to('super_admin').emit('attendance:checkout', existingActiveSession);
      }

      await AuditLog.create({
        userId: req.user._id,
        action: 'ATTENDANCE_CHECKOUT_QR',
        resource: 'Attendance',
        resourceId: existingActiveSession._id.toString(),
        gymId,
        ipAddress: req.ip,
        details: { rollNumber, durationMinutes },
      });

      return res.status(200).json({
        success: true,
        action: 'CHECKED_OUT',
        message: `Checked out ${student.userId.name} (${student.rollNumber}). Session duration: ${durationMinutes} mins.`,
        student: {
          name: student.userId.name,
          rollNumber: student.rollNumber,
          department: student.department,
          avatar: student.userId.avatar,
        },
        durationMinutes,
        checkOutTime,
      });
    } else {
      // CHECK IN FLOW
      const newAttendance = await Attendance.create({
        studentId: student._id,
        gymId,
        checkInTime: new Date(),
        status: 'ACTIVE',
        method: 'QR_SCAN',
        recordedBy: req.user._id,
      });

      const populated = await Attendance.findById(newAttendance._id)
        .populate({
          path: 'studentId',
          select: 'rollNumber department academicYear studentType',
          populate: { path: 'userId', select: 'name email avatar' },
        })
        .populate('gymId', 'name code');

      if (io) {
        io.to(`gym_${gymId}`).emit('attendance:checkin', populated);
        io.to('super_admin').emit('attendance:checkin', populated);
      }

      await AuditLog.create({
        userId: req.user._id,
        action: 'ATTENDANCE_CHECKIN_QR',
        resource: 'Attendance',
        resourceId: newAttendance._id.toString(),
        gymId,
        ipAddress: req.ip,
        details: { rollNumber },
      });

      return res.status(201).json({
        success: true,
        action: 'CHECKED_IN',
        message: `Checked in ${student.userId.name} (${student.rollNumber}). Enjoy your workout!`,
        student: {
          name: student.userId.name,
          rollNumber: student.rollNumber,
          department: student.department,
          avatar: student.userId.avatar,
        },
        checkInTime: newAttendance.checkInTime,
        attendance: populated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Query Attendance Logs with Filters & Pagination
 */
const getAttendanceLogs = async (req, res, next) => {
  try {
    const { gymId, date, status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (gymId) query.gymId = gymId;
    if (status) query.status = status;

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      query.checkInTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let logsQuery = Attendance.find(query)
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'studentId',
        select: 'rollNumber department academicYear studentType',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('gymId', 'name code');

    const [logs, total] = await Promise.all([
      logsQuery.lean(),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Real-Time Active Inside Summary
 */
const getTodaySummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const gyms = await Gym.find({ isActive: true }).lean();
    const summary = await Promise.all(
      gyms.map(async (gym) => {
        const currentlyInside = await Attendance.countDocuments({
          gymId: gym._id,
          status: 'ACTIVE',
        });
        const todayTotal = await Attendance.countDocuments({
          gymId: gym._id,
          checkInTime: { $gte: todayStart },
        });
        return {
          gymId: gym._id,
          gymName: gym.name,
          gymCode: gym.code,
          capacity: gym.capacity,
          currentlyInside,
          todayTotal,
          occupancyPercentage: Math.min(100, Math.round((currentlyInside / (gym.capacity || 100)) * 100)),
        };
      })
    );

    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Student's Personal Attendance History
 */
const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const history = await Attendance.find({ studentId: student._id })
      .sort({ checkInTime: -1 })
      .limit(50)
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  manualCheckIn,
  manualCheckOut,
  generateStudentQrToken,
  scanQrToken,
  getAttendanceLogs,
  getTodaySummary,
  getMyAttendanceHistory,
};
