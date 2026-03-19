const db = require('../../db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createSuperAdmin() {
    const email = 'superadmin@kaamkokura.com';
    const password = 'SuperAdmin123!';
    const firstName = 'Super';
    const lastName = 'Admin';

    console.log(`Creating new Super Admin: ${email}`);

    try {
        // 1. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Create User (or update if exists)
        let userId;
        const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0].id;
            await db.query(
                `UPDATE users SET password_hash = $1, first_name = $2, last_name = $3, role = 'admin', is_verified = true WHERE id = $4`,
                [hashedPassword, firstName, lastName, userId]
            );
            console.log('User updated.');
        } else {
            const res = await db.query(
                `INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified) 
                 VALUES ($1, $2, $3, $4, 'admin', true) RETURNING id`,
                [firstName, lastName, email, hashedPassword]
            );
            userId = res.rows[0].id;
            console.log('User created.');
        }

        // 3. Assign 'Administrator' Role
        // Find Role ID
        const roleRes = await db.query(`SELECT id FROM admin_roles WHERE name = 'Administrator'`);
        if (roleRes.rows.length === 0) {
            throw new Error("Administrator role not found in DB. Run init_rbac.js first.");
        }
        const roleId = roleRes.rows[0].id;

        // Assign
        await db.query(
            `INSERT INTO admin_user_roles (user_id, role_id) 
             VALUES ($1, $2)
             ON CONFLICT (user_id, role_id) DO NOTHING`,
            [userId, roleId]
        );

        console.log(`✅ SUCCESS: Assigned 'Administrator' role to ${email}`);
        console.log(`👉 Login with: ${email}  /  ${password}`);

    } catch (err) {
        console.error("Failed to create super admin:", err);
    } finally {
        process.exit();
    }
}

createSuperAdmin();
