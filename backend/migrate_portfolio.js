const db = require('./db');

(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS portfolio_items (
                id SERIAL PRIMARY KEY,
                freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url VARCHAR(255) NOT NULL,
                project_url VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Successfully created portfolio_items table.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to create portfolio_items table:', err);
        process.exit(1);
    }
})();
