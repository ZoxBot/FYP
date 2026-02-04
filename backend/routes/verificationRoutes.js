const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Unique filename: user-id-timestamp-ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'verification-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Images/PDF only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// 1. Submit Verification Request (User)
router.post('/verify', verifyToken, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        const userId = req.user.id;
        const documentPath = req.file.filename; // Store filename only

        // Check if pending request exists
        const existing = await db.query(
            "SELECT * FROM verification_requests WHERE user_id = $1 AND status = 'pending'",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending verification request.' });
        }

        await db.query(
            "INSERT INTO verification_requests (user_id, document_path) VALUES ($1, $2)",
            [userId, documentPath]
        );

        res.status(201).json({ message: 'Verification details submitted successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Get My Verification Status (User)
router.get('/status', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT status, document_path, created_at FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
            [req.user.id]
        );

        // Also get current user verification status directly from users table
        const userRes = await db.query("SELECT is_verified FROM users WHERE id = $1", [req.user.id]);
        const isVerified = userRes.rows[0].is_verified;

        res.json({
            isVerified: isVerified,
            pendingRequest: result.rows[0] || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Get All Pending Requests (Admin)
router.get('/pending', verifyToken, checkPermission('user.verify'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT vr.*, u.first_name, u.last_name, u.email 
            FROM verification_requests vr
            JOIN users u ON vr.user_id = u.id
            WHERE vr.status = 'pending'
            ORDER BY vr.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Approve/Reject Request (Admin)
router.post('/:id/review', verifyToken, checkPermission('user.verify'), async (req, res) => {
    const { id } = req.params; // Request ID
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    try {
        await db.query('BEGIN');

        const reqRes = await db.query("SELECT user_id, status FROM verification_requests WHERE id = $1", [id]);
        if (reqRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = reqRes.rows[0];
        if (request.status !== 'pending') {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Request is already processed' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        // Update request status
        await db.query("UPDATE verification_requests SET status = $1 WHERE id = $2", [newStatus, id]);

        // If approved, update user status
        if (action === 'approve') {
            await db.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [request.user_id]);
        }

        await db.query('COMMIT');
        res.json({ message: `Request ${newStatus}` });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
