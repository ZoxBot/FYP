const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const { ticketStorage } = require('../cloudinary');
const { verifyToken, checkPermission, hasPermission } = require('../middleware/authMiddleware');

// Configure Multer for support attachments using Cloudinary
const upload = multer({
    storage: ticketStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 1. Create a Ticket (User - Universal)
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
    const { subject, category, description } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    try {
        const result = await db.query(
            'INSERT INTO tickets (user_id, subject, category, description, has_unread_admin) VALUES ($1, $2, $3, $4, true) RETURNING *',
            [userId, subject, category, description]
        );
        const ticket = result.rows[0];

        // Store attachments
        for (const file of files) {
            await db.query(
                'INSERT INTO ticket_attachments (ticket_id, file_path, file_type) VALUES ($1, $2, $3)',
                [ticket.id, file.path, file.mimetype]
            );
        }

        res.status(201).json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 2. Get Own Tickets (User - Universal)
router.get('/my', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            'SELECT * FROM tickets WHERE user_id = $1 AND is_deleted_by_user = false ORDER BY updated_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 3. Get Ticket Details + Messages (Universal for owner, Permission for admin)
router.get('/:id', verifyToken, async (req, res) => {
    const ticketId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Find ticket
        const ticketResult = await db.query(`
            SELECT t.*, u.first_name, u.last_name, u.email,
                   c.first_name as claim_first_name, c.last_name as claim_last_name
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users c ON t.claimed_by = c.id
            WHERE t.id = $1
        `, [ticketId]);

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const ticket = ticketResult.rows[0];

        // Dynamic Authorization: Must be owner OR have ticket.manage
        const canManage = await hasPermission(userId, userRole, 'ticket.manage');

        if (ticket.user_id !== userId && !canManage) {
            return res.status(403).json({ message: 'You do not have permission to view this ticket.' });
        }

        // Clear unread flags
        if (canManage) {
            await db.query('UPDATE tickets SET has_unread_admin = false WHERE id = $1', [ticketId]);
        } else {
            await db.query('UPDATE tickets SET has_unread_user = false WHERE id = $1', [ticketId]);
        }

        // Get messages
        const messagesResult = await db.query(`
            SELECT tm.*, u.first_name, u.last_name, u.role,
                   (SELECT json_agg(ta.*) FROM ticket_attachments ta WHERE ta.message_id = tm.id) as attachments
            FROM ticket_messages tm
            JOIN users u ON tm.sender_id = u.id
            WHERE tm.ticket_id = $1
            ORDER BY tm.created_at ASC
        `, [ticketId]);

        // Get ticket-level attachments (those without a message_id)
        const ticketAttachments = await db.query(
            'SELECT * FROM ticket_attachments WHERE ticket_id = $1 AND message_id IS NULL',
            [ticketId]
        );

        // Anonymize Admin info for User POV
        if (!canManage) {
            ticket.claimed_by = ticket.claimed_by ? true : false;
            ticket.claim_first_name = ticket.claim_first_name ? 'Kaamko Kura' : null;
            ticket.claim_last_name = ticket.claim_last_name ? 'Admin' : null;
        }

        // Sanitize names for User POV (Anonymity)
        const sanitizedMessages = messagesResult.rows.map(msg => {
            const isAdmin = msg.role === 'admin' || msg.role === 'Administrator' || msg.role === 'Admin' || msg.role === 'Higher Admin';
            // If the viewer is NOT the admin manager, hide the admin's real name
            if (!canManage && isAdmin) {
                return {
                    ...msg,
                    first_name: 'Kaamko Kura',
                    last_name: 'Admin'
                };
            }
            return msg;
        });

        res.json({
            ...ticket,
            attachments: ticketAttachments.rows,
            messages: sanitizedMessages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 4. Add Message to Ticket (Owner or permissioned admin)
router.post('/:id/messages', verifyToken, upload.array('images', 5), async (req, res) => {
    const ticketId = req.params.id;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const files = req.files || [];

    try {
        // Verify ticket exists and user has access
        const ticketResult = await db.query('SELECT user_id FROM tickets WHERE id = $1', [ticketId]);
        if (ticketResult.rows.length === 0) return res.status(404).json({ message: 'Ticket not found.' });

        const ticket = ticketResult.rows[0];
        const canManage = await hasPermission(userId, userRole, 'ticket.manage');

        if (ticket.user_id !== userId && !canManage) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Block replies for closed tickets (Admin can still reply)
        const checkStatus = await db.query('SELECT status FROM tickets WHERE id = $1', [ticketId]);
        if (checkStatus.rows[0].status === 'closed' && !canManage) {
            return res.status(400).json({ message: 'This ticket is closed and no longer accepting replies.' });
        }

        const result = await db.query(
            'INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *',
            [ticketId, userId, message]
        );
        const newMessage = result.rows[0];

        // Update unread flag for the OTHER party
        if (canManage) {
            await db.query('UPDATE tickets SET has_unread_user = true, updated_at = NOW() WHERE id = $1', [ticketId]);
        } else {
            await db.query('UPDATE tickets SET has_unread_admin = true, updated_at = NOW() WHERE id = $1', [ticketId]);
        }

        // Store attachments for message
        for (const file of files) {
            await db.query(
                'INSERT INTO ticket_attachments (ticket_id, message_id, file_path, file_type) VALUES ($1, $2, $3, $4)',
                [ticketId, newMessage.id, file.path, file.mimetype]
            );
        }

        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 5. Soft-Delete Ticket (Owner Only)
router.delete('/:id', verifyToken, async (req, res) => {
    const ticketId = req.params.id;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'UPDATE tickets SET is_deleted_by_user = true, status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id',
            ['closed', ticketId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found or unauthorized.' });
        }

        res.json({ message: 'Ticket successfully removed from your view.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

module.exports = router;
