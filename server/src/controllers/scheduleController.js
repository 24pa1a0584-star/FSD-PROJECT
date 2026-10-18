const GymSchedule = require('../models/GymSchedule');
const Gym = require('../models/Gym');

const getSchedules = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const query = {};

    if (['GYM_MANAGER', 'GYM_STAFF', 'TRAINER'].includes(req.user?.role) && req.user?.assignedGym) {
      query.gymId = req.user.assignedGym;
    } else if (gymId) {
      query.gymId = gymId;
    }

    const schedules = await GymSchedule.find(query)
      .sort({ dayOfWeek: 1 })
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({ success: true, count: schedules.length, schedules });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { morningSlot, eveningSlot, isClosed, specialNotes } = req.body;

    const schedule = await GymSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      if (schedule.gymId && schedule.gymId.toString() !== req.user.assignedGym.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to modify schedules for another gym facility.',
        });
      }
    }

    if (morningSlot) schedule.morningSlot = morningSlot;
    if (eveningSlot) schedule.eveningSlot = eveningSlot;
    if (isClosed !== undefined) schedule.isClosed = isClosed;
    if (specialNotes !== undefined) schedule.specialNotes = specialNotes;

    await schedule.save();

    res.status(200).json({ success: true, message: 'Schedule updated successfully', schedule });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSchedules, updateSchedule };
