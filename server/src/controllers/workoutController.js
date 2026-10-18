const WorkoutPlan = require('../models/WorkoutPlan');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const Notification = require('../models/Notification');
const { workoutPlanSchema } = require('../validators/workoutValidator');

/**
 * List workout plans (scoped)
 */
const getWorkoutPlans = async (req, res, next) => {
  try {
    const { gymId, studentId } = req.query;
    const query = {};

    if (['GYM_MANAGER', 'GYM_STAFF', 'TRAINER'].includes(req.user?.role) && req.user?.assignedGym) {
      query.gymId = req.user.assignedGym;
    } else if (gymId) {
      query.gymId = gymId;
    }

    if (studentId) query.studentId = studentId;

    const plans = await WorkoutPlan.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'studentId',
        select: 'rollNumber department',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate({
        path: 'trainerId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    next(error);
  }
};

/**
 * Create workout plan
 */
const createWorkoutPlan = async (req, res, next) => {
  try {
    const validatedData = workoutPlanSchema.parse(req.body);

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      if (validatedData.gymId && validatedData.gymId.toString() !== req.user.assignedGym.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to create workout plans for another gym facility.',
        });
      }
    }

    // Verify student belongs to this gym
    const student = await Student.findById(validatedData.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    if (student.assignedGym && student.assignedGym.toString() !== validatedData.gymId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Student does not belong to the selected gym facility.',
      });
    }

    // If caller is a trainer, look up trainer ID
    let trainerId = null;
    if (req.user.role === 'TRAINER') {
      const trainerRecord = await Trainer.findOne({ userId: req.user._id });
      if (trainerRecord) trainerId = trainerRecord._id;
    }

    // Deactivate previous active plans for this student if any
    await WorkoutPlan.updateMany({ studentId: validatedData.studentId }, { isActive: false });

    const newPlan = await WorkoutPlan.create({
      ...validatedData,
      trainerId,
      isActive: true,
    });

    // Notify student
    if (student.userId) {
      await Notification.create({
        recipientId: student.userId,
        gymId: validatedData.gymId,
        title: 'New Workout Plan Assigned! 🏋️',
        message: `Your coach has assigned you a new '${validatedData.title}' training plan. Check your student dashboard to review daily exercises.`,
        type: 'WORKOUT',
      });
    }

    const populated = await WorkoutPlan.findById(newPlan._id)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('gymId', 'name');

    res.status(201).json({
      success: true,
      message: 'Workout plan created and assigned successfully.',
      plan: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workout plan
 */
const updateWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await WorkoutPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      if (plan.gymId && plan.gymId.toString() !== req.user.assignedGym.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to modify workout plans for another gym facility.',
        });
      }
    }

    Object.assign(plan, req.body);
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Workout plan updated successfully',
      plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in student's personal active workout plan
 */
const getMyWorkoutPlan = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const plan = await WorkoutPlan.findOne({ studentId: student._id, isActive: true })
      .populate({
        path: 'trainerId',
        populate: { path: 'userId', select: 'name email phone avatar' },
      })
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({ success: true, plan: plan || null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  getMyWorkoutPlan,
};
