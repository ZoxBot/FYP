require('dotenv').config({ path: './.env' });
const db = require('../../db');

async function debug() {
    try {
        console.log("--- Roles ---");
        const roles = await db.query("SELECT * FROM admin_roles");
        console.table(roles.rows);

        console.log("\n--- Users (Admins only) ---");
        const admins = await db.query("SELECT id, email, role FROM users WHERE role = 'admin'");
        console.table(admins.rows);

        console.log("\n--- Raw Admin User Roles ---");
        const rawMapping = await db.query("SELECT * FROM admin_user_roles");
        console.table(rawMapping.rows);

        console.log("\n--- Admin User Roles JOIN ---");
        const mapping = await db.query(`
            SELECT aur.user_id, aur.role_id, ar.name as role_name, u.email 
            FROM admin_user_roles aur
            LEFT JOIN admin_roles ar ON aur.role_id = ar.id
            LEFT JOIN users u ON aur.user_id = u.id
        `);
        console.table(mapping.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
