const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../db');

async function seedMissingPermissions() {
    try {
        console.log("Seeding Missing Admin Permissions...");

        const insertPerm = async (slug, desc, parentId = null) => {
            let res = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
            if (res.rows.length > 0) return res.rows[0].id;

            res = await db.query(
                `INSERT INTO permissions (slug, description, parent_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [slug, desc, parentId]
            );
            return res.rows[0].id;
        };

        // Core Management Permissions
        await insertPerm('user.view', 'View Users List');
        await insertPerm('user.manage', 'Edit/Delete Users');
        await insertPerm('job.view', 'View Jobs List');
        await insertPerm('job.manage', 'Moderate/Edit Jobs');
        await insertPerm('audit.view', 'View Audit Logs');
        await insertPerm('ticket.manage', 'Manage Support Tickets');
        await insertPerm('verification.manage', 'Review User Verifications');
        await insertPerm('withdrawal.manage', 'Process Withdrawals');

        console.log("Permissions seeded.");

        // Assign to ALL Admin roles
        const adminRolesRes = await db.query(`SELECT id, name FROM admin_roles WHERE name IN ('Super Admin', 'Full Admin', 'Standard Admin', 'Administrator', 'Admin')`);
        
        for (const role of adminRolesRes.rows) {
            const roleId = role.id;
            const slugs = [
                'user.view', 'user.manage', 'job.view', 'job.manage', 
                'audit.view', 'ticket.manage', 'verification.manage', 'withdrawal.manage'
            ];

            for (const slug of slugs) {
                const pRes = await db.query(`SELECT id FROM permissions WHERE slug = $1`, [slug]);
                if (pRes.rows.length > 0) {
                    await db.query(
                        `INSERT INTO admin_role_permissions (role_id, permission_id) 
                         VALUES ($1, $2) 
                         ON CONFLICT DO NOTHING`,
                        [roleId, pRes.rows[0].id]
                    );
                }
            }
            console.log(`Assigned permissions to role: ${role.name} (ID: ${roleId})`);
        }

        console.log("Seeding Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Seeding failed:", e);
        process.exit(1);
    }
}

seedMissingPermissions();
