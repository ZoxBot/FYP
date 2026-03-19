const db = require('../../db');

async function migrateAdminV2() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Creating audit_logs table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50),
                target_id INTEGER,
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Creating system_settings table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(100) PRIMARY KEY,
                value JSONB NOT NULL,
                description TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Cleaning up existing roles and seeding Super Admin / Full Admin...");
        // Delete dependent data first
        await client.query('DELETE FROM admin_role_permissions');
        await client.query('DELETE FROM admin_user_roles');
        await client.query('DELETE FROM admin_roles');

        // Insert new roles
        await client.query(`
            INSERT INTO admin_roles (name, level, description) VALUES 
            ('Super Admin', 1, 'Full system access and authority.'),
            ('Full Admin', 2, 'Broad administrative access with some restrictions.'),
            ('Standard Admin', 3, 'Limited administrative functionality.')
            ON CONFLICT (name) DO NOTHING;
        `);

        // Seed some initial settings
        await client.query(`
            INSERT INTO system_settings (key, value, description) VALUES 
            ('site_name', '"Kaamko Kura"', 'The name of the platform.'),
            ('maintenance_mode', 'false', 'Enable or disable maintenance mode.'),
            ('allow_registrations', 'true', 'Allow new users to sign up.')
            ON CONFLICT (key) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log("Migration V2 completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration V2 failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

migrateAdminV2().catch(e => console.error(e));
