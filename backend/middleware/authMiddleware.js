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

        // Strict scope and role enforcement
        if (verified.scope !== 'admin' || verified.role !== 'admin') {
            console.warn(`[AUDIT] Invalid token scope attempt: User ${verified.id} tried accessing admin with scope ${verified.scope}`);
            return res.status(403).json({ message: 'Access Denied: Invalid Security Scope.' });
        }

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
            const userRole = req.user.role;
            const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);

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
