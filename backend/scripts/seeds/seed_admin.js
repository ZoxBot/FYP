const db = require('../../db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    const email = 'admin@example.com';
    const password = 'adminpassword';
    const firstName = 'Admin';
    const lastName = 'User';

    try {
        console.log('Seeding admin user...');

        // Check if exists
        const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Admin user already exists. Updating role...');
            await db.query("UPDATE users SET role = 'admin', is_verified = true WHERE email = $1", [email]);
            console.log('Admin user updated.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            "INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, 'admin', true)",
            [firstName, lastName, email, hashedPassword]
        );

        console.log(`Admin user created: ${email} / ${password}`);
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        process.exit();
    }
}

seedAdmin();
