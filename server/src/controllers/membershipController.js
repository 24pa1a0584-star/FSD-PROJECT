const Membership = require('../models/Membership');
const MembershipType = require('../models/MembershipType');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

/**
 * List all available membership types
 */
const getMembershipTypes = async (req, res, next) => {
  try {
    const types = await MembershipType.find({ isActive: true }).lean();
    res.status(200).json({ success: true, count: types.length, types });
  } catch (error) {
    next(error);
  }
};

/**
 * List memberships (scoped by gym)
 */
const getMemberships = async (req, res, next) => {
  try {
    const { gymId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (gymId) query.gymId = gymId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [memberships, total] = await Promise.all([
      Membership.find(query)
        .sort({ endDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'studentId',
          select: 'rollNumber department academicYear studentType contactNumber',
          populate: { path: 'userId', select: 'name email avatar' },
        })
        .populate('gymId', 'name code')
        .populate('membershipTypeId')
        .lean(),
      Membership.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student retrieves their active digital membership card
 */
const getMyCard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'name email avatar')
      .populate('assignedGym');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const membership = await Membership.findOne({
      studentId: student._id,
      gymId: student.assignedGym._id,
      status: 'ACTIVE',
    })
      .populate('membershipTypeId')
      .populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      card: {
        studentName: student.userId.name,
        rollNumber: student.rollNumber,
        department: student.department,
        academicYear: student.academicYear,
        section: student.section,
        studentType: student.studentType,
        profilePhoto: student.profilePhoto || student.userId.avatar,
        gymName: student.assignedGym.name,
        gymCode: student.assignedGym.code,
        gymLocation: student.assignedGym.location,
        hasActiveMembership: !!membership,
        membership: membership || null,
        qrCardId: membership ? membership.qrCardId : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renew Membership
 */
const renewMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalMonths = 6, notes } = req.body;

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    // Facility isolation check: GYM_MANAGER can only renew their own facility's memberships
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== membership.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to renew memberships for another gym facility.',
      });
    }

    const currentEnd = new Date(membership.endDate > new Date() ? membership.endDate : new Date());
    const newEndDate = new Date(currentEnd);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(additionalMonths));

    membership.renewalHistory.push({
      renewedAt: new Date(),
      extendedMonths: parseInt(additionalMonths),
      newEndDate,
      renewedBy: req.user._id,
      notes: notes || 'Standard campus renewal.',
    });

    membership.endDate = newEndDate;
    membership.status = 'ACTIVE';
    await membership.save();

    await Student.findByIdAndUpdate(membership.studentId, { membershipStatus: 'ACTIVE' });

    await AuditLog.create({
      userId: req.user._id,
      action: 'RENEW_MEMBERSHIP',
      resource: 'Membership',
      resourceId: membership._id.toString(),
      gymId: membership.gymId,
      ipAddress: req.ip,
      details: { additionalMonths, newEndDate },
    });

    res.status(200).json({
      success: true,
      message: `Membership renewed successfully until ${newEndDate.toLocaleDateString()}.`,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Membership Status (ACTIVE, SUSPENDED, CANCELLED)
 */
const updateMembershipStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid membership status' });
    }

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    // Facility isolation check: GYM_MANAGER can only update their own facility's memberships
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== membership.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to update memberships for another gym facility.',
      });
    }

    membership.status = status;
    await membership.save();

    await Student.findByIdAndUpdate(membership.studentId, {
      membershipStatus: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
    });

    res.status(200).json({
      success: true,
      message: `Membership status updated to ${status}.`,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembershipTypes,
  getMemberships,
  getMyCard,
  renewMembership,
  updateMembershipStatus,
};
