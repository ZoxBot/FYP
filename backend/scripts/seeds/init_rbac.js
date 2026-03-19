const db = require('../../db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initRbac() {
    try {
        console.log("Starting RBAC Initialization...");

        // 1. Run SQL Schema
        const sql = fs.readFileSync(path.join(__dirname, 'database_rbac.sql'), 'utf8');
        await db.query(sql);
        console.log("RBAC Tables Created.");

        // 2. Seed Roles
        const roles = [
            { name: 'Administrator', level: 1, description: 'Super Admin - Full Access' },
            { name: 'Higher Admin', level: 2, description: 'Senior Management' },
            { name: 'Admin', level: 3, description: 'Standard Admin' }
        ];

        for (const role of roles) {
            await db.query(
                `INSERT INTO admin_roles (name, level, description) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (name) DO NOTHING`,
                [role.name, role.level, role.description]
            );
        }
        console.log("Roles Seeded.");

        // 3. Seed Permissions (Hierarchical)
        // Helper to insert permission
        const insertPerm = async (slug, desc, parentId = null) => {
            const res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (slug) DO UPDATE SET description = $2 
                 RETURNING id`,
                [slug, desc, parentId]
            );
            // If it already existed and wasn't updated (e.g. no change), fetch the ID
            if (res.rows.length > 0) return res.rows[0].id;
            const fetch = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            return fetch.rows[0].id;
        };

        // Root Groups
        const pDocs = await insertPerm('document', 'Document Management Group');
        const pUsers = await insertPerm('user', 'User Management Group');
        const pPayments = await insertPerm('payment', 'Payment Management Group');
        const pJobs = await insertPerm('jobs', 'Job Management Group');
        const pRoles = await insertPerm('rbac', 'Role & Permission Management (Super Admin)');

        // Children
        // Documents
        await insertPerm('document.view', 'View Documents', pDocs);
        await insertPerm('document.approve', 'Approve Documents', pDocs);
        await insertPerm('document.reject', 'Reject Documents', pDocs);

        // Users
        await insertPerm('user.verify', 'Verify User', pUsers);
        await insertPerm('user.ban', 'Ban User', pUsers);
        await insertPerm('user.kick', 'Kick User', pUsers); // Maybe "kick" means force logout?
        await insertPerm('user.remove', 'Remove User', pUsers);
        await insertPerm('user.admin.remove', 'Remove Admin Access', pUsers);
        await insertPerm('user.change_role', 'Change User Base/Admin Role', pUsers);

        // Payments
        await insertPerm('payment.release', 'Release Payment', pPayments);
        await insertPerm('payment.hold', 'Hold Payment', pPayments);
        await insertPerm('payment.refund', 'Refund Payment', pPayments);

        // Jobs
        await insertPerm('job.approve', 'Approve Jobs', pJobs);
        await insertPerm('job.reject', 'Reject Jobs', pJobs);
        await insertPerm('job.suspend', 'Suspend Jobs', pJobs);
        await insertPerm('job.view', 'View Jobs', pJobs); // Ensure view is added in init too
        await insertPerm('report.handle', 'Handle Reports', pJobs);

        // Groups
        const pAdminGroups = await insertPerm('group', 'Admin Group Management', pUsers);
        await insertPerm('group.view', 'View Groups', pAdminGroups);
        await insertPerm('group.create', 'Create Groups', pAdminGroups);
        await insertPerm('group.edit', 'Edit Groups', pAdminGroups);
        await insertPerm('group.delete', 'Delete Groups', pAdminGroups);
        await insertPerm('group.assign', 'Assign Users to Groups', pAdminGroups);

        // RBAC (Super Admin only usually)
        await insertPerm('rbac.roles.manage', 'Create/Edit Roles', pRoles);
        await insertPerm('rbac.permissions.manage', 'Grant/Revoke Permissions', pRoles);

        console.log("Permissions Seeded.");

        // 4. Assign All Permissions to Administrator
        // Get Administrator Role ID
        const adminRoleRes = await db.query(`SELECT id FROM admin_roles WHERE name = 'Administrator'`);
        const adminRoleId = adminRoleRes.rows[0].id;

        // Get All permissions
        const allPerms = await db.query(`SELECT id FROM permissions`);

        for (const perm of allPerms.rows) {
            await db.query(
                `INSERT INTO admin_role_permissions (role_id, permission_id) 
                 VALUES ($1, $2) 
                 ON CONFLICT DO NOTHING`,
                [adminRoleId, perm.id]
            );
        }
        console.log("Administrator Permissions Assigned.");

        // 5. Assign 'Administrator' Role to existing Admin Users
        const adminEmails = ['admin@example.com', 'superadmin@kaamkokura.com'];
        for (const email of adminEmails) {
            const userRes = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
            if (userRes.rows.length > 0) {
                const userId = userRes.rows[0].id;
                await db.query(
                    `INSERT INTO admin_user_roles (user_id, role_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT DO NOTHING`,
                    [userId, adminRoleId]
                );
                console.log(`Assigned Administrator role to user ${email}`);
                // Ensure base role is admin
                await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
            } else {
                console.log(`Warning: User ${email} not found.`);
            }
        }

        console.log("RBAC Initialization Complete.");
        process.exit(0);

    } catch (err) {
        console.error("RBAC Init Failed:", err);
        process.exit(1);
    }
}

initRbac();
