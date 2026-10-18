const GymRegistration = require('../models/GymRegistration');
const Student = require('../models/Student');
const Membership = require('../models/Membership');
const MembershipType = require('../models/MembershipType');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const {
  submitRegistrationSchema,
  reviewRegistrationSchema,
} = require('../validators/registrationValidator');
const crypto = require('crypto');

/**
 * Student submits gym registration application
 */
const submitRegistration = async (req, res, next) => {
  try {
    const { gymId, preferredSlot, fitnessGoals, medicalClearance } =
      submitRegistrationSchema.parse(req.body);

    const student = await Student.findOne({ userId: req.user._id }).populate('userId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Check if there is already an active or pending registration for this gym
    const existingRegistration = await GymRegistration.findOne({
      studentId: student._id,
      gymId,
      status: { $in: ['PENDING', 'APPROVED'] },
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: `You already have an active or pending registration (Status: ${existingRegistration.status}) for this facility.`,
      });
    }

    const registration = await GymRegistration.create({
      studentId: student._id,
      gymId,
      status: 'PENDING',
      preferredSlot,
      fitnessGoals,
      medicalClearance,
      studentSnapshot: {
        name: student.userId.name,
        rollNumber: student.rollNumber,
        department: student.department,
        academicYear: student.academicYear,
        studentType: student.studentType,
        contactNumber: student.contactNumber,
      },
    });

    // Notify Gym Managers
    const io = req.app.get('io');
    if (io) {
      io.to(`gym_${gymId}`).emit('registration:new', registration);
      io.to('super_admin').emit('registration:new', registration);
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'SUBMIT_GYM_REGISTRATION',
      resource: 'GymRegistration',
      resourceId: registration._id.toString(),
      gymId,
      ipAddress: req.ip,
      details: { rollNumber: student.rollNumber, preferredSlot },
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Awaiting gym manager approval.',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List gym registration requests (scoped by gym authorization)
 */
const getRegistrations = async (req, res, next) => {
  try {
    const { gymId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (gymId) query.gymId = gymId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registrations, total] = await Promise.all([
      GymRegistration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'studentId',
          select: 'rollNumber department academicYear studentType contactNumber profilePhoto',
          populate: { path: 'userId', select: 'name email avatar' },
        })
        .populate('gymId', 'name code')
        .populate('reviewedBy', 'name email')
        .lean(),
      GymRegistration.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student views own registrations
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const registrations = await GymRegistration.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .populate('gymId', 'name code')
      .populate('reviewedBy', 'name')
      .lean();

    res.status(200).json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve Registration Application
 */
const approveRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks, durationMonths = 6 } = reviewRegistrationSchema.parse(req.body);

    const registration = await GymRegistration.findById(id).populate('studentId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    // Facility isolation check: GYM_MANAGER can only approve their own gym's registrations
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== registration.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to approve registrations for this gym facility.',
      });
    }

    if (registration.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'This application is already approved.' });
    }

    // Check if student already has an active membership for this facility
    const existingActive = await Membership.findOne({
      studentId: registration.studentId._id,
      gymId: registration.gymId,
      status: 'ACTIVE',
    });

    if (existingActive) {
      registration.status = 'APPROVED';
      registration.reviewedBy = req.user._id;
      registration.reviewedAt = new Date();
      registration.remarks = remarks || 'Approved (Active membership already exists).';
      await registration.save();

      return res.status(200).json({
        success: true,
        message: 'Registration approved. Student already holds an active membership.',
        registration,
        membership: existingActive,
      });
    }

    // Ensure MembershipType exists (fallback to SEMESTER or first active or create)
    let membershipType = await MembershipType.findOne({ code: 'SEMESTER' });
    if (!membershipType) {
      membershipType = await MembershipType.findOne({ isActive: true });
    }
    if (!membershipType) {
      membershipType = await MembershipType.create({
        name: 'Semester',
        code: 'SEMESTER',
        durationMonths: 6,
        feeAmount: 0,
        description: 'Standard semester campus gym pass',
        isActive: true,
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths, 10));

    // Update Registration
    registration.status = 'APPROVED';
    registration.reviewedBy = req.user._id;
    registration.reviewedAt = new Date();
    registration.remarks = remarks || 'Approved after institutional verification.';
    await registration.save();

    // Create active membership
    const roll = registration.studentSnapshot?.rollNumber || registration.studentId?.rollNumber || 'STUDENT';
    const qrCardId = `VITB-GYM-${roll}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const membership = await Membership.create({
      studentId: registration.studentId._id,
      gymId: registration.gymId,
      membershipTypeId: membershipType._id,
      startDate,
      endDate,
      status: 'ACTIVE',
      approvedBy: req.user._id,
      qrCardId,
    });

    // Update Student membership status
    await Student.findByIdAndUpdate(registration.studentId._id, {
      membershipStatus: 'ACTIVE',
      assignedGym: registration.gymId,
    });

    // Create notification for student
    const studentUser = await Student.findById(registration.studentId._id);
    if (studentUser && studentUser.userId) {
      await Notification.create({
        recipientId: studentUser.userId,
        gymId: registration.gymId,
        title: 'Gym Membership Approved! 🎉',
        message: `Your gym registration has been approved. You now have active access until ${endDate.toLocaleDateString()}. Check your digital card!`,
        type: 'REGISTRATION',
      });
    }

    // Socket.IO Emit
    const io = req.app.get('io');
    if (io) {
      io.to(`gym_${registration.gymId}`).emit('registration:approved', {
        registrationId: registration._id,
        membership,
      });
      io.to('super_admin').emit('registration:approved', {
        registrationId: registration._id,
        membership,
      });
    }

    // Audit Log
    await AuditLog.create({
      userId: req.user._id,
      action: 'APPROVE_GYM_REGISTRATION',
      resource: 'GymRegistration',
      resourceId: registration._id.toString(),
      gymId: registration.gymId,
      ipAddress: req.ip,
      details: { rollNumber: roll, membershipId: membership._id },
    });

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully. Active membership issued.',
      registration,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Registration Application
 */
const rejectRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const registration = await GymRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration request not found.' });
    }

    // Facility isolation check: GYM_MANAGER can only reject their own gym's registrations
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== registration.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to reject registrations for this gym facility.',
      });
    }

    registration.status = 'REJECTED';
    registration.reviewedBy = req.user._id;
    registration.reviewedAt = new Date();
    registration.remarks = remarks || 'Registration rejected by gym manager.';
    await registration.save();

    await Student.findByIdAndUpdate(registration.studentId, {
      membershipStatus: 'INACTIVE',
    });

    // Notify student
    const studentRecord = await Student.findById(registration.studentId);
    if (studentRecord && studentRecord.userId) {
      await Notification.create({
        recipientId: studentRecord.userId,
        gymId: registration.gymId,
        title: 'Gym Registration Update',
        message: `Your gym application was not approved. Remarks: ${registration.remarks}`,
        type: 'REGISTRATION',
      });
    }

    // Socket.IO Emit
    const io = req.app.get('io');
    if (io) {
      io.to(`gym_${registration.gymId}`).emit('registration:rejected', {
        registrationId: registration._id,
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'REJECT_GYM_REGISTRATION',
      resource: 'GymRegistration',
      resourceId: registration._id.toString(),
      gymId: registration.gymId,
      ipAddress: req.ip,
      details: { remarks: registration.remarks },
    });

    res.status(200).json({
      success: true,
      message: 'Registration application has been rejected.',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRegistration,
  getRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
};
