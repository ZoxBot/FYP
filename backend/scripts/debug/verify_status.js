const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function verify() {
    try {
        console.log("--- DB VERIFICATION STATUS ---");

        // 1. Check Super Admin
        const userRes = await pool.query("SELECT id, email, role FROM users WHERE email = 'superadmin@kaamkokura.com'");
        if (userRes.rows.length === 0) {
            console.log("FAIL: superadmin@kaamkokura.com not found!");
        } else {
            const admin = userRes.rows[0];
            console.log(`PASS: Found Super Admin - ID: ${admin.id}, Role: ${admin.role}`);

            // 2. Check Role Assignment
            const roleAssignment = await pool.query(
                "SELECT ar.name FROM admin_user_roles aur JOIN admin_roles ar ON aur.role_id = ar.id WHERE aur.user_id = $1",
                [admin.id]
            );
            console.log("Admin Role Assignments:", roleAssignment.rows.map(r => r.name));

            // 3. Check Permissions
            if (roleAssignment.rows.length > 0) {
                const perms = await pool.query(
                    "SELECT p.slug FROM admin_role_permissions arp JOIN permissions p ON arp.permission_id = p.id JOIN admin_roles ar ON arp.role_id = ar.id WHERE ar.name = 'Super Admin'"
                );
                console.log(`Permission Count for 'Super Admin' role: ${perms.rows.length}`);
            }
        }

        // 4. Check Total Users
        const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
        console.log(`Total Users in DB: ${totalUsers.rows[0].count}`);

        // 5. Check other Admins
        const otherAdmins = await pool.query(
            "SELECT u.email, ar.name FROM users u JOIN admin_user_roles aur ON u.id = aur.user_id JOIN admin_roles ar ON aur.role_id = ar.id WHERE u.email != 'superadmin@kaamkokura.com'"
        );
        console.log("Other Admin Role Assignments (should be empty):", otherAdmins.rows);

        console.log("--- END STATUS ---");
    } catch (err) {
        console.error("Verification failed:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

verify();
