const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Get all jobs posted by the current client
router.get('/jobs', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT j.*, COUNT(b.id) AS bid_count 
             FROM jobs j 
             LEFT JOIN bids b ON j.id = b.job_id 
             WHERE j.client_id = $1 
             GROUP BY j.id 
             ORDER BY j.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch client jobs error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
