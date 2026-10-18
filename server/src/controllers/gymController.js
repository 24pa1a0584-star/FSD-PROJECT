const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const Student = require('../models/Student');
const Membership = require('../models/Membership');
const GymRegistration = require('../models/GymRegistration');
const Attendance = require('../models/Attendance');
const Trainer = require('../models/Trainer');
const Equipment = require('../models/Equipment');
const AuditLog = require('../models/AuditLog');

/**
 * List all gym facilities
 */
const getGyms = async (req, res, next) => {
  try {
    const gyms = await Gym.find({ isActive: true }).lean();
    res.status(200).json({ success: true, count: gyms.length, gyms });
  } catch (error) {
    next(error);
  }
};

/**
 * Get gym details by ID
 */
const getGymById = async (req, res, next) => {
  try {
    const gym = await Gym.findById(req.params.id);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym facility not found' });
    }
    res.status(200).json({ success: true, gym });
  } catch (error) {
    next(error);
  }
};

/**
 * Update gym information (Super Admin only)
 */
const updateGym = async (req, res, next) => {
  try {
    const { name, capacity, operatingHours, contactPhone, contactEmail, description } = req.body;
    const gym = await Gym.findById(req.params.id);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    if (name) gym.name = name;
    if (capacity) gym.capacity = capacity;
    if (operatingHours) gym.operatingHours = operatingHours;
    if (contactPhone) gym.contactPhone = contactPhone;
    if (contactEmail) gym.contactEmail = contactEmail;
    if (description) gym.description = description;

    await gym.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_GYM_FACILITY',
      resource: 'Gym',
      resourceId: gym._id.toString(),
      gymId: gym._id,
      ipAddress: req.ip,
      details: { name: gym.name, capacity: gym.capacity },
    });

    res.status(200).json({ success: true, message: 'Gym facility updated successfully', gym });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin Campus Dashboard: Real MongoDB Aggregation Pipelines
 */
const getCampusDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const gyms = await Gym.find({ isActive: true }).lean();
    const boysGym = gyms.find((g) => g.code === 'BOYS_GYM');
    const girlsGym = gyms.find((g) => g.code === 'GIRLS_GYM');

    // 1. Total Registered Students & Breakdown
    const totalStudents = await Student.countDocuments();
    const boysGymMembers = boysGym
      ? await Student.countDocuments({ assignedGym: boysGym._id })
      : 0;
    const girlsGymMembers = girlsGym
      ? await Student.countDocuments({ assignedGym: girlsGym._id })
      : 0;

    // 2. Active Memberships & Pending Applications
    const activeMemberships = await Membership.countDocuments({
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
    });
    const pendingApplications = await GymRegistration.countDocuments({ status: 'PENDING' });

    // 3. Today's Attendance Aggregations
    const todayAttendanceTotal = await Attendance.countDocuments({
      checkInTime: { $gte: todayStart, $lte: todayEnd },
    });

    const boysGymAttendanceToday = boysGym
      ? await Attendance.countDocuments({
          gymId: boysGym._id,
          checkInTime: { $gte: todayStart, $lte: todayEnd },
        })
      : 0;

    const girlsGymAttendanceToday = girlsGym
      ? await Attendance.countDocuments({
          gymId: girlsGym._id,
          checkInTime: { $gte: todayStart, $lte: todayEnd },
        })
      : 0;

    // Currently Active inside facilities
    const currentlyActiveBoys = boysGym
      ? await Attendance.countDocuments({ gymId: boysGym._id, status: 'ACTIVE' })
      : 0;
    const currentlyActiveGirls = girlsGym
      ? await Attendance.countDocuments({ gymId: girlsGym._id, status: 'ACTIVE' })
      : 0;

    // 4. Trainers & Equipment Status
    const availableTrainers = await Trainer.countDocuments({ isAvailable: true });
    const equipmentUnderMaintenance = await Equipment.countDocuments({
      status: { $in: ['UNDER_MAINTENANCE', 'OUT_OF_SERVICE'] },
    });
    const totalEquipment = await Equipment.countDocuments();

    // 5. MongoDB Aggregation: Monthly Attendance (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAttendanceData = await Attendance.aggregate([
      { $match: { checkInTime: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$checkInTime' },
            month: { $month: '$checkInTime' },
            gymId: '$gymId',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format Monthly Aggregation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyUsageMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyUsageMap[key] = {
        month: key,
        boys: 0,
        girls: 0,
        total: 0,
      };
    }

    monthlyAttendanceData.forEach((item) => {
      const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      if (monthlyUsageMap[key]) {
        if (boysGym && item._id.gymId.toString() === boysGym._id.toString()) {
          monthlyUsageMap[key].boys += item.count;
        } else if (girlsGym && item._id.gymId.toString() === girlsGym._id.toString()) {
          monthlyUsageMap[key].girls += item.count;
        }
        monthlyUsageMap[key].total += item.count;
      }
    });

    const monthlyTrends = Object.values(monthlyUsageMap);

    // 6. MongoDB Aggregation: Student Registrations by Department
    const departmentDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 7. Recent Campus Attendance Feed
    const recentActivity = await Attendance.find()
      .sort({ checkInTime: -1 })
      .limit(8)
      .populate({
        path: 'studentId',
        select: 'rollNumber department academicYear studentType',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        boysGymMembers,
        girlsGymMembers,
        activeMemberships,
        pendingApplications,
        todayAttendanceTotal,
        boysGymAttendanceToday,
        girlsGymAttendanceToday,
        currentlyActiveBoys,
        currentlyActiveGirls,
        availableTrainers,
        equipmentUnderMaintenance,
        totalEquipment,
        boysGymCapacity: boysGym ? boysGym.capacity : 120,
        girlsGymCapacity: girlsGym ? girlsGym.capacity : 100,
      },
      charts: {
        monthlyTrends,
        departmentDistribution,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Facility-Specific Dashboard for Boys Gym or Girls Gym Manager
 */
const getFacilityDashboardStats = async (req, res, next) => {
  try {
    const { gymId } = req.params;
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym facility not found' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalMembers = await Student.countDocuments({ assignedGym: gymId });
    const activeMembers = await Membership.countDocuments({
      gymId,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
    });
    const pendingRequests = await GymRegistration.countDocuments({ gymId, status: 'PENDING' });

    const todayAttendance = await Attendance.countDocuments({
      gymId,
      checkInTime: { $gte: todayStart, $lte: todayEnd },
    });

    const currentlyInside = await Attendance.countDocuments({ gymId, status: 'ACTIVE' });

    const totalEquipment = await Equipment.countDocuments({ gymId });
    const availableEquipment = await Equipment.countDocuments({ gymId, status: 'AVAILABLE' });
    const maintenanceEquipment = await Equipment.countDocuments({
      gymId,
      status: { $in: ['UNDER_MAINTENANCE', 'OUT_OF_SERVICE'] },
    });

    const trainersCount = await Trainer.countDocuments({ gymId, isAvailable: true });

    // Aggregation: Hourly distribution for today / peak hours
    const peakHours = await Attendance.aggregate([
      { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
      {
        $group: {
          _id: { $hour: '$checkInTime' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          hour: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Recent check-ins in this facility
    const recentActivity = await Attendance.find({ gymId })
      .sort({ checkInTime: -1 })
      .limit(10)
      .populate({
        path: 'studentId',
        select: 'rollNumber department academicYear studentType',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .lean();

    res.status(200).json({
      success: true,
      gym: {
        id: gym._id,
        name: gym.name,
        code: gym.code,
        capacity: gym.capacity,
        operatingHours: gym.operatingHours,
      },
      stats: {
        totalMembers,
        activeMembers,
        pendingRequests,
        todayAttendance,
        currentlyInside,
        occupancyPercentage: Math.min(100, Math.round((currentlyInside / (gym.capacity || 100)) * 100)),
        totalEquipment,
        availableEquipment,
        maintenanceEquipment,
        trainersCount,
      },
      peakHours,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGyms,
  getGymById,
  updateGym,
  getCampusDashboardStats,
  getFacilityDashboardStats,
};
