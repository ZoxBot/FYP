const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const { portfolioStorage } = require('../cloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');

// Configure Multer for Portfolio
const upload = multer({
    storage: portfolioStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for portfolio images
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// 1. Get all tasks where the current user is the selected freelancer
router.get('/tasks', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM jobs WHERE selected_freelancer_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch freelancer tasks error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 2. Get all bids placed by the current freelancer
router.get('/bids', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT b.*, j.title as job_title, j.status as job_status 
             FROM bids b 
             JOIN jobs j ON b.job_id = j.id 
             WHERE b.freelancer_id = $1 
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch freelancer bids error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /portfolio
router.post('/portfolio', verifyToken, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const { title, description, project_url } = req.body;
        if (!title) return res.status(400).json({ message: 'Title is required' });

        try {
            const result = await db.query(
                'INSERT INTO portfolio_items (freelancer_id, title, description, image_url, project_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [req.user.id, title, description, req.file.path, project_url]
            );
            res.status(201).json(result.rows[0]);
        } catch (dbErr) {
            console.error('Add portfolio error:', dbErr);
            res.status(500).json({ message: 'Server error' });
        }
    });
});

// GET /portfolio (Own portfolio)
router.get('/portfolio', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM portfolio_items WHERE freelancer_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch portfolio error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /:id/portfolio (Specific freelancer's portfolio)
router.get('/:id/portfolio', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM portfolio_items WHERE freelancer_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch public portfolio error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /portfolio/:id
router.delete('/portfolio/:id', verifyToken, async (req, res) => {
    try {
        const itemRes = await db.query('SELECT * FROM portfolio_items WHERE id = $1 AND freelancer_id = $2', [req.params.id, req.user.id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ message: 'Portfolio item not found' });
        
        const item = itemRes.rows[0];
        await deleteFromCloudinary(item.image_url);
        
        await db.query('DELETE FROM portfolio_items WHERE id = $1', [req.params.id]);
        res.json({ message: 'Portfolio item deleted successfully' });
    } catch (err) {
        console.error('Delete portfolio error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Saved Jobs (Bookmarks) ---

// 1. Save a job
router.post('/saved-jobs', verifyToken, async (req, res) => {
    const { jobId } = req.body;
    try {
        await db.query(
            'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.user.id, jobId]
        );
        res.status(201).json({ message: 'Job saved successfully' });
    } catch (err) {
        console.error('Save job error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Remove a saved job
router.delete('/saved-jobs/:jobId', verifyToken, async (req, res) => {
    const { jobId } = req.params;
    try {
        await db.query(
            'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
            [req.user.id, jobId]
        );
        res.json({ message: 'Job removed from saved list' });
    } catch (err) {
        console.error('Remove saved job error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Get all saved jobs with details
router.get('/saved-jobs', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT j.*, u.first_name, u.last_name 
             FROM saved_jobs sj
             JOIN jobs j ON sj.job_id = j.id
             JOIN users u ON j.client_id = u.id
             WHERE sj.user_id = $1
             ORDER BY sj.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch saved jobs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Get only saved job IDs (for UI state)
router.get('/saved-jobs/ids', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT job_id FROM saved_jobs WHERE user_id = $1',
            [req.user.id]
        );
        res.json(result.rows.map(r => r.job_id));
    } catch (err) {
        console.error('Fetch saved job IDs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
