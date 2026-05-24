const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationService');
const multer = require('multer');
const { submissionStorage } = require('../cloudinary');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { bidSchema, disputeSchema } = require('../validations/jobValidations');
 
const jobSchema = z.object({
    body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
        budget: z.preprocess((val) => Number(val), z.number().positive("Budget must be a positive number")),
        category: z.string().min(1, "Category is required"),
        deadline: z.string().optional(),
    }),
});

// Configure Multer for Submissions
const uploadSubmission = multer({
    storage: submissionStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for submissions
});

// 1. Post a Job (Moved from server.js)
router.post('/', verifyToken, checkPermission('job.post'), validate(jobSchema), asyncHandler(async (req, res) => {
    const { title, description, budget, deadline, category } = req.body;
 
    const result = await db.query(
        "INSERT INTO jobs (client_id, title, description, budget, deadline, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [req.user.id, title, description, budget, deadline, category]
    );
    res.status(201).json(result.rows[0]);
}));

// 2. Get All Jobs (with filters & pagination)
router.get('/', async (req, res) => {
    try {
        const { search, category, min_budget, max_budget, status, sort, page = 1, limit = 10 } = req.query;
        const p = parseInt(page);
        const l = parseInt(limit);
        const offset = (p - 1) * l;
 
        let filterQuery = '';
        const params = [];
        let paramIndex = 1;
 
        if (search) {
            filterQuery += ` AND (j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (category && category !== 'all' && category !== 'All') {
            filterQuery += ` AND j.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (min_budget) {
            filterQuery += ` AND j.budget >= $${paramIndex}`;
            params.push(min_budget);
            paramIndex++;
        }
        if (max_budget) {
            filterQuery += ` AND j.budget <= $${paramIndex}`;
            params.push(max_budget);
            paramIndex++;
        }
        if (status && status !== 'all' && status !== 'All') {
            const dbStatus = status === 'open' ? 'active' : status;
            filterQuery += ` AND j.status = $${paramIndex}`;
            params.push(dbStatus);
            paramIndex++;
        }
 
        // 1. Get total count for pagination metadata
        const countQuery = `
            SELECT COUNT(*) 
            FROM jobs j 
            JOIN users u ON j.client_id = u.id
            WHERE 1=1 ${filterQuery}
        `;
        const countResult = await db.query(countQuery, params);
        const totalItems = parseInt(countResult.rows[0].count);
 
        // 2. Get paginated results
        let query = `
            SELECT j.*, u.first_name AS client_first_name, u.last_name AS client_last_name
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            WHERE 1=1 ${filterQuery}
        `;
 
        if (sort === 'budget_asc') {
            query += ' ORDER BY j.budget ASC';
        } else if (sort === 'budget_desc') {
            query += ' ORDER BY j.budget DESC';
        } else if (sort === 'oldest') {
            query += ' ORDER BY j.created_at ASC';
        } else {
            query += ' ORDER BY j.created_at DESC';
        }
 
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(l, offset);
 
        const result = await db.query(query, params);
        
        res.json({
            jobs: result.rows,
            pagination: {
                total: totalItems,
                page: p,
                limit: l,
                totalPages: Math.ceil(totalItems / l)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end.' });
    }
});

// 2.5 Get a Single Job
router.get('/:id', asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT j.*, u.first_name AS client_first_name, u.last_name AS client_last_name, u.avatar_url AS client_avatar, u.is_verified AS client_is_verified
         FROM jobs j
         JOIN users u ON j.client_id = u.id
         WHERE j.id = $1`,
        [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Job not found', 404);
    res.json(result.rows[0]);
}));

// 3. Submit a Bid (Freelancer only)
router.post('/:id/bids', verifyToken, validate(bidSchema), asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const { amount, proposal } = req.body;
    const freelancerId = req.user.id;

 
    // Check if job exists and is open
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
    if (job.status !== 'open') {
        throw new AppError('Job is not open for bidding.', 400);
    }
    if (job.client_id === freelancerId) {
        throw new AppError('You cannot bid on your own job.', 400);
    }
 
    const result = await db.query(
        "INSERT INTO bids (job_id, freelancer_id, amount, proposal) VALUES ($1, $2, $3, $4) RETURNING *",
        [jobId, freelancerId, amount, proposal]
    );
 
    // Notify Job Owner
    const freelancerRes = await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [freelancerId]);
    const freelancerName = `${freelancerRes.rows[0].first_name} ${freelancerRes.rows[0].last_name}`;
 
    await createNotification(job.client_id, 'new_bid', {
        job_id: jobId,
        job_title: job.title,
        freelancer_name: freelancerName,
        amount: amount
    });
 
    res.status(201).json(result.rows[0]);
}));

// 4. Get Bids for a Job (Owner, Admin, or Freelancer)
router.get('/:id/bids', verifyToken, asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const jobResult = await db.query('SELECT client_id FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const isOwner = jobResult.rows[0].client_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isFreelancer = req.user.role === 'freelancer';
 
    // Authorization: Only client who posted the job, an admin, or a freelancer
    if (!isOwner && !isAdmin && !isFreelancer) {
        throw new AppError('Unauthorized access to bids.', 403);
    }
 
    const result = await db.query(
        `SELECT b.*, u.first_name, u.last_name, u.email, u.avatar_url, u.is_verified
         FROM bids b
         JOIN users u ON b.freelancer_id = u.id
         WHERE b.job_id = $1
         ORDER BY b.created_at DESC`,
        [jobId]
    );
 
    let bids = result.rows;
 
    // Mask sensitive info for other freelancers
    if (!isOwner && !isAdmin) {
        bids = bids.map(bid => {
            if (bid.freelancer_id !== req.user.id) {
                return {
                    ...bid,
                    email: 'hidden@example.com',
                }
            }
            return bid;
        });
    }
    res.json(bids);
}));

// 5. Update Bid Status (Accept)
router.put('/bids/:id/accept', verifyToken, asyncHandler(async (req, res) => {
    const bidId = req.params.id;
 
    // Authorization: Check if req.user.id is the owner of the job the bid belongs to
    const bidResult = await db.query(
        'SELECT b.*, j.client_id, j.status as job_status, j.title as job_title FROM bids b JOIN jobs j ON b.job_id = j.id WHERE b.id = $1',
        [bidId]
    );
 
    if (bidResult.rows.length === 0) throw new AppError('Bid not found', 404);
 
    const bid = bidResult.rows[0];
 
    if (bid.client_id !== req.user.id) {
        throw new AppError('Unauthorized', 403);
    }
 
    // Feedback rule: Prevent Accept After Bids Already Accepted
    if (bid.job_status !== 'open' && bid.job_status !== 'active') { // Added 'active' just in case
        throw new AppError('Cannot accept bid. Job is no longer open.', 400);
    }
 
    // Use DB transaction
    await db.query('BEGIN');
    try {
        // Update Job
        await db.query(
            'UPDATE jobs SET status = $1, selected_freelancer_id = $2, final_price = $3 WHERE id = $4',
            ['pending_payment', bid.freelancer_id, bid.amount, bid.job_id]
        );
 
        // Update Accepted Bid
        const result = await db.query(
            'UPDATE bids SET status = $1 WHERE id = $2 RETURNING *',
            ['accepted', bidId]
        );
 
        // Update Other Bids to Rejected
        const otherBids = await db.query(
            'UPDATE bids SET status = $1 WHERE job_id = $2 AND id != $3 RETURNING freelancer_id',
            ['rejected', bid.job_id, bidId]
        );
 
        // Notify Accepted Freelancer
        await createNotification(bid.freelancer_id, 'bid_accepted', {
            job_id: bid.job_id,
            job_title: bid.job_title,
            amount: bid.amount
        });
 
        // Notify Rejected Freelancers
        for (const otherBid of otherBids.rows) {
            await createNotification(otherBid.freelancer_id, 'bid_rejected', {
                job_id: bid.job_id,
                job_title: bid.job_title
            });
        }
 
        await db.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));

// 6. Complete Job (Freelancer marks complete)
router.put('/:id/complete', verifyToken, uploadSubmission.single('attachment'), asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const { submission_message } = req.body;
    const submission_attachment_url = req.file ? req.file.path : null;
 
    if (!submission_message && !submission_attachment_url) {
        throw new AppError('A message or attachment is required to submit work.', 400);
    }
 
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
 
    // Authorization: Only selected freelancer
    if (job.selected_freelancer_id !== req.user.id) {
        throw new AppError('Unauthorized. Only the selected freelancer can complete this.', 403);
    }
 
    // Status Check
    if (job.status !== 'in_progress') {
        throw new AppError('Job must be in progress to be completed.', 400);
    }
 
    const result = await db.query(
        'UPDATE jobs SET status = $1, submission_message = $2, submission_attachment_url = $3 WHERE id = $4 RETURNING *',
        ['awaiting_confirmation', submission_message, submission_attachment_url, jobId]
    );
 
    // Notify Client
    const freelancerRes = await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
    const freelancerName = `${freelancerRes.rows[0].first_name} ${freelancerRes.rows[0].last_name}`;
 
    await createNotification(job.client_id, 'job_awaiting_confirmation', {
        job_id: jobId,
        job_title: job.title,
        freelancer_name: freelancerName
    });
 
    res.json(result.rows[0]);
}));

// 7. Confirm Job Completion (Client confirms)
router.put('/:id/confirm', verifyToken, asyncHandler(async (req, res) => {
    const jobId = req.params.id;
 
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
 
    // Authorization: Only job owner
    if (job.client_id !== req.user.id) {
        throw new AppError('Unauthorized', 403);
    }
 
    // Final Double-Action Prevention: Ensure job not already completed
    if (job.status === 'completed') {
        throw new AppError('Job is already completed.', 400);
    }
    if (job.status !== 'awaiting_confirmation') {
        throw new AppError('Job must be awaiting confirmation.', 400);
    }
 
    await db.query('BEGIN');
    try {
        // Update job
        const result = await db.query(
            'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
            ['completed', jobId]
        );
 
        // Commission Calculation (5%)
        const totalAmount = job.final_price;
        const commissionRate = 0.05;
        const commissionAmount = totalAmount * commissionRate;
        const netAmount = totalAmount - commissionAmount;
 
        // Update payment to released with commission details
        await db.query(
            'UPDATE payments SET status = $1, commission_amount = $2, net_amount = $3 WHERE task_id = $4',
            ['released', commissionAmount, netAmount, jobId]
        );
 
        // Update Freelancer Wallet (Increment balance)
        await db.query(
            `INSERT INTO wallets (user_id, balance) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id) 
             DO UPDATE SET balance = wallets.balance + $2, updated_at = CURRENT_TIMESTAMP`,
            [job.selected_freelancer_id, netAmount]
        );
 
        await db.query('COMMIT');
 
        // Notify Freelancer
        await createNotification(job.selected_freelancer_id, 'job_completed', {
            job_id: jobId,
            job_title: job.title,
            amount: job.final_price
        });
 
        res.json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));

// 2.6 Update a Job (Owner only, before bid accepted)
router.put('/:id', verifyToken, asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const { title, description, budget, deadline, category } = req.body;
 
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
 
    // Authorization
    if (job.client_id !== req.user.id) {
        throw new AppError('Unauthorized. You are not the owner of this job.', 403);
    }
 
    // Constraint: Only allow edit if status is 'active' or 'open' (and no freelancer selected)
    if (job.status !== 'active' && job.status !== 'open') {
        throw new AppError('Cannot edit job once a bid has been accepted or the process has started.', 400);
    }
 
    const result = await db.query(
        `UPDATE jobs 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             budget = COALESCE($3, budget), 
             deadline = COALESCE($4, deadline), 
             category = COALESCE($5, category),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 RETURNING *`,
        [title, description, budget, deadline, category, jobId]
    );
 
    res.json(result.rows[0]);
}));

// 2.7 Delete a Job (Owner only, before bid accepted)
router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
    const jobId = req.params.id;
 
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
 
    // Authorization
    if (job.client_id !== req.user.id) {
        throw new AppError('Unauthorized', 403);
    }
 
    // Constraint
    if (job.status !== 'active' && job.status !== 'open') {
        throw new AppError('Cannot delete job once it is in progress.', 400);
    }
 
    // Use transaction to ensure bids are also handled or check if bids exist
    await db.query('BEGIN');
    try {
        await db.query('DELETE FROM bids WHERE job_id = $1', [jobId]);
        await db.query('DELETE FROM jobs WHERE id = $1', [jobId]);
        await db.query('COMMIT');
        res.json({ message: 'Job deleted successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));

// 8. Open a Dispute
router.post('/:id/dispute', verifyToken, validate(disputeSchema), asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    const { reason } = req.body;

 
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) throw new AppError('Job not found', 404);
 
    const job = jobResult.rows[0];
 
    // Authorization: Only owner or selected freelancer
    if (job.client_id !== req.user.id && job.selected_freelancer_id !== req.user.id) {
        throw new AppError('Unauthorized. Only parties involved can dispute this job.', 403);
    }
 
    // Status Check: Can only dispute if in_progress or awaiting_confirmation
    if (job.status !== 'in_progress' && job.status !== 'awaiting_confirmation') {
        throw new AppError('Dispute can only be opened for active contracts.', 400);
    }
 
    await db.query('BEGIN');
    try {
        // Update Job Status
        await db.query("UPDATE jobs SET status = 'disputed' WHERE id = $1", [jobId]);
 
        // Create Dispute Record
        const dispute = await db.query(
            "INSERT INTO disputes (job_id, initiator_id, reason) VALUES ($1, $2, $3) RETURNING *",
            [jobId, req.user.id, reason]
        );
 
        // Notify other party
        const recipientId = job.client_id === req.user.id ? job.selected_freelancer_id : job.client_id;
        await createNotification(recipientId, 'dispute_opened', {
            job_id: jobId,
            job_title: job.title,
            reason: reason
        });
 
        await db.query('COMMIT');
        res.status(201).json(dispute.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));

module.exports = router;
