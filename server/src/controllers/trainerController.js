const Trainer = require('../models/Trainer');
const TrainerAssignment = require('../models/TrainerAssignment');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

/**
 * List all trainers (filterable by gym)
 */
const getTrainers = async (req, res, next) => {
  try {
    const { gymId, isAvailable } = req.query;
    const query = {};
    if (gymId) query.gymId = gymId;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const trainers = await Trainer.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('gymId', 'name code')
      .lean();

    // Attach active student count to each trainer
    const trainersWithCounts = await Promise.all(
      trainers.map(async (t) => {
        const studentCount = await TrainerAssignment.countDocuments({
          trainerId: t._id,
          status: 'ACTIVE',
        });
        return { ...t, activeStudentCount: studentCount };
      })
    );

    res.status(200).json({ success: true, count: trainersWithCounts.length, trainers: trainersWithCounts });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new trainer profile
 */
const createTrainer = async (req, res, next) => {
  try {
    const { name, email, password, gymId, specialization, certifications, bio, maxStudents } = req.body;

    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== gymId?.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to create trainers for another facility.',
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password || 'Trainer@123', salt);
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'TRAINER',
        assignedGym: gymId,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });
    }

    const trainer = await Trainer.create({
      userId: user._id,
      gymId,
      specialization: specialization || ['Strength & Conditioning'],
      certifications: certifications || ['Certified Fitness Coach'],
      bio: bio || 'Campus fitness trainer.',
      maxStudents: maxStudents || 25,
      isAvailable: true,
    });

    const populated = await Trainer.findById(trainer._id)
      .populate('userId', 'name email phone avatar')
      .populate('gymId', 'name code');

    res.status(201).json({ success: true, message: 'Trainer created successfully', trainer: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Update trainer availability / specialization
 */
const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization, certifications, bio, isAvailable, maxStudents } = req.body;

    const trainer = await Trainer.findById(id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== trainer.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to modify trainers of another facility.',
      });
    }

    if (specialization) trainer.specialization = specialization;
    if (certifications) trainer.certifications = certifications;
    if (bio) trainer.bio = bio;
    if (isAvailable !== undefined) trainer.isAvailable = isAvailable;
    if (maxStudents) trainer.maxStudents = maxStudents;

    await trainer.save();

    res.status(200).json({ success: true, message: 'Trainer profile updated successfully', trainer });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign trainer to student
 */
const assignTrainer = async (req, res, next) => {
  try {
    const { trainerId, studentId, notes } = req.body;

    const [trainer, student] = await Promise.all([
      Trainer.findById(trainerId),
      Student.findById(studentId),
    ]);

    if (!trainer || !student) {
      return res.status(404).json({ success: false, message: 'Trainer or Student record not found' });
    }

    // Facility isolation check
    if (
      req.user.role === 'GYM_MANAGER' &&
      (!req.user.assignedGym || req.user.assignedGym.toString() !== trainer.gymId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to assign trainers for another facility.',
      });
    }

    // Verify facility match
    if (trainer.gymId.toString() !== student.assignedGym.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign: Trainer and Student belong to different gym facilities.',
      });
    }

    // Deactivate previous active assignment if any
    await TrainerAssignment.updateMany(
      { studentId: student._id, status: 'ACTIVE' },
      { status: 'COMPLETED' }
    );

    const assignment = await TrainerAssignment.create({
      trainerId: trainer._id,
      studentId: student._id,
      gymId: trainer.gymId,
      assignedBy: req.user._id,
      notes: notes || 'Personal coach assignment for student fitness progression.',
    });

    res.status(201).json({
      success: true,
      message: 'Trainer assigned to student successfully',
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students assigned to a trainer
 */
const getAssignedStudents = async (req, res, next) => {
  try {
    const { trainerId } = req.params;

    const assignments = await TrainerAssignment.find({ trainerId, status: 'ACTIVE' })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email phone avatar' },
      })
      .lean();

    res.status(200).json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainers,
  createTrainer,
  updateTrainer,
  assignTrainer,
  getAssignedStudents,
};
