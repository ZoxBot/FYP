const db = require('./db');
require('dotenv').config();

async function debugUsers() {
    console.log("--- Debugging Users Table ---");

    try {
        // 1. Count Users
        const countRes = await db.query("SELECT COUNT(*) FROM users");
        console.log(`Total Users in DB: ${countRes.rows[0].count}`);

        // 2. List Top 5 Users
        const usersRes = await db.query("SELECT id, email, role, is_verified, is_banned FROM users LIMIT 5");
        console.log("Top 5 Users:", usersRes.rows);

        // 3. Test the exact API Query
        console.log("\nTesting API Query Logic:");
        const apiQuery = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role, u.is_verified, u.is_banned, u.created_at,
                   ar.name as admin_role_name
            FROM users u
            LEFT JOIN admin_user_roles aur ON u.id = aur.user_id
            LEFT JOIN admin_roles ar ON aur.role_id = ar.id
            ORDER BY u.created_at DESC
        `;
        const apiRes = await db.query(apiQuery);
        console.log(`API Query Rows returned: ${apiRes.rows.length}`);
        if (apiRes.rows.length > 0) {
            console.log("First row:", apiRes.rows[0]);
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        process.exit();
    }
}

debugUsers();
