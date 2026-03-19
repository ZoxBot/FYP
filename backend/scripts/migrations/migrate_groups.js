const db = require('../../db');

async function migrateGroups() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Creating admin_groups table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_groups (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Creating admin_group_permissions table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_group_permissions (
                group_id INTEGER REFERENCES admin_groups(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, permission_id)
            );
        `);

        console.log("Creating admin_user_groups table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_user_groups (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                group_id INTEGER REFERENCES admin_groups(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, group_id)
            );
        `);

        await client.query('COMMIT');
        console.log("Migration completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

// migrateGroups();
migrateGroups().catch(e => console.error(e));
