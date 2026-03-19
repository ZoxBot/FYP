const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');

// GET /api/notifications - Get all notifications for the current user
router.get('/', verifyToken, asyncHandler(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
    );
    res.json(result.rows);
}));

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', verifyToken, asyncHandler(async (req, res) => {
    const result = await db.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
}));

// PATCH /api/notifications/:id/read - Mark a notification as read
router.patch('/:id/read', verifyToken, asyncHandler(async (req, res) => {
    const result = await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
        [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
        throw new AppError('Notification not found', 404);
    }
    res.json(result.rows[0]);
}));

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', verifyToken, asyncHandler(async (req, res) => {
    await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
        [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
}));

module.exports = router;
