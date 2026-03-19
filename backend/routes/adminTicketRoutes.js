const express = require('express');
const router = express.Router();
const db = require('../db');
const { checkPermission } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/auditLogger');

// 1. Get All Tickets (Admin Overview)
router.get('/', checkPermission('ticket.manage'), async (req, res) => {
    try {
        const { status, priority } = req.query;
        let query = `
            SELECT t.*, u.first_name, u.last_name, u.email,
                   c.first_name as claim_first_name, c.last_name as claim_last_name
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users c ON t.claimed_by = c.id
            WHERE t.is_archived = false
        `;
        const params = [];
        let pIndex = 1;

        if (status) {
            query += ` AND t.status = $${pIndex++}`;
            params.push(status);
        }
        if (priority) {
            query += ` AND t.priority = $${pIndex++}`;
            params.push(priority);
        }

        query += ` ORDER BY t.updated_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 2. Ticket Stats (For Admin Dashboard)
router.get('/stats', checkPermission('ticket.manage'), async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'open') as open,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'closed') as closed
            FROM tickets
            WHERE is_archived = false
        `);
        res.json(stats.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 3. Claim Ticket
router.post('/:id/claim', checkPermission('ticket.claim'), async (req, res) => {
    const ticketId = req.params.id;
    const adminId = req.user.id;

    try {
        const result = await db.query(
            'UPDATE tickets SET claimed_by = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [adminId, 'in_progress', ticketId]
        );

        const ticket = result.rows[0];
        await logAdminAction(adminId, 'claim_ticket', 'ticket', ticketId, { status: 'in_progress' }, req);
        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 4. Update Ticket (Status/Priority/Archive)
router.patch('/:id', checkPermission('ticket.manage'), async (req, res) => {
    const { status, priority, is_archived } = req.body;
    const ticketId = req.params.id;

    try {
        const updates = [];
        const values = [];
        let i = 1;

        if (status) { updates.push(`status = $${i++}`); values.push(status); }
        if (priority) { updates.push(`priority = $${i++}`); values.push(priority); }
        if (is_archived !== undefined) { updates.push(`is_archived = $${i++}`); values.push(is_archived); }

        if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

        values.push(ticketId);
        const query = `UPDATE tickets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;

        const result = await db.query(query, values);
        const ticket = result.rows[0];
        await logAdminAction(req.user.id, 'update_ticket', 'ticket', ticketId, { status, priority, is_archived }, req);
        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 5. Delete Ticket
router.delete('/:id', checkPermission('ticket.delete'), async (req, res) => {
    const ticketId = req.params.id;
    try {
        await db.query('DELETE FROM ticket_messages WHERE ticket_id = $1', [ticketId]);
        await db.query('DELETE FROM tickets WHERE id = $1', [ticketId]);
        await logAdminAction(req.user.id, 'delete_ticket', 'ticket', ticketId, {}, req);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
