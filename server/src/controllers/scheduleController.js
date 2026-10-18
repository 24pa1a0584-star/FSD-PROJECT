const GymSchedule = require('../models/GymSchedule');
const Gym = require('../models/Gym');

const getSchedules = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const query = {};
    if (gymId) query.gymId = gymId;

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
