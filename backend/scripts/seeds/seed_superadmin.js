const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function seedSuperAdmin() {
    const email = 'superadmin@kaamkokura.com';
    const password = 'SuperAdmin123!';

    try {
        console.log("Starting Super Admin seeding and cleanup...");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 1. Create or Update Super Admin User
        const userRes = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified) " +
            "VALUES ($1, $2, $3, $4, $5, $6) " +
            "ON CONFLICT (email) DO UPDATE SET password_hash = $4, role = $5, is_verified = $6 " +
            "RETURNING id",
            ['Super', 'Admin', email, passwordHash, 'admin', true]
        );
        const adminId = userRes.rows[0].id;
        console.log(`Super Admin user ensured with ID: ${adminId}`);

        // 2. Ensure Super Admin Role exists
        const roleRes = await pool.query("SELECT id FROM admin_roles WHERE name = 'Super Admin'");
        let roleId;
        if (roleRes.rows.length === 0) {
            const newRoleRes = await pool.query(
                "INSERT INTO admin_roles (name, level, description) VALUES ('Super Admin', 1, 'Full system access.') RETURNING id"
            );
            roleId = newRoleRes.rows[0].id;
        } else {
            roleId = roleRes.rows[0].id;
        }
        console.log(`Super Admin role ID: ${roleId}`);

        // 3. Clear ALL other admin role assignments
        await pool.query("DELETE FROM admin_user_roles");
        console.log("Cleared all existing admin role assignments.");

        // 4. Assign role to the main account
        await pool.query(
            "INSERT INTO admin_user_roles (user_id, role_id) VALUES ($1, $2)",
            [adminId, roleId]
        );
        console.log(`Role 'Super Admin' assigned to ${email}.`);

        // 5. Ensure all permissions are assigned to Super Admin role
        const permRes = await pool.query("SELECT id FROM permissions");
        const permIds = permRes.rows.map(r => r.id);
        console.log(`Assigning ${permIds.length} permissions to Super Admin role...`);

        await pool.query("DELETE FROM admin_role_permissions WHERE role_id = $1", [roleId]);
        for (const pId of permIds) {
            await pool.query(
                "INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2)",
                [roleId, pId]
            );
        }

        // 6. Final verification of other users
        // The user said "keep default role for freelancer and client static"
        // This implies we shouldn't change the 'role' column for existing freelancers/clients.
        // We already cleared admin_user_roles, so they won't have admin perms.

        console.log("Seeding completed successfully.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await pool.end();
        process.exit();
    }
}

seedSuperAdmin();
