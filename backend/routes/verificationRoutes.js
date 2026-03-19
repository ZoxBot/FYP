const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { verificationStorage } = require('../cloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const validate = require('../middleware/validate');
const { reviewVerificationSchema } = require('../validations/verificationValidations');

// Configure Multer Storage for Cloudinary
const upload = multer({
    storage: verificationStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// 1. Submit Verification Request (User)
router.post('/verify', verifyToken, checkPermission('verification.submit'), upload.single('document'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No document uploaded', 400);
    }
 
    const userId = req.user.id;
    const documentPath = req.file.path; // Cloudinary full URL
 
    // Check if pending request exists
    const existing = await db.query(
        "SELECT * FROM verification_requests WHERE user_id = $1 AND status = 'pending'",
        [userId]
    );
 
    if (existing.rows.length > 0) {
        throw new AppError('You already have a pending verification request.', 400);
    }
 
    // Clean up any previously REJECTED document if it exists
    const oldDocs = await db.query(
        "SELECT document_path FROM verification_requests WHERE user_id = $1 AND status = 'rejected'",
        [userId]
    );
 
    for (const row of oldDocs.rows) {
        await deleteFromCloudinary(row.document_path);
    }
 
    await db.query(
        "DELETE FROM verification_requests WHERE user_id = $1 AND status = 'rejected'",
        [userId]
    );
 
    await db.query(
        "INSERT INTO verification_requests (user_id, document_path) VALUES ($1, $2)",
        [userId, documentPath]
    );
 
    res.status(201).json({ message: 'Verification details submitted successfully.' });
}));

// 2. Get My Verification Status (User)
router.get('/status', verifyToken, asyncHandler(async (req, res) => {
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
}));

// 3. Get All Pending Requests (Admin)
router.get('/pending', verifyToken, checkPermission('user.verify'), asyncHandler(async (req, res) => {
    const result = await db.query(`
        SELECT vr.*, u.first_name, u.last_name, u.email 
        FROM verification_requests vr
        JOIN users u ON vr.user_id = u.id
        WHERE vr.status = 'pending'
        ORDER BY vr.created_at ASC
    `);
    res.json(result.rows);
}));

// 4. Approve/Reject Request (Admin)
router.post('/:id/review', verifyToken, checkPermission('user.verify'), validate(reviewVerificationSchema), asyncHandler(async (req, res) => {
    const { id } = req.params; // Request ID
    const { action } = req.body; // 'approve' or 'reject'
 
    await db.query('BEGIN');
    try {
        const reqRes = await db.query("SELECT user_id, status FROM verification_requests WHERE id = $1", [id]);
        if (reqRes.rows.length === 0) {
            await db.query('ROLLBACK');
            throw new AppError('Request not found', 404);
        }
 
        const request = reqRes.rows[0];
        if (request.status !== 'pending') {
            await db.query('ROLLBACK');
            throw new AppError('Request is already processed', 400);
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
        throw err;
    }
}));

module.exports = router;
