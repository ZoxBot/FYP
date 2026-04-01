const jwt = require('jsonwebtoken');
const db = require('../db'); // Required for permission checks
require('dotenv').config();

const verifyToken = (req, res, next) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.header('Authorization');
        token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) return res.status(401).json({ message: 'Authentication required. Please log in to continue.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Your session has expired or is invalid. Please log in again.' });
    }
};

/**
 * Dedicated Admin Token Verifier (Security Boundary)
 */
const verifyAdminToken = (req, res, next) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.header('Authorization');
        token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
        return res.status(401).json({ message: 'Admin authentication required.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Role and scope enforcement
        // Flexibility: Allow access if role is 'admin', even if dedicated admin scope is missing
        if (verified.role !== 'admin') {
            console.warn(`[AUDIT] Unauthorized admin portal access attempt by User ${verified.id} (Role: ${verified.role})`);
            return res.status(403).json({ message: 'Access Denied: Administrator role required.' });
        }

        // If it's a dedicated admin login token, it will have scope: 'admin'
        // If it's a regular login token, it won't. We allow both if role is 'admin'.
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Admin session expired or invalid.' });
    }
};

/**
 * Helper to check permission outside of middleware context
 */
async function hasPermission(userId, userRole, requiredPermission) {
    const query = `
        SELECT 1 
        FROM permissions p
        WHERE p.slug = $2 AND (
            -- Direct User Permission
            EXISTS (SELECT 1 FROM admin_user_permissions aup WHERE aup.permission_id = p.id AND aup.user_id = $1)
            OR
            -- Group Permission
            EXISTS (
                SELECT 1 FROM admin_group_permissions agp 
                JOIN admin_user_groups aug ON agp.group_id = aug.group_id 
                WHERE agp.permission_id = p.id AND aug.user_id = $1
            )
            OR
            -- Base String Role Permission
            EXISTS (
                SELECT 1 FROM admin_role_permissions arp
                JOIN admin_roles ar ON arp.role_id = ar.id
                WHERE arp.permission_id = p.id AND ar.name = $3
            )
            OR
            -- Role Permission
            EXISTS (
                SELECT 1 FROM admin_role_permissions arp 
                JOIN admin_user_roles aur ON arp.role_id = aur.role_id 
                WHERE arp.permission_id = p.id AND aur.user_id = $1
            )
            OR
            -- Legacy/Static Role Check (optional fallback)
            ($3 = 'Admin' AND p.slug IN ('user.view', 'job.view'))
        )
        LIMIT 1
    `;
    const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    const result = await db.query(query, [userId, requiredPermission, roleName]);
    return result.rows.length > 0;
}

// Middleware: Check if user has a specific permission
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const userId = req.user.id;
            const userRole = req.user.role; // e.g., 'admin', 'freelancer', 'client'
            const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1); // 'Admin'

            // --- EMERGENCY BYPASS FOR ADMINS ---
            // If the user's primary role is 'admin', we allow them access to management views
            // to ensure they can see data while granular RBAC is being refined.
            if (userRole === 'admin') {
                console.log(`[AUTH] Auto-granting admin access to ${requiredPermission} for User ${userId}`);
                return next();
            }

            console.log(`Checking permission ${requiredPermission} for user ${userId} (Role: ${roleName})`);
            const granted = await hasPermission(userId, userRole, requiredPermission);
            console.log(`Permission result: ${granted ? 'GRANTED' : 'DENIED'}`);

            if (granted) {
                return next();
            }

            console.warn(`Access Denied: User ${userId} (Role: ${roleName}) lacks permission ${requiredPermission}`);
            return res.status(403).json({
                message: `Permission denied: ${requiredPermission}. Your current role is ${roleName}.`,
                debug: { userId, roleName, requiredPermission }
            });

        } catch (err) {
            console.error("RBAC Error:", err);
            res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
        }
    }
};

module.exports = { verifyToken, verifyAdminToken, checkPermission, hasPermission };
