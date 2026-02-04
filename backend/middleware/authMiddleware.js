const jwt = require('jsonwebtoken');
const db = require('../db'); // Required for permission checks
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// New Middleware: Check if user has a specific permission
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const userId = req.user.id;

            // 1. Get User's Roles and Direct Permissions
            // Query logic:
            // - Get permissions from assigned roles
            // - Get direct user permissions
            // - Check if any of them match the requiredPermission OR (if hierarchal) is a parent of it

            // NOTE: For simplicity in this implementation, we will fetch ALL user permissions and check in JS
            // In a very large system, this should be an optimized SQL query.

            const query = `
                SELECT DISTINCT p.slug 
                FROM permissions p
                LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
                LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id
                LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id
                WHERE (aur.user_id = $1 OR aup.user_id = $1)
            `;

            const result = await db.query(query, [userId]);
            const userPermissions = result.rows.map(row => row.slug);

            // Check for exact match
            if (userPermissions.includes(requiredPermission)) {
                return next();
            }

            // Check for Parent match (e.g. 'user' grants 'user.ban')
            // This requires we know the hierarchy or split the slug.
            // Assumption: Slugs are dot.separated, e.g. "document.approve"
            // If user has "document", they have everything starting with "document."

            // We can also check against the DB parent structure, but for speed, let's check basic prefix logic matches
            // OR fetch hierarchy from DB if needed. 
            // Better approach: The SQL above fetches the actual assigned permissions.
            // If the user was assigned the 'Parent' permission (e.g. 'document'), it appears in the list.
            // But 'document' permission implies 'document.view', etc.

            // Re-evaluating: The prompt says "Enabling a parent permission automatically enables all child permissions"
            // So if user has 'document', they should pass 'document.view'.

            // Let's refine the query to fetch children of assigned parents too.
            // Using a Recursive CTE would be best, but let's stick to a simpler logic for now:
            // If user has 'document', they can access 'document.view'.

            // Fetch all user perm IDs first
            const userPermIdsQuery = `
                SELECT DISTINCT p.id, p.slug
                FROM permissions p
                LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
                LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id
                LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id
                WHERE (aur.user_id = $1 OR aup.user_id = $1)
            `;
            const userPerms = await db.query(userPermIdsQuery, [userId]);
            const permittedSlugs = userPerms.rows.map(r => r.slug);
            const permittedIds = userPerms.rows.map(r => r.id);

            if (permittedSlugs.includes(requiredPermission)) return next();

            // Check if any of the user's permissions is a PARENT of the required permission
            // We need to check the DB to see if 'requiredPermission' is a child of any 'permittedIds'

            const parentCheck = await db.query(`
                SELECT id FROM permissions 
                WHERE slug = $1 AND parent_id = ANY($2::int[])
            `, [requiredPermission, permittedIds]);

            if (parentCheck.rows.length > 0) {
                return next();
            }

            // Fallback: Check if user has 'Administrator' role (Super Admin bypass usually, but prompt implies specific perms)
            // But we assigned ALL perms to Administrator in init_rbac, so the above check should pass.

            return res.status(403).json({ message: `Access denied. Missing permission: ${requiredPermission}` });

        } catch (err) {
            console.error("RBAC Error:", err);
            res.status(500).json({ message: 'Server error during authorization' });
        }
    }
};

module.exports = { verifyToken, checkPermission };
