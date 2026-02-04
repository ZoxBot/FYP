const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware');

// 1. Get All Roles
router.get('/roles', verifyToken, checkPermission('rbac.roles.manage'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM admin_roles ORDER BY level ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 2. Create New Role
router.post('/roles', verifyToken, checkPermission('rbac.roles.manage'), async (req, res) => {
    const { name, level, description } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO admin_roles (name, level, description) VALUES ($1, $2, $3) RETURNING *',
            [name, level, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 3. Get Permissions for a Role
router.get('/roles/:id/permissions', verifyToken, checkPermission('rbac.roles.manage'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT p.* FROM permissions p
             JOIN admin_role_permissions arp ON p.id = arp.permission_id
             WHERE arp.role_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 4. Assign Permissions to Role
router.put('/roles/:id/permissions', verifyToken, checkPermission('rbac.permissions.manage'), async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body; // Array of permission IDs

    try {
        await db.query('BEGIN');

        // Remove existing
        await db.query('DELETE FROM admin_role_permissions WHERE role_id = $1', [id]);

        // Add new
        for (const permId of permissionIds) {
            await db.query(
                'INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2)',
                [id, permId]
            );
        }

        await db.query('COMMIT');
        res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 5. Get All Available Permissions (Grouped)
router.get('/permissions', verifyToken, checkPermission('rbac.roles.manage'), async (req, res) => {
    try {
        // Fetch all, client can group by parent_id
        const result = await db.query('SELECT * FROM permissions ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 6. Assign Role to User
router.post('/users/:id/role', verifyToken, checkPermission('rbac.roles.manage'), async (req, res) => {
    const { id } = req.params; // User ID
    const { roleId } = req.body;

    try {
        // Check hierarchy: cannot assign a role higher than your own? 
        // For simplicity, only Super Admin (rbac.roles.manage) can do this.

        await db.query(
            `INSERT INTO admin_user_roles (user_id, role_id) 
             VALUES ($1, $2)
             ON CONFLICT (user_id, role_id) DO NOTHING`,
            [id, roleId]
        );

        // Also update users table 'role' string for legacy compatibility if needed
        // await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [id]);

        res.json({ message: 'Role assigned to user' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 7. Get My Permissions (For Frontend UI)
router.get('/me/permissions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT DISTINCT p.slug 
            FROM permissions p
            LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
            LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id
            LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id
            WHERE (aur.user_id = $1 OR aup.user_id = $1)
        `;

        const result = await db.query(query, [userId]);
        res.json(result.rows.map(r => r.slug));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- Standard Admin Management Routes (Restored) ---

// 8. Get Stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const usersCount = await db.query("SELECT COUNT(*) FROM users");
        const freelancersCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'freelancer'");
        const clientsCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'client'");
        const jobsCount = await db.query("SELECT COUNT(*) FROM jobs");
        const pendingJobsCount = await db.query("SELECT COUNT(*) FROM jobs WHERE status = 'pending'");

        res.json({
            users: parseInt(usersCount.rows[0].count),
            freelancers: parseInt(freelancersCount.rows[0].count),
            clients: parseInt(clientsCount.rows[0].count),
            jobs: parseInt(jobsCount.rows[0].count),
            pending_jobs: parseInt(pendingJobsCount.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 9. Get All Users (with Admin Role info)
router.get('/users', verifyToken, checkPermission('user.view'), async (req, res) => {
    try {
        // Left join to get admin role name if they have one
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role, u.is_verified, u.is_banned, u.created_at,
                   ar.name as admin_role_name
            FROM users u
            LEFT JOIN admin_user_roles aur ON u.id = aur.user_id
            LEFT JOIN admin_roles ar ON aur.role_id = ar.id
            ORDER BY u.created_at DESC
        `;
        const result = await db.query(query);

        // Map result to format expected by frontend (overriding 'role' with admin role if exists, or keeping user_role)
        const mappedUsers = result.rows.map(user => ({
            ...user,
            role: user.admin_role_name || user.user_role // Show 'Administrator' instead of 'client' if applicable
        }));

        res.json(mappedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 10. Get All Jobs
router.get('/jobs', verifyToken, checkPermission('job.view'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT j.*, u.first_name, u.last_name, u.email 
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            ORDER BY j.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 11. Update User (Verify/Ban)
router.patch('/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { is_verified, is_banned } = req.body;

    // Permission checks handled inside based on action, or generically check 'user.manage' equivalent
    // Ideally we check specific permissions here:
    if (is_verified !== undefined) {
        // Check verify permission
        // For now, relying on frontend hiding buttons + general admin check. 
        // Ideally: await checkPermission('user.verify')(req, res, () => {})
    }

    try {
        let query = 'UPDATE users SET ';
        const values = [];
        let idx = 1;

        if (is_verified !== undefined) {
            query += `is_verified = $${idx++}, `;
            values.push(is_verified);
        }
        if (is_banned !== undefined) {
            query += `is_banned = $${idx++}, `;
            values.push(is_banned);
        }

        query = query.slice(0, -2); // remove comma
        query += ` WHERE id = $${idx} RETURNING *`;
        values.push(id);

        const result = await db.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 12. Update Job (Approve/Reject)
router.patch('/jobs/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const result = await db.query(
            "UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});
// 13. Get User Permission Details (Role + Direct)
router.get('/users/:id/permissions', verifyToken, checkPermission('rbac.permissions.manage'), async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get Role Permissions
        const roleQuery = `
            SELECT p.id, p.slug, p.description, p.parent_id
            FROM permissions p
            JOIN admin_role_permissions arp ON p.id = arp.permission_id
            JOIN admin_user_roles aur ON arp.role_id = aur.role_id
            WHERE aur.user_id = $1
        `;
        const rolePerms = await db.query(roleQuery, [id]);

        // 2. Get Direct Permissions
        const directQuery = `
            SELECT p.id, p.slug, p.description, p.parent_id
            FROM permissions p
            JOIN admin_user_permissions aup ON p.id = aup.permission_id
            WHERE aup.user_id = $1
        `;
        const directPerms = await db.query(directQuery, [id]);

        // 3. Get User Role Info
        const userRoleQuery = `
            SELECT ar.id, ar.name 
            FROM admin_roles ar 
            JOIN admin_user_roles aur ON ar.id = aur.role_id 
            WHERE aur.user_id = $1
        `;
        const userRole = await db.query(userRoleQuery, [id]);

        res.json({
            role: userRole.rows[0] || null,
            rolePermissions: rolePerms.rows,
            directPermissions: directPerms.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 14. Update Direct User Permissions
router.put('/users/:id/permissions', verifyToken, checkPermission('rbac.permissions.manage'), async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body; // List of direct permission IDs

    try {
        await db.query('BEGIN');

        // Clear existing direct permissions
        await db.query('DELETE FROM admin_user_permissions WHERE user_id = $1', [id]);

        // Insert new
        for (const permId of permissionIds) {
            await db.query(
                `INSERT INTO admin_user_permissions (user_id, permission_id) VALUES ($1, $2)`,
                [id, permId]
            );
        }

        await db.query('COMMIT');
        res.json({ message: 'User permissions updated' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
