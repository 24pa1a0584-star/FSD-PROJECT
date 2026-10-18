const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Membership = require('../models/Membership');
const Equipment = require('../models/Equipment');
const Gym = require('../models/Gym');

/**
 * Monthly Attendance Aggregation
 */
const getAttendanceReports = async (req, res, next) => {
  try {
    const { gymId, months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const matchStage = { checkInTime: { $gte: startDate } };
    let targetGymId = gymId;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      targetGymId = req.user.assignedGym;
    }
    if (targetGymId) matchStage.gymId = new mongoose.Types.ObjectId(targetGymId);

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$checkInTime' },
            month: { $month: '$checkInTime' },
          },
          totalCheckIns: { $sum: 1 },
          avgDurationMinutes: { $avg: '$durationMinutes' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Boys vs Girls Facility Comparison Aggregation
 */
const getGymComparisonReport = async (req, res, next) => {
  try {
    const gyms = await Gym.find({ isActive: true }).lean();
    const boysGym = gyms.find((g) => g.code === 'BOYS_GYM');
    const girlsGym = gyms.find((g) => g.code === 'GIRLS_GYM');

    const [boysTotal, girlsTotal, boysActiveMem, girlsActiveMem, boysAttendance, girlsAttendance] =
      await Promise.all([
        boysGym ? Student.countDocuments({ assignedGym: boysGym._id }) : 0,
        girlsGym ? Student.countDocuments({ assignedGym: girlsGym._id }) : 0,
        boysGym ? Membership.countDocuments({ gymId: boysGym._id, status: 'ACTIVE' }) : 0,
        girlsGym ? Membership.countDocuments({ gymId: girlsGym._id, status: 'ACTIVE' }) : 0,
        boysGym ? Attendance.countDocuments({ gymId: boysGym._id }) : 0,
        girlsGym ? Attendance.countDocuments({ gymId: girlsGym._id }) : 0,
      ]);

    res.status(200).json({
      success: true,
      comparison: {
        boysGym: {
          name: 'Vishnu Boys Gym',
          totalStudents: boysTotal,
          activeMembers: boysActiveMem,
          totalAttendanceLogs: boysAttendance,
        },
        girlsGym: {
          name: 'Vishnu Girls Gym',
          totalStudents: girlsTotal,
          activeMembers: girlsActiveMem,
          totalAttendanceLogs: girlsAttendance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Department Registrations Report
 */
const getDepartmentReport = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const match = {};
    let targetGymId = gymId;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      targetGymId = req.user.assignedGym;
    }
    if (targetGymId) match.assignedGym = new mongoose.Types.ObjectId(targetGymId);

    const departments = await Student.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          hostellers: {
            $sum: { $cond: [{ $eq: ['$studentType', 'Hosteller'] }, 1, 0] },
          },
          dayScholars: {
            $sum: { $cond: [{ $eq: ['$studentType', 'Day Scholar'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

/**
 * Equipment Breakdown Report
 */
const getEquipmentReport = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const match = {};
    let targetGymId = gymId;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      targetGymId = req.user.assignedGym;
    }
    if (targetGymId) match.gymId = new mongoose.Types.ObjectId(targetGymId);

    const breakdown = await Equipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: '$quantity' },
          available: { $sum: '$availableQuantity' },
          maintenanceCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['UNDER_MAINTENANCE', 'OUT_OF_SERVICE']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceReports,
  getGymComparisonReport,
  getDepartmentReport,
  getEquipmentReport,
};
