require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookie = require('cookie');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const session = require('express-session');
const passport = require('./passport');
const cookieParser = require('cookie-parser');
const { verifyAdminToken, verifyToken } = require('./middleware/authMiddleware');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const AppError = require('./utils/AppError');
const validate = require('./middleware/validate');
const { signupSchema, loginSchema, otpSchema, forgotPasswordSchema, resetPasswordSchema } = require('./validations/authValidations');
const globalErrorHandler = require('./middleware/errorMiddleware');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Socket.io connection logic
const { setIo } = require('./utils/notificationService');
setIo(io);
 
// Socket.io Auth Middleware
io.use((socket, next) => {
    let token = socket.handshake.auth?.token;
 
    // Fallback to cookie if token not in auth (useful for HttpOnly cookies)
    if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.token;
    }
 
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
 
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
        socket.user = decoded;
        next();
    });
});
 
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id, 'User ID:', socket.user.id);
 
    // Automatically join the user's private notification room
    socket.join(`user_${socket.user.id}`);
 
    // Real-time Chat: Join a specific task's chat room
    socket.on('join_chat', async (taskId) => {
        // Security: In a production app, we would verify the user has access to this task
        // const hasAccess = await db.query('SELECT 1 FROM ... WHERE user_id = $1 AND task_id = $2', [socket.user.id, taskId]);
        // if (!hasAccess.rows.length) return;
        
        socket.join(`chat_${taskId}`);
        console.log(`User ${socket.user.id} joined chat room chat_${taskId}`);
    });
 
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'secret_key'));
 
// Session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Signup
app.post('/api/auth/signup', authLimiter, validate(signupSchema), asyncHandler(async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;
 
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
        throw new AppError('User already exists', 400);
    }
 
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
 
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
 
    // Insert user
    const result = await db.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, verification_otp, otp_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, role',
        [first_name, last_name, email, hashedPassword, role, otp, otpExpires]
    );
 
    const newUser = result.rows[0];
 
    // Send OTP Email
    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
        // If email fails, we might want to delete the user to allow retrying, 
        // but for now, we'll just throw an error so the signup doesn't "succeed" partially.
        await db.query('DELETE FROM users WHERE id = $1', [newUser.id]);
        throw new AppError('Failed to send verification email. Please try again.', 500);
    }

    // Create token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
 
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600000 // 1 hour
    });
 
    res.status(201).json({
        message: 'User created successfully. Please verify your email.',
        token,
        user: newUser,
    });
}));

// Login
app.post('/api/auth/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
 
    // Check user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
    }
 
    const user = result.rows[0];
 
    if (user.is_banned) {
        throw new AppError('Your account has been banned. Please contact support.', 403);
    }
 
    // Check password
    if (!user.password_hash) {
        throw new AppError('Please login with Google or Facebook', 400);
    }
 
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }
 
    // Check Email Verification
    if (!user.is_email_verified) {
        return res.status(401).json({ 
            message: 'Please verify your email address to continue.',
            unverified: true,
            email: user.email 
        });
    }
 
    // Create token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
 
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600000 // 1 hour
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
            is_verified: user.is_verified,
            is_email_verified: user.is_email_verified
        },
    });
}));

// Verify OTP
app.post('/api/auth/verify-otp', validate(otpSchema), asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
 
    const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND verification_otp = $2 AND otp_expires_at > NOW()',
        [email, otp]
    );
 
    if (result.rows.length === 0) {
        throw new AppError('Invalid or expired OTP', 400);
    }
 
    const user = result.rows[0];
 
    await db.query(
        'UPDATE users SET is_email_verified = TRUE, verification_otp = NULL, otp_expires_at = NULL WHERE id = $1',
        [user.id]
    );
 
    res.json({ message: 'Email verified successfully' });
}));

// Resend OTP
app.post('/api/auth/resend-otp', asyncHandler(async (req, res) => {
    const { email } = req.body;
 
    if (!email) {
        throw new AppError('Email is required', 400);
    }
 
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
 
    await db.query(
        'UPDATE users SET verification_otp = $1, otp_expires_at = $2 WHERE email = $3',
        [otp, otpExpires, email]
    );
 
    await sendOTP(email, otp);
 
    res.json({ message: 'OTP resent successfully' });
}));

// Forgot Password
app.post('/api/auth/forgot-password', authLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
    const { email } = req.body;
 
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
        throw new AppError('User not found', 404);
    }
 
    const userId = userRes.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
 
    await db.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
        [token, expires, userId]
    );
 
    await sendPasswordResetEmail(email, token);
 
    res.json({ message: 'Password reset link sent to your email.' });
}));

// Reset Password
app.post('/api/auth/reset-password', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
 
    const userRes = await db.query(
        'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
    );
 
    if (userRes.rows.length === 0) {
        throw new AppError('Invalid or expired reset token', 400);
    }
 
    const userId = userRes.rows[0].id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
 
    await db.query(
        'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
        [hashedPassword, userId]
    );
 
    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
}));

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

// User Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Admin Routes (Modularized)
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminTicketRoutes = require('./routes/adminTicketRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/admin/auth', authLimiter, adminAuthRoutes);
app.use('/api/admin/tickets', verifyAdminToken, adminTicketRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin', verifyAdminToken, adminRoutes);

// Verification Routes
const verificationRoutes = require('./routes/verificationRoutes');
app.use('/api/verification', verificationRoutes);

// Dashboard Routes
const clientRoutes = require('./routes/clientRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
app.use('/api/client', clientRoutes);
app.use('/api/freelancer', freelancerRoutes);

// Ticket Routes
const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/tickets', ticketRoutes);

// Job Routes
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);
 
// Withdrawal Routes
const withdrawalRoutes = require('./routes/withdrawalRoutes');
app.use('/api/withdrawals', withdrawalRoutes);

// Message Routes
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// Review Routes
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// Notification Routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Serve Uploaded Files (Verification Docs)
// Security Note: In production, consider serving these via signed URLs or checking auth before serving
app.use('/uploads', express.static('uploads'));

/* 
// Legacy Inline Admin Routes - Moved to routes/adminRoutes.js
// Kept commented out for reference if needed, but should be removed.
*/

// Public Jobs Listing moved to jobRoutes.js
// Post Job moved to jobRoutes.js


// OAuth Routes

// Google
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login` }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 3600000 // 1 hour
        });

        // Redirect to frontend with token
        // In production, use a more secure way (e.g., httpOnly cookie or separate exchange)
        // For this MVP, query param is acceptable but not ideal.
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&role=${user.role}`);
    }
);

// Facebook
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login` }),
    (req, res) => {
        // Successful authentication
        const user = req.user;
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 3600000 // 1 hour
        });

        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&role=${user.role}`);
    }
);

// Error Handler for CSRF & Global
app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next(err);
});
 
app.use(globalErrorHandler);
 
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, server };
