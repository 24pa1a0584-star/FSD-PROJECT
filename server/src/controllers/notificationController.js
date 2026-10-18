const Notification = require('../models/Notification');

const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    });

    res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserNotifications, markAsRead };
