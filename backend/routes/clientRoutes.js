const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Get all jobs posted by the current client
router.get('/jobs', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM jobs WHERE client_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch client jobs error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
