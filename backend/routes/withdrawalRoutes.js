const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
 
// 1. Request Withdrawal (Freelancer)
router.post('/', verifyToken, asyncHandler(async (req, res) => {
    const { amount, method, method_details } = req.body;
    const userId = req.user.id;
 
    if (!amount || !method || !method_details) {
        throw new AppError('Amount, method, and details are required', 400);
    }
 
    if (amount <= 0) {
        throw new AppError('Invalid withdrawal amount', 400);
    }
 
    await db.query('BEGIN');
    try {
        // Check balance
        const walletResult = await db.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
        if (walletResult.rows.length === 0 || walletResult.rows[0].balance < amount) {
            await db.query('ROLLBACK');
            throw new AppError('Insufficient balance', 400);
        }
 
        // Deduct from wallet immediately to "hold" funds
        await db.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, userId]);
 
        // Create withdrawal record
        const result = await db.query(
            'INSERT INTO withdrawals (user_id, amount, method, method_details) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, amount, method, method_details]
        );
 
        await db.query('COMMIT');
        res.status(210).json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));
 
// 2. Get My Withdrawals (Freelancer)
router.get('/me', verifyToken, asyncHandler(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(result.rows);
}));
 
// 3. Get All Pending Withdrawals (Admin)
router.get('/pending', verifyToken, checkPermission('user.verify'), asyncHandler(async (req, res) => {
    const result = await db.query(`
        SELECT w.*, u.first_name, u.last_name, u.email 
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
        WHERE w.status = 'pending'
        ORDER BY w.created_at ASC
    `);
    res.json(result.rows);
}));
 
// 4. Process Withdrawal (Admin)
router.post('/:id/review', verifyToken, checkPermission('user.verify'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
 
    await db.query('BEGIN');
    try {
        const withdrawalRes = await db.query('SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE', [id]);
        if (withdrawalRes.rows.length === 0) {
            await db.query('ROLLBACK');
            throw new AppError('Withdrawal request not found', 404);
        }
 
        const withdrawal = withdrawalRes.rows[0];
        if (withdrawal.status !== 'pending') {
            await db.query('ROLLBACK');
            throw new AppError('Withdrawal already processed', 400);
        }
 
        if (action === 'approve') {
            await db.query(
                "UPDATE withdrawals SET status = 'completed', processed_at = CURRENT_TIMESTAMP WHERE id = $1",
                [id]
            );
            // In a real app, integrate with Khalti Payout API or Bank API here
        } else {
            await db.query(
                "UPDATE withdrawals SET status = 'rejected', processed_at = CURRENT_TIMESTAMP WHERE id = $1",
                [id]
            );
            // REFUND the wallet
            await db.query(
                'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
                [withdrawal.amount, withdrawal.user_id]
            );
        }
 
        await db.query('COMMIT');
        res.json({ message: `Withdrawal ${action === 'approve' ? 'completed' : 'rejected'}` });
    } catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
}));
 
module.exports = router;
