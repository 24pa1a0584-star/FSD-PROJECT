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

    const announcement = await Announcement.create({
      title,
      content,
      targetAudience: targetAudience || 'ALL',
      priority: priority || 'NORMAL',
      gymId: gymId || null,
      createdBy: req.user._id,
      expiresAt: expiresAt || null,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name')
      .populate('gymId', 'name code');

    const io = req.app.get('io');
    if (io) {
      if (gymId) {
        io.to(`gym_${gymId}`).emit('announcement:new', populated);
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
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
