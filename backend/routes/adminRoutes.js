const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { checkPermission } = require('../middleware/authMiddleware');
const { logAdminAction } = require('../utils/auditLogger');

// 1. Get All Roles
router.get('/roles', checkPermission('rbac.roles.manage'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM admin_roles ORDER BY level ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 2. Create New Role
router.post('/roles', checkPermission('rbac.roles.manage'), async (req, res) => {
    const { name, level, description } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO admin_roles (name, level, description) VALUES ($1, $2, $3) RETURNING *',
            [name, level, description]
        );
        const newRole = result.rows[0];
        await logAdminAction(req.user.id, 'create_role', 'admin_role', newRole.id, { name, level }, req);
        res.json(newRole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 3. Get Permissions for a Role
router.get('/roles/:id/permissions', checkPermission('rbac.roles.manage'), async (req, res) => {
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
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 4. Assign Permissions to Role
router.put('/roles/:id/permissions', checkPermission('rbac.permissions.manage'), async (req, res) => {
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
        await logAdminAction(req.user.id, 'update_role_permissions', 'admin_role', id, { permissionCount: permissionIds.length }, req);
        res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 5. Get All Available Permissions (Grouped)
router.get('/permissions', checkPermission('rbac.roles.manage'), async (req, res) => {
    try {
        // Fetch all, client can group by parent_id
        const result = await db.query('SELECT * FROM permissions ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 6. Assign Role to User
router.post('/users/:id/role', checkPermission('rbac.roles.manage'), async (req, res) => {
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

        await logAdminAction(req.user.id, 'assign_role_to_user', 'user', id, { roleId }, req);
        res.json({ message: 'Role assigned to user' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 7. Get My Permissions (For Frontend UI)
router.get('/me/permissions', async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);

        const query = `
            SELECT DISTINCT p.slug 
            FROM permissions p
            LEFT JOIN admin_role_permissions arp ON p.id = arp.permission_id
            LEFT JOIN admin_user_roles aur ON arp.role_id = aur.role_id AND aur.user_id = $1
            LEFT JOIN admin_user_permissions aup ON p.id = aup.permission_id AND aup.user_id = $1
            LEFT JOIN admin_roles ar ON arp.role_id = ar.id
            LEFT JOIN admin_group_permissions agp ON p.id = agp.permission_id
            LEFT JOIN admin_user_groups aug ON agp.group_id = aug.group_id AND aug.user_id = $1
            WHERE (aur.user_id IS NOT NULL 
               OR aup.user_id IS NOT NULL 
               OR aug.user_id IS NOT NULL
               OR ar.name = $2)
        `;

        const result = await db.query(query, [userId, roleName]);
        res.json(result.rows.map(r => r.slug));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 7.1. Get Audit Logs
router.get('/logs', checkPermission('audit.view'), async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const countRes = await db.query('SELECT COUNT(*) FROM audit_logs');
        const total = parseInt(countRes.rows[0].count);

        const result = await db.query(`
            SELECT l.*, u.first_name, u.last_name, u.email 
            FROM audit_logs l
            LEFT JOIN users u ON l.admin_id = u.id
            ORDER BY l.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        res.json({
            logs: result.rows,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 7.2. Get System Settings
router.get('/settings', checkPermission('settings.view'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM system_settings');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 7.3. Update System Setting
router.patch('/settings/:key', checkPermission('settings.manage'), async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    try {
        await db.query(
            'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2',
            [JSON.stringify(value), key]
        );
        await logAdminAction(req.user.id, 'update_setting', 'system_setting', null, { key, value }, req);
        res.json({ message: 'Setting updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 7.4. Update My Password
router.patch('/me/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    try {
        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [adminId]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'Admin not found' });

        const { password_hash } = userRes.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, adminId]);
        await logAdminAction(adminId, 'change_password', 'user', adminId, { self: true }, req);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 7.5. Update My Profile
router.patch('/me/profile', async (req, res) => {
    const { first_name, last_name } = req.body;
    const adminId = req.user.id;

    try {
        await db.query(
            'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
            [first_name, last_name, adminId]
        );
        await logAdminAction(adminId, 'update_profile', 'user', adminId, { first_name, last_name }, req);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// 8. Get Stats
router.get('/stats', async (req, res) => {
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
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 9. Get All Users (with Admin Role info)
router.get('/users', checkPermission('user.view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += `(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            if (whereClause) whereClause += ' AND ';
            whereClause += `(u.role = $${paramIndex} OR ar.name = $${paramIndex})`;
            params.push(role);
            paramIndex++;
        }

        const countQuery = `
            SELECT COUNT(DISTINCT u.id) 
            FROM users u
            LEFT JOIN admin_user_roles aur ON u.id = aur.user_id
            LEFT JOIN admin_roles ar ON aur.role_id = ar.id
            ${whereClause ? 'WHERE ' + whereClause : ''}
        `;
        const countRes = await db.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count);

        const dataQuery = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role, u.is_verified, u.is_banned, u.created_at,
                   ar.name as admin_role_name
            FROM users u
            LEFT JOIN admin_user_roles aur ON u.id = aur.user_id
            LEFT JOIN admin_roles ar ON aur.role_id = ar.id
            ${whereClause ? 'WHERE ' + whereClause : ''}
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit);
        params.push(offset);
        
        const result = await db.query(dataQuery, params);

        const mappedUsers = result.rows.map(user => ({
            ...user,
            role: user.admin_role_name || user.user_role
        }));

        res.json({
            users: mappedUsers,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 10. Get All Jobs
router.get('/jobs', checkPermission('job.view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += `(j.title ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (status) {
            if (whereClause) whereClause += ' AND ';
            whereClause += `j.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            ${whereClause ? 'WHERE ' + whereClause : ''}
        `;
        const countRes = await db.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count);

        const dataQuery = `
            SELECT j.*, u.first_name, u.last_name, u.email 
            FROM jobs j
            JOIN users u ON j.client_id = u.id
            ${whereClause ? 'WHERE ' + whereClause : ''}
            ORDER BY j.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit);
        params.push(offset);

        const result = await db.query(dataQuery, params);

        res.json({
            jobs: result.rows,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 10.1 Get All Bids
router.get('/bids', checkPermission('job.view'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.*, u.first_name as freelancer_first_name, u.last_name as freelancer_last_name, j.title as job_title
            FROM bids b
            JOIN users u ON b.freelancer_id = u.id
            JOIN jobs j ON b.job_id = j.id
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 10.2 Get All Payments
router.get('/payments', checkPermission('job.view'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, 
                   c.first_name as client_first_name, c.last_name as client_last_name,
                   f.first_name as freelancer_first_name, f.last_name as freelancer_last_name,
                   j.title as job_title
            FROM payments p
            JOIN users c ON p.client_id = c.id
            JOIN users f ON p.freelancer_id = f.id
            JOIN jobs j ON p.task_id = j.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 10.3 Force Cancel Job
router.put('/jobs/:id/cancel', checkPermission('job.manage'), async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('BEGIN');

        // Ensure job exists
        const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
        if (jobResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Job not found' });
        }

        // Update job status to cancelled
        const result = await db.query(
            "UPDATE jobs SET status = 'cancelled' WHERE id = $1 RETURNING *",
            [id]
        );

        // If payment is held, simulate a refund
        await db.query(`
            UPDATE payments 
            SET status = 'refunded' 
            WHERE task_id = $1 AND status = 'held'
        `, [id]);

        // Log action
        await logAdminAction(req.user.id, 'cancel_job', 'job', id, { previous_status: jobResult.rows[0].status }, req);

        await db.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 11. Update User (Verify/Ban)
router.patch('/users/:id', async (req, res) => {
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
        const updatedUser = result.rows[0];

        // Audit log
        if (is_verified !== undefined) await logAdminAction(req.user.id, 'verify_user', 'user', id, { is_verified }, req);
        if (is_banned !== undefined) await logAdminAction(req.user.id, 'ban_user', 'user', id, { is_banned }, req);

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 12. Update Job (Approve/Reject)
router.patch('/jobs/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const result = await db.query(
            "UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        await logAdminAction(req.user.id, status === 'active' ? 'approve_job' : 'reject_job', 'job', id, { status }, req);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});
// 13. Get User Permission Details (Role + Direct)
router.get('/users/:id/permissions', checkPermission('rbac.permissions.manage'), async (req, res) => {
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
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 14. Update Direct User Permissions
router.put('/users/:id/permissions', checkPermission('rbac.permissions.manage'), async (req, res) => {
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
        await logAdminAction(req.user.id, 'update_user_permissions', 'user', id, { permissionCount: permissionIds.length }, req);
        res.json({ message: 'User permissions updated' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// --- Group Management Routes ---

// 15. Get All Groups
router.get('/groups', checkPermission('group.view'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM admin_groups ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 16. Create Group
router.post('/groups', checkPermission('group.create'), async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO admin_groups (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        const newGroup = result.rows[0];
        await logAdminAction(req.user.id, 'create_group', 'admin_group', newGroup.id, { name }, req);
        res.json(newGroup);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 17. Edit Group
router.put('/groups/:id', checkPermission('group.edit'), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const result = await db.query(
            'UPDATE admin_groups SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        await logAdminAction(req.user.id, 'edit_group', 'admin_group', id, { name }, req);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 18. Delete Group
router.delete('/groups/:id', checkPermission('group.delete'), async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM admin_groups WHERE id = $1', [id]);
        await logAdminAction(req.user.id, 'delete_group', 'admin_group', id, null, req);
        res.json({ message: 'Group deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 19. Get Group Permissions
router.get('/groups/:id/permissions', checkPermission('group.view'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT p.id
            FROM permissions p
            JOIN admin_group_permissions agp ON p.id = agp.permission_id
            WHERE agp.group_id = $1
        `, [id]);
        res.json(result.rows.map(r => r.id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 20. Assign Permissions to Group
router.put('/groups/:id/permissions', checkPermission('group.edit'), async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;
    try {
        await db.query('BEGIN');
        await db.query('DELETE FROM admin_group_permissions WHERE group_id = $1', [id]);

        for (const permId of permissionIds) {
            await db.query(
                'INSERT INTO admin_group_permissions (group_id, permission_id) VALUES ($1, $2)',
                [id, permId]
            );
        }
        await db.query('COMMIT');
        await logAdminAction(req.user.id, 'update_group_permissions', 'admin_group', id, { permissionCount: permissionIds.length }, req);
        res.json({ message: 'Group permissions updated' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 21. Assign Group to User
router.post('/users/:id/groups', checkPermission('group.assign'), async (req, res) => {
    const { id } = req.params;
    const { groupId } = req.body;
    try {
        await db.query(
            'INSERT INTO admin_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, groupId]
        );
        await logAdminAction(req.user.id, 'assign_group_to_user', 'user', id, { groupId }, req);
        res.json({ message: 'Group assigned to user' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 27. Get Members of a Group
router.get('/groups/:id/users', checkPermission('group.view'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.email
            FROM users u
            JOIN admin_user_groups aug ON u.id = aug.user_id
            WHERE aug.group_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching group members' });
    }
});

// 28. Remove Member from Group
router.delete('/groups/:id/users/:userId', checkPermission('group.assign'), async (req, res) => {
    const { id, userId } = req.params;
    try {
        await db.query('DELETE FROM admin_user_groups WHERE user_id = $1 AND group_id = $2', [userId, id]);
        await logAdminAction(req.user.id, 'remove_user_from_group', 'user', userId, { groupId: id }, req);
        res.json({ message: 'User removed from group' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error removing group member' });
    }
});

// 22. Remove Group from User
router.delete('/users/:id/groups/:groupId', checkPermission('group.assign'), async (req, res) => {
    const { id, groupId } = req.params;
    try {
        await db.query('DELETE FROM admin_user_groups WHERE user_id = $1 AND group_id = $2', [id, groupId]);
        await logAdminAction(req.user.id, 'remove_group_from_user', 'user', id, { groupId }, req);
        res.json({ message: 'Group removed from user' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 23. Get User Groups
router.get('/users/:id/groups', checkPermission('user.view'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT g.* 
            FROM admin_groups g
            JOIN admin_user_groups aug ON g.id = aug.group_id
            WHERE aug.user_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
    }
});

// 24. Change User Role (Freelancer <-> Client <-> Admin)
router.patch('/users/:id/role', checkPermission('user.change_role'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // 'freelancer', 'client', 'admin', or 'N/A'

    // Validation
    if (role && !['freelancer', 'client', 'admin', 'N/A'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role selection.' });
    }

    try {
        await db.query('BEGIN');

        // 1. Check if user is currently an admin
        const currentRoleRes = await db.query('SELECT role FROM users WHERE id = $1', [id]);
        if (currentRoleRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentRole = currentRoleRes.rows[0].role;

        // 2. If demoting from admin, check for specific permission
        if (currentRole === 'admin' && role !== 'admin') {
            const hasRemovePerm = await hasPermission(req.user.id, req.user.role, 'user.admin.remove');
            if (!hasRemovePerm) {
                await db.query('ROLLBACK');
                return res.status(403).json({ message: 'Permission denied: user.admin.remove. Only authorized admins can remove admin access.' });
            }

            // Prevent demoting the last Super Admin
            const adminRoleIdRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Administrator'");
            const adminRoleId = adminRoleIdRes.rows[0]?.id;

            if (adminRoleId) {
                const isSuperAdmin = await db.query(
                    'SELECT 1 FROM admin_user_roles WHERE user_id = $1 AND role_id = $2',
                    [id, adminRoleId]
                );

                if (isSuperAdmin.rows.length > 0) {
                    const otherSuperAdmins = await db.query(
                        'SELECT COUNT(*) FROM admin_user_roles WHERE role_id = $1 AND user_id != $2',
                        [adminRoleId, id]
                    );
                    if (parseInt(otherSuperAdmins.rows[0].count) === 0) {
                        await db.query('ROLLBACK');
                        return res.status(400).json({ message: 'Cannot demote the only remaining Super Admin.' });
                    }
                }
            }

            // Clear RBAC Roles
            await db.query('DELETE FROM admin_user_roles WHERE user_id = $1', [id]);
            // Clear Admin Groups
            await db.query('DELETE FROM admin_user_groups WHERE user_id = $1', [id]);
            // Clear Direct Permissions
            await db.query('DELETE FROM admin_user_permissions WHERE user_id = $1', [id]);
        }

        // 3. Update main role
        const finalizedRole = role === 'N/A' ? null : role;
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [finalizedRole, id]
        );

        await db.query('COMMIT');
        await logAdminAction(req.user.id, 'change_user_role', 'user', id, { old_role: currentRole, new_role: role }, req);
        res.json(result.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Something went wrong on our end.' });
    }
});

// 25. Get Members of a Role
router.get('/roles/:id/users', checkPermission('rbac.roles.manage'), async (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching members for role ID: ${id}`);
    try {
        const result = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role
            FROM users u
            JOIN admin_user_roles aur ON u.id = aur.user_id
            WHERE aur.role_id = $1
        `, [id]);
        console.log(`[DEBUG] Found ${result.rows.length} members for role ${id}`);
        res.json(result.rows);
    } catch (err) {
        console.error("[DEBUG] Error fetching role members:", err);
        res.status(500).json({ message: 'Error fetching role members' });
    }
});

// 26. Remove Member from Role (Wrapper for existing logic but specifically for role tab)
router.delete('/roles/:id/users/:userId', checkPermission('user.admin.remove'), async (req, res) => {
    const { id, userId } = req.params;
    try {
        await db.query('BEGIN');

        // Check if Super Admin and lockout prevention
        const adminRoleIdRes = await db.query("SELECT id FROM admin_roles WHERE name = 'Administrator'");
        const adminRoleId = adminRoleIdRes.rows[0]?.id;

        if (parseInt(id) === adminRoleId) {
            const otherSuperAdmins = await db.query(
                'SELECT COUNT(*) FROM admin_user_roles WHERE role_id = $1 AND user_id != $2',
                [adminRoleId, userId]
            );
            if (parseInt(otherSuperAdmins.rows[0].count) === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: 'Cannot remove the last Super Admin.' });
            }
        }

        // Delete from admin tables
        await db.query('DELETE FROM admin_user_roles WHERE user_id = $1 AND role_id = $2', [userId, id]);

        // Check if they have ANY other admin roles left
        const otherRoles = await db.query('SELECT 1 FROM admin_user_roles WHERE user_id = $1', [userId]);
        if (otherRoles.rows.length === 0) {
            // Revert users.role to 'client' (safe default) or keep as is? 
            // Better to keep users.role as 'admin' if they still have it, but usually if they have no admin_role then they aren't admin.
            await db.query("UPDATE users SET role = 'client' WHERE id = $1 AND role = 'admin'", [userId]);
            await db.query('DELETE FROM admin_user_groups WHERE user_id = $1', [userId]);
            await db.query('DELETE FROM admin_user_permissions WHERE user_id = $1', [userId]);
        }

        await db.query('COMMIT');
        await logAdminAction(req.user.id, 'remove_user_from_role', 'user', userId, { role_id: id }, req);
        res.json({ message: 'User removed from role' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error removing role' });
    }
});

// 29. Add Member to Role
router.post('/roles/:id/users', checkPermission('user.change_role'), async (req, res) => {
    const { id } = req.params; // role_id
    const { userId } = req.body;
    try {
        await db.query('BEGIN');

        // 1. Assign Role
        await db.query(
            'INSERT INTO admin_user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, id]
        );

        // 2. Ensure users.role is 'admin'
        await db.query("UPDATE users SET role = 'admin' WHERE id = $1 AND (role != 'admin' OR role IS NULL)", [userId]);

        await db.query('COMMIT');
        await logAdminAction(req.user.id, 'assign_role_to_user', 'user', userId, { role_id: id }, req);
        res.json({ message: 'User added to role' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error adding user to role' });
    }
});

// --- Dispute Resolution ---

// 29. Get All Disputes
router.get('/disputes', checkPermission('job.view'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT d.*, 
                   j.title AS job_title, j.final_price,
                   u.first_name AS initiator_first_name, u.last_name AS initiator_last_name,
                   c.first_name AS client_first_name, c.last_name AS client_last_name, c.id AS client_id,
                   f.first_name AS freelancer_first_name, f.last_name AS freelancer_last_name, f.id AS freelancer_id
            FROM disputes d
            JOIN jobs j ON d.job_id = j.id
            JOIN users u ON d.initiator_id = u.id
            JOIN users c ON j.client_id = c.id
            JOIN users f ON j.selected_freelancer_id = f.id
            ORDER BY d.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 30. Resolve Dispute
router.post('/disputes/:id/resolve', checkPermission('job.manage'), async (req, res) => {
    const { id } = req.params;
    const { resolution, admin_notes } = req.body;

    if (!resolution || !['refunded', 'released_to_freelancer'].includes(resolution)) {
        return res.status(400).json({ message: 'Invalid resolution action.' });
    }

    try {
        await db.query('BEGIN');

        // Get Dispute & Job Details
        const disputeRes = await db.query(`
            SELECT d.*, j.selected_freelancer_id, j.final_price, j.title AS job_title 
            FROM disputes d 
            JOIN jobs j ON d.job_id = j.id 
            WHERE d.id = $1
        `, [id]);

        if (disputeRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Dispute not found' });
        }

        const dispute = disputeRes.rows[0];
        const jobId = dispute.job_id;

        // 1. Update Dispute
        await db.query(
            `UPDATE disputes 
             SET status = 'resolved', resolution = $1, admin_notes = $2, resolved_at = NOW(), resolved_by = $3
             WHERE id = $4`,
            [resolution, admin_notes, req.user.id, id]
        );

        if (resolution === 'refunded') {
            // Mark payment as refunded
            await db.query("UPDATE payments SET status = 'refunded' WHERE task_id = $1", [jobId]);
            // Mark Job as cancelled
            await db.query("UPDATE jobs SET status = 'cancelled' WHERE id = $1", [jobId]);
        } else if (resolution === 'released_to_freelancer') {
            // Release funds logic (5% commission)
            const totalAmount = parseFloat(dispute.final_price);
            const commissionAmount = totalAmount * 0.05;
            const netAmount = totalAmount - commissionAmount;

            // Updated Payment record
            await db.query(
                "UPDATE payments SET status = 'released', commission_amount = $1, net_amount = $2 WHERE task_id = $3",
                [commissionAmount, netAmount, jobId]
            );

            // Update Job to completed
            await db.query("UPDATE jobs SET status = 'completed' WHERE id = $1", [jobId]);

            // Update Freelancer Wallet
            await db.query(
                `INSERT INTO wallets (user_id, balance) 
                 VALUES ($1, $2) 
                 ON CONFLICT (user_id) 
                 DO UPDATE SET balance = wallets.balance + $2, updated_at = CURRENT_TIMESTAMP`,
                [dispute.selected_freelancer_id, netAmount]
            );
        }

        await db.query('COMMIT');
        await logAdminAction(req.user.id, 'resolve_dispute', 'dispute', id, { resolution }, req);
        res.json({ message: `Dispute resolved with action: ${resolution}` });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Resolve dispute error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
