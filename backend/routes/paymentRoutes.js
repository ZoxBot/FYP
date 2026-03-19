const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_API_URL = 'https://dev.khalti.com/api/v2';

// 1. Initiate Payment
router.post('/initiate', verifyToken, async (req, res) => {
    const { bidId, amount, purchase_order_name } = req.body;

    if (!bidId || !amount) {
        return res.status(400).json({ message: 'Bid ID and amount are required' });
    }

    try {
        // Create unique purchase_order_id
        const purchase_order_id = `ORDER-${bidId}-${Date.now()}`;

        const payload = {
            return_url: `${process.env.CLIENT_URL || 'http://localhost:9002'}/payment-verification`,
            website_url: process.env.CLIENT_URL || 'http://localhost:9002',
            amount: Math.round(amount * 100), // Khalti expects amount in paisa
            purchase_order_id,
            purchase_order_name: purchase_order_name || 'Job Payment',
        };

        const response = await axios.post(`${KHALTI_API_URL}/epayment/initiate/`, payload, {
            headers: {
                Authorization: `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // Store transaction as pending
        await db.query(
            'INSERT INTO transactions (bid_id, purchase_order_id, pidx, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [bidId, purchase_order_id, response.data.pidx, amount, 'pending']
        );

        res.json({
            payment_url: response.data.payment_url,
            pidx: response.data.pidx
        });
    } catch (err) {
        console.error('Khalti Init Error:', err.response?.data || err.message);
        res.status(500).json({ message: 'Khalti payment initiation failed.' });
    }
});

// 2. Verify Payment (Callback)
router.get('/verify', verifyToken, async (req, res) => {
    const { pidx, purchase_order_id, status } = req.query;

    if (!pidx) {
        return res.status(400).json({ message: 'pidx is required' });
    }

    try {
        // Lookup transaction in Khalti
        const response = await axios.post(`${KHALTI_API_URL}/epayment/lookup/`, { pidx }, {
            headers: {
                Authorization: `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const khaltiStatus = response.data.status;

        if (khaltiStatus === 'Completed') {
            await db.query('BEGIN');

            // Update transaction status
            await db.query(
                'UPDATE transactions SET status = $1 WHERE pidx = $2',
                ['completed', pidx]
            );

            // Fetch bid to update job status
            const bidResult = await db.query(`
                SELECT b.*, j.title as job_title 
                FROM bids b 
                JOIN jobs j ON b.job_id = j.id 
                WHERE b.id = (SELECT bid_id FROM transactions WHERE pidx = $1)
            `, [pidx]);

            if (bidResult.rows.length > 0) {
                const bid = bidResult.rows[0];

                // Update Job: Set to in_progress, set freelancer and final price
                await db.query(
                    'UPDATE jobs SET status = $1, selected_freelancer_id = $2, final_price = $3 WHERE id = $4',
                    ['in_progress', bid.freelancer_id, bid.amount, bid.job_id]
                );

                // Update Bid: Set to accepted
                await db.query(
                    'UPDATE bids SET status = $1 WHERE id = $2',
                    ['accepted', bid.id]
                );

                // Update Other Bids: Set to rejected
                await db.query(
                    'UPDATE bids SET status = $1 WHERE job_id = $2 AND id != $3',
                    ['rejected', bid.job_id, bid.id]
                );

                // Create Payment record (Escrow Held)
                const transaction_id = `KHALTI-${pidx}`;
                await db.query(
                    'INSERT INTO payments (task_id, client_id, freelancer_id, amount, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
                    [bid.job_id, req.user.id, bid.freelancer_id, bid.amount, 'held', transaction_id]
                );
            }

            await db.query('COMMIT');
            res.json({ message: 'Payment verified and job started', status: 'completed' });
        } else {
            res.status(400).json({ message: `Payment failed with status: ${khaltiStatus}`, status: khaltiStatus });
        }
    } catch (err) {
        console.error('Khalti Verify Error:', err.response?.data || err.message);
        res.status(500).json({ message: 'Khalti payment verification failed.' });
    }
});

// 3. Simulate Escrow Payment (As requested for workflow)
router.post('/create', verifyToken, async (req, res) => {
    const { taskId, amount, freelancerId } = req.body;

    if (!taskId || !amount || !freelancerId) {
        return res.status(400).json({ message: 'Task ID, Amount, and Freelancer ID are required' });
    }

    try {
        const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [taskId]);
        if (jobResult.rows.length === 0) return res.status(404).json({ message: 'Job not found' });

        const job = jobResult.rows[0];

        // Authorization: Only job owner
        if (job.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Status check
        if (job.status !== 'pending_payment') {
            return res.status(400).json({ message: 'Job must be in pending_payment status.' });
        }

        // Feedback rule: Prevent Payment Replay
        const paymentCheck = await db.query('SELECT * FROM payments WHERE task_id = $1 AND status = $2', [taskId, 'held']);
        if (paymentCheck.rows.length > 0) {
            return res.status(400).json({ message: 'A payment already exists for this task in held status.' });
        }

        // Generate fake transaction_id
        const transaction_id = `ESCROW-${taskId}-${Date.now()}`;

        await db.query('BEGIN');

        // Note: amount might come from the client request or job.final_price. 
        // We will trust the backend final_price or amount provided if it matches.
        const paymentAmount = job.final_price || amount;

        // Insert payment record
        await db.query(
            'INSERT INTO payments (task_id, client_id, freelancer_id, amount, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [taskId, req.user.id, freelancerId, paymentAmount, 'held', transaction_id]
        );

        // Update Job Status
        const result = await db.query(
            'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
            ['in_progress', taskId]
        );

        await db.query('COMMIT');

        res.status(201).json({ message: 'Escrow payment simulated successfully', job: result.rows[0] });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Create payment error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 4. Get User Wallet
router.get('/wallet', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM wallets WHERE user_id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            // Lazy initialize if not found
            const newRes = await db.query(
                'INSERT INTO wallets (user_id, balance) VALUES ($1, 0) RETURNING *',
                [req.user.id]
            );
            return res.json(newRes.rows[0]);
        }
        
        // Also get some stats (Total Earned)
        const statsRes = await db.query(
            'SELECT SUM(amount) as total_escrow, SUM(net_amount) as total_earned FROM payments WHERE freelancer_id = $1 AND status = \'released\'',
            [req.user.id]
        );

        res.json({
            ...result.rows[0],
            stats: statsRes.rows[0]
        });
    } catch (err) {
        console.error('Wallet fetch error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 5. Get Transaction History
router.get('/history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch Payments (Incoming/Outgoing)
        const paymentsRes = await db.query(
            `SELECT p.*, j.title as job_title, 
                    u_client.first_name as client_name, 
                    u_freelancer.first_name as freelancer_name
             FROM payments p
             JOIN jobs j ON p.task_id = j.id
             LEFT JOIN users u_client ON p.client_id = u_client.id
             LEFT JOIN users u_freelancer ON p.freelancer_id = u_freelancer.id
             WHERE p.client_id = $1 OR p.freelancer_id = $1
             ORDER BY p.created_at DESC`,
            [userId]
        );
 
        // Fetch Withdrawals
        const withdrawalsRes = await db.query(
            'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
 
        res.json({
            payments: paymentsRes.rows,
            withdrawals: withdrawalsRes.rows
        });
    } catch (err) {
        console.error('History fetch error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
 
module.exports = router;
