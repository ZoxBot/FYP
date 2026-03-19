const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
require('dotenv').config();

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Fetch user and check role
        const result = await db.query(
            'SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Access Restricted to Administrators' });
        }

        const user = result.rows[0];

        // 2. Strict Role Check
        if (user.role !== 'admin') {
            // Log failed attempt for audit
            console.warn(`[AUDIT] Unauthorized admin login attempt by ${email}`);
            return res.status(403).json({ message: 'Access Restricted to Administrators' });
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Generate Dedicated Admin Token
        const adminToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                scope: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Shorter TTL
        );

        // 5. Audit Log Login
        console.log(`[AUDIT] Admin ${user.email} logged in at ${new Date().toISOString()}`);

        res.json({
            message: 'Admin authentication successful',
            admin_token: adminToken,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/auth/me
router.get('/me', async (req, res) => {
    // This will be protected by verifyAdminToken in server.js/index.js if applied globally or locally
    // For now, simple check or assume middleware handles it
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.scope !== 'admin') return res.status(403).json({ message: 'Invalid scope' });

        const result = await db.query(
            'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
            [verified.id]
        );

        res.json(result.rows[0]);
    } catch (e) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
