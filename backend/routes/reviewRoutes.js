const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const validate = require('../middleware/validate');
const { reviewSchema } = require('../validations/reviewValidations');

// POST /api/reviews - Leave a review for a job
router.post('/', verifyToken, validate(reviewSchema), asyncHandler(async (req, res) => {
    const { job_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;
 
    // 1. Check if job exists and is completed
    const jobRes = await db.query('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (jobRes.rows.length === 0) {
        throw new AppError('Job not found', 404);
    }
 
    const job = jobRes.rows[0];
    if (job.status !== 'completed') {
        throw new AppError('Reviews can only be left for completed jobs', 400);
    }
 
    // 2. Identify the reviewee
    let reviewee_id;
    if (reviewer_id === job.client_id) {
        reviewee_id = job.selected_freelancer_id;
    } else if (reviewer_id === job.selected_freelancer_id) {
        reviewee_id = job.client_id;
    } else {
        throw new AppError('You are not authorized to review this job', 403);
    }
 
    if (!reviewee_id) {
        throw new AppError('Reviewee not found for this job', 400);
    }
 
    // 3. Insert review
    // Note: Database unique constraint will be caught by asyncHandler/globalErrorHandler
    const result = await db.query(
        'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [job_id, reviewer_id, reviewee_id, rating, comment]
    );
 
    res.status(201).json(result.rows[0]);
}));

// GET /api/reviews/user/:userId - Get all reviews for a user
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
 
    const result = await db.query(`
        SELECT r.*, 
               u.first_name as reviewer_first_name, 
               u.last_name as reviewer_last_name,
               u.avatar_url as reviewer_avatar_url,
               j.title as job_title
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        JOIN jobs j ON r.job_id = j.id
        WHERE r.reviewee_id = $1
        ORDER BY r.created_at DESC
    `, [userId]);
 
    res.json(result.rows);
}));

// GET /api/reviews/job/:jobId - Get reviews for a specific job
router.get('/job/:jobId', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
 
    const result = await db.query(`
        SELECT r.*, u.first_name, u.last_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.job_id = $1
    `, [jobId]);
 
    res.json(result.rows);
}));

module.exports = router;
