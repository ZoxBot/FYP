const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkMessageAccess } = require('../middleware/messageMiddleware');
const { createNotification } = require('../utils/notificationService');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const validate = require('../middleware/validate');
const multer = require('multer');
const { chatStorage } = require('../cloudinary');
const upload = multer({ 
    storage: chatStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for chat files
});
const { messageSchema } = require('../validations/messageValidations');

// 0. Get All Conversations for a User
router.get('/conversations/all', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await db.query(
        `SELECT j.id as task_id, j.title, j.status, j.client_id, j.selected_freelancer_id,
        uc.first_name as client_fname, uc.last_name as client_lname, uc.avatar_url as client_avatar,
        uf.first_name as freelancer_fname, uf.last_name as freelancer_lname, uf.avatar_url as freelancer_avatar,
        (SELECT message FROM job_messages m WHERE m.task_id = j.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT attachment_url FROM job_messages m WHERE m.task_id = j.id ORDER BY m.created_at DESC LIMIT 1) as last_message_attachment_url,
        (SELECT attachment_type FROM job_messages m WHERE m.task_id = j.id ORDER BY m.created_at DESC LIMIT 1) as last_message_attachment_type,
        (SELECT created_at FROM job_messages m WHERE m.task_id = j.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
        FROM jobs j
        JOIN users uc ON j.client_id = uc.id
        JOIN users uf ON j.selected_freelancer_id = uf.id
        WHERE (j.client_id = $1 OR j.selected_freelancer_id = $1)
        AND j.selected_freelancer_id IS NOT NULL
        ORDER BY last_message_time DESC NULLS LAST, j.created_at DESC`,
        [userId]
    );
    res.json(result.rows);
}));

// 0.5. Upload a Chat Attachment
router.post('/:taskId/upload', verifyToken, checkMessageAccess, asyncHandler(async (req, res) => {
    return new Promise((resolve, reject) => {
        upload.single('file')(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                return reject(new AppError(err.message, 400));
            } else if (err) {
                return reject(new AppError(err.message, 400));
            }

            try {
                if (!req.file) {
                    return reject(new AppError('No file uploaded', 400));
                }

                res.json({
                    url: req.file.path,
                    type: req.file.mimetype
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}));

// 1. Send a Message in a Task
router.post('/:taskId', verifyToken, checkMessageAccess, validate(messageSchema), asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { message, attachment_url, attachment_type } = req.body;
    const senderId = req.user.id;
 
    const result = await db.query(
        'INSERT INTO job_messages (task_id, sender_id, message, attachment_url, attachment_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [taskId, senderId, message || null, attachment_url || null, attachment_type || null]
    );
 
    // Notify the other party
    const jobRes = await db.query('SELECT client_id, selected_freelancer_id, title FROM jobs WHERE id = $1', [taskId]);
    const job = jobRes.rows[0];
    const recipientId = (senderId === job.client_id) ? job.selected_freelancer_id : job.client_id;
 
    if (recipientId) {
        const senderRes = await db.query('SELECT first_name, last_name, avatar_url FROM users WHERE id = $1', [senderId]);
        const sender = senderRes.rows[0];
        const senderName = `${sender.first_name} ${sender.last_name}`;
 
        await createNotification(recipientId, 'new_message', {
            job_id: taskId,
            job_title: job.title,
            sender_name: senderName,
            message_snippet: attachment_url ? (attachment_type?.startsWith('image/') ? '📷 Image' : '📎 Attachment') : (message.substring(0, 50) + (message.length > 50 ? '...' : ''))
        });
 
        // real-time delivery to the chat room
        const { getIo } = require('../utils/notificationService');
        const io = getIo();
        if (io) {
            io.to(`chat_${taskId}`).emit('new_chat_message', {
                ...result.rows[0],
                first_name: sender.first_name,
                last_name: sender.last_name,
                avatar_url: sender.avatar_url
            });
        }
    }
 
    res.status(201).json(result.rows[0]);
}));

// 2. Get Messages for a Task
router.get('/:taskId', verifyToken, checkMessageAccess, asyncHandler(async (req, res) => {
    const { taskId } = req.params;
 
    const result = await db.query(
        `SELECT m.*, u.first_name, u.last_name, u.avatar_url 
         FROM job_messages m 
         JOIN users u ON m.sender_id = u.id 
         WHERE m.task_id = $1 
         ORDER BY m.created_at ASC`,
        [taskId]
    );
    res.json(result.rows);
}));

module.exports = router;
