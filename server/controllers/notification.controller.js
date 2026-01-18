const Notification = require('../models/Notification');
const User = require('../models/User');

// Internal helper to create notification
const createNotificationInternal = async (userId, type, title, body, related = {}, alertLevel = 'green') => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            body,
            related,
            alertLevel,
            read: false
        });
        return notification;
    } catch (error) {
        console.error('Error creating internal notification:', error);
    }
};

// @desc    Create a notification (Admin/System)
// @route   POST /api/notifications
// @access  Private
const createNotification = async (req, res) => {
    try {
        const { title, body, type, alertLevel, recipientType, specificEmail } = req.body;

        let recipients = [];

        if (recipientType === 'all') {
            recipients = await User.find({}, '_id');
        } else if (recipientType === 'faculty') {
            recipients = await User.find({ roles: 'faculty' }, '_id');
        } else if (recipientType === 'student') {
            recipients = await User.find({ roles: 'student' }, '_id');
        } else if (recipientType === 'specific') {
            const user = await User.findOne({ email: specificEmail });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            recipients = [user];
        } else {
            return res.status(400).json({ message: 'Invalid recipient type' });
        }

        // Use the internal helper for each recipient
        const notifications = await Promise.all(recipients.map(user =>
            createNotificationInternal(user._id, type, title, body, {}, alertLevel)
        ));

        res.status(201).json({ message: `Notification sent to ${notifications.length} users` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createNotification,
    getMyNotifications,
    markRead,
    createNotificationInternal
};
