const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res, next) => {
  try {
    const { gymId } = req.query;
    const query = { isActive: true };

    if (gymId) {
      query.$or = [{ gymId }, { gymId: null }, { targetAudience: 'ALL' }];
    }

    const announcements = await Announcement.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name role')
      .populate('gymId', 'name code')
      .lean();

    res.status(200).json({ success: true, count: announcements.length, announcements });
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience, priority, gymId, expiresAt } = req.body;

    let targetGymId = gymId || null;
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      targetGymId = req.user.assignedGym;
    }

    const announcement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || 'ALL',
      priority: priority || 'NORMAL',
      gymId: targetGymId,
      createdBy: req.user._id,
      expiresAt: expiresAt || null,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name')
      .populate('gymId', 'name code');

    const io = req.app.get('io');
    if (io) {
      if (targetGymId) {
        io.to(`gym_${targetGymId}`).emit('announcement:new', populated);
      } else {
        io.emit('announcement:new', populated);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.assignedGym) {
      if (announcement.gymId && announcement.gymId.toString() !== req.user.assignedGym.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to delete announcements for another gym facility.',
        });
      }
    }

    await announcement.deleteOne();
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
