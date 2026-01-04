const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const session = require('express-session');
const passport = require('./passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes

// Signup
app.post('/api/auth/signup', async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role',
            [first_name, last_name, email, hashedPassword, role]
        );

        const newUser = result.rows[0];

        // Create token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: newUser,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check user
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        // If user created via OAuth, they might not have a password
        if (!user.password_hash) {
            return res.status(400).json({ message: 'Please login with Google or Facebook' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// OAuth Routes

// Google
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Redirect to frontend with token
        // In production, use a more secure way (e.g., httpOnly cookie or separate exchange)
        // For this MVP, query param is acceptable but not ideal.
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
);

// Facebook
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
