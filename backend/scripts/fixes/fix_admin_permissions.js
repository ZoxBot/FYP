const db = require('../../db');

async function fixPermissions() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Fetching Super Admin role ID...");
        const roleRes = await client.query("SELECT id FROM admin_roles WHERE name = 'Super Admin'");
        if (roleRes.rows.length === 0) {
            throw new Error("Super Admin role not found. Please run migrate_admin_v2.js first.");
        }
        const superAdminRoleId = roleRes.rows[0].id;

        console.log("Fetching all available permissions...");
        const permRes = await client.query("SELECT id FROM permissions");
        const allPermIds = permRes.rows.map(r => r.id);

        console.log(`Assigning ${allPermIds.length} permissions to Super Admin role...`);
        for (const permId of allPermIds) {
            await client.query(
                "INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [superAdminRoleId, permId]
            );
        }

        console.log("Ensuring User 11 (Admin) is linked to Super Admin role...");
        // First check if user 11 exists
        const userRes = await client.query("SELECT id FROM users WHERE id = 11");
        if (userRes.rows.length > 0) {
            await client.query(
                "INSERT INTO admin_user_roles (user_id, role_id) VALUES (11, $1) ON CONFLICT DO NOTHING",
                [superAdminRoleId]
            );
            await client.query("UPDATE users SET role = 'admin' WHERE id = 11");
            console.log("User 11 permissions restored.");
        } else {
            console.warn("User 11 not found. Skipping auto-assignment.");
        }

        await client.query('COMMIT');
        console.log("Permission fix completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Fix failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

fixPermissions().catch(e => console.error(e));
