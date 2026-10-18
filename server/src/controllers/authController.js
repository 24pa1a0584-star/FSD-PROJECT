const User = require('../models/User');
const Student = require('../models/Student');
const Gym = require('../models/Gym');
const GymRegistration = require('../models/GymRegistration');
const AuditLog = require('../models/AuditLog');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/tokenUtils');
const {
  loginSchema,
  registerStudentSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/authValidator');
const bcrypt = require('bcryptjs');

/**
 * Log in user and set secure HttpOnly cookie
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).populate('assignedGym');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact campus gym administration.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);

    // If student, attach student profile
    let studentProfile = null;
    if (user.role === 'STUDENT') {
      studentProfile = await Student.findOne({ userId: user._id }).populate('assignedGym');
    }

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      gymId: user.assignedGym ? user.assignedGym._id : null,
      ipAddress: req.ip,
      details: { role: user.role },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful. Welcome to VISHNUFIT!',
      token, // Dual-support for API clients / Postman
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedGym: user.assignedGym,
        avatar: user.avatar,
        phone: user.phone,
      },
      studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student Self-Registration (Creates User, Student, and initial GymRegistration)
 */
const registerStudent = async (req, res, next) => {
  try {
    const validatedData = registerStudentSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this institutional email already exists.',
      });
    }

    // Check if roll number already exists
    const existingRoll = await Student.findOne({ rollNumber: validatedData.rollNumber });
    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message: `Student with roll number '${validatedData.rollNumber}' is already registered.`,
      });
    }

    // Validate gym exists
    const gym = await Gym.findById(validatedData.assignedGym);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: 'Selected gym facility does not exist.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Create User
    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: 'STUDENT',
      assignedGym: gym._id,
      phone: validatedData.contactNumber,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`,
    });

    // Create Student Profile
    const newStudent = await Student.create({
      userId: newUser._id,
      rollNumber: validatedData.rollNumber,
      department: validatedData.department,
      academicYear: validatedData.academicYear,
      section: validatedData.section || 'A',
      contactNumber: validatedData.contactNumber,
      studentType: validatedData.studentType,
      assignedGym: gym._id,
      membershipStatus: 'PENDING',
      emergencyContact: validatedData.emergencyContact || { name: '', phone: '', relation: '' },
      profilePhoto: newUser.avatar,
    });

    // Auto-create initial GymRegistration application
    const initialRegistration = await GymRegistration.create({
      studentId: newStudent._id,
      gymId: gym._id,
      status: 'PENDING',
      preferredSlot: 'MORNING (6 AM - 8 AM)',
      fitnessGoals: 'General campus fitness and athletic conditioning',
      studentSnapshot: {
        name: newUser.name,
        rollNumber: newStudent.rollNumber,
        department: newStudent.department,
        academicYear: newStudent.academicYear,
        studentType: newStudent.studentType,
        contactNumber: newStudent.contactNumber,
      },
    });

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    // Audit Log
    await AuditLog.create({
      userId: newUser._id,
      action: 'STUDENT_REGISTER',
      resource: 'Student',
      resourceId: newStudent._id.toString(),
      gymId: gym._id,
      ipAddress: req.ip,
      details: { rollNumber: newStudent.rollNumber, registrationId: initialRegistration._id },
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Gym application submitted for manager approval.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        assignedGym: gym,
        avatar: newUser.avatar,
      },
      studentProfile: newStudent,
      registration: initialRegistration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user and clear cookie
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: req.user._id.toString(),
        gymId: req.user.assignedGym,
        ipAddress: req.ip,
      });
    }
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current session user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash')
      .populate('assignedGym');

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      studentProfile = await Student.findOne({ userId: user._id }).populate('assignedGym');
    }

    res.status(200).json({
      success: true,
      user,
      studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update personal profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = updateProfileSchema.parse(req.body);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedGym: user.assignedGym,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      resource: 'User',
      resourceId: user._id.toString(),
      gymId: user.assignedGym,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  registerStudent,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
