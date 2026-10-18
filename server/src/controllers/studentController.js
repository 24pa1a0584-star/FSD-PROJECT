const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const GymRegistration = require('../models/GymRegistration');

/**
 * List students with filters, search, and pagination
 */
const getStudents = async (req, res, next) => {
  try {
    const {
      gymId,
      department,
      academicYear,
      studentType,
      membershipStatus,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (gymId) query.assignedGym = gymId;
    if (department) query.department = department;
    if (academicYear) query.academicYear = parseInt(academicYear);
    if (studentType) query.studentType = studentType;
    if (membershipStatus) query.membershipStatus = membershipStatus;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [{ rollNumber: searchRegex }, { userId: { $in: userIds } }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort({ rollNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email phone avatar isActive')
        .populate('assignedGym', 'name code')
        .lean(),
      Student.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student Profile by ID with attendance & membership
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'name email phone avatar isActive')
      .populate('assignedGym');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // Facility isolation check: GYM_MANAGER cannot view students from another facility
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== (student.assignedGym?._id || student.assignedGym).toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view students from another facility.',
      });
    }

    // Fetch active membership
    const membership = await Membership.findOne({
      studentId: student._id,
      gymId: student.assignedGym._id || student.assignedGym,
      status: 'ACTIVE',
    }).populate('membershipTypeId');

    // Fetch recent 10 attendance sessions
    const recentAttendance = await Attendance.find({ studentId: student._id })
      .sort({ checkInTime: -1 })
      .limit(10)
      .lean();

    // Fetch registrations
    const registrations = await GymRegistration.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      student,
      membership,
      recentAttendance,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile (Admin/Manager or self)
 */
const updateStudent = async (req, res, next) => {
  try {
    const { contactNumber, studentType, section, emergencyContact, profilePhoto } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Facility isolation check: GYM_MANAGER cannot update students from another facility
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== student.assignedGym?.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to modify students of another facility.',
      });
    }

    if (contactNumber) student.contactNumber = contactNumber;
    if (studentType) student.studentType = studentType;
    if (section) student.section = section;
    if (emergencyContact) student.emergencyContact = emergencyContact;
    if (profilePhoto) student.profilePhoto = profilePhoto;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      student,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
};
