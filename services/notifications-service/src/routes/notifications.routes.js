const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.model');
const authenticateToken = require('../middleware/auth.middleware');

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        const type = req.query.type; // Optional filter by type

        const query = { userId: req.user.userId };
        if (type) {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Notification.countDocuments(query);

        res.json({
            notifications,
            total,
            limit,
            skip
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notifications',
            error: error.message 
        });
    }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.userId,
            isRead: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ 
            message: 'Failed to fetch unread count',
            error: error.message 
        });
    }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { 
                _id: req.params.id, 
                userId: req.user.userId 
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark notification as read',
            error: error.message 
        });
    }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { 
                userId: req.user.userId,
                isRead: false 
            },
            { isRead: true }
        );

        res.json({ 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark all notifications as read',
            error: error.message 
        });
    }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ 
            message: 'Notification deleted successfully',
            id: req.params.id
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ 
            message: 'Failed to delete notification',
            error: error.message 
        });
    }
});

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await Notification.aggregate([
            { $match: { userId: req.user.userId } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unread: {
                        $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                    }
                }
            }
        ]);

        const total = await Notification.countDocuments({ userId: req.user.userId });
        const totalUnread = await Notification.countDocuments({ 
            userId: req.user.userId,
            isRead: false 
        });

        res.json({
            total,
            totalUnread,
            byType: stats
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notification stats',
            error: error.message 
        });
    }
});

module.exports = router;
