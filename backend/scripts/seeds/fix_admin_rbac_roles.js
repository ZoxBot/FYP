const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../db');

async function fixAdminRoles() {
    try {
        console.log("Fixing Admin RBAC roles...");

        // 1. Get the 'Super Admin' or 'Administrator' role ID
        const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name IN ('Super Admin', 'Administrator') ORDER BY level LIMIT 1`);
        if (roleRes.rows.length === 0) {
            console.error("No Admin role found in admin_roles table.");
            process.exit(1);
        }
        const adminRoleId = roleRes.rows[0].id;

        // 2. Find all users with role 'admin'
        const usersRes = await db.query(`SELECT id, email FROM users WHERE role = 'admin'`);
        console.log(`Found ${usersRes.rows.length} users with admin role.`);

        for (const user of usersRes.rows) {
            // 3. Check if they already have an RBAC role
            const rbacRes = await db.query(`SELECT 1 FROM admin_user_roles WHERE user_id = $1`, [user.id]);
            if (rbacRes.rows.length === 0) {
                console.log(`Assigning Super Admin role to ${user.email} (ID: ${user.id})...`);
                await db.query(
                    `INSERT INTO admin_user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [user.id, adminRoleId]
                );
            } else {
                console.log(`${user.email} already has an RBAC role.`);
            }
        }

        console.log("Role adjustment complete.");
        process.exit(0);
    } catch (e) {
        console.error("Fix failed:", e);
        process.exit(1);
    }
}

fixAdminRoles();
