const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdminToken, checkPermission } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

// GET Admin Analytics Overview
router.get('/overview', verifyAdminToken, checkPermission('audit.view'), asyncHandler(async (req, res) => {
    // Current date - 30 days
    const days30Ago = new Date();
    days30Ago.setDate(days30Ago.getDate() - 30);

    // 1. User Growth (Daily counts)
    const userGrowth = await db.query(`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count 
        FROM users 
        WHERE created_at > $1
        GROUP BY 1 
        ORDER BY 1
    `, [days30Ago]);

    // 2. Job Posts (Daily counts)
    const jobGrowth = await db.query(`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count 
        FROM jobs 
        WHERE created_at > $1
        GROUP BY 1 
        ORDER BY 1
    `, [days30Ago]);

    // 3. Revenue (Daily sum of completed payments)
    // Assuming 'completed' status means revenue
    const revenueGrowth = await db.query(`
        SELECT DATE_TRUNC('day', created_at) as date, SUM(amount) as amount 
        FROM payments 
        WHERE created_at > $1 AND status = 'completed'
        GROUP BY 1 
        ORDER BY 1
    `, [days30Ago]);

    // 4. Distribution by role
    const roleDistribution = await db.query(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role
    `);

    // 5. Job status distribution
    const jobStatusDistribution = await db.query(`
        SELECT status, COUNT(*) as count FROM jobs GROUP BY status
    `);

    // 6. Category Distribution
    const categoryDistribution = await db.query(`
        SELECT category, COUNT(*) as count FROM jobs GROUP BY category ORDER BY count DESC
    `);

    res.json({
        user_growth: userGrowth.rows,
        job_growth: jobGrowth.rows,
        revenue_growth: revenueGrowth.rows,
        role_distribution: roleDistribution.rows,
        job_status: jobStatusDistribution.rows,
        category_distribution: categoryDistribution.rows
    });
}));

// GET CSV Export - Users
router.get('/export/users', verifyAdminToken, checkPermission('user.view'), asyncHandler(async (req, res) => {
    const result = await db.query('SELECT id, first_name, last_name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
}));

// GET CSV Export - Jobs
router.get('/export/jobs', verifyAdminToken, checkPermission('job.view'), asyncHandler(async (req, res) => {
    const result = await db.query('SELECT id, title, description, budget, status, created_at FROM jobs ORDER BY created_at DESC');
    res.json(result.rows);
}));

// GET CSV Export - Payments
router.get('/export/payments', verifyAdminToken, checkPermission('job.view'), asyncHandler(async (req, res) => {
    const result = await db.query('SELECT id, amount, status, created_at, client_id, freelancer_id, task_id FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
}));

module.exports = router;
