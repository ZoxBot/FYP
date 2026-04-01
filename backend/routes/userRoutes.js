const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { avatarStorage } = require('../cloudinary');
const { deleteFromCloudinary } = require('../utils/cloudinaryHelper');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');

// Configure Multer for Avatars using Cloudinary storage
const upload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for profile pics
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// GET My Permissions (For standard users to verify access in frontend)
router.get('/me/permissions', verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role || '';
    const roleName = userRole ? (userRole.charAt(0).toUpperCase() + userRole.slice(1)) : '';
 
    const query = `
        SELECT DISTINCT p.slug 
        FROM permissions p
        LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
        LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id AND aur.user_id = $1
        LEFT JOIN admin_roles ar ON arp.role_id = ar.id
        LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id AND aup.user_id = $1
        LEFT JOIN admin_group_permissions agp ON p.id = agp.permission_id
        LEFT JOIN admin_user_groups aug ON agp.group_id = aug.group_id AND aug.user_id = $1
        WHERE 
            aur.user_id IS NOT NULL              -- User has role with this permission
            OR aup.user_id IS NOT NULL           -- User has direct permission
            OR (aug.user_id IS NOT NULL)         -- User is in group with this permission
            OR (ar.name = $2)                    -- FALLBACK: Permission belongs to user's primary role name
    `;
 
    const result = await db.query(query, [userId, roleName]);
    res.json(result.rows.map(r => r.slug));
}));

// GET Current User Profile
router.get('/me', verifyToken, asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT id, first_name, last_name, email, role, is_verified, bio, avatar_url, skills, 
                github_url, linkedin_url, dribbble_url, website_url,
                notification_settings, payment_settings, privacy_settings, created_at,
         (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = users.id) as avg_rating,
         (SELECT COUNT(*) FROM reviews WHERE reviewee_id = users.id) as review_count
         FROM users WHERE id = $1`,
        [req.user.id]
    );
    if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
    res.json(result.rows[0]);
}));

// GET Public User Profile
router.get('/:userId', asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT id, first_name, last_name, role, is_verified, bio, avatar_url, skills, 
                github_url, linkedin_url, dribbble_url, website_url, created_at,
         (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = users.id) as avg_rating,
         (SELECT COUNT(*) FROM reviews WHERE reviewee_id = users.id) as review_count
         FROM users WHERE id = $1`,
        [req.params.userId]
    );
    if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
    res.json(result.rows[0]);
}));

// UPDATE Profile (JSON Data)
router.put('/me', verifyToken, asyncHandler(async (req, res) => {
    const { first_name, last_name, bio, skills, github_url, linkedin_url, dribbble_url, website_url } = req.body;
 
    const result = await db.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, bio = $3, skills = $4, 
             github_url = $5, linkedin_url = $6, dribbble_url = $7, website_url = $8 
         WHERE id = $9 
         RETURNING id, first_name, last_name, email, role, is_verified, bio, avatar_url, skills, 
                   github_url, linkedin_url, dribbble_url, website_url`,
        [first_name, last_name, bio, skills || [], github_url, linkedin_url, dribbble_url, website_url, req.user.id]
    );
 
    if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
 
    res.json(result.rows[0]);
}));

// UPDATE Avatar (File)
router.post('/avatar', verifyToken, asyncHandler(async (req, res) => {
    return new Promise((resolve, reject) => {
        upload.single('avatar')(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return reject(new AppError('File too large. Maximum 2MB allowed.', 400));
                }
                return reject(new AppError(err.message, 400));
            } else if (err) {
                return reject(new AppError(err.message, 400));
            }
 
            try {
                if (!req.file) {
                    return reject(new AppError('No file uploaded', 400));
                }
 
                // Get current avatar to delete it from Cloudinary
                const oldUserRes = await db.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
                const oldAvatarUrl = oldUserRes.rows[0]?.avatar_url;
 
                const avatarUrl = req.file.path; // Cloudinary returns the full URL in path
                await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
 
                if (oldAvatarUrl) {
                    await deleteFromCloudinary(oldAvatarUrl);
                }
 
                res.json({ message: 'Avatar updated successfully', avatar_url: avatarUrl });
                resolve();
            } catch (dbErr) {
                reject(dbErr);
            }
        });
    });
}));

// REMOVE Avatar
router.delete('/avatar', verifyToken, asyncHandler(async (req, res) => {
    const userRes = await db.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    const oldAvatarUrl = userRes.rows[0]?.avatar_url;
 
    await db.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [req.user.id]);
 
    if (oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
    }
 
    res.json({ message: 'Avatar removed successfully' });
}));

// UPDATE Settings (JSONB fields)
router.patch('/me/settings', verifyToken, asyncHandler(async (req, res) => {
    const { notification_settings, payment_settings, privacy_settings } = req.body;
    const userId = req.user.id;
 
    let updateQuery = 'UPDATE users SET ';
    const updates = [];
    const values = [];
 
    if (notification_settings) {
        updates.push(`notification_settings = $${updates.length + 1}`);
        values.push(notification_settings);
    }
    if (payment_settings) {
        updates.push(`payment_settings = $${updates.length + 1}`);
        values.push(payment_settings);
    }
    if (privacy_settings) {
        updates.push(`privacy_settings = $${updates.length + 1}`);
        values.push(privacy_settings);
    }
 
    if (updates.length === 0) {
        throw new AppError('No settings provided for update', 400);
    }
 
    updateQuery += updates.join(', ') + ` WHERE id = $${updates.length + 1} RETURNING notification_settings, payment_settings, privacy_settings`;
    values.push(userId);
 
    const result = await db.query(updateQuery, values);
    res.json(result.rows[0]);
}));

// UPDATE Password
router.patch('/me/password', verifyToken, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
 
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) throw new AppError('User not found', 404);
 
    const { password_hash } = userRes.rows[0];
 
    // If user has no password (e.g. OAuth only), handle accordingly
    if (password_hash) {
        const isMatch = await bcrypt.compare(currentPassword, password_hash);
        if (!isMatch) throw new AppError('Incorrect current password', 400);
    }
 
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
 
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
 
    res.json({ message: 'Password updated successfully' });
}));

module.exports = router;
